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
from dotenv import load_dotenv
from bingads.authorization import OAuthWebAuthCodeGrant
from bingads.service_client import ServiceClient
from bingads.v13.reporting import ReportingServiceManager
from bingads import AuthorizationData

import boto3
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

# 定数
JST = timezone(timedelta(hours=9))
DEFAULT_REDIRECT_URI = "https://login.microsoftonline.com/common/oauth2/nativeclient"

# ロガー設定
logger = logging.getLogger("msads-to-s3")
if not logger.handlers:
    _h = logging.StreamHandler(sys.stdout)
    _h.setFormatter(logging.Formatter("%(levelname)s:%(name)s:%(message)s"))
    logger.addHandler(_h)
logger.setLevel(logging.INFO)

# ---------- ログ/エラー補助（JSON構造化） ----------
def _jlog(level: str, **payload):
    base = {"ts": datetime.now(JST).isoformat(), "level": level.upper(), "app": "ms-ads-to-s3"}
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
def load_secret_json(secret_id: str, region: Optional[str] = None) -> dict:
    sm = boto3.client("secretsmanager", region_name=region)
    res = sm.get_secret_value(SecretId=secret_id)
    if "SecretString" in res:
        return json.loads(res["SecretString"])
    return json.loads(res["SecretBinary"].decode("utf-8"))

def validate_secret(secret: dict):
    required = ["CLIENT_ID", "CLIENT_SECRET", "DEVELOPER_TOKEN", "REFRESH_TOKEN"]
    missing = [k for k in required if not (secret.get(k) or secret.get(k.lower()))]
    if missing:
        for k in missing:
            logger.error(f"[SECRET] Missing key: {k}")
        raise SystemExit(2)
    env = (secret.get("ENV") or secret.get("environment") or "production").strip().lower()
    if env not in ("production", "sandbox"):
        logger.error(f"[SECRET] ENV must be 'production' or 'sandbox', got: {env}")
        raise SystemExit(2)

def normalize_id_list(raw) -> List[int]:
    out: List[int] = []
    if raw is None:
        return out
    items = raw if isinstance(raw, (list, tuple)) else str(raw).replace(" ", "").split(",")
    for x in items:
        if x in (None, "", "null", "None"):
            continue
        try:
            out.append(int(str(x).strip()))
        except:
            pass
    return sorted(set(out))

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
    """レポートダウンロード（高速化版）"""
    try:
        # trackのタイムアウトを短縮（10分 → 5分）
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

    # ポーリング設定を最適化
    max_tries = 12  # 15 → 12に削減
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
            # ポーリング間隔を短縮（1秒固定）
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

def resolve_period(start_date: str, end_date: str) -> Tuple[date, date, int]:
    """期間設定（バックフィル専用）

    Args:
        start_date: 開始日（YYYY-MM-DD形式）
        end_date: 終了日（YYYY-MM-DD形式）

    Returns:
        (開始日, 終了日, 日数) のタプル
    """
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()

        if start_dt > end_dt:
            raise ValueError(f"開始日({start_date})が終了日({end_date})より後になっています")

        calculated_days = (end_dt - start_dt).days + 1
        _jlog("INFO", where="resolve_period",
              start_date=start_date, end_date=end_date, days=calculated_days)
        return start_dt, end_dt, calculated_days
    except ValueError as e:
        _jlog("ERROR", where="resolve_period.parse",
              error=str(e), start_date=start_date, end_date=end_date)
        raise

def make_report_time(factory, end_dt: date, days: int):
    """レポート期間の設定"""
    start_dt = end_dt - timedelta(days=days - 1)
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
    return time_obj, start_dt, end_dt

def get_report_columns(report_type: str) -> List[str]:
    """レポートタイプに応じたカラムリストを返す（修正版）"""
    
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
    """レポートタイプからエンティティ名を取得（修正版）"""
    mapping = {
        "Account": "account",
        "Campaign": "campaign",
        "AdGroup": "adgroup",  # 修正: "AdGroup" → "adgroup"
        "Ad": "adgroupad",
    }
    return mapping.get(report_type, report_type.lower())

def split_by_date(rows: List[Dict], date_col: str = "TimePeriod") -> Dict[str, List[Dict]]:
    """日付ごとにレコードを分割"""
    result = {}
    empty_date_count = 0
    
    for row in rows:
        dt_val = row.get(date_col, "")
        if isinstance(dt_val, str):
            dt_str = dt_val[:10] if dt_val else ""
        elif isinstance(dt_val, (date, datetime)):
            dt_str = dt_val.strftime("%Y-%m-%d")
        else:
            dt_str = str(dt_val)[:10] if dt_val else ""
        
        # 日付が空の場合はスキップ
        if not dt_str or dt_str == "":
            empty_date_count += 1
            _jlog("WARN", where="split_by_date.empty_date", 
                  date_col=date_col, row_sample=str(row)[:200])
            continue
            
        result.setdefault(dt_str, []).append(row)
    
    if empty_date_count > 0:
        _jlog("WARN", where="split_by_date.summary", 
              empty_date_rows=empty_date_count, total_rows=len(rows))
    
    return result

# ================================================================================
# 型変換
# ================================================================================

# 日付型
DATE_COLUMNS = ["TimePeriod"]

# 日時型
DATETIME_COLUMNS = ["_ingestion_timestamp"]

# 整数型 (INT64)
INT64_COLUMNS = [
    # ID系
    "AccountId", "CustomerId", "CampaignId", "AdGroupId", "AdId",
    
    # メトリクス（カウント）
    "Impressions", "Clicks", "Assists", "ViewThroughConversions",
    "Conversions", "AllConversions",
    
    # 品質スコア
    "QualityScore", "ExpectedCtr", "AdRelevance", "LandingPageExperience",
    "HistoricalQualityScore", "HistoricalExpectedCtr",
    "HistoricalAdRelevance", "HistoricalLandingPageExperience",
]

# 浮動小数点型 (FLOAT64)
FLOAT64_COLUMNS = [
    # 金額・単価
    "AverageCpc", "AverageCpm", "Spend",
    "CostPerConversion", "Revenue", "ReturnOnAdSpend", "RevenuePerConversion",
    "AllCostPerConversion", "AllRevenue", "AllReturnOnAdSpend", "AllRevenuePerConversion",
    
    # 認定コンバージョン（小数あり）
    "ConversionsQualified", "AllConversionsQualified",
    "ViewThroughConversionsQualified", "ViewThroughRevenue",
]

# パーセント型 (FLOAT64 で "XX%" → 0.XX に変換)
PERCENT_COLUMNS = [
    # コンバージョン率・クリック率など
    "Ctr", "ConversionRate", "AllConversionRate",
    
    # インプレッションシェア
    "ImpressionSharePercent", "ImpressionLostToBudgetPercent",
    "ImpressionLostToRankAggPercent", "ExactMatchImpressionSharePercent",
    "ClickSharePercent",
    
    # トップインプレッション
    "AbsoluteTopImpressionSharePercent", "TopImpressionSharePercent",
    "AbsoluteTopImpressionRatePercent", "TopImpressionRatePercent",
    "TopImpressionShareLostToRankPercent", "TopImpressionShareLostToBudgetPercent",
    "AbsoluteTopImpressionShareLostToRankPercent",
    "AbsoluteTopImpressionShareLostToBudgetPercent",
]

# 文字列型
STRING_COLUMNS = [
    # アカウント情報
    "AccountName", "AccountNumber", "AccountStatus", "CurrencyCode", "CustomerName",
    
    # キャンペーン情報
    "CampaignName", "CampaignStatus", "CampaignType",
    
    # AdGroup情報
    "AdGroupName", "AdGroupStatus", "AdGroupType", "Status",
    
    # Ad情報
    "AdStatus", "AdType",
]

# 配列型
LABEL_COLUMNS = [
    "CampaignLabels",
    "AdGroupLabels",
    "AdLabels",
]


def convert_types(df: pd.DataFrame) -> pd.DataFrame:
    """DataFrame型変換"""
    result = df.copy()

    # 日付型
    for col in DATE_COLUMNS:
        if col in result.columns:
            result[col] = pd.to_datetime(result[col], errors='coerce').dt.date

    # 日時型（UTC想定）
    for col in DATETIME_COLUMNS:
        if col in result.columns:
            result[col] = pd.to_datetime(result[col], errors='coerce')

    # 整数型（カンマ除去 → 数値化 → Nullable Int64）
    for col in INT64_COLUMNS:
        if col in result.columns:
            result[col] = result[col].astype(str).str.replace(',', '', regex=False)
            result[col] = pd.to_numeric(result[col], errors='coerce').astype('Int64')

    # 浮動小数点型（カンマ除去 → 数値化）
    for col in FLOAT64_COLUMNS:
        if col in result.columns:
            result[col] = result[col].astype(str).str.replace(',', '', regex=False)
            result[col] = pd.to_numeric(result[col], errors='coerce')

    # パーセント型（"XX%" → 0.XX）
    for col in PERCENT_COLUMNS:
        if col in result.columns:
            def _to_ratio(x):
                if pd.isna(x):
                    return None
                s = str(x).strip()
                if not s or s in ("-", "—", "N/A", "None"):
                    return None
                # "12,3%" のような欧州小数を簡易的に吸収
                s = s.replace(",", ".").rstrip("%")
                try:
                    return float(s) / 100.0
                except Exception:
                    return None
            result[col] = result[col].apply(_to_ratio)

    # ラベル列（配列化: List[str]）
    for col in LABEL_COLUMNS:
        if col in result.columns:
            def _to_str_list(x):
                if x is None or (isinstance(x, float) and pd.isna(x)):
                    return []
                if isinstance(x, list):
                    return [str(v).strip() for v in x if str(v).strip()]
                s = str(x).strip()
                if not s or s in ("-", "—", "N/A", "None"):
                    return []
                # JSON配列風 ["A","B"] に見えたらJSONとして解釈
                if (s.startswith('[') and s.endswith(']')) or (s.startswith('["') and s.endswith('"]')):
                    try:
                        parsed = json.loads(s)
                        if isinstance(parsed, list):
                            return [str(v).strip() for v in parsed if str(v).strip()]
                    except Exception:
                        pass
                # 区切り文字で分割（, ; 全角カンマ 、 縦棒 | など想定）
                parts = re.split(r'[;,、|]', s)
                return [p.strip() for p in parts if p.strip()]
            result[col] = result[col].apply(_to_str_list)

    # 文字列型
    for col in STRING_COLUMNS:
        if col in result.columns:
            result[col] = result[col].astype(str)

    return result



def put_s3_parquet_by_date(s3_bucket: str, s3_prefix: str, filename_pattern: str,
                          account_id: int, run_ts: str, entity_type: str,
                          rows_by_date: Dict[str, List[Dict]]):
    """日付ごとにParquetファイルをS3にアップロード（修正版）"""
    s3 = boto3.client("s3")
    utc_now_iso = datetime.now(timezone.utc).isoformat()
    
    # デバッグ: 日付キーを確認
    _jlog("DEBUG", where="put_s3_parquet_by_date.dates", 
          date_keys=list(rows_by_date.keys()), 
          num_dates=len(rows_by_date))
    
    for date_str, rows in rows_by_date.items():
        if not rows:
            continue
        
        # 日付が空の場合をチェック
        if not date_str or date_str.strip() == "":
            _jlog("ERROR", where="put_s3_parquet_by_date.empty_date", 
                  date_str=repr(date_str), num_rows=len(rows),
                  sample_row=str(rows[0])[:300] if rows else "")
            continue
        
        # 全行に取得日時を追加
        for row in rows:
            row['_ingestion_timestamp'] = utc_now_iso
        
        df = pd.DataFrame(rows)
        df = convert_types(df) 
        table = pa.Table.from_pandas(df, preserve_index=False)
        
        with io.BytesIO() as buf:
            pq.write_table(table, buf, compression=None)
            parquet_bytes = buf.getvalue()
        
        # 日付フォーマット: YYYYMMDD
        date_only = date_str.replace("-", "")
        
        # ファイル名生成
        filename = filename_pattern.format(
            dataType=entity_type,
            accountId=account_id,
            date=date_only,
            run_ts=run_ts
        )
        
        # S3パス: {prefix}/{entity}/{account_id}/{data_date}/{ts}/{filename}
        key = f"{s3_prefix}/{entity_type}/{account_id}/{date_only}/{run_ts}/{filename}"
        
        s3.put_object(Bucket=s3_bucket, Key=key, Body=parquet_bytes)
        _jlog("INFO", where="put_s3_bytes", s3=f"s3://{s3_bucket}/{key}", bytes=len(parquet_bytes))

def fetch_report(env: str, auth_rep: AuthorizationData, report_type: str,
                account_id: int, account_name: str, time_obj,
                s3_bucket: str, s3_prefix: str, filename_pattern: str, run_ts: str,
                start_dt: date, end_dt: date) -> Tuple[int, List[Dict]]:
    """レポート取得とS3アップロード"""
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
        req.ReturnOnlyCompleteData = False  # 当日データを含むためFalse
        req.Format = "Csv"
        
        # カラム設定
        columns_list = get_report_columns(report_type)
        req.Columns = factory.create(f"ArrayOf{report_type}PerformanceReportColumn")
        for col in columns_list:
            req.Columns[f"{report_type}PerformanceReportColumn"].append(col)
        
        # レポート生成（並列実行時のディレクトリ競合を回避）
        unique_dir = f"/tmp/BingAdsSDKPython_{account_id}_{report_type}_{os.getpid()}_{random.randint(1000,9999)}"
        mgr = ReportingServiceManager(
            authorization_data=auth_rep,
            environment=env,
            working_directory=unique_dir,
            poll_interval_in_milliseconds=1000  # 2秒 → 1秒に短縮
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
        
        # エンコーディング検出とCSVパース（ヘッダー検出対応）
        enc = _detect_encoding(data_bytes[:4096])
        text = data_bytes.decode(enc, errors="replace")
        
        # ヘッダー行を検出してCSVをパース
        rows = _parse_csv_with_header_detection(text)
        
        if not rows:
            _jlog("INFO", where="fetch_report.no_rows", report_type=report_type,
                  account_id=account_id, account_name=account_name)
            return 0, []
        
        # 日付ごとに分割してS3にアップロード
        rows_by_date = split_by_date(rows, "TimePeriod")
        put_s3_parquet_by_date(s3_bucket, s3_prefix, filename_pattern,
                              account_id, run_ts, entity_type, rows_by_date)
        
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
                    s3_bucket: str, s3_prefix: str, filename_pattern: str, run_ts: str,
                    end_dt_for_all: date, days: int) -> Dict[str, Any]:
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

    time_obj, start_dt, end_dt = make_report_time(factory, end_dt_for_all, days)
    print(f"  期間: {start_dt.isoformat()} ～ {end_dt.isoformat()}")

    results = {"account_id": account_id, "account_name": account_name, "success": True, "skipped": False, "reports": {}}

    if "Account" in report_types:
        print(f"  Accountレポート取得中...")
        row_count, _ = fetch_report(env, auth_rep, "Account", account_id, account_name, time_obj,
                                    s3_bucket, s3_prefix, filename_pattern, run_ts,
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
                                    s3_bucket, s3_prefix, filename_pattern, run_ts,
                                    start_dt, end_dt)
        if row_count > 0:
            print(f"    ✓ 完了: {row_count}行")
            results["reports"][report_type] = {"rows": row_count}
        else:
            print(f"    ⚠️ データなし")
            results["reports"][report_type] = {"rows": 0}

    return results

def main():
    """メイン処理（バックフィル専用）"""
    import argparse
    parser = argparse.ArgumentParser(
        description="Microsoft広告レポート バックフィル取得ツール"
    )
    parser.add_argument("--secret-id", default=os.getenv("SECRET_ID", "microsoft-ads-connection"),
                        help="AWS Secrets ManagerのシークレットID")
    parser.add_argument("--aws-region", default=os.getenv("AWS_REGION", "ap-northeast-1"),
                        help="AWSリージョン")
    parser.add_argument("--start-date", type=str, required=True,
                        help="取得開始日（YYYY-MM-DD形式）【必須】")
    parser.add_argument("--end-date", type=str, required=True,
                        help="取得終了日（YYYY-MM-DD形式）【必須】")
    parser.add_argument("--max-workers", type=int, default=int(os.getenv("MAX_WORKERS", "10")),
                        help="アカウント並列実行のワーカー数（デフォルト: 10）")

    args, unknown = parser.parse_known_args()
    if unknown:
        logger.warning(f"ignored extra args: {unknown}")

    # Secrets Manager
    secret = load_secret_json(args.secret_id, args.aws_region)
    validate_secret(secret)

    # 認証情報
    client_id = secret.get("CLIENT_ID") or secret.get("client_id")
    client_secret = secret.get("CLIENT_SECRET") or secret.get("client_secret")
    developer_token = secret.get("DEVELOPER_TOKEN") or secret.get("developer_token")
    refresh_token = secret.get("REFRESH_TOKEN") or secret.get("refresh_token")
    env = (secret.get("ENV") or secret.get("environment") or "production").lower()
    
    redirect_uri = (secret.get("REDIRECT_URI") or secret.get("redirect_uri") or 
                  secret.get("MSADS_REDIRECT_URI") or DEFAULT_REDIRECT_URI)

    # S3設定
    s3_bucket = secret.get("S3_BUCKET") or "ads-data-collect"
    s3_prefix = secret.get("S3_PREFIX") or "microsoft"
    filename_pattern = secret.get("FILENAME_PATTERN") or "microsoft_{dataType}_{accountId}_{date}_{run_ts}.parq"

    # 除外アカウント
    except_account_ids = set(normalize_id_list(secret.get("EXCEPT_ACCOUNT_IDS") or secret.get("except_account_ids")))

    # 実行タイムスタンプ
    run_ts = datetime.now(JST).strftime("%Y%m%d%H%M%S")

    # レポートタイプ
    report_types = ["Account", "Campaign", "AdGroup", "Ad"]

    # 期間設定（バックフィル専用）
    start_dt_for_all, end_dt_for_all, days = resolve_period(args.start_date, args.end_date)

    print("="*80)
    print("Microsoft広告 バックフィルレポート取得 → S3")
    print("="*80)
    print(f"Secret ID: {args.secret_id}")
    print(f"Redirect URI: {redirect_uri}")
    print(f"S3 Bucket: {s3_bucket}")
    print(f"S3 Prefix: {s3_prefix}")
    print(f"レポートタイプ: {', '.join(report_types)}")
    print(f"期間: {start_dt_for_all} ～ {end_dt_for_all} ({days}日分)")
    print(f"並列ワーカー数: {args.max_workers}")
    print("="*80)

    # アカウントリストを取得
    print("\nアカウントリスト取得中...")
    all_accounts = get_accounts(env, client_id, client_secret, developer_token, refresh_token, redirect_uri)
    if not all_accounts:
        print("アカウントが見つかりませんでした")
        return
    accounts = [(aid, name) for aid, name in all_accounts if aid not in except_account_ids]

    print(f"全アカウント数: {len(all_accounts)}")
    if except_account_ids:
        print(f"除外アカウント数: {len(except_account_ids)}")
    print(f"取得対象アカウント数: {len(accounts)}")
    for acc_id, acc_name in accounts:
        print(f"  - {acc_name} (ID: {acc_id})")

    # 並列実行
    all_results = []
    max_workers = max(1, int(args.max_workers))
    
    start_time = time.time()
    
    if max_workers == 1:
        for account_id, account_name in accounts:
            result = process_account(
                env, client_id, client_secret, developer_token, refresh_token, redirect_uri,
                account_id, account_name, report_types,
                s3_bucket, s3_prefix, filename_pattern, run_ts,
                end_dt_for_all=end_dt_for_all, days=days
            )
            all_results.append(result)
    else:
        with ThreadPoolExecutor(max_workers=max_workers) as ex:
            futs = {
                ex.submit(
                    process_account,
                    env, client_id, client_secret, developer_token, refresh_token, redirect_uri,
                    account_id, account_name, report_types,
                    s3_bucket, s3_prefix, filename_pattern, run_ts,
                    end_dt_for_all, days
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
