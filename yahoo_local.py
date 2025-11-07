"""
Yahoo広告 API - ローカル実行用レポート取得スクリプト（Search広告のみ）

このスクリプトは、Yahoo広告 Search APIを使用してパフォーマンスデータを取得し、
ローカルのCSVファイルに出力します。
"""

import sys
import io
import csv
import json
import time
import gzip
import os
from typing import List, Dict, Optional
from datetime import datetime, timezone, timedelta, date

import requests
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed

# ================= 基本設定 =================
UA = "yahoo-search-local/1.0 (+python-requests)"

TOKEN_URL     = "https://biz-oauth.yahoo.co.jp/oauth/v1/token"
SEARCH_BASE   = "https://ads-search.yahooapis.jp/api/v18"
PATHS = {
    "account_get": "/AccountService/get",
    "report_add": "/ReportDefinitionService/add",
    "report_get": "/ReportDefinitionService/get",
    "report_download": "/ReportDefinitionService/download",
}
JST = timezone(timedelta(hours=9))

# =============== ログ ===============
def log_info(msg: str):
    print(f"[INFO] {msg}", file=sys.stdout)
    sys.stdout.flush()

def log_warn(msg: str):
    print(f"[WARN] {msg}", file=sys.stdout)
    sys.stdout.flush()

def log_error(msg: str):
    print(f"[ERROR] {msg}", file=sys.stdout)
    sys.stdout.flush()

# =============== 認証 ===============
def get_access_token(client_id: str, client_secret: str, refresh_token: str) -> str:
    """Yahoo OAuth トークンを取得"""
    log_info("Attempting to fetch access token...")

    # Form 形式でのリクエスト
    r = requests.post(
        TOKEN_URL,
        headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA},
        data={
            "grant_type": "refresh_token",
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
        },
        timeout=30,
    )

    if r.status_code == 200:
        token = r.json().get("access_token")
        if not token:
            raise RuntimeError("Response does not contain 'access_token'")
        log_info("Successfully obtained access token")
        return token

    # Form 形式失敗時は Basic 認証にフォールバック
    log_warn(f"Token request (form) failed: status={r.status_code}. Trying Basic auth...")
    r = requests.post(
        TOKEN_URL,
        headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA},
        data={"grant_type": "refresh_token", "refresh_token": refresh_token},
        auth=(client_id, client_secret),
        timeout=30,
    )

    if r.status_code == 200:
        token = r.json().get("access_token")
        if not token:
            raise RuntimeError("Response does not contain 'access_token'")
        log_info("Successfully obtained access token (via Basic auth)")
        return token

    raise RuntimeError(f"Token fetch failed: status={r.status_code} body={r.text[:300]}")

def hdr(token: str, base_account_id: int) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": UA,
        "x-z-base-account-id": str(base_account_id),
    }

# =============== アカウント一覧取得 ===============
def fetch_account_ids(token: str, base_account_id: int) -> List[int]:
    """Search広告のアカウントID一覧を取得"""
    url = SEARCH_BASE + PATHS["account_get"]
    r = requests.post(url, headers=hdr(token, base_account_id), json={}, timeout=60)
    r.raise_for_status()
    js = r.json() or {}
    out: List[int] = []
    for v in ((js.get("rval") or {}).get("values") or []):
        if v.get("operationSucceeded"):
            acc = v.get("account") or {}
            aid = acc.get("accountId")
            try:
                out.append(int(str(aid)))
            except Exception:
                pass
    return sorted(set(out))

# =============== レポート作成・取得 ===============
def add_report_custom_date(token: str, base_account_id: int, account_id: int,
                          fields: List[str], report_type: str,
                          start_date: date, end_date: date, lang: str = "EN") -> int:
    """カスタム日付範囲でレポートを作成"""
    url = SEARCH_BASE + PATHS["report_add"]

    operand = {
        "reportName": f"search_{account_id}_{int(time.time())}",
        "fields": fields,
        "reportDownloadFormat": "CSV",
        "reportLanguage": lang,
        "reportType": report_type,
        "reportDateRangeType": "CUSTOM_DATE",
        "dateRange": {
            "startDate": start_date.strftime("%Y%m%d"),
            "endDate": end_date.strftime("%Y%m%d"),
        },
    }

    body = {"accountId": int(account_id), "operand": [operand]}

    time.sleep(0.5)  # レート制限対策

    r = requests.post(url, headers=hdr(token, base_account_id), json=body, timeout=90)
    if r.status_code != 200:
        log_error(f"/add -> {r.text}")
        r.raise_for_status()

    payload = r.json() or {}
    vals = ((payload.get("rval") or {}).get("values") or [])
    if not vals or not vals[0].get("operationSucceeded"):
        raise RuntimeError(f"/add returned non-succeeded -> {r.text}")

    job_id = (vals[0].get("reportDefinition") or {}).get("reportJobId")
    log_info(f"  Created report job: account={account_id}, job_id={job_id}")
    return job_id

def get_status(token: str, base_account_id: int, account_id: int, job_id: int) -> str:
    """レポートステータスを取得"""
    url = SEARCH_BASE + PATHS["report_get"]
    body = {"accountId": int(account_id), "reportJobIds": [int(job_id)]}

    time.sleep(0.5)

    r = requests.post(url, headers=hdr(token, base_account_id), json=body, timeout=60)
    if r.status_code != 200:
        log_error(f"/get_status account_id={account_id}, job_id={job_id} -> Status {r.status_code}: {r.text}")
        r.raise_for_status()

    vals = ((r.json().get("rval") or {}).get("values") or [])
    rep = vals[0].get("reportDefinition") if vals else {}
    return rep.get("reportJobStatus", "UNKNOWN")

def download_csv_text(token: str, base_account_id: int, account_id: int, job_id: int) -> str:
    """レポートをダウンロード"""
    url = SEARCH_BASE + PATHS["report_download"]
    body = {"accountId": int(account_id), "reportJobId": int(job_id)}

    time.sleep(0.5)

    r = requests.post(url, headers=hdr(token, base_account_id), json=body, timeout=300)
    if r.status_code != 200:
        log_error(f"/download account_id={account_id}, job_id={job_id} -> Status {r.status_code}: {r.text}")
        r.raise_for_status()

    raw = r.content
    # Gzip解凍
    if len(raw) >= 2 and raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    return raw.decode("utf-8", "replace")

# =============== CSV パース ===============
def csv_to_rows(csv_text: str) -> List[Dict[str, str]]:
    """CSV テキストをパースして行をリストで返却"""
    src = io.StringIO(csv_text)
    rdr = csv.DictReader(src)
    rows_out: List[Dict[str, str]] = []

    if not rdr.fieldnames:
        log_error("No fieldnames found in CSV!")
        return rows_out

    for row in rdr:
        # 空行をスキップ
        if not any(row.values()):
            continue

        # Yahoo Search APIは "Day" カラムを使用
        date_value = row.get("Day")

        # ヘッダー行や無効な行をスキップ
        if not date_value or date_value in ("Day", "Total", "合計"):
            continue

        # 'date' キーを追加
        row["date"] = str(date_value).strip()
        rows_out.append(row)

    log_info(f"CSV parsed: {len(rows_out)} rows")
    return rows_out

# =============== フィールド定義 ===============
SEARCH_ACCOUNT_FIELDS = [
    "DAY", "ACCOUNT_ID", "ACCOUNT_NAME",
    "COST", "IMPS", "CLICKS", "CLICK_RATE", "AVG_CPC",
    "INVALID_CLICKS", "INVALID_CLICK_RATE",
    "IMPRESSION_SHARE", "EXACT_MATCH_IMPRESSION_SHARE",
    "BUDGET_LOST_IMPRESSION_SHARE", "QUALITY_LOST_IMPRESSION_SHARE",
    "CONVERSIONS", "CONV_RATE", "CONV_VALUE",
    "COST_PER_CONV", "VALUE_PER_CONV",
    "ALL_CONV", "ALL_CONV_RATE", "ALL_CONV_VALUE",
    "COST_PER_ALL_CONV", "VALUE_PER_ALL_CONV",
    "CROSS_DEVICE_CONVERSIONS",
    "CONV_VALUE_PER_COST", "ALL_CONV_VALUE_PER_COST",
]

SEARCH_CAMPAIGN_FIELDS = [
    "DAY",
    "ACCOUNT_ID", "ACCOUNT_NAME",
    "CAMPAIGN_ID", "CAMPAIGN_NAME",
    "CAMPAIGN_DISTRIBUTION_SETTINGS",
    "CAMPAIGN_DISTRIBUTION_STATUS",
    "DAILY_SPENDING_LIMIT",
    "CAMPAIGN_START_DATE", "CAMPAIGN_END_DATE",
    "TRACKING_URL", "CUSTOM_PARAMETERS", "CAMPAIGN_TRACKING_ID",
    "CAMPAIGN_TYPE", "LABELS", "LABELS_JSON",
    "BID_STRATEGY_ID", "BID_STRATEGY_NAME", "BID_STRATEGY_TYPE", "BID_STRATEGY_STATUS",
    "BUDGET_ID", "BUDGET_NAME",
    "AB_TEST_USAGE",
    "COST", "IMPS", "CLICKS", "CLICK_RATE", "AVG_CPC",
    "INVALID_CLICKS", "INVALID_CLICK_RATE",
    "IMPRESSION_SHARE", "EXACT_MATCH_IMPRESSION_SHARE",
    "BUDGET_LOST_IMPRESSION_SHARE", "QUALITY_LOST_IMPRESSION_SHARE",
    "CONVERSIONS", "CONV_RATE", "CONV_VALUE",
    "COST_PER_CONV", "VALUE_PER_CONV",
    "ALL_CONV", "ALL_CONV_RATE", "ALL_CONV_VALUE",
    "COST_PER_ALL_CONV", "VALUE_PER_ALL_CONV",
    "CROSS_DEVICE_CONVERSIONS",
    "CONV_VALUE_PER_COST", "ALL_CONV_VALUE_PER_COST",
    "ABSOLUTE_TOP_IMPRESSION_PERCENTAGE",
    "TOP_IMPRESSION_PERCENTAGE",
    "SEARCH_ABSOLUTE_TOP_IMPRESSION_SHARE",
    "SEARCH_TOP_IMPRESSION_SHARE",
    "SEARCH_BUDGET_LOST_ABSOLUTE_TOP_IMPRESSION_SHARE",
    "SEARCH_RANK_LOST_ABSOLUTE_TOP_IMPRESSION_SHARE",
    "SEARCH_BUDGET_LOST_TOP_IMPRESSION_SHARE",
    "SEARCH_RANK_LOST_TOP_IMPRESSION_SHARE",
]

SEARCH_ADGROUP_FIELDS = [
    "DAY",
    "ACCOUNT_ID", "ACCOUNT_NAME",
    "CAMPAIGN_ID", "CAMPAIGN_NAME",
    "ADGROUP_ID", "ADGROUP_NAME",
    "ADGROUP_DISTRIBUTION_SETTINGS",
    "ADGROUP_BID",
    "TRACKING_URL", "CUSTOM_PARAMETERS",
    "CAMPAIGN_TRACKING_ID", "ADGROUP_TRACKING_ID",
    "LABELS", "LABELS_JSON",
    "AB_TEST_USAGE",
    "COST", "IMPS", "CLICKS", "CLICK_RATE", "AVG_CPC",
    "IMPRESSION_SHARE", "EXACT_MATCH_IMPRESSION_SHARE",
    "QUALITY_LOST_IMPRESSION_SHARE",
    "CONVERSIONS", "CONV_RATE", "CONV_VALUE",
    "COST_PER_CONV", "VALUE_PER_CONV",
    "ALL_CONV", "ALL_CONV_RATE", "ALL_CONV_VALUE",
    "COST_PER_ALL_CONV", "VALUE_PER_ALL_CONV",
    "CROSS_DEVICE_CONVERSIONS",
    "CONV_VALUE_PER_COST", "ALL_CONV_VALUE_PER_COST",
    "ABSOLUTE_TOP_IMPRESSION_PERCENTAGE",
    "TOP_IMPRESSION_PERCENTAGE",
    "SEARCH_ABSOLUTE_TOP_IMPRESSION_SHARE",
    "SEARCH_TOP_IMPRESSION_SHARE",
    "SEARCH_BUDGET_LOST_ABSOLUTE_TOP_IMPRESSION_SHARE",
    "SEARCH_RANK_LOST_ABSOLUTE_TOP_IMPRESSION_SHARE",
    "SEARCH_BUDGET_LOST_TOP_IMPRESSION_SHARE",
    "SEARCH_RANK_LOST_TOP_IMPRESSION_SHARE",
]

SEARCH_ADGROUPAD_FIELDS = [
    "DAY",
    "ACCOUNT_ID", "ACCOUNT_NAME",
    "CAMPAIGN_ID", "CAMPAIGN_NAME",
    "ADGROUP_ID", "ADGROUP_NAME",
    "AD_ID", "AD_NAME",
    "DISPLAY_URL", "DESTINATION_URL",
    "AD_TYPE",
    "AD_DISTRIBUTION_SETTINGS",
    "AD_EDITORIAL_STATUS",
    "TRACKING_URL", "CUSTOM_PARAMETERS",
    "FINAL_URL", "FINAL_URL_SMARTPHONE",
    "CAMPAIGN_TRACKING_ID", "AD_TRACKING_ID", "ADGROUP_TRACKING_ID",
    "LABELS", "LABELS_JSON",
    "AB_TEST_USAGE",
    "COST", "IMPS", "CLICKS", "CLICK_RATE", "AVG_CPC",
    "CONVERSIONS", "CONV_RATE", "CONV_VALUE",
    "COST_PER_CONV", "VALUE_PER_CONV",
    "ALL_CONV", "ALL_CONV_RATE", "ALL_CONV_VALUE",
    "COST_PER_ALL_CONV", "VALUE_PER_ALL_CONV",
    "CROSS_DEVICE_CONVERSIONS",
    "CONV_VALUE_PER_COST", "ALL_CONV_VALUE_PER_COST",
    "ABSOLUTE_TOP_IMPRESSION_PERCENTAGE",
    "TOP_IMPRESSION_PERCENTAGE",
]

SEARCH_FIELDS: Dict[str, List[str]] = {
    "account": SEARCH_ACCOUNT_FIELDS,
    "campaign": SEARCH_CAMPAIGN_FIELDS,
    "adgroup": SEARCH_ADGROUP_FIELDS,
    "adgroupad": SEARCH_ADGROUPAD_FIELDS,
}

SEARCH_REPORT_TYPE = {
    "account": "ACCOUNT",
    "campaign": "CAMPAIGN",
    "adgroup": "ADGROUP",
    "adgroupad": "AD",
}

# =============== レポート取得処理 ===============
def fetch_report(token: str, base_account_id: int, account_id: int,
                entity: str, start_date: date, end_date: date) -> List[Dict]:
    """1アカウントのレポートを取得"""
    log_info(f"  Fetching {entity} report for account {account_id}...")

    try:
        # レポート作成
        job_id = add_report_custom_date(
            token, base_account_id, account_id,
            SEARCH_FIELDS[entity],
            SEARCH_REPORT_TYPE[entity],
            start_date, end_date
        )

        # ステータスチェック（最大60回、1秒間隔）
        max_wait = 60
        for i in range(max_wait):
            status = get_status(token, base_account_id, account_id, job_id)

            if status == "COMPLETED":
                # ダウンロード
                csv_text = download_csv_text(token, base_account_id, account_id, job_id)
                rows = csv_to_rows(csv_text)
                log_info(f"    ✓ {entity}: {len(rows)} rows")
                return rows

            elif status in ("FAILED", "UNKNOWN"):
                log_error(f"    ✗ {entity}: Report status={status}")
                return []

            # まだ処理中
            if i < max_wait - 1:
                time.sleep(1)

        log_error(f"    ✗ {entity}: Timeout waiting for report completion")
        return []

    except Exception as e:
        log_error(f"    ✗ {entity}: {repr(e)}")
        return []

def process_account(token: str, base_account_id: int, account_id: int,
                   entities: List[str], start_date: date, end_date: date) -> Dict[str, List[Dict]]:
    """1アカウントの全エンティティデータを取得"""
    print(f"\nアカウント: {account_id}")
    print("="*80)

    result = {}

    # Accountレベルを最初にチェック
    if "account" in entities:
        rows = fetch_report(token, base_account_id, account_id, "account", start_date, end_date)
        result["account"] = rows

        if not rows:
            log_warn(f"  → アカウントレベルでデータなし。後続レポートをスキップします。")
            for entity in entities:
                if entity != "account":
                    result[entity] = []
            return result

    # 残りのエンティティを取得
    for entity in entities:
        if entity == "account":
            continue
        rows = fetch_report(token, base_account_id, account_id, entity, start_date, end_date)
        result[entity] = rows

    return result

def main():
    """メイン処理"""

    # ===== 環境変数から認証情報を取得 =====
    client_id = os.getenv("YAHOO_ADS_CLIENT_ID")
    client_secret = os.getenv("YAHOO_ADS_CLIENT_SECRET")
    refresh_token = os.getenv("YAHOO_ADS_REFRESH_TOKEN")
    base_account_id = os.getenv("YAHOO_ADS_BASE_ACCOUNT_ID")

    # 必須項目の確認
    required = {
        "YAHOO_ADS_CLIENT_ID": client_id,
        "YAHOO_ADS_CLIENT_SECRET": client_secret,
        "YAHOO_ADS_REFRESH_TOKEN": refresh_token,
        "YAHOO_ADS_BASE_ACCOUNT_ID": base_account_id,
    }
    missing = [k for k, v in required.items() if not v]
    if missing:
        log_error(f"Missing required environment variables: {', '.join(missing)}")
        sys.exit(1)

    base_account_id = int(base_account_id)

    # ===== 設定 =====
    # 取得期間（2025年10月1日〜10月31日）
    START_DATE = date(2025, 10, 1)
    END_DATE = date(2025, 10, 31)

    # 出力ディレクトリ
    OUTPUT_DIR = "yahoo"
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # タイムスタンプ
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # レポートタイプ（Search広告のみ）
    entities = ["account", "campaign", "adgroup", "adgroupad"]

    # 並列ワーカー数
    max_workers = int(os.getenv("MAX_WORKERS", "5"))

    print("="*80)
    print("Yahoo広告 Search ローカル取得")
    print("="*80)
    print(f"出力先: {OUTPUT_DIR}/")
    print(f"エンティティ: {', '.join(entities)}")
    print(f"期間: {START_DATE} ～ {END_DATE}")
    print(f"並列ワーカー数: {max_workers}")
    print("="*80)

    # アクセストークン取得
    print("\nアクセストークン取得中...")
    token = get_access_token(client_id, client_secret, refresh_token)

    # アカウントリスト取得（Search広告のみ）
    print("\nアカウントリスト取得中...")
    accounts = fetch_account_ids(token, base_account_id)

    print(f"取得対象アカウント数: {len(accounts)}")
    for acc_id in accounts:
        print(f"  - Account ID: {acc_id}")

    # 並列実行
    all_results = []
    start_time = time.time()

    if max_workers == 1:
        for account_id in accounts:
            result = process_account(
                token, base_account_id, account_id,
                entities, START_DATE, END_DATE
            )
            all_results.append(result)
    else:
        with ThreadPoolExecutor(max_workers=max_workers) as ex:
            futs = {
                ex.submit(
                    process_account,
                    token, base_account_id, account_id,
                    entities, START_DATE, END_DATE
                ): account_id
                for account_id in accounts
            }
            for fut in as_completed(futs):
                try:
                    all_results.append(fut.result())
                except Exception as e:
                    acc_id = futs[fut]
                    log_error(f"Thread error for account {acc_id}: {repr(e)}")

    elapsed_time = time.time() - start_time

    # エンティティごとにデータを結合してCSV出力
    print(f"\n{'='*80}")
    print("CSV出力処理")
    print(f"{'='*80}")

    for entity in entities:
        all_rows = []

        # 全アカウントのデータを収集
        for result in all_results:
            if entity in result and result[entity]:
                all_rows.extend(result[entity])

        if all_rows:
            # ディレクトリ作成
            entity_dir = os.path.join(OUTPUT_DIR, entity)
            os.makedirs(entity_dir, exist_ok=True)

            # ファイル名生成
            filename = f"{entity}_report_{timestamp}.csv"
            filepath = os.path.join(entity_dir, filename)

            # DataFrameに変換してCSV出力
            df = pd.DataFrame(all_rows)

            # Day列を削除し、dateを最初のカラムに移動
            if "Day" in df.columns:
                df = df.drop(columns=["Day"])
            if "date" in df.columns:
                date_col = df.pop("date")
                df.insert(0, "date", date_col)

            df.to_csv(filepath, index=False, encoding="utf-8")

            print(f"  ✓ {entity}: {len(all_rows)}行 → {filepath}")
        else:
            print(f"  ⚠️ {entity}: データなし")

    # サマリー
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
        log_error(repr(e))
        import traceback
        traceback.print_exc()
        sys.exit(1)
