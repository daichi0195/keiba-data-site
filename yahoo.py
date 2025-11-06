import sys
import io
import csv
import json
import time
import gzip
import argparse
from typing import List, Dict, Optional
from datetime import datetime, timezone, timedelta

import boto3
import requests
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# ================= 基本設定 =================
UA = "yahoo-search+display-daily/1.0 (+python-requests)"

TOKEN_URL     = "https://biz-oauth.yahoo.co.jp/oauth/v1/token"
SEARCH_BASE   = "https://ads-search.yahooapis.jp/api/v18"
DISPLAY_BASE  = "https://ads-display.yahooapis.jp/api/v18"
BASES = {"search": SEARCH_BASE, "display": DISPLAY_BASE}
PATHS = {
    "account_get": "/AccountService/get",
    "report_add": "/ReportDefinitionService/add",
    "report_get": "/ReportDefinitionService/get",
    "report_download": "/ReportDefinitionService/download",
}
JST = timezone(timedelta(hours=9))

DEFAULT_SECRET_ID        = "yahoo-ads-connection"
DEFAULT_BASE_ACCOUNT_ID  = 1002385335
DEFAULT_S3_BUCKET        = "ads-data-collect"
DEFAULT_S3_PREFIX        = "yahoo"
DEFAULT_LANG             = "EN"

DEFAULT_FILENAME_PATTERN = "{dataType}_{accountId}_{date}_{run_ts}.parq"
SOURCE_DIR_IN_KEY = True

# =============== ログ ===============
VERBOSE = True
def log_info(msg: str):
    if VERBOSE:
        print(f"[INFO] {msg}", file=sys.stdout)
        sys.stdout.flush()
def log_warn(msg: str):
    print(f"[WARN] {msg}", file=sys.stdout)
    sys.stdout.flush()
def log_error(msg: str):
    print(f"[ERROR] {msg}", file=sys.stdout)
    sys.stdout.flush()

# =============== Secrets / 認証 ===============
def load_secret_json(secret_id: str, max_retries: int = 3) -> Dict[str, str]:
    """
    AWS Secrets Manager からシークレット情報を取得（リトライ付き）

    Args:
        secret_id: シークレットID
        max_retries: リトライ上限回数

    Returns:
        認証情報を含む辞書

    Raises:
        RuntimeError: シークレット取得失敗時
    """
    from botocore.exceptions import ClientError

    for attempt in range(max_retries):
        try:
            sm = boto3.client("secretsmanager")
            v = sm.get_secret_value(SecretId=secret_id)
            s = v.get("SecretString")
            if not s:
                raise RuntimeError(f"secret '{secret_id}' has no SecretString")

            data = json.loads(s)
            for k in ("client_id", "client_secret", "refresh_token"):
                if not data.get(k):
                    raise RuntimeError(f"secret '{secret_id}' missing key: {k}")

            log_info(f"Successfully loaded secret '{secret_id}'")
            return data

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']

            # 致命的エラー（リトライ不可）
            if error_code == 'ResourceNotFoundException':
                log_error(f"Secret '{secret_id}' not found in Secrets Manager")
                raise RuntimeError(f"Secret '{secret_id}' does not exist") from e
            elif error_code == 'AccessDeniedException':
                log_error(f"Access denied to secret '{secret_id}'. Check IAM permissions.")
                raise RuntimeError(f"IAM access denied to secret '{secret_id}'") from e

            # リトライ可能なエラー
            if attempt < max_retries - 1:
                sleep_time = BASE_BACKOFF * (2 ** attempt)
                log_warn(f"Failed to load secret (attempt {attempt + 1}/{max_retries}): {error_code} - {error_message}. Retrying in {sleep_time}s...")
                time.sleep(sleep_time)
            else:
                log_error(f"Failed to load secret after {max_retries} attempts: {error_code}")
                raise RuntimeError(f"Failed to load secret '{secret_id}' after {max_retries} attempts: {error_code}") from e

        except json.JSONDecodeError as e:
            log_error(f"Invalid JSON in secret '{secret_id}': {str(e)}")
            raise RuntimeError(f"Secret '{secret_id}' contains invalid JSON") from e

        except Exception as e:
            if attempt < max_retries - 1:
                sleep_time = BASE_BACKOFF * (2 ** attempt)
                log_warn(f"Unexpected error loading secret (attempt {attempt + 1}/{max_retries}): {str(e)}. Retrying in {sleep_time}s...")
                time.sleep(sleep_time)
            else:
                log_error(f"Unexpected error loading secret after {max_retries} attempts: {str(e)}")
                raise RuntimeError(f"Unexpected error loading secret '{secret_id}': {str(e)}") from e

    # この行に到達することはない（ループが例外で終了する）
    raise RuntimeError(f"Failed to load secret '{secret_id}'")

def normalize_ids(raw) -> List[int]:
    out: List[int] = []
    if isinstance(raw, (list, tuple)):
        for x in raw:
            try:
                out.append(int(str(x).strip()))
            except Exception:
                pass
    return sorted(set(out))

def load_excluded_ids(secret_id: str, key: str) -> List[int]:
    data = load_secret_json(secret_id)
    return normalize_ids(data.get(key, []))

def get_access_token(secret_id: str, max_retries: int = 3) -> str:
    """
    Yahoo OAuth トークンを取得（リトライ付き）

    Args:
        secret_id: Secrets Manager のシークレットID
        max_retries: リトライ上限回数

    Returns:
        アクセストークン

    Raises:
        RuntimeError: トークン取得失敗時
    """
    cred = load_secret_json(secret_id, max_retries=max_retries)
    log_info(f"Attempting to fetch access token...")

    for attempt in range(max_retries):
        try:
            # 1. Form 形式でのリクエスト
            log_info(f"Token request (form) - attempt {attempt + 1}/{max_retries}")
            r = requests.post(
                TOKEN_URL,
                headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA},
                data={
                    "grant_type": "refresh_token",
                    "client_id": cred["client_id"],
                    "client_secret": cred["client_secret"],
                    "refresh_token": cred["refresh_token"],
                },
                timeout=30,
            )

            if r.status_code == 200:
                token = r.json().get("access_token")
                if not token:
                    raise RuntimeError("Response does not contain 'access_token'")
                log_info(f"Successfully obtained access token")
                return token

            # Form 形式失敗時は Basic 認証にフォールバック
            log_warn(f"Token request (form) failed: status={r.status_code}. Trying Basic auth...")
            r = requests.post(
                TOKEN_URL,
                headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA},
                data={"grant_type": "refresh_token", "refresh_token": cred["refresh_token"]},
                auth=(cred["client_id"], cred["client_secret"]),
                timeout=30,
            )

            if r.status_code == 200:
                token = r.json().get("access_token")
                if not token:
                    raise RuntimeError("Response does not contain 'access_token'")
                log_info(f"Successfully obtained access token (via Basic auth)")
                return token

            # 両方失敗 → リトライ判定
            error_text = r.text[:300]
            log_warn(f"Token request (basic) failed: status={r.status_code} body={error_text}")

            # リトライ可能なエラーかチェック
            retriable = r.status_code in (429, 500, 502, 503, 504)
            if not retriable or attempt == max_retries - 1:
                log_error(f"Token fetch failed (non-retriable or max retries): status={r.status_code}")
                r.raise_for_status()

            # リトライ
            if attempt < max_retries - 1:
                sleep_time = BASE_BACKOFF * (2 ** attempt) + random.uniform(*JITTER_RANGE)
                log_info(f"Retrying token fetch in {sleep_time:.1f}s...")
                time.sleep(sleep_time)

        except requests.exceptions.Timeout as e:
            log_warn(f"Token request timeout (attempt {attempt + 1}/{max_retries}): {str(e)}")
            if attempt < max_retries - 1:
                sleep_time = BASE_BACKOFF * (2 ** attempt) + random.uniform(*JITTER_RANGE)
                log_info(f"Retrying token fetch in {sleep_time:.1f}s...")
                time.sleep(sleep_time)
            else:
                log_error(f"Token request timeout after {max_retries} attempts")
                raise RuntimeError(f"Token fetch timeout after {max_retries} attempts") from e

        except requests.exceptions.ConnectionError as e:
            log_warn(f"Token request connection error (attempt {attempt + 1}/{max_retries}): {str(e)}")
            if attempt < max_retries - 1:
                sleep_time = BASE_BACKOFF * (2 ** attempt) + random.uniform(*JITTER_RANGE)
                log_info(f"Retrying token fetch in {sleep_time:.1f}s...")
                time.sleep(sleep_time)
            else:
                log_error(f"Token request connection error after {max_retries} attempts")
                raise RuntimeError(f"Token fetch connection error after {max_retries} attempts") from e

        except Exception as e:
            log_error(f"Unexpected error fetching token: {str(e)}")
            raise RuntimeError(f"Unexpected error fetching token: {str(e)}") from e

    raise RuntimeError(f"Failed to obtain access token after {max_retries} attempts")

def hdr(token: str, base_account_id: int) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": UA,
        "x-z-base-account-id": str(base_account_id),
    }

# =============== アカウント一覧（MCC配下） ===============
def fetch_account_ids(source: str, token: str, base_account_id: int) -> List[int]:
    url = BASES[source] + PATHS["account_get"]
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

# =============== ReportDefinitionService ===============
def add_report_custom_date(session: requests.Session, source: str, token: str,
                           base_account_id: int, account_id: int,
                           fields: List[str], lang: str = "EN",
                           report_type: Optional[str] = None,
                           start_date: str = None, end_date: str = None) -> int:
    """
    カスタム日付範囲でレポートを作成

    Args:
        session: リクエストセッション
        source: "search" または "display"
        token: アクセストークン
        base_account_id: ベースアカウントID
        account_id: アカウントID
        fields: 取得フィールドリスト
        lang: レポート言語 ("EN" または "JA")
        report_type: レポートタイプ (search/display)
        start_date: 開始日 (YYYYMMDD形式)
        end_date: 終了日 (YYYYMMDD形式)

    Returns:
        レポートジョブID
    """
    url = BASES[source] + PATHS["report_add"]
    operand = {
        "reportName": f"{source}_{account_id}_{int(time.time())}",
        "fields": fields,
        "reportDownloadFormat": "CSV",
        "reportLanguage": lang,
        "reportDateRangeType": "CUSTOM_DATE",
        "dateRange": {
            "startDate": start_date,
            "endDate": end_date
        }
    }
    # report_type が指定されている場合は追加（search/display両対応）
    if report_type:
        operand["reportType"] = report_type

    body = {"accountId": int(account_id), "operand": [operand]}

    # API レート制限対策：リクエスト前に遅延を追加
    time.sleep(0.5)

    r = session.post(url, headers=hdr(token, base_account_id), json=body, timeout=90)
    if r.status_code != 200:
        log_error(f"/add ({source}) -> {r.text}")
        r.raise_for_status()
    payload = r.json() or {}
    vals = ((payload.get("rval") or {}).get("values") or [])
    if not vals or not vals[0].get("operationSucceeded"):
        raise RuntimeError(f"/add returned non-succeeded ({source}) -> {r.text}")
    return (vals[0].get("reportDefinition") or {}).get("reportJobId")

def get_status(session: requests.Session, source: str, token: str,
               base_account_id: int, account_id: int, job_id: int) -> str:
    url = BASES[source] + PATHS["report_get"]
    body = {"accountId": int(account_id), "reportJobIds": [int(job_id)]}

    # API レート制限対策：リクエスト前に遅延を追加
    time.sleep(0.5)

    r = session.post(url, headers=hdr(token, base_account_id), json=body, timeout=60)
    if r.status_code != 200:
        log_error(f"/get_status ({source}) account_id={account_id}, job_id={job_id} -> Status {r.status_code}: {r.text}")
        r.raise_for_status()
    vals = ((r.json().get("rval") or {}).get("values") or [])
    rep = vals[0].get("reportDefinition") if vals else {}
    return rep.get("reportJobStatus", "UNKNOWN")

def download_csv_text(session: requests.Session, source: str, token: str,
                      base_account_id: int, account_id: int, job_id: int) -> str:
    url = BASES[source] + PATHS["report_download"]
    body = {"accountId": int(account_id), "reportJobId": int(job_id)}

    # API レート制限対策：リクエスト前に遅延を追加
    time.sleep(0.5)

    r = session.post(url, headers=hdr(token, base_account_id), json=body, timeout=300)
    if r.status_code != 200:
        log_error(f"/download ({source}) account_id={account_id}, job_id={job_id} -> Status {r.status_code}: {r.text}")
        r.raise_for_status()
    raw = r.content
    if len(raw) >= 2 and raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    return raw.decode("utf-8", "replace")


# =============== CSV パース ===============

def csv_to_rows(csv_text: str, entity: Optional[str] = None) -> List[Dict[str, str]]:
    """
    CSV テキストをパース して行をリストで返却
    【デバッグ強化版】実際のCSVデータの中身を詳細ログ出力

    Args:
        csv_text: Yahoo API から取得した CSV テキスト
        entity: エンティティタイプ（参考用）

    Returns:
        List[Dict]: CSV の行をそのまま辞書リストで返却
    """
    # CSV全体のサイズをログ出力
    log_info(f"[CSV_INPUT] CSV text length: {len(csv_text)} bytes")

    # ★デバッグ：CSVの最初の500文字を出力（データ内容確認用）
    if len(csv_text) > 0:
        preview = csv_text[:500].replace('\n', '\\n').replace('\r', '\\r')
        log_info(f"[CSV_DEBUG] First 500 chars of CSV: {preview}")

    src = io.StringIO(csv_text)
    rdr = csv.DictReader(src)
    rows_out: List[Dict[str, str]] = []

    # デバッグ: ヘッダー情報をログ出力
    if rdr.fieldnames:
        log_info(f"[CSV_HEADER] Fieldnames: {list(rdr.fieldnames)}")
        log_info(f"[CSV_HEADER] Number of columns: {len(rdr.fieldnames)}")
    else:
        log_error(f"[CSV_ERROR] No fieldnames found in CSV!")
        return rows_out

    total_rows_read = 0
    skipped_empty = 0
    skipped_header = 0
    skipped_total = 0
    skipped_no_day = 0
    skipped_invalid_day = 0

    for row_idx, row in enumerate(rdr):
        total_rows_read += 1

        # ★デバッグ：最初の3行は全内容を出力
        if row_idx < 3:
            log_info(f"[CSV_ROW_{row_idx}] Full row data: {row}")

        # 空行をスキップ
        if not any(row.values()):
            if row_idx < 3:
                log_info(f"[CSV_ROW_{row_idx}] Skipping empty row")
            skipped_empty += 1
            continue

        # Yahoo API の日付カラムを 'date' に統一
        # Display API は "Daily"、Search API は "Day" を使用
        date_value = row.get("Day") or row.get("Daily")

        # ★デバッグ：日付カラムの値を詳細出力（最初の10行）
        if row_idx < 10:
            log_info(f"[CSV_ROW_{row_idx}] Date value: '{date_value}' (type: {type(date_value).__name__}, len: {len(str(date_value)) if date_value else 0})")

        # 日付カラムが存在しない場合
        if "Day" not in row and "Daily" not in row:
            if row_idx < 3:
                log_warn(f"[CSV_ROW_{row_idx}] No 'Day' or 'Daily' column found! Available keys: {list(row.keys())}")
            skipped_no_day += 1
            continue

        # ヘッダー行や無効な行をスキップ
        # 「Day」または「Daily」の値がカラム名そのもの（例："Day"、"Daily"）の場合はヘッダーの二重読み込み
        if not date_value or date_value in ("Day", "Daily"):
            if row_idx < 3:
                log_info(f"[CSV_ROW_{row_idx}] Skipping header/invalid row: date_value={date_value}, row_keys={list(row.keys())[:5]}")
            skipped_header += 1
            continue

        # 合計行をスキップ
        if date_value in ("Total", "合計"):
            if row_idx < 3:
                log_info(f"[CSV_ROW_{row_idx}] Skipping total row: date_value={date_value}")
            skipped_total += 1
            continue

        # ★デバッグ：日付フォーマットのバリデーション詳細
        # 元のコードでは日付フォーマットチェックがなかったが、
        # 念のため日付値の妥当性をチェック
        date_str = str(date_value).strip()

        # 日付フォーマットの検証（警告のみ、スキップはしない）
        if not date_str:
            if row_idx < 10:
                log_warn(f"[CSV_ROW_{row_idx}] Empty date value after strip")
            skipped_invalid_day += 1
            continue

        # 日付フォーマットのパターンをログ出力（最初の5件）
        if row_idx < 5:
            log_info(f"[CSV_ROW_{row_idx}] Date format check: '{date_str}' - length={len(date_str)}, isdigit={date_str.isdigit()}, contains_hyphen={'-' in date_str}, contains_slash={'/' in date_str}")

        # 'date' キーを明示的に追加
        row["date"] = date_str

        if row_idx < 3:
            log_info(f"[CSV_ROW_{row_idx}] ✓ Valid data row added: date={date_str}")

        rows_out.append(row)

    # ★デバッグ：詳細な統計情報
    log_info(f"[CSV_PARSED] Total rows read: {total_rows_read}")
    log_info(f"[CSV_PARSED] Skipped - empty: {skipped_empty}, header: {skipped_header}, total_row: {skipped_total}, no_day_column: {skipped_no_day}, invalid_day: {skipped_invalid_day}")
    log_info(f"[CSV_PARSED] Valid rows: {len(rows_out)}")

    if rows_out:
        log_info(f"[CSV_PARSED] ✓ Successfully parsed {len(rows_out)} rows")
        log_info(f"[CSV_PARSED] Sample keys: {list(rows_out[0].keys())[:10]}...")
        log_info(f"[CSV_PARSED] Has 'date' column? {'date' in rows_out[0]}")
        log_info(f"[CSV_PARSED] First row 'date' value: {rows_out[0].get('date')}")
    else:
        # データが0件の理由を詳しく記録
        if total_rows_read == 0:
            log_warn(f"[CSV_PARSED] ⚠ NO DATA - No data rows from API (total_rows_read={total_rows_read})")
        elif total_rows_read == 1 and skipped_header == 1:
            log_warn(f"[CSV_PARSED] ⚠ NO DATA - CSV has only header row, account has no data in this period (total_rows={total_rows_read}, skipped_header={skipped_header})")
        elif skipped_no_day > 0:
            log_warn(f"[CSV_PARSED] ⚠ NO DATA - All rows skipped: missing 'Day'/'Daily' column ({skipped_no_day} rows)")
        elif skipped_empty + skipped_header + skipped_total + skipped_invalid_day == total_rows_read:
            log_warn(f"[CSV_PARSED] ⚠ NO DATA - All rows filtered: empty={skipped_empty}, header={skipped_header}, total={skipped_total}, invalid_date={skipped_invalid_day}")
        else:
            log_warn(f"[CSV_PARSED] ⚠ NO DATA - No valid data rows parsed (breakdown: empty={skipped_empty}, header={skipped_header}, total={skipped_total}, no_day={skipped_no_day}, invalid={skipped_invalid_day})")

    return rows_out

# =============== フィールド型定義（ハードコード版 - AWS環境対応） ===============
FIELD_TYPES_ACCOUNT = {
    "ACCOUNT_ID": "STRING",
    "ACCOUNT_NAME": "STRING",
    "ALL_CONV": "DOUBLE",
    "ALL_CONV_RATE": "DOUBLE",
    "ALL_CONV_VALUE": "DOUBLE",
    "ALL_CONV_VALUE_PER_COST": "DOUBLE",
    "AVG_CPC": "DOUBLE",
    "BUDGET_LOST_IMPRESSION_SHARE": "DOUBLE",
    "CLICKS": "LONG",
    "CLICK_RATE": "DOUBLE",
    "CONVERSIONS": "DOUBLE",
    "CONV_RATE": "DOUBLE",
    "CONV_VALUE": "DOUBLE",
    "CONV_VALUE_PER_COST": "DOUBLE",
    "COST": "LONG",
    "COST_PER_ALL_CONV": "DOUBLE",
    "COST_PER_CONV": "DOUBLE",
    "CROSS_DEVICE_CONVERSIONS": "DOUBLE",
    "DAY": "STRING",
    "EXACT_MATCH_IMPRESSION_SHARE": "DOUBLE",
    "IMPRESSION_SHARE": "DOUBLE",
    "IMPS": "LONG",
    "INVALID_CLICKS": "LONG",
    "INVALID_CLICK_RATE": "DOUBLE",
    "QUALITY_LOST_IMPRESSION_SHARE": "DOUBLE",
    "VALUE_PER_ALL_CONV": "DOUBLE",
    "VALUE_PER_CONV": "DOUBLE",
}

FIELD_TYPES_CAMPAIGN = {
    "ABSOLUTE_TOP_IMPRESSION_PERCENTAGE": "DOUBLE",
    "AB_TEST_USAGE": "ENUM",
    "ACCOUNT_ID": "STRING",
    "ACCOUNT_NAME": "STRING",
    "ALL_CONV": "DOUBLE",
    "ALL_CONV_RATE": "DOUBLE",
    "ALL_CONV_VALUE": "DOUBLE",
    "ALL_CONV_VALUE_PER_COST": "DOUBLE",
    "AVG_CPC": "DOUBLE",
    "BID_STRATEGY_ID": "LONG",
    "BID_STRATEGY_NAME": "STRING",
    "BID_STRATEGY_STATUS": "ENUM",
    "BID_STRATEGY_TYPE": "ENUM",
    "BUDGET_ID": "LONG",
    "BUDGET_LOST_IMPRESSION_SHARE": "DOUBLE",
    "BUDGET_NAME": "STRING",
    "CAMPAIGN_DISTRIBUTION_SETTINGS": "ENUM",
    "CAMPAIGN_DISTRIBUTION_STATUS": "ENUM",
    "CAMPAIGN_END_DATE": "STRING",
    "CAMPAIGN_ID": "LONG",
    "CAMPAIGN_NAME": "STRING",
    "CAMPAIGN_START_DATE": "STRING",
    "CAMPAIGN_TRACKING_ID": "LONG",
    "CAMPAIGN_TYPE": "ENUM",
    "CLICKS": "LONG",
    "CLICK_RATE": "DOUBLE",
    "CONVERSIONS": "DOUBLE",
    "CONV_RATE": "DOUBLE",
    "CONV_VALUE": "DOUBLE",
    "CONV_VALUE_PER_COST": "DOUBLE",
    "COST": "LONG",
    "COST_PER_ALL_CONV": "DOUBLE",
    "COST_PER_CONV": "DOUBLE",
    "CROSS_DEVICE_CONVERSIONS": "DOUBLE",
    "CUSTOM_PARAMETERS": "STRING",
    "DAILY_SPENDING_LIMIT": "LONG",
    "DAY": "STRING",
    "EXACT_MATCH_IMPRESSION_SHARE": "DOUBLE",
    "IMPRESSION_SHARE": "DOUBLE",
    "IMPS": "LONG",
    "INVALID_CLICKS": "LONG",
    "INVALID_CLICK_RATE": "DOUBLE",
    "LABELS": "STRING",
    "LABELS_JSON": "STRING",
    "QUALITY_LOST_IMPRESSION_SHARE": "DOUBLE",
    "SEARCH_ABSOLUTE_TOP_IMPRESSION_SHARE": "DOUBLE",
    "SEARCH_BUDGET_LOST_ABSOLUTE_TOP_IMPRESSION_SHARE": "DOUBLE",
    "SEARCH_BUDGET_LOST_TOP_IMPRESSION_SHARE": "DOUBLE",
    "SEARCH_RANK_LOST_ABSOLUTE_TOP_IMPRESSION_SHARE": "DOUBLE",
    "SEARCH_RANK_LOST_TOP_IMPRESSION_SHARE": "DOUBLE",
    "SEARCH_TOP_IMPRESSION_SHARE": "DOUBLE",
    "TOP_IMPRESSION_PERCENTAGE": "DOUBLE",
    "TRACKING_URL": "STRING",
    "VALUE_PER_ALL_CONV": "DOUBLE",
    "VALUE_PER_CONV": "DOUBLE",
}

FIELD_TYPES_ADGROUP = {
    "ABSOLUTE_TOP_IMPRESSION_PERCENTAGE": "DOUBLE",
    "AB_TEST_USAGE": "ENUM",
    "ACCOUNT_ID": "STRING",
    "ACCOUNT_NAME": "STRING",
    "ADGROUP_BID": "LONG",
    "ADGROUP_DISTRIBUTION_SETTINGS": "ENUM",
    "ADGROUP_ID": "LONG",
    "ADGROUP_NAME": "STRING",
    "ADGROUP_TRACKING_ID": "LONG",
    "ALL_CONV": "DOUBLE",
    "ALL_CONV_RATE": "DOUBLE",
    "ALL_CONV_VALUE": "DOUBLE",
    "ALL_CONV_VALUE_PER_COST": "DOUBLE",
    "AVG_CPC": "DOUBLE",
    "CAMPAIGN_ID": "LONG",
    "CAMPAIGN_NAME": "STRING",
    "CAMPAIGN_TRACKING_ID": "LONG",
    "CLICKS": "LONG",
    "CLICK_RATE": "DOUBLE",
    "CONVERSIONS": "DOUBLE",
    "CONV_RATE": "DOUBLE",
    "CONV_VALUE": "DOUBLE",
    "CONV_VALUE_PER_COST": "DOUBLE",
    "COST": "LONG",
    "COST_PER_ALL_CONV": "DOUBLE",
    "COST_PER_CONV": "DOUBLE",
    "CROSS_DEVICE_CONVERSIONS": "DOUBLE",
    "CUSTOM_PARAMETERS": "STRING",
    "DAY": "STRING",
    "EXACT_MATCH_IMPRESSION_SHARE": "DOUBLE",
    "IMPRESSION_SHARE": "DOUBLE",
    "IMPS": "LONG",
    "LABELS": "STRING",
    "LABELS_JSON": "STRING",
    "QUALITY_LOST_IMPRESSION_SHARE": "DOUBLE",
    "SEARCH_ABSOLUTE_TOP_IMPRESSION_SHARE": "DOUBLE",
    "SEARCH_BUDGET_LOST_ABSOLUTE_TOP_IMPRESSION_SHARE": "DOUBLE",
    "SEARCH_BUDGET_LOST_TOP_IMPRESSION_SHARE": "DOUBLE",
    "SEARCH_RANK_LOST_ABSOLUTE_TOP_IMPRESSION_SHARE": "DOUBLE",
    "SEARCH_RANK_LOST_TOP_IMPRESSION_SHARE": "DOUBLE",
    "SEARCH_TOP_IMPRESSION_SHARE": "DOUBLE",
    "TOP_IMPRESSION_PERCENTAGE": "DOUBLE",
    "TRACKING_URL": "STRING",
    "VALUE_PER_ALL_CONV": "DOUBLE",
    "VALUE_PER_CONV": "DOUBLE",
}

FIELD_TYPES_ADGROUPAD = {
    "ABSOLUTE_TOP_IMPRESSION_PERCENTAGE": "DOUBLE",
    "AB_TEST_USAGE": "ENUM",
    "ACCOUNT_ID": "STRING",
    "ACCOUNT_NAME": "STRING",
    "ADGROUP_ID": "LONG",
    "ADGROUP_NAME": "STRING",
    "ADGROUP_TRACKING_ID": "LONG",
    "AD_DISTRIBUTION_SETTINGS": "ENUM",
    "AD_EDITORIAL_STATUS": "ENUM",
    "AD_ID": "LONG",
    "AD_NAME": "STRING",
    "AD_TRACKING_ID": "LONG",
    "AD_TYPE": "ENUM",
    "ALL_CONV": "DOUBLE",
    "ALL_CONV_RATE": "DOUBLE",
    "ALL_CONV_VALUE": "DOUBLE",
    "ALL_CONV_VALUE_PER_COST": "DOUBLE",
    "AVG_CPC": "DOUBLE",
    "CAMPAIGN_ID": "LONG",
    "CAMPAIGN_NAME": "STRING",
    "CAMPAIGN_TRACKING_ID": "LONG",
    "CLICKS": "LONG",
    "CLICK_RATE": "DOUBLE",
    "CONVERSIONS": "DOUBLE",
    "CONV_RATE": "DOUBLE",
    "CONV_VALUE": "DOUBLE",
    "CONV_VALUE_PER_COST": "DOUBLE",
    "COST": "LONG",
    "COST_PER_ALL_CONV": "DOUBLE",
    "COST_PER_CONV": "DOUBLE",
    "CROSS_DEVICE_CONVERSIONS": "DOUBLE",
    "CUSTOM_PARAMETERS": "STRING",
    "DAY": "STRING",
    "DESTINATION_URL": "STRING",
    "DISPLAY_URL": "STRING",
    "FINAL_URL": "STRING",
    "FINAL_URL_SMARTPHONE": "STRING",
    "IMPS": "LONG",
    "LABELS": "STRING",
    "LABELS_JSON": "STRING",
    "TOP_IMPRESSION_PERCENTAGE": "DOUBLE",
    "TRACKING_URL": "STRING",
    "VALUE_PER_ALL_CONV": "DOUBLE",
    "VALUE_PER_CONV": "DOUBLE",
}

# =============== Display API フィールド型定義（統合版） ===============
# すべてのエンティティで同じフィールドセットを使用するため、型定義も統合
FIELD_TYPES_DISPLAY = {
    # Attributes（必須の10個）
    "ACCOUNT_ID": "LONG",
    "ACCOUNT_NAME": "STRING",
    "CAMPAIGN_ID": "LONG",
    "CAMPAIGN_NAME": "STRING",
    "CAMPAIGN_USER_STATUS": "STRING",
    "ADGROUP_ID": "LONG",
    "ADGROUP_NAME": "STRING",
    "ADGROUP_USER_STATUS": "STRING",
    "AD_ID": "LONG",
    "AD_NAME": "STRING",
    # Metrics（57個）
    "ALL_CONV": "LONG",
    "ALL_CONV_RATE": "DOUBLE",
    "ALL_CONV_VALUE": "LONG",
    "ALL_CONV_VALUE_PER_COST": "DOUBLE",
    "AVG_CPC": "DOUBLE",
    "AVG_CPM": "DOUBLE",
    "AVG_CPV": "DOUBLE",
    "AVG_DELIVER_RANK": "DOUBLE",
    "AVG_DURATION_VIDEO_VIEWED": "DOUBLE",
    "AVG_PERCENT_VIDEO_VIEWED": "DOUBLE",
    "AVG_VCPM": "DOUBLE",
    "CLICK": "LONG",
    "CLICKS": "LONG",
    "CLICK_RATE": "DOUBLE",
    "CONVERSIONS": "LONG",
    "CONVERSIONS_VIA_AD_CLICK": "LONG",
    "CONVERSION_RATE_VIA_AD_CLICK": "DOUBLE",
    "CONV_RATE": "DOUBLE",
    "CONV_VALUE": "LONG",
    "CONV_VALUE_PER_COST": "DOUBLE",
    "CONV_VALUE_VIA_AD_CLICK": "LONG",
    "CONV_VALUE_VIA_AD_CLICK_PER_COST": "DOUBLE",
    "CONV_VALUE_VIA_VIEW_THROUGH": "LONG",
    "COST": "DOUBLE",
    "COST_PER_ALL_CONV": "DOUBLE",
    "COST_PER_CONV": "DOUBLE",
    "COST_PER_CONV_VIA_AD_CLICK": "DOUBLE",
    "CROSS_DEVICE_CONVERSIONS": "LONG",
    "IMPRESSION_SHARE": "DOUBLE",
    "IMPS": "LONG",
    "MATERIAL_VIEWABLE_CLICK_RATE": "DOUBLE",
    "MATERIAL_VIEWABLE_IMPS": "LONG",
    "MEASURED_IMPS": "LONG",
    "MEASURED_IMPS_RATE": "DOUBLE",
    "PAID_VIDEO_VIEWS": "LONG",
    "PAID_VIDEO_VIEW_RATE": "DOUBLE",
    "VALUE_PER_ALL_CONV": "DOUBLE",
    "VALUE_PER_CONV": "DOUBLE",
    "VALUE_PER_CONV_VIA_AD_CLICK": "DOUBLE",
    "VIDEO_VIEWS": "LONG",
    "VIDEO_VIEWS_TO_100": "LONG",
    "VIDEO_VIEWS_TO_10_SEC": "LONG",
    "VIDEO_VIEWS_TO_25": "LONG",
    "VIDEO_VIEWS_TO_3_SEC": "LONG",
    "VIDEO_VIEWS_TO_50": "LONG",
    "VIDEO_VIEWS_TO_75": "LONG",
    "VIDEO_VIEWS_TO_95": "LONG",
    "VIDEO_VIEW_THROUGH_RATE": "DOUBLE",
    "VIEWABLE_CLICK": "LONG",
    "VIEWABLE_CLICKS": "LONG",
    "VIEWABLE_CLICK_RATE": "DOUBLE",
    "VIEWABLE_IMPS": "LONG",
    "VIEWABLE_IMPS_RATE": "DOUBLE",
    # Campaign Labels
    "CAMPAIGN_LABEL_IDS_JSON": "LIST<LONG>",
    "CAMPAIGN_LABELS": "LIST<STRING>",
    "CAMPAIGN_LABELS_JSON": "LIST<STRING>",
    # Adgroup Labels
    "ADGROUP_LABEL_IDS_JSON": "LIST<LONG>",
    "ADGROUP_LABELS": "LIST<STRING>",
    "ADGROUP_LABELS_JSON": "LIST<STRING>",
    # Ad Labels
    "AD_LABEL_IDS_JSON": "LIST<LONG>",
    "AD_LABELS": "LIST<STRING>",
    "AD_LABELS_JSON": "LIST<STRING>",
}

# 後方互換性のため、エンティティ別の型定義も定義
FIELD_TYPES_DISPLAY_ACCOUNT = FIELD_TYPES_DISPLAY
FIELD_TYPES_DISPLAY_CAMPAIGN = FIELD_TYPES_DISPLAY
FIELD_TYPES_DISPLAY_ADGROUP = FIELD_TYPES_DISPLAY
FIELD_TYPES_DISPLAY_ADGROUPAD = FIELD_TYPES_DISPLAY

def get_field_types(entity: str, source: str = "search") -> Dict[str, str]:
    """
    entity と source に対応するフィールド型定義を取得

    Args:
        entity: entity タイプ (account, campaign, adgroup, adgroupad)
        source: source タイプ (search, display)

    Returns:
        Dict[str, str]: フィールド名 → 型のマッピング
    """
    if source.lower() == "display":
        field_types_map = {
            "account": FIELD_TYPES_DISPLAY_ACCOUNT,
            "campaign": FIELD_TYPES_DISPLAY_CAMPAIGN,
            "adgroup": FIELD_TYPES_DISPLAY_ADGROUP,
            "adgroupad": FIELD_TYPES_DISPLAY_ADGROUPAD,
        }
    else:  # default to search
        field_types_map = {
            "account": FIELD_TYPES_ACCOUNT,
            "campaign": FIELD_TYPES_CAMPAIGN,
            "adgroup": FIELD_TYPES_ADGROUP,
            "adgroupad": FIELD_TYPES_ADGROUPAD,
        }
    return field_types_map.get(entity.lower(), {})

def cast_df_by_field_types(df: pd.DataFrame, field_types: Dict[str, str]) -> pd.DataFrame:
    """
    DataFrame のカラムを Yahoo API フィールド定義の型に基づいてキャスト

    Args:
        df: 入力 DataFrame
        field_types: フィールド名 → 型のマッピング

    Returns:
        pd.DataFrame: 型が適切に設定された DataFrame
    """
    # SettingWithCopyWarning を回避するためコピーを作成
    df = df.copy()

    for col in df.columns:
        if col not in field_types:
            continue

        field_type = field_types[col]

        try:
            if field_type == "LONG":
                # LONG 型：整数に変換
                # NaN は保持、空文字列は 0 に変換
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype('Int64')

            elif field_type == "DOUBLE":
                # DOUBLE 型：浮動小数点に変換
                # パーセンテージ記号 % があれば削除
                df[col] = df[col].astype(str).str.replace('%', '', regex=False)
                df[col] = pd.to_numeric(df[col], errors='coerce').astype('float64')

            elif field_type == "STRING" or field_type == "ENUM":
                # STRING / ENUM 型：文字列のまま保持
                df[col] = df[col].astype(str)

        except Exception as e:
            log_warn(f"Failed to cast column {col} to {field_type}: {e}")
            # キャスト失敗時は元のまま
            continue

    return df

# =============== S3 出力ユーティリティ ===============
def jst_run_ts() -> str:
    return datetime.now(JST).strftime("%Y%m%d%H%M%S")

def render_filename(pattern: str, *, account_id: int, date_ymd: str, data_type: str, run_ts: str) -> str:
    return (pattern
            .replace("{accountId}", str(account_id))
            .replace("{date}", date_ymd)
            .replace("{dataType}", data_type)
            .replace("{run_ts}", run_ts))

def df_to_parquet_bytes(df: pd.DataFrame) -> bytes:
    table = pa.Table.from_pandas(df, preserve_index=False)
    sink = pa.BufferOutputStream()
    pq.write_table(table, sink, compression=None)
    return sink.getvalue().to_pybytes()

def put_s3_bytes(bucket: str, key: str, body: bytes):
    boto3.client("s3").put_object(
        Bucket=bucket, Key=key, Body=body, ContentType="application/octet-stream"
    )
    log_info(f"Put s3://{bucket}/{key} ({len(body)} bytes)")


def put_entity_partitions(df: pd.DataFrame, *, account_id: int, entity: str,
                          s3_bucket: str, s3_prefix: str, source: str,
                          filename_pattern: str, run_ts: str) -> bool:
    """
    DataFrameをParquetに変換してS3に保存

    Returns:
        bool: True if data was saved, False if processing was skipped
    """
    log_info(f"[PUT_ENTITY_PARTITIONS] Called: source={source}, entity={entity}, account_id={account_id}")
    log_info(f"[PUT_ENTITY_PARTITIONS] DataFrame shape: {df.shape}, columns: {list(df.columns)}")

    # DataFrame が空の場合は早期リターン
    if df.empty:
        log_warn(f"[NO_DATA] {source}/{entity}/{account_id}: DataFrame is empty - no data for this period")
        return False

    # First row sample to debug
    if len(df) > 0:
        log_info(f"[PUT_ENTITY_PARTITIONS] First row sample: {dict(df.iloc[0])}")

    if "date" not in df.columns:
        log_error(f"[CRITICAL] {source}/{entity}/{account_id}: no 'date' column in DataFrame! Available columns: {list(df.columns)}")
        log_warn(f"{source}/{entity}: no 'date' column -> skip")
        return False
    log_info(f"[PUT_ENTITY_PARTITIONS] 'date' column found, sample values: {df['date'].head(3).tolist()}")

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    before_dropna = len(df)
    df = df.dropna(subset=["date"])
    after_dropna = len(df)

    if df.empty:
        log_warn(f"[NO_DATA] {source}/{entity}/{account_id}: No valid data for this period (before_date_filter={before_dropna}, after_date_filter={after_dropna})")
        return False

    log_info(f"[DEBUG] After date processing: {df.shape[0]} rows")

    # source別のカラム調整
    if source == "search":
        # Search: Day カラムを削除（date で十分）
        if "Day" in df.columns:
            df = df.drop(columns=["Day"])
            log_info(f"[DEBUG] Removed 'Day' column for Search")

        # date を最初のカラムに移動
        date_col = df.pop("date")
        df.insert(0, "date", date_col)
        log_info(f"[DEBUG] Moved 'date' to first column for Search")
    elif source == "display":
        # Display: Daily/Day カラムを削除し、date を最初のカラムに移動
        cols_to_drop = [col for col in ["Daily", "Day"] if col in df.columns]
        if cols_to_drop:
            df = df.drop(columns=cols_to_drop)
            log_info(f"[DEBUG] Removed {cols_to_drop} columns for Display")

        # date を最初のカラムに移動
        date_col = df.pop("date")
        df.insert(0, "date", date_col)
        log_info(f"[DEBUG] Moved 'date' to first column for Display")

    # Yahoo API フィールド定義に基づいて型をキャスト
    field_types = get_field_types(entity, source)
    if field_types:
        log_info(f"[DEBUG] Casting {len(field_types)} field types")
        df = cast_df_by_field_types(df, field_types)
    else:
        log_warn(f"No field type definitions found for {source}/{entity}; proceeding without type casting")

    df["date_ymd"] = df["date"].dt.strftime("%Y%m%d")
    log_info(f"[DEBUG] Data grouped by date_ymd, groups: {df['date_ymd'].nunique()}")

    for ymd, part in df.groupby("date_ymd", sort=True):
        # フィールド型に基づいて型変換を適用済み
        part_for_s3 = part.copy().drop(columns=["date_ymd"])  # ← コピーを作成

        # _ingestion_timestamp を最後のカラムとして追加（UTC時刻）
        ingestion_ts = datetime.now(timezone.utc)
        part_for_s3["_ingestion_timestamp"] = ingestion_ts

        # エンティティにsource プレフィックスを付与（s_account, d_campaign など）
        source_prefix = "s_" if source == "search" else "d_"
        entity_with_prefix = f"{source_prefix}{entity}"
        data_type = f"{source}_{entity}"
        filename = render_filename(
            filename_pattern,
            account_id=account_id, date_ymd=ymd, data_type=data_type, run_ts=run_ts
        )

        # S3キー：sourceディレクトリを削除、エンティティにプレフィックスを付与
        key = f"{s3_prefix.strip('/')}/{entity_with_prefix}/{account_id}/{ymd}/{run_ts}/{filename}"

        log_info(f"[DEBUG] Preparing to save: key={key}, rows={part_for_s3.shape[0]}")
        body = df_to_parquet_bytes(part_for_s3)
        log_info(f"[DEBUG] Parquet body size: {len(body)} bytes")
        put_s3_bytes(s3_bucket, key, body)
        log_info(f"[DEBUG] Successfully saved {source}/{entity} for {ymd}")

    return True

# =============== フィールド定義 ===============
# ACCOUNT エンティティ - Search 広告
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

# CAMPAIGN エンティティ - Search 広告
# セグメント列を DAY のみに制限し、すべてのメトリクスを同時取得可能
SEARCH_CAMPAIGN_FIELDS = [
    # Attributes
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
    # Metrics
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

# ADGROUP エンティティ - Search 広告
# セグメント列を DAY のみに制限し、すべてのメトリクスを同時取得可能
# DAY 以外のセグメント除外: NETWORK, CLICK_TYPE, DEVICE, DAY_OF_WEEK, QUARTER, YEAR, MONTH, MONTH_OF_YEAR, WEEK, HOUR_OF_DAY, OBJECT_OF_CONVERSION_TRACKING, CONVERSION_NAME
SEARCH_ADGROUP_FIELDS = [
    # Segment
    "DAY",
    # Attributes
    "ACCOUNT_ID", "ACCOUNT_NAME",
    "CAMPAIGN_ID", "CAMPAIGN_NAME",
    "ADGROUP_ID", "ADGROUP_NAME",
    "ADGROUP_DISTRIBUTION_SETTINGS",
    "ADGROUP_BID",
    "TRACKING_URL", "CUSTOM_PARAMETERS",
    "CAMPAIGN_TRACKING_ID", "ADGROUP_TRACKING_ID",
    "LABELS", "LABELS_JSON",
    "AB_TEST_USAGE",
    # Metrics
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

# AD (ADGROUPAD) エンティティ - Search 広告
# セグメント列を DAY のみに制限し、すべてのメトリクスを同時取得可能
# DAY 以外のセグメント除外: NETWORK, CLICK_TYPE, DEVICE, DAY_OF_WEEK, QUARTER, YEAR, MONTH, MONTH_OF_YEAR, WEEK, OBJECT_OF_CONVERSION_TRACKING, CONVERSION_NAME, AD_KEYWORD_ID
SEARCH_ADGROUPAD_FIELDS = [
    # Segment
    "DAY",
    # Attributes
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
    # Metrics
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
SEARCH_REPORT_TYPE = {"account": "ACCOUNT", "campaign": "CAMPAIGN", "adgroup": "ADGROUP", "adgroupad": "AD"}

# Display フィールド定義（新ルール）
# ・Segment フィールド: 取得しない
# ・Metric フィールド: すべて取得（57個）
# ・Attribute フィールド: エンティティの階層に応じて段階的に追加

# 共通Metrics（すべてのレベルで取得）
DISPLAY_METRICS = [
    "ALL_CONV",
    "ALL_CONV_RATE",
    "ALL_CONV_VALUE",
    "ALL_CONV_VALUE_PER_COST",
    "AVG_CPC",
    "AVG_CPM",
    "AVG_CPV",
    "AVG_DELIVER_RANK",
    "AVG_DURATION_VIDEO_VIEWED",
    "AVG_PERCENT_VIDEO_VIEWED",
    "AVG_VCPM",
    "CLICK",
    "CLICKS",
    "CLICK_RATE",
    "CONVERSIONS",
    "CONVERSIONS_VIA_AD_CLICK",
    "CONVERSION_RATE_VIA_AD_CLICK",
    "CONV_RATE",
    "CONV_VALUE",
    "CONV_VALUE_PER_COST",
    "CONV_VALUE_VIA_AD_CLICK",
    "CONV_VALUE_VIA_AD_CLICK_PER_COST",
    "CONV_VALUE_VIA_VIEW_THROUGH",
    "COST",
    "COST_PER_ALL_CONV",
    "COST_PER_CONV",
    "COST_PER_CONV_VIA_AD_CLICK",
    "CROSS_DEVICE_CONVERSIONS",
    "IMPRESSION_SHARE",
    "IMPS",
    "MATERIAL_VIEWABLE_CLICK_RATE",
    "MATERIAL_VIEWABLE_IMPS",
    "MEASURED_IMPS",
    "MEASURED_IMPS_RATE",
    "PAID_VIDEO_VIEWS",
    "PAID_VIDEO_VIEW_RATE",
    "VALUE_PER_ALL_CONV",
    "VALUE_PER_CONV",
    "VALUE_PER_CONV_VIA_AD_CLICK",
    "VIDEO_VIEWS",
    "VIDEO_VIEWS_TO_100",
    "VIDEO_VIEWS_TO_10_SEC",
    "VIDEO_VIEWS_TO_25",
    "VIDEO_VIEWS_TO_3_SEC",
    "VIDEO_VIEWS_TO_50",
    "VIDEO_VIEWS_TO_75",
    "VIDEO_VIEWS_TO_95",
    "VIDEO_VIEW_THROUGH_RATE",
    "VIEWABLE_CLICK",
    "VIEWABLE_CLICKS",
    "VIEWABLE_CLICK_RATE",
    "VIEWABLE_IMPS",
    "VIEWABLE_IMPS_RATE",
]

# ラベル関連フィールド（エンティティごとに異なる）
DISPLAY_CAMPAIGN_LABELS = [
    "CAMPAIGN_LABEL_IDS_JSON",
    "CAMPAIGN_LABELS",
    "CAMPAIGN_LABELS_JSON",
]

DISPLAY_ADGROUP_LABELS = [
    "ADGROUP_LABEL_IDS_JSON",
    "ADGROUP_LABELS",
    "ADGROUP_LABELS_JSON",
]

DISPLAY_AD_LABELS = [
    "AD_LABEL_IDS_JSON",
    "AD_LABELS",
    "AD_LABELS_JSON",
]

# AD レベルではIMPRESSION_SHAREを除外（ラベルフィールドとの互換性なし）
DISPLAY_METRICS_EXCLUDING_IMPRESSION_SHARE = [f for f in DISPLAY_METRICS if f != "IMPRESSION_SHARE"]

# ACCOUNT レベル: ACCOUNT_ID, ACCOUNT_NAME + Metrics（IMPRESSION_SHARE 含む）
DISPLAY_ACCOUNT_FIELDS = [
    "ACCOUNT_ID",
    "ACCOUNT_NAME",
    "DAY",
] + DISPLAY_METRICS

# CAMPAIGN レベル: Account + CAMPAIGN_ID, CAMPAIGN_NAME, CAMPAIGN_USER_STATUS + Metrics + Labels（IMPRESSION_SHARE 含む）
DISPLAY_CAMPAIGN_FIELDS = [
    "ACCOUNT_ID",
    "ACCOUNT_NAME",
    "CAMPAIGN_ID",
    "CAMPAIGN_NAME",
    "CAMPAIGN_USER_STATUS",
    "DAY",
] + DISPLAY_METRICS + DISPLAY_CAMPAIGN_LABELS

# ADGROUP レベル: Campaign + ADGROUP_ID, ADGROUP_NAME, ADGROUP_USER_STATUS + Metrics + Campaign Labels + Adgroup Labels（IMPRESSION_SHARE 含む）
DISPLAY_ADGROUP_FIELDS = [
    "ACCOUNT_ID",
    "ACCOUNT_NAME",
    "CAMPAIGN_ID",
    "CAMPAIGN_NAME",
    "CAMPAIGN_USER_STATUS",
    "ADGROUP_ID",
    "ADGROUP_NAME",
    "ADGROUP_USER_STATUS",
    "DAY",
] + DISPLAY_METRICS + DISPLAY_CAMPAIGN_LABELS + DISPLAY_ADGROUP_LABELS

# AD (ADGROUPAD) レベル: Adgroup + AD_ID, AD_NAME + DAY + Metrics（IMPRESSION_SHARE 除外） + Campaign Labels + Adgroup Labels + Ad Labels
# 重要: DAYフィールドを指定することで、Yahoo APIが「Daily」カラムを返す
DISPLAY_ADGROUPAD_FIELDS = [
    "ACCOUNT_ID",
    "ACCOUNT_NAME",
    "CAMPAIGN_ID",
    "CAMPAIGN_NAME",
    "CAMPAIGN_USER_STATUS",
    "ADGROUP_ID",
    "ADGROUP_NAME",
    "ADGROUP_USER_STATUS",
    "AD_ID",
    "AD_NAME",
    "AD_USER_STATUS",
    "AD_TYPE",
    "DAY",
] + DISPLAY_METRICS_EXCLUDING_IMPRESSION_SHARE + DISPLAY_CAMPAIGN_LABELS + DISPLAY_ADGROUP_LABELS + DISPLAY_AD_LABELS

DISPLAY_FIELDS: Dict[str, List[str]] = {
    "account": DISPLAY_ACCOUNT_FIELDS,
    "campaign": DISPLAY_CAMPAIGN_FIELDS,
    "adgroup": DISPLAY_ADGROUP_FIELDS,
    "adgroupad": DISPLAY_ADGROUPAD_FIELDS,
}

# =============== 並列パイプライン ===============
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
from dataclasses import dataclass
from collections import deque, defaultdict, Counter
import random
import threading
from requests.adapters import HTTPAdapter

DEFAULT_MAX_WORKERS        = 10
DEFAULT_POLL_INTERVAL      = 1.2
DEFAULT_MAX_RETRIES        = 7
BASE_BACKOFF               = 1.0
JITTER_RANGE               = (0.2, 1.8)
DEFAULT_ADD_LIMIT_PER_SRC  = 3

def new_session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": UA})
    adapter = HTTPAdapter(pool_connections=128, pool_maxsize=128, max_retries=0)
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    return s

def _with_retry(fn, max_retries: int, *a, **kw):
    for i in range(max_retries + 1):
        try:
            return fn(*a, **kw)
        except requests.HTTPError as e:
            code = getattr(e.response, "status_code", None)
            text = e.response.text if getattr(e, "response", None) else ""
            retry_after = e.response.headers.get("Retry-After") if getattr(e, "response", None) else None

            freq_limited = False
            try:
                js = e.response.json()
                for err in (js.get("errors") or []):
                    if "Frequency limit exceeded" in (err.get("message") or ""):
                        freq_limited = True
                        break
            except Exception:
                if "Frequency limit exceeded" in (text or "") or "Too much requests" in (text or ""):
                    freq_limited = True

            retriable = (code in (429, 500, 502, 503, 504)) or freq_limited
            if not retriable or i == max_retries:
                raise

            if retry_after:
                try:
                    sleep_sec = float(retry_after)
                except Exception:
                    sleep_sec = 0.0
            else:
                base = BASE_BACKOFF * (2 ** i)
                sleep_sec = min(base, 60.0)

            sleep_sec += random.uniform(*JITTER_RANGE)
            time.sleep(sleep_sec)

        except (requests.ConnectionError, requests.Timeout):
            if i == max_retries:
                raise
            base = BASE_BACKOFF * (2 ** i)
            sleep_sec = min(base, 60.0) + random.uniform(*JITTER_RANGE)
            time.sleep(sleep_sec)

@dataclass
class JobUnit:
    source: str              # "search" | "display"
    entity: str              # "account"|"campaign"|"adgroup"|"adgroupad"
    account_id: int
    report_type: Optional[str]
    fields: List[str]
    lang: str
    job_id: Optional[int] = None
    status: str = "PENDING"
    attempts_add: int = 0
    attempts_status: int = 0
    attempts_download: int = 0
    error: Optional[str] = None

def build_jobs(entities_req: List[str],
               targets_search: List[int], targets_display: List[int],
               lang: str) -> List[JobUnit]:
    jobs: List[JobUnit] = []
    for aid in targets_search:
        for ent in entities_req:
            if ent not in SEARCH_FIELDS: continue
            jobs.append(JobUnit("search", ent, aid, SEARCH_REPORT_TYPE[ent], SEARCH_FIELDS[ent], lang))
    for aid in targets_display:
        for ent in entities_req:
            if ent not in DISPLAY_FIELDS: continue
            # Display API: reportType を指定しない（DAYカラムを取得するため）
            jobs.append(JobUnit("display", ent, aid, None, DISPLAY_FIELDS[ent], lang))
    return jobs

def run_parallel(token, base_account_id, jobs: List[JobUnit],
                 s3_bucket, s3_prefix, filename_pattern, run_ts,
                 max_workers: int, poll_interval: float, max_retries: int,
                 add_limit_per_source: int, overall_timeout: int = 3600,
                 start_date: str = None, end_date: str = None):
    """
    並列レポート取得・S3保存

    Args:
        token: アクセストークン
        base_account_id: ベースアカウントID
        jobs: ジョブリスト
        s3_bucket: S3バケット名
        s3_prefix: S3プレフィックス
        filename_pattern: ファイル名パターン
        run_ts: 実行タイムスタンプ
        max_workers: 最大ワーカー数
        poll_interval: ポーリング間隔（秒）
        max_retries: リトライ上限
        add_limit_per_source: ソース別同時作成数上限
        overall_timeout: 全体タイムアウト（秒、デフォルト 3600秒=1時間）
        start_date: 開始日（YYYYMMDD形式）
        end_date: 終了日（YYYYMMDD形式）

    Returns:
        実行マニフェスト
    """
    manifest = {"total": len(jobs), "added": 0, "completed": 0, "downloaded": 0, "failed": 0,
                "errors": [], "fail_by_stage": defaultdict(int), "fail_by_code": defaultdict(int),
                "timed_out": False, "overall_timeout_sec": overall_timeout}
    q_add, q_status, q_dl = deque([j for j in jobs if j.status == "PENDING"]), deque(), deque()
    inflight = {}

    # アカウントエンティティでデータなしのアカウントを追跡（スキップ対象）
    accounts_with_no_data = set()  # (source, account_id) のセット

    # タイムアウト機構
    start_time = time.time()
    last_activity_time = start_time

    add_gate = {"search": threading.Semaphore(add_limit_per_source),
                "display": threading.Semaphore(add_limit_per_source)}

    def submit_add(ex, job: JobUnit):
        def _add():
            add_gate[job.source].acquire()
            try:
                job.attempts_add += 1
                job.job_id = _with_retry(
                    add_report_custom_date, max_retries,
                    new_session(), job.source, token, base_account_id, job.account_id,
                    job.fields, job.lang, job.report_type, start_date, end_date
                )
                return job
            finally:
                add_gate[job.source].release()
        fut = ex.submit(_add)
        inflight[fut] = ("add", job)

    def submit_status(ex, job: JobUnit):
        def _st():
            job.attempts_status += 1
            return _with_retry(get_status, max_retries,
                               new_session(), job.source, token, base_account_id, job.account_id, job.job_id)
        fut = ex.submit(_st)
        inflight[fut] = ("status", job)

    def submit_download(ex, job: JobUnit):
        def _dl():
            job.attempts_download += 1
            return _with_retry(download_csv_text, max_retries,
                               new_session(), job.source, token, base_account_id, job.account_id, job.job_id)
        fut = ex.submit(_dl)
        inflight[fut] = ("download", job)

    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        while q_add and len(inflight) < max_workers:
            j = q_add.popleft()
            j.status = "ADDED"
            time.sleep(random.uniform(*JITTER_RANGE))
            submit_add(ex, j)

        while inflight or q_add or q_status or q_dl:
            # === タイムアウトチェック ===
            elapsed = time.time() - start_time
            if elapsed > overall_timeout:
                log_error(f"Overall timeout ({overall_timeout}s) reached after {elapsed:.0f}s")
                manifest["timed_out"] = True
                # 未処理のジョブを FAILED に設定
                for j in q_add:
                    j.status = "FAILED"
                    j.error = f"Timeout: not started (elapsed {elapsed:.0f}s)"
                    manifest["failed"] += 1
                    manifest["fail_by_stage"]["add"] += 1
                for j in q_status:
                    j.status = "FAILED"
                    j.error = f"Timeout: status check incomplete (elapsed {elapsed:.0f}s)"
                    manifest["failed"] += 1
                    manifest["fail_by_stage"]["status"] += 1
                for j in q_dl:
                    j.status = "FAILED"
                    j.error = f"Timeout: download incomplete (elapsed {elapsed:.0f}s)"
                    manifest["failed"] += 1
                    manifest["fail_by_stage"]["download"] += 1
                # 進捗中のジョブの処理を待たずにループを抜ける
                q_add.clear()
                q_status.clear()
                q_dl.clear()
                # 進捗中のタスクをキャンセル（Executor がまだ実行中なので完了まで待機）
                break

            if inflight:
                done, _ = wait(set(inflight.keys()), timeout=poll_interval, return_when=FIRST_COMPLETED)
            else:
                time.sleep(poll_interval); done = set()

            for fut in list(done):
                kind, job = inflight.pop(fut, (None, None))
                if not job: continue
                log_info(f"[TASK_COMPLETE] kind={kind}, job={job.source}/{job.entity}/{job.account_id}")
                try:
                    if kind == "add":
                        fut.result()
                        manifest["added"] += 1
                        job.status = "RUNNING"
                        q_status.append(job)
                    elif kind == "status":
                        st = fut.result()
                        if st == "COMPLETED":
                            manifest["completed"] += 1
                            job.status = "COMPLETED"
                            q_dl.append(job)
                        elif st in ("FAILED", "UNKNOWN"):
                            job.error = f"report status={st}"
                            job.status = "FAILED"
                            manifest["failed"] += 1
                            manifest["fail_by_stage"]["status"] += 1
                            manifest["errors"].append({
                                "source": job.source, "entity": job.entity, "accountId": job.account_id,
                                "stage": "status", "error": job.error
                            })
                        else:
                            q_status.append(job)
                    else:  # download
                        csv_text = fut.result()
                        log_info(f"[DOWNLOAD_START] {job.source}/{job.entity}/{job.account_id}: csv_text size={len(csv_text)} bytes")
                        rows = csv_to_rows(csv_text, entity=job.entity)
                        log_info(f"[DOWNLOAD] {job.source}/{job.entity}/{job.account_id}: rows={len(rows)}")
                        if rows:
                            df = pd.DataFrame(rows)
                            log_info(f"[DATAFRAME_CHECK] DataFrame shape: {df.shape}, columns: {list(df.columns)}, has 'date'? {'date' in df.columns}")
                            if 'date' not in df.columns:
                                log_error(f"[CRITICAL] DataFrame missing 'date' column after creation! Columns: {list(df.columns)}")
                            log_info(f"[S3SAVE] About to save {job.source}/{job.entity}/{job.account_id} with {len(df)} rows")
                            s3_saved = put_entity_partitions(
                                df, account_id=job.account_id, entity=job.entity,
                                s3_bucket=s3_bucket, s3_prefix=s3_prefix,
                                source=job.source, filename_pattern=filename_pattern, run_ts=run_ts
                            )
                            if s3_saved:
                                log_info(f"[S3SAVE] Completed saving {job.source}/{job.entity}/{job.account_id}")
                            else:
                                log_warn(f"[S3SAVE] Data processing skipped (likely no valid rows) for {job.source}/{job.entity}/{job.account_id}")
                                # accountエンティティでスキップされた場合、後続エンティティをスキップ対象に追加
                                if job.entity == "account":
                                    accounts_with_no_data.add((job.source, job.account_id))
                                    log_info(f"[SKIP_DOWNSTREAM] Marking subsequent entities for {job.source}/{job.account_id} to be skipped")
                        else:
                            log_warn(f"[S3SKIP] No rows for {job.source}/{job.entity}/{job.account_id}")
                            # accountエンティティでスキップされた場合、後続エンティティをスキップ対象に追加
                            if job.entity == "account":
                                accounts_with_no_data.add((job.source, job.account_id))
                                log_info(f"[SKIP_DOWNSTREAM] Marking subsequent entities for {job.source}/{job.account_id} to be skipped")
                        job.status = "DOWNLOADED"
                        manifest["downloaded"] += 1
                except Exception as e:
                    log_error(f"[EXCEPTION] {job.source}/{job.entity}/{job.account_id}: kind={kind}, error={repr(e)}")
                    import traceback
                    log_error(f"[TRACEBACK] {traceback.format_exc()}")
                    job.status = "FAILED"
                    job.error = str(e)
                    manifest["failed"] += 1
                    manifest["fail_by_stage"][kind or "unknown"] += 1
                    if isinstance(e, requests.HTTPError) and getattr(e, "response", None):
                        manifest["fail_by_code"][e.response.status_code] += 1
                    manifest["errors"].append({
                        "source": job.source, "entity": job.entity, "accountId": job.account_id,
                        "stage": kind, "error": job.error
                    })

            while q_dl and len(inflight) < max_workers:
                submit_download(ex, q_dl.popleft())
            while q_status and len(inflight) < max_workers:
                submit_status(ex, q_status.popleft())
            while q_add and len(inflight) < max_workers:
                # 再度タイムアウトチェック
                if time.time() - start_time > overall_timeout:
                    break
                j = q_add.popleft()
                # account がなかったアカウントの後続エンティティをスキップ
                if (j.source, j.account_id) in accounts_with_no_data and j.entity != "account":
                    log_warn(f"[SKIP_JOB] Skipping {j.source}/{j.entity}/{j.account_id} (account entity had no data)")
                    j.status = "SKIPPED"
                    continue
                j.status = "ADDED"
                time.sleep(random.uniform(*JITTER_RANGE))
                submit_add(ex, j)

    # 進捗ログ
    by_status = dict(Counter(j.status for j in jobs))
    log_info(f"Manifest: total={manifest['total']} added={manifest['added']} "
             f"completed={manifest['completed']} downloaded={manifest['downloaded']} "
             f"failed={manifest['failed']}")
    log_info(f"By status: {by_status}")

    # タイムアウト情報
    if manifest.get("timed_out"):
        log_error(f"Execution timed out (limit: {manifest['overall_timeout_sec']}s)")

    if manifest["failed"]:
        log_info(f"Fail by stage: {dict(manifest['fail_by_stage'])}")
        log_info(f"Fail by code : {dict(manifest['fail_by_code'])}")
        # エラーログ出力（最初の10件のみ）
        error_count = len(manifest["errors"])
        for i, it in enumerate(manifest["errors"][:10]):
            log_warn(str(it))
        if error_count > 10:
            log_warn(f"... and {error_count - 10} more errors (see full manifest)")

    # 欠け確認
    done_keys = set((j.source, j.entity, j.account_id) for j in jobs if j.status == "DOWNLOADED")
    all_keys  = set((j.source, j.entity, j.account_id) for j in jobs)
    missing = sorted(all_keys - done_keys)
    if missing:
        log_warn(f"Missing {len(missing)} jobs (not DOWNLOADED):")
        for src, ent, aid in missing:
            log_warn(f"  - source={src} entity={ent} account={aid}")

    manifest["by_status"] = by_status
    return manifest

# =============== main ===============
def main():
    global VERBOSE

    # ========================================
    # ここで日付を直接指定してください
    # ========================================
    DEFAULT_START_DATE = "20240101"  # 開始日 (YYYYMMDD形式)
    DEFAULT_END_DATE = "20240131"    # 終了日 (YYYYMMDD形式)
    # ========================================

    ap = argparse.ArgumentParser(description="Yahoo Search + Display バックフィル取得ツール")
    ap.add_argument("--secret-id", default=DEFAULT_SECRET_ID, required=False)
    ap.add_argument("--base-account-id", type=int, default=DEFAULT_BASE_ACCOUNT_ID)
    ap.add_argument("--lang", choices=["EN", "JA"], default=DEFAULT_LANG)

    ap.add_argument("--s3-bucket", default=DEFAULT_S3_BUCKET)
    ap.add_argument("--s3-prefix", default=DEFAULT_S3_PREFIX)
    ap.add_argument("--filename-pattern", default=DEFAULT_FILENAME_PATTERN)

    ap.add_argument("--entities", default="account,campaign,adgroup,adgroupad")

    ap.add_argument("--start-date", type=str, default=None,
                    help="取得開始日（YYYYMMDD形式）※未指定時はコード内のデフォルト値を使用")
    ap.add_argument("--end-date", type=str, default=None,
                    help="取得終了日（YYYYMMDD形式）※未指定時はコード内のデフォルト値を使用")

    ap.add_argument("--max-workers", type=int, default=DEFAULT_MAX_WORKERS)
    ap.add_argument("--poll-interval", type=float, default=DEFAULT_POLL_INTERVAL)
    ap.add_argument("--max-retries", type=int, default=DEFAULT_MAX_RETRIES)
    ap.add_argument("--add-limit-per-source", type=int, default=DEFAULT_ADD_LIMIT_PER_SRC)
    ap.add_argument("--overall-timeout", type=int, default=3600,
                    help="Overall execution timeout in seconds (default: 3600s = 1 hour)")

    ap.add_argument("--verbose", action="store_true")

    args, unknown = ap.parse_known_args()

    # 日付が指定されていない場合はデフォルト値を使用
    start_date = args.start_date or DEFAULT_START_DATE
    end_date = args.end_date or DEFAULT_END_DATE
    VERBOSE = bool(args.verbose)
    if unknown:
        log_warn(f"Ignoring extra args from Glue: {unknown}")

    entities_req = [e.strip().lower() for e in args.entities.split(",") if e.strip()]
    if not any(ent in ("account","campaign","adgroup","adgroupad") for ent in entities_req):
        log_warn("No valid entities selected; nothing to do.")
        print(json.dumps({"accounts": [], "manifest": {}}))
        return

    token = get_access_token(args.secret_id)
    log_info("got access_token")

    discovered_search = fetch_account_ids("search", token, args.base_account_id)
    excluded_search   = set(load_excluded_ids(args.secret_id, "exclude_account_ids_search"))
    targets_search    = [aid for aid in discovered_search if aid not in excluded_search]
    log_info(f"SEARCH: discovered={len(discovered_search)} excluded={len(excluded_search)} targets={len(targets_search)}")

    discovered_display = fetch_account_ids("display", token, args.base_account_id)
    excluded_display   = set(load_excluded_ids(args.secret_id, "exclude_account_ids_display"))
    targets_display    = [aid for aid in discovered_display if aid not in excluded_display]
    log_info(f"DISPLAY: discovered={len(discovered_display)} excluded={len(excluded_display)} targets={len(targets_display)}")

    if not targets_search and not targets_display:
        log_warn("No target accounts for both sources. Nothing to do.")
        print(json.dumps({"accounts": [], "manifest": {}}))
        return

    run_ts = jst_run_ts()
    jobs = build_jobs(entities_req, targets_search, targets_display, args.lang)
    log_info(f"Enqueued jobs: {len(jobs)}")

    log_info(f"Date range: {start_date} - {end_date}")

    manifest = run_parallel(
        token=token, base_account_id=args.base_account_id,
        jobs=jobs,
        s3_bucket=args.s3_bucket, s3_prefix=args.s3_prefix,
        filename_pattern=args.filename_pattern, run_ts=run_ts,
        max_workers=args.max_workers, poll_interval=args.poll_interval, max_retries=args.max_retries,
        add_limit_per_source=args.add_limit_per_source, overall_timeout=args.overall_timeout,
        start_date=start_date, end_date=end_date
    )

    total_check = manifest["downloaded"] + manifest["failed"]
    if total_check != manifest["total"]:
        log_warn(f"Mismatch: total({manifest['total']}) != downloaded+failed({total_check})")

    result = {
        "accounts": {"search": targets_search, "display": targets_display},
        "manifest": manifest,
        "run_ts": run_ts,
    }
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        import traceback
        log_error(repr(e))
        traceback.print_exc()
        sys.exit(1)
