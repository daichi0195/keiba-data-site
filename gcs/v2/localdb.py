#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
サイト向けマート (BigQuery keibaai-v2.site) をローカルの Parquet に落とし、DuckDB で BigQuery 互換に問い合わせる層。

- 生成スクリプト (generate_*.py) は 1 エンティティごとに十数本のクエリを投げる (全体で約 14,000 本)。
  これを BigQuery に投げると 1 回の生成で数百 GB を読むため、週 1 回のマート取得 (約 100MB) だけ BigQuery を使い、
  集計はすべてローカルの DuckDB で行う。
- SQL は BigQuery 方言のまま書き、translate() で DuckDB 方言に機械変換する。
- CURRENT_DATE() は AS_OF (環境変数 SITE_AS_OF、既定は今日) に固定し、再実行で同じ結果が出るようにする。

使い方:
  python localdb.py fetch            # BigQuery → gcs/v2/data/*.parquet
  python localdb.py check            # 行数と最大日付を表示
"""
import datetime as dt
import json
import os
import re
import sys
from pathlib import Path

import duckdb

PROJECT_ID = 'keibaai-v2'
DATASET = 'site'
TABLES = ['race_master', 'race_result', 'horse', 'jockey', 'trainer', 'sire']
HERE = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get('SITE_DATA_DIR', HERE / 'data'))
OUT_DIR = Path(os.environ.get('SITE_OUT_DIR', HERE / 'out'))


def as_of_date() -> dt.date:
    s = os.environ.get('SITE_AS_OF')
    return dt.date.fromisoformat(s) if s else dt.date.today()


# ---------------------------------------------------------------------------
# BigQuery → Parquet
# ---------------------------------------------------------------------------
def fetch(tables=TABLES):
    from google.cloud import bigquery
    import pyarrow.parquet as pq
    client = bigquery.Client(project=PROJECT_ID)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for t in tables:
        table = client.get_table(f'{PROJECT_ID}.{DATASET}.{t}')
        arrow = client.list_rows(table).to_arrow()
        path = DATA_DIR / f'{t}.parquet'
        pq.write_table(arrow, path)
        print(f'  {t:12s} {arrow.num_rows:8d} rows → {path.name} ({path.stat().st_size / 1e6:.1f} MB)', flush=True)
    (DATA_DIR / 'fetched_at.txt').write_text(dt.datetime.now().isoformat())


# ---------------------------------------------------------------------------
# BigQuery 方言 → DuckDB 方言
# ---------------------------------------------------------------------------
def translate(sql: str, as_of: dt.date) -> str:
    s = sql
    s = s.replace('`', '')
    # 日付の固定
    s = re.sub(r'DATE_SUB\(\s*CURRENT_DATE\(\)\s*,\s*INTERVAL\s+(\d+)\s+(YEAR|MONTH|DAY|WEEK)\s*\)',
               lambda m: f"(DATE '{as_of}' - INTERVAL {m.group(1)} {m.group(2)})", s, flags=re.I)
    s = re.sub(r'DATE_ADD\(\s*CURRENT_DATE\(\)\s*,\s*INTERVAL\s+(\d+)\s+(YEAR|MONTH|DAY|WEEK)\s*\)',
               lambda m: f"(DATE '{as_of}' + INTERVAL {m.group(1)} {m.group(2)})", s, flags=re.I)
    s = re.sub(r'CURRENT_DATE\(\)', f"DATE '{as_of}'", s)
    # 中央値: APPROX_QUANTILES(x, 100)[OFFSET(50)] → quantile_disc(x, 0.5) (実在する値を返す点が BigQuery と同じ)
    s = re.sub(r'APPROX_QUANTILES\((.+?),\s*100\)\[OFFSET\(50\)\]', r'quantile_disc(\1, 0.5)', s)
    # 配列
    s = re.sub(r'\[OFFSET\(ARRAY_LENGTH\((\w+)\)\s*-\s*1\)\]', r'[len(\1)]', s)
    s = re.sub(r'\[(?:SAFE_)?OFFSET\((\d+)\)\]', lambda m: f'[{int(m.group(1)) + 1}]', s)
    s = re.sub(r'\bARRAY_LENGTH\(', 'len(', s)
    s = re.sub(r'\bSPLIT\(', 'string_split(', s)
    # 正規表現: r'...' → '...'、REGEXP_EXTRACT はグループ 1 を返す
    s = re.sub(r"REGEXP_EXTRACT\((.+?),\s*r'(.+?)'\)", r"regexp_extract(\1, '\2', 1)", s)
    s = re.sub(r"\br'", "'", s)
    # 日付差: DATE_DIFF(a, b, DAY) → date_diff('day', b, a)
    s = re.sub(r'DATE_DIFF\(\s*(.+?)\s*,\s*(.+?)\s*,\s*DAY\s*\)', r"date_diff('day', \2, \1)", s, flags=re.S)
    # 型名
    s = re.sub(r'\bFLOAT64\b', 'DOUBLE', s)
    s = re.sub(r'\bAS STRING\b', 'AS VARCHAR', s)
    s = re.sub(r'\bSAFE_CAST\(', 'TRY_CAST(', s)
    s = re.sub(r'\bCOUNTIF\(', 'count_if(', s)
    return s


class Row(dict):
    """BigQuery の Row と同じく row['x'] / row.x / dict(row) ができる行"""
    __getattr__ = dict.__getitem__


class _Result:
    def __init__(self, cols, rows):
        self._rows = [Row(zip(cols, r)) for r in rows]
        self._it = iter(self._rows)

    def __iter__(self):
        return iter(self._rows)

    def __next__(self):
        return next(self._it)

    def __len__(self):
        return len(self._rows)

    def result(self):
        return self


class LocalClient:
    """google.cloud.bigquery.Client の代わり。client.query(sql).result() で行を返す"""

    def __init__(self, data_dir: Path = DATA_DIR, as_of: dt.date = None, log_sql: bool = False):
        self.as_of = as_of or as_of_date()
        self.log_sql = log_sql
        self.con = duckdb.connect()
        self.con.execute("SET default_null_order = 'NULLS_FIRST'")  # BigQuery の ORDER BY は NULL が先頭
        self.con.execute(f'CREATE SCHEMA {DATASET}')
        until = os.environ.get('SITE_UNTIL')  # 突合用: この日付より後のレースを除外 (旧データの最終日に合わせる)
        for t in TABLES:
            p = data_dir / f'{t}.parquet'
            if not p.exists():
                continue
            if until and t == 'race_master':
                self.con.execute(f"CREATE VIEW {DATASET}.{t} AS SELECT * FROM read_parquet('{p}') WHERE race_date <= DATE '{until}'")
            elif until and t == 'race_result':
                self.con.execute(f"CREATE VIEW {DATASET}.{t} AS SELECT * FROM read_parquet('{p}') "
                                 f"WHERE race_id IN (SELECT race_id FROM {DATASET}.race_master)")
            elif t == 'horse':
                # 種牡馬名の別名 (サイトの既存表記・URL を維持する)
                aliases = {k: v for k, v in json.loads((HERE / 'sire_aliases.json').read_text(encoding='utf-8')).items() if not k.startswith('_')}
                case = ' '.join(f"WHEN '{k}' THEN '{v}'" for k, v in aliases.items())
                self.con.execute(f"CREATE VIEW {DATASET}.{t} AS SELECT * REPLACE (CASE father {case} ELSE father END AS father, "
                                 f"CASE mf {case} ELSE mf END AS mf) FROM read_parquet('{p}')")
            else:
                self.con.execute(f"CREATE VIEW {DATASET}.{t} AS SELECT * FROM read_parquet('{p}')")
        self.con.execute('CREATE MACRO SAFE_DIVIDE(a, b) AS CASE WHEN b IS NULL OR b = 0 THEN NULL ELSE a / b END')
        self.n_queries = 0

    def query(self, sql: str, job_config=None):
        self.n_queries += 1
        t = translate(sql, self.as_of)
        if self.log_sql:
            print(t, file=sys.stderr)
        try:
            cur = self.con.execute(t)
        except Exception as e:
            raise RuntimeError(f'{e}\n--- translated SQL ---\n{t}') from e
        cols = [d[0] for d in cur.description]
        return _Result(cols, cur.fetchall())


# ---------------------------------------------------------------------------
# 出力
# ---------------------------------------------------------------------------
def _json_default(o):
    if isinstance(o, (dt.date, dt.datetime)):
        return o.isoformat()
    from decimal import Decimal
    if isinstance(o, Decimal):
        return float(o)
    raise TypeError(f'not serializable: {type(o)}')


def save_json(blob_path: str, data) -> Path:
    """GCS に上げる代わりに OUT_DIR/<blob_path> へ書く (アップロードは upload.py が行う)"""
    path = OUT_DIR / blob_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, default=_json_default), encoding='utf-8')
    return path


def check():
    c = LocalClient()
    for t in TABLES:
        try:
            n = c.query(f'SELECT COUNT(*) AS n FROM site.{t}').result()
            print(f'  {t:12s} {list(n)[0]["n"]:8d} rows')
        except Exception as e:
            print(f'  {t:12s} ERROR {e}')
    r = list(c.query('SELECT MIN(race_date) AS mn, MAX(race_date) AS mx FROM site.race_master').result())[0]
    print(f'  race_master: {r["mn"]} .. {r["mx"]}  (as_of = {c.as_of})')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'check'
    if cmd == 'fetch':
        fetch()
    check()
