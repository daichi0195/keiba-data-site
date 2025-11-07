"""
Microsoft Ads API - ローカル実行用レポート取得スクリプト

このスクリプトは、Microsoft Ads APIを使用してパフォーマンスデータを取得し、
ローカルのCSVファイルに出力します。
"""

import os
import sys
import io
import csv
import zipfile
import tempfile
import json
import traceback
import time
import random
import shutil
import logging
import re
from typing import Optional, List, Dict, Tuple, Any
from urllib.request import urlretrieve
from datetime import datetime, timedelta, timezone, date
from bingads.authorization import OAuthWebAuthCodeGrant
from bingads.service_client import ServiceClient
from bingads.v13.reporting import ReportingServiceManager
from bingads import AuthorizationData

import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed

# 定数
JST = timezone(timedelta(hours=9))
DEFAULT_REDIRECT_URI = "https://login.microsoftonline.com/common/oauth2/nativeclient"

# ロガー設定
logger = logging.getLogger("msads-local")
if not logger.handlers:
    _h = logging.StreamHandler(sys.stdout)
    _h.setFormatter(logging.Formatter("%(levelname)s:%(name)s:%(message)s"))
    logger.addHandler(_h)
logger.setLevel(logging.INFO)

# ---------- ログ/エラー補助（JSON構造化） ----------
def _jlog(level: str, **payload):
    base = {"ts": datetime.now(JST).isoformat(), "level": level.upper(), "app": "ms-ads-local"}
    base.update(payload)
    print(json.dumps(base, ensure_ascii=False))

def _exc_payload(e: Exception) -> Dict[str, str]:
    code = getattr(e, "errorcode", None) or getattr(e, "code", None)
    msg = str(e)
    fault = getattr(e, "fault", None)
    if fault:
        try:
            code = code or getattr(fault, "faultcode", None)
            msg = f"{msg} | fault={fault}"
        except Exception:
            pass
    return {"errorCode": str(code) if code else "", "errorMessage": msg, "trace": traceback.format_exc(limit=5)}

def with_retry(fn, *, retries=3, base=1.7, jitter=True, on_retry=None):
    for i in range(retries):
        try:
            return fn()
        except Exception as e:
            if i == retries - 1:
                raise
            sleep = (base ** i) + (random.random() if jitter else 0)
            if on_retry:
                try:
                    on_retry(e, i + 1, sleep)
                except Exception:
                    pass
            time.sleep(sleep)

# ---------- ヘルパー関数 ----------
def _detect_encoding(sample: bytes) -> str:
    if sample.startswith(b"\xef\xbb\xbf"): return "utf-8-sig"
    if sample.startswith(b"\xff\xfe"):     return "utf-16-le"
    if sample.startswith(b"\xfe\xff"):     return "utf-16-be"
    if sample.count(b"\x00") > max(1, len(sample)//20): return "utf-16-le"
    for enc in ("utf-8-sig","utf-8","cp932","cp1252"):
        try:
            sample.decode(enc); return enc
        except Exception:
            pass
    return "utf-8"

def _parse_csv_with_header_detection(text: str) -> List[Dict]:
    lines = text.strip().split('\n')

    # 空行をスキップ
    non_empty_lines = [line for line in lines if line.strip()]
    if not non_empty_lines:
        return []

    # ヘッダー行を探す（TimePeriodを含む行を探す）
    header_idx = -1
    for idx, line in enumerate(non_empty_lines):
        # カンマで分割してカラム名を取得
        potential_headers = [h.strip('"').strip() for h in line.split(',')]
        if 'TimePeriod' in potential_headers:
            header_idx = idx
            break

    if header_idx == -1:
        # TimePeriodが見つからない場合は、最初の行をヘッダーとして使用
        _jlog("WARN", where="csv_parse.no_timeperiod_header",
              first_line_sample=non_empty_lines[0][:200])
        header_idx = 0

    # ヘッダー以降の行をCSVとしてパース
    csv_text = '\n'.join(non_empty_lines[header_idx:])
    reader = csv.DictReader(io.StringIO(csv_text))
    rows = []

    for row in reader:
        # 空行やコピーライト行をスキップ
        if not any(row.values()) or 'Microsoft Corporation' in str(row):
            continue
        rows.append(row)

    _jlog("DEBUG", where="csv_parse.result",
          header_idx=header_idx,
          total_rows=len(rows),
          sample_keys=list(rows[0].keys())[:5] if rows else [])

    return rows

def _is_zip_bytes(b: bytes) -> bool:
    return b[:2] == b"PK"

def _extract_first_from_zip_bytes(b: bytes) -> Optional[bytes]:
    try:
        with zipfile.ZipFile(io.BytesIO(b), "r") as zf:
            names = [n for n in zf.namelist() if not n.endswith("/")]
            if not names: return None
            with zf.open(names[0], "r") as f:
                return f.read()
    except zipfile.BadZipFile:
        return None

def download_bytes_via_url(operation, timeout_ms=300_000) -> Optional[bytes]:
    """レポートダウンロード"""
    try:
        if hasattr(operation, "track"):
            operation.track(timeout_in_milliseconds=timeout_ms)
    except Exception as e:
        _jlog("WARN", where="download_bytes_via_url.track", **_exc_payload(e))

    def _get_status_and_url():
        try:
            st = operation.get_status()
            status = getattr(st, "Status", None)
            url = getattr(st, "report_download_url", None)
            return status, url
        except Exception:
            try:
                url = getattr(operation, "report_download_url", None)
                return "Success" if url else None, url
            except Exception:
                return None, None

    max_tries = 12
    tries = 0

    while tries < max_tries:
        status, url = _get_status_and_url()

        if status == "Success":
            if url:
                break
            else:
                _jlog("WARN", where="download_bytes_via_url.no_data",
                      message="Status=Success but no URL (likely no data)")
                return None

        if status == "Error":
            _jlog("ERROR", where="download_bytes_via_url.error_status",
                  message="Report generation failed with Error status")
            return None

        if tries < max_tries - 1:
            wait = 1
            time.sleep(wait)
            tries += 1
        else:
            break

    if not url:
        _jlog("ERROR", where="download_bytes_via_url.get_url",
              message="report_download_url not available after polling",
              final_status=status, tries=tries)
        return None

    def _download_once():
        with tempfile.TemporaryDirectory(prefix="msads_") as tmp:
            path = os.path.join(tmp, "report.bin")
            urlretrieve(url, path)
            with open(path, "rb") as f:
                return f.read()

    try:
        data = with_retry(_download_once, retries=2, on_retry=lambda e, n, s: _jlog(
            "WARN", where="download_bytes_via_url.download", retry=n, sleep_s=round(s, 2), **_exc_payload(e)
        ))
    except Exception as e:
        _jlog("ERROR", where="download_bytes_via_url.download", **_exc_payload(e))
        return None

    return data

def build_auth(env: str, client_id: str, client_secret: str, developer_token: str,
              refresh_token: str, redirect_uri: str,
              account_id_header: Optional[int] = None, customer_id_header: Optional[int] = None
              ) -> AuthorizationData:
    auth = OAuthWebAuthCodeGrant(client_id, client_secret, redirect_uri, env)
    # token_refreshed_callbackがNoneでない場合は削除（bingads SDKのバグ対策）
    if hasattr(auth, 'token_refreshed_callback') and not callable(auth.token_refreshed_callback):
        auth.token_refreshed_callback = None
    auth.request_oauth_tokens_by_refresh_token(refresh_token)
    return AuthorizationData(
        account_id=account_id_header,
        customer_id=customer_id_header,
        developer_token=developer_token,
        authentication=auth
    )

def get_parent_customer_id(env: str, auth_base: AuthorizationData, account_id: int) -> Optional[int]:
    try:
        cm = ServiceClient("CustomerManagementService", 13,
                          authorization_data=auth_base, environment=env)
        res = cm.GetAccount(AccountId=int(account_id))
        acc = getattr(res, "Account", None) or res
        parent = getattr(acc, "ParentCustomerId", None)
        return int(parent) if parent is not None else None
    except Exception as e:
        _jlog("WARN", where="get_parent_customer_id", account_id=account_id, **_exc_payload(e))
        return None

def get_accounts(env: str, client_id: str, client_secret: str, developer_token: str,
                 refresh_token: str, redirect_uri: str) -> List[Tuple[int, str]]:
    """アカウントリストを取得"""
    _jlog("INFO", where="get_accounts", msg="Calling GetAccountsInfo(CustomerId=None)")

    try:
        auth = build_auth(env, client_id, client_secret, developer_token, refresh_token, redirect_uri)

        customer_service = ServiceClient(
            service='CustomerManagementService',
            version=13,
            authorization_data=auth,
            environment=env
        )

        response = customer_service.GetAccountsInfo(
            CustomerId=None,
            OnlyParentAccounts=False
        )

        if not response or not response[0]:
            _jlog("WARN", where="get_accounts", msg="No accounts returned")
            return []

        accounts_info = response[0]
        accounts = []

        for acc in accounts_info:
            acc_id = getattr(acc, "Id", None)
            acc_name = getattr(acc, "Name", "")
            acc_status = getattr(acc, "AccountLifeCycleStatus", "")

            if acc_id:
                accounts.append((int(acc_id), acc_name))
                _jlog("INFO", where="get_accounts",
                      account_id=acc_id, account_name=acc_name, status=acc_status)

        _jlog("INFO", where="get_accounts", msg=f"Retrieved {len(accounts)} accounts")
        return accounts

    except Exception as e:
        _jlog("ERROR", where="get_accounts", **_exc_payload(e))
        return []

def make_report_time(factory, start_dt: date, end_dt: date):
    """レポート期間の設定"""
    time_obj = factory.create("ReportTime")
    custom_range = factory.create("Date")
    custom_range.Day = start_dt.day
    custom_range.Month = start_dt.month
    custom_range.Year = start_dt.year
    custom_range_end = factory.create("Date")
    custom_range_end.Day = end_dt.day
    custom_range_end.Month = end_dt.month
    custom_range_end.Year = end_dt.year
    time_obj.CustomDateRangeStart = custom_range
    time_obj.CustomDateRangeEnd = custom_range_end
    return time_obj

def get_report_columns(report_type: str) -> List[str]:
    """レポートタイプに応じたカラムリストを返す"""

    # 共通カラム
    base_columns = [
        "TimePeriod", "AccountId", "AccountName", "AccountNumber", "CurrencyCode",
        "Impressions", "Clicks", "Ctr", "AverageCpc", "AverageCpm", "Spend",
        "ConversionRate", "CostPerConversion", "Conversions", "ConversionsQualified",
        "Revenue", "ReturnOnAdSpend", "RevenuePerConversion",
        "Assists", "AllConversions", "AllConversionsQualified", "AllRevenue",
        "AllConversionRate", "AllCostPerConversion", "AllReturnOnAdSpend",
        "AllRevenuePerConversion", "ViewThroughConversions",
        "AccountStatus", "CustomerId", "CustomerName",
    ]

    # インプレッションシェア関連
    impression_share_columns = [
        "ImpressionSharePercent", "ImpressionLostToBudgetPercent",
        "ImpressionLostToRankAggPercent", "ExactMatchImpressionSharePercent",
        "ClickSharePercent", "AbsoluteTopImpressionSharePercent",
        "TopImpressionSharePercent", "AbsoluteTopImpressionRatePercent",
        "TopImpressionRatePercent", "TopImpressionShareLostToRankPercent",
        "TopImpressionShareLostToBudgetPercent",
        "AbsoluteTopImpressionShareLostToRankPercent",
        "AbsoluteTopImpressionShareLostToBudgetPercent",
    ]

    # 品質指標
    quality_columns = [
        "QualityScore", "ExpectedCtr", "AdRelevance", "LandingPageExperience",
        "HistoricalQualityScore", "HistoricalExpectedCtr",
        "HistoricalAdRelevance", "HistoricalLandingPageExperience",
    ]

    if report_type == "Account":
        return base_columns + impression_share_columns + [
            "ViewThroughConversionsQualified", "ViewThroughRevenue",
        ]

    elif report_type == "Campaign":
        # Campaign固有のカラム
        campaign_specific = [
            "CampaignId", "CampaignName", "CampaignStatus", "CampaignType", "CampaignLabels",
        ]
        return base_columns + impression_share_columns + quality_columns + campaign_specific

    elif report_type == "AdGroup":
        return base_columns + impression_share_columns + quality_columns + [
            "CampaignId", "CampaignName", "CampaignStatus", "CampaignType",
            "AdGroupId", "AdGroupName", "Status", "AdGroupType","AdGroupLabels",
            "ViewThroughConversionsQualified", "ViewThroughRevenue",
        ]

    elif report_type == "Ad":
        return [
            "TimePeriod", "AccountId", "AccountName", "AccountNumber", "CurrencyCode",
            "CampaignId", "CampaignName", "CampaignStatus", "CampaignType",
            "AdGroupId", "AdGroupName", "AdGroupStatus",
            "AdId", "AdStatus", "AdType","AdLabels",
            "Impressions", "Clicks", "Ctr", "AverageCpc", "AverageCpm", "Spend",
            "ConversionRate", "CostPerConversion", "Conversions", "ConversionsQualified",
            "Revenue", "ReturnOnAdSpend", "RevenuePerConversion",
            "Assists", "AllConversions", "AllConversionsQualified", "AllRevenue",
            "AllConversionRate", "AllCostPerConversion", "AllReturnOnAdSpend",
            "AllRevenuePerConversion", "ViewThroughConversions",
            "ViewThroughConversionsQualified", "ViewThroughRevenue",
            "AccountStatus", "CustomerId", "CustomerName",
            "AbsoluteTopImpressionRatePercent", "TopImpressionRatePercent",
        ]

    return base_columns

def get_entity_type(report_type: str) -> str:
    """レポートタイプからエンティティ名を取得"""
    mapping = {
        "Account": "account",
        "Campaign": "campaign",
        "AdGroup": "adgroup",
        "Ad": "ad",
    }
    return mapping.get(report_type, report_type.lower())

def save_to_csv(rows: List[Dict], output_dir: str, entity_type: str,
                account_id: int, timestamp: str) -> str:
    """CSVファイルとして保存"""
    if not rows:
        return ""

    # ディレクトリ作成
    entity_dir = os.path.join(output_dir, entity_type)
    os.makedirs(entity_dir, exist_ok=True)

    # ファイル名生成
    filename = f"{entity_type}_report_{account_id}_{timestamp}.csv"
    filepath = os.path.join(entity_dir, filename)

    # DataFrameに変換してCSV出力
    df = pd.DataFrame(rows)
    df.to_csv(filepath, index=False, encoding="utf-8")

    return filepath

def fetch_report(env: str, auth_rep: AuthorizationData, report_type: str,
                account_id: int, account_name: str, time_obj,
                output_dir: str, timestamp: str,
                start_dt: date, end_dt: date) -> Tuple[int, List[Dict]]:
    """レポート取得とCSV保存"""
    entity_type = get_entity_type(report_type)
    _jlog("INFO", where="fetch_report.start", report_type=report_type,
          account_id=account_id, account_name=account_name,
          period=f"{start_dt}..{end_dt}", entity=entity_type)

    try:
        rep_client = ServiceClient("ReportingService", 13, authorization_data=auth_rep, environment=env)
        factory = rep_client.factory

        # レポートリクエストの作成
        if report_type == "Account":
            req = factory.create("AccountPerformanceReportRequest")
            req.Scope = factory.create("AccountReportScope")
            req.Scope.AccountIds = {"long": [int(account_id)]}
        elif report_type == "Campaign":
            req = factory.create("CampaignPerformanceReportRequest")
            req.Scope = factory.create("AccountThroughCampaignReportScope")
            req.Scope.AccountIds = {"long": [account_id]}
            req.Scope.Campaigns = None
        elif report_type == "AdGroup":
            req = factory.create("AdGroupPerformanceReportRequest")
            req.Scope = factory.create("AccountThroughAdGroupReportScope")
            req.Scope.AccountIds = {"long": [account_id]}
            req.Scope.Campaigns = None
            req.Scope.AdGroups = None
        elif report_type == "Ad":
            req = factory.create("AdPerformanceReportRequest")
            req.Scope = factory.create("AccountThroughAdGroupReportScope")
            req.Scope.AccountIds = {"long": [account_id]}
            req.Scope.Campaigns = None
            req.Scope.AdGroups = None
        else:
            _jlog("ERROR", where="fetch_report.unknown_type", report_type=report_type)
            return 0, []

        req.Aggregation = "Daily"
        req.Time = time_obj
        req.ReturnOnlyCompleteData = False
        req.Format = "Csv"

        # カラム設定
        columns_list = get_report_columns(report_type)
        req.Columns = factory.create(f"ArrayOf{report_type}PerformanceReportColumn")
        for col in columns_list:
            req.Columns[f"{report_type}PerformanceReportColumn"].append(col)

        # レポート生成
        unique_dir = f"/tmp/BingAdsSDKPython_{account_id}_{report_type}_{os.getpid()}_{random.randint(1000,9999)}"
        mgr = ReportingServiceManager(
            authorization_data=auth_rep,
            environment=env,
            working_directory=unique_dir,
            poll_interval_in_milliseconds=1000
        )
        operation = mgr.submit_download(req)

        # ダウンロード
        data_bytes = download_bytes_via_url(operation, timeout_ms=300_000)

        # 一時ディレクトリをクリーンアップ
        try:
            if os.path.exists(unique_dir):
                shutil.rmtree(unique_dir, ignore_errors=True)
        except Exception:
            pass

        if not data_bytes:
            _jlog("INFO", where="fetch_report.no_data", report_type=report_type,
                  account_id=account_id, account_name=account_name)
            return 0, []

        # ZIP解凍
        if _is_zip_bytes(data_bytes):
            csv_bytes = _extract_first_from_zip_bytes(data_bytes)
            if not csv_bytes:
                _jlog("WARN", where="fetch_report.zip_empty")
                return 0, []
            data_bytes = csv_bytes

        # エンコーディング検出とCSVパース
        enc = _detect_encoding(data_bytes[:4096])
        text = data_bytes.decode(enc, errors="replace")

        # ヘッダー行を検出してCSVをパース
        rows = _parse_csv_with_header_detection(text)

        if not rows:
            _jlog("INFO", where="fetch_report.no_rows", report_type=report_type,
                  account_id=account_id, account_name=account_name)
            return 0, []

        # CSV保存
        filepath = save_to_csv(rows, output_dir, entity_type, account_id, timestamp)
        if filepath:
            _jlog("INFO", where="fetch_report.saved", filepath=filepath, rows=len(rows))

        _jlog("INFO", where="fetch_report.done", report_type=report_type,
              account_id=account_id, account_name=account_name,
              rows=len(rows), period=f"{start_dt}..{end_dt}", entity=entity_type)

        return len(rows), rows

    except Exception as e:
        _jlog("ERROR", where="fetch_report",
              report_type=report_type, account_id=account_id,
              account_name=account_name, period=f"{start_dt}..{end_dt}",
              **_exc_payload(e))
        return 0, []

def process_account(env: str, client_id: str, client_secret: str,
                    developer_token: str, refresh_token: str,
                    redirect_uri: str,
                    account_id: int, account_name: str,
                    report_types: List[str],
                    output_dir: str, timestamp: str,
                    start_dt: date, end_dt: date) -> Dict[str, Any]:
    print("\n" + "="*80)
    print(f"アカウント: {account_name} (ID: {account_id})")
    print("="*80)

    auth_base = build_auth(env, client_id, client_secret, developer_token, refresh_token, redirect_uri)
    parent_customer_id = get_parent_customer_id(env, auth_base, account_id)

    if not parent_customer_id:
        _jlog("ERROR", where="process_account.parent_customer_not_found",
              account_id=account_id, account_name=account_name)
        return {"account_id": account_id, "account_name": account_name, "success": False, "skipped": False}

    auth_rep = build_auth(env, client_id, client_secret, developer_token, refresh_token, redirect_uri,
                          account_id_header=account_id, customer_id_header=parent_customer_id)

    rep_client = ServiceClient("ReportingService", 13,
                              authorization_data=auth_rep, environment=env)
    factory = rep_client.factory

    time_obj = make_report_time(factory, start_dt, end_dt)
    print(f"  期間: {start_dt.isoformat()} ～ {end_dt.isoformat()}")

    results = {"account_id": account_id, "account_name": account_name, "success": True, "skipped": False, "reports": {}}

    if "Account" in report_types:
        print(f"  Accountレポート取得中...")
        row_count, _ = fetch_report(env, auth_rep, "Account", account_id, account_name, time_obj,
                                    output_dir, timestamp,
                                    start_dt, end_dt)
        if row_count > 0:
            print(f"    ✓ 完了: {row_count}行")
            results["reports"]["Account"] = {"rows": row_count}
        else:
            print(f"    ⚠️ データなし")
            print(f"  → アカウントレベルでデータなし。後続レポートをスキップします。")
            results["reports"]["Account"] = {"rows": 0}
            results["skipped"] = True
            for report_type in report_types:
                if report_type != "Account":
                    results["reports"][report_type] = {"rows": 0}
            return results

    for report_type in report_types:
        if report_type == "Account":
            continue
        print(f"  {report_type}レポート取得中...")
        row_count, _ = fetch_report(env, auth_rep, report_type, account_id, account_name, time_obj,
                                    output_dir, timestamp,
                                    start_dt, end_dt)
        if row_count > 0:
            print(f"    ✓ 完了: {row_count}行")
            results["reports"][report_type] = {"rows": row_count}
        else:
            print(f"    ⚠️ データなし")
            results["reports"][report_type] = {"rows": 0}

    return results

def main():
    """メイン処理"""

    # ===== 環境変数から認証情報を取得 =====
    client_id = os.getenv("MICROSOFT_ADS_CLIENT_ID")
    client_secret = os.getenv("MICROSOFT_ADS_CLIENT_SECRET")
    developer_token = os.getenv("MICROSOFT_ADS_DEVELOPER_TOKEN")
    refresh_token = os.getenv("MICROSOFT_ADS_REFRESH_TOKEN")

    # 環境（production or sandbox）
    env = os.getenv("MICROSOFT_ADS_ENV", "production").lower()

    # リダイレクトURI
    redirect_uri = os.getenv("MICROSOFT_ADS_REDIRECT_URI", DEFAULT_REDIRECT_URI)

    # 必須項目の確認
    required = {
        "MICROSOFT_ADS_CLIENT_ID": client_id,
        "MICROSOFT_ADS_CLIENT_SECRET": client_secret,
        "MICROSOFT_ADS_DEVELOPER_TOKEN": developer_token,
        "MICROSOFT_ADS_REFRESH_TOKEN": refresh_token,
    }
    missing = [k for k, v in required.items() if not v]
    if missing:
        logger.error(f"Missing required environment variables: {', '.join(missing)}")
        sys.exit(1)

    # ===== 設定 =====
    # 取得期間（2024年10月1日〜10月31日）
    START_DATE = date(2024, 10, 1)
    END_DATE = date(2024, 10, 31)

    # 出力ディレクトリ
    OUTPUT_DIR = "ms"
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # タイムスタンプ
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # レポートタイプ
    report_types = ["Account", "Campaign", "AdGroup", "Ad"]

    # 並列ワーカー数
    max_workers = int(os.getenv("MAX_WORKERS", "10"))

    print("="*80)
    print("Microsoft広告 ローカル取得")
    print("="*80)
    print(f"環境: {env}")
    print(f"出力先: {OUTPUT_DIR}/")
    print(f"レポートタイプ: {', '.join(report_types)}")
    print(f"期間: {START_DATE} ～ {END_DATE}")
    print(f"並列ワーカー数: {max_workers}")
    print("="*80)

    # アカウントリストを取得
    print("\nアカウントリスト取得中...")
    accounts = get_accounts(env, client_id, client_secret, developer_token, refresh_token, redirect_uri)
    if not accounts:
        print("アカウントが見つかりませんでした")
        return

    print(f"取得対象アカウント数: {len(accounts)}")
    for acc_id, acc_name in accounts:
        print(f"  - {acc_name} (ID: {acc_id})")

    # 並列実行
    all_results = []
    start_time = time.time()

    if max_workers == 1:
        for account_id, account_name in accounts:
            result = process_account(
                env, client_id, client_secret, developer_token, refresh_token, redirect_uri,
                account_id, account_name, report_types,
                OUTPUT_DIR, timestamp,
                start_dt=START_DATE, end_dt=END_DATE
            )
            all_results.append(result)
    else:
        with ThreadPoolExecutor(max_workers=max_workers) as ex:
            futs = {
                ex.submit(
                    process_account,
                    env, client_id, client_secret, developer_token, refresh_token, redirect_uri,
                    account_id, account_name, report_types,
                    OUTPUT_DIR, timestamp,
                    START_DATE, END_DATE
                ): (account_id, account_name)
                for account_id, account_name in accounts
            }
            for fut in as_completed(futs):
                try:
                    all_results.append(fut.result())
                except Exception as e:
                    acc = futs[fut]
                    _jlog("ERROR", where="thread.result", account_id=acc[0], account_name=acc[1], **_exc_payload(e))

    elapsed_time = time.time() - start_time

    # サマリー
    print(f"\n{'='*80}")
    print("処理完了サマリー")
    print(f"{'='*80}")
    for result in all_results:
        print(f"\n{result['account_name']} (ID: {result['account_id']})")
        if result.get('skipped'):
            print(f"  ⏭️  アカウントレベルでデータなし（後続レポートスキップ）")
            continue
        if result['success']:
            for report_type, report_data in result['reports'].items():
                if report_data['rows'] > 0:
                    print(f"  ✓ {report_type}: {report_data['rows']}行")
                else:
                    print(f"  ⚠️ {report_type}: データなし")
        else:
            print(f"  ✗ 処理失敗")

    print(f"\n{'='*80}")
    print(f"総実行時間: {elapsed_time:.1f}秒 ({elapsed_time/60:.1f}分)")
    print(f"出力先: {OUTPUT_DIR}/")
    print(f"{'='*80}")

if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        logger.error(repr(e))
        traceback.print_exc()
        sys.exit(1)
