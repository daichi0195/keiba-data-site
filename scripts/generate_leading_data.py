#!/usr/bin/env python3
"""
リーディングデータを生成してGCSに保存

Usage:
    python3 scripts/generate_leading_data.py
"""

import json
import os
import sys
from datetime import datetime
from google.cloud import bigquery
from google.cloud import storage

# スクリプト自身のディレクトリを基準にパスを解決
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# lib/siresからALL_SIRESをインポート（種牡馬IDマッピング用）
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'lib'))
try:
    from sires_data import ALL_SIRES_DATA
    # 名前でマッピングできるように辞書を作成
    SIRE_NAME_TO_ID = {sire['name']: sire['id'] for sire in ALL_SIRES_DATA}
except ImportError:
    print("⚠️  Warning: Could not import sires data. Sire IDs will not be assigned.")
    SIRE_NAME_TO_ID = {}

# BigQueryクライアント
client = bigquery.Client()

# 現在の年度
current_year = datetime.now().year

print(f"📊 {current_year}年のリーディングデータを生成中...")

# SQLファイルを読み込み
with open(os.path.join(SCRIPT_DIR, 'generate_leading_data.sql'), 'r', encoding='utf-8') as f:
    sql = f.read()

# current_yearを置き換え
sql = sql.replace('DECLARE current_year INT64 DEFAULT 2025;', f'DECLARE current_year INT64 DEFAULT {current_year};')

# クエリ実行
print("🔍 BigQueryでクエリ実行中...")
query_job = client.query(sql)
results = list(query_job.result())

if len(results) == 0:
    print("❌ データが見つかりませんでした")
    exit(1)

# 結果を取得
row = results[0]

# JSON形式に変換
leading_data = {
    "year": row.year,
    "last_updated": row.last_updated.isoformat(),
    "jockey_leading": [
        {
            "rank": item["rank"] if isinstance(item, dict) else item.rank,
            "id": item["id"] if isinstance(item, dict) else item.id,
            "name": item["name"] if isinstance(item, dict) else item.name,
            "wins": item["wins"] if isinstance(item, dict) else item.wins,
            "rides": item["rides"] if isinstance(item, dict) else item.rides,
            "winRate": float(item["winRate"] if isinstance(item, dict) else item.winRate)
        }
        for item in row.jockey_leading
    ],
    "trainer_leading": [
        {
            "rank": item["rank"] if isinstance(item, dict) else item.rank,
            "id": item["id"] if isinstance(item, dict) else item.id,
            "name": item["name"] if isinstance(item, dict) else item.name,
            "wins": item["wins"] if isinstance(item, dict) else item.wins,
            "rides": item["rides"] if isinstance(item, dict) else item.rides,
            "winRate": float(item["winRate"] if isinstance(item, dict) else item.winRate)
        }
        for item in row.trainer_leading
    ],
    "sire_leading": [
        {
            "rank": item["rank"] if isinstance(item, dict) else item.rank,
            "id": SIRE_NAME_TO_ID.get(item["name"] if isinstance(item, dict) else item.name, 0),
            "name": item["name"] if isinstance(item, dict) else item.name,
            "wins": item["wins"] if isinstance(item, dict) else item.wins,
            "rides": item["rides"] if isinstance(item, dict) else item.rides,
            "winRate": float(item["winRate"] if isinstance(item, dict) else item.winRate)
        }
        for item in row.sire_leading
    ]
}

print(f"\n✅ リーディングデータ生成完了")
print(f"   騎手: {len(leading_data['jockey_leading'])}名")
print(f"   調教師: {len(leading_data['trainer_leading'])}名")
print(f"   種牡馬: {len(leading_data['sire_leading'])}頭")

# GCSに保存
print(f"\n💾 GCSに保存中...")
storage_client = storage.Client()
bucket = storage_client.bucket('umadata')
blob = bucket.blob('leading.json')

# JSON文字列に変換
json_str = json.dumps(leading_data, ensure_ascii=False, indent=2)

# アップロード
blob.upload_from_string(
    json_str,
    content_type='application/json'
)

print(f"✅ GCSに保存完了: gs://umadata/leading.json")
print(f"   公開URL: https://storage.googleapis.com/umadata/leading.json")

# ローカルのpublic/dataにも保存
print(f"\n💾 ローカルに保存中...")
local_path = os.path.join(PROJECT_ROOT, 'public', 'data', 'leading.json')
with open(local_path, 'w', encoding='utf-8') as f:
    f.write(json_str)
print(f"✅ ローカルに保存完了: {local_path}")

# 確認用に内容を表示
print(f"\n📋 騎手リーディング TOP 3:")
for item in leading_data['jockey_leading'][:3]:
    print(f"   {item['rank']}位: {item['name']} ({item['wins']}勝 / {item['rides']}走 / {item['winRate']}%)")

print(f"\n📋 調教師リーディング TOP 3:")
for item in leading_data['trainer_leading'][:3]:
    print(f"   {item['rank']}位: {item['name']} ({item['wins']}勝 / {item['rides']}走 / {item['winRate']}%)")

print(f"\n📋 種牡馬リーディング TOP 3:")
for item in leading_data['sire_leading'][:3]:
    print(f"   {item['rank']}位: {item['name']} ({item['wins']}勝 / {item['rides']}走 / {item['winRate']}%)")

print(f"\n✅ 完了")
