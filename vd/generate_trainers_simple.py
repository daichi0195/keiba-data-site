#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
調教師データを BigQuery から取得して GCS に保存（シンプル版・テスト用）
"""

from google.cloud import bigquery, storage
import json
import sys
from datetime import datetime

# 設定
PROJECT_ID = 'umadata'
BUCKET_NAME = 'umadata'
DATASET = 'umadata.keiba_data'

# グローバル変数として現在処理中の調教師情報を保持
TRAINER_ID = None


def get_trainer_basic_info(client):
    """調教師の基本情報を取得"""
    query = f"""
    SELECT
      trainer_id,
      trainer_name as name,
      region as stable,
      debut_year,
      is_active
    FROM
      `{DATASET}.trainer`
    WHERE
      trainer_id = {TRAINER_ID}
    """

    try:
        results = client.query(query).result()
        rows = list(results)
        if not rows:
            return None
        return dict(rows[0])
    except Exception as e:
        print(f"   ⚠️  Error fetching trainer basic info: {str(e)}", file=sys.stderr)
        raise


def get_total_stats(client):
    """総合成績を取得（過去3年間）"""
    query = f"""
    SELECT
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      CAST(rr.trainer_id AS STRING) = CAST({TRAINER_ID} AS STRING)
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    """

    try:
        results = client.query(query).result()
        rows = list(results)
        if not rows:
            return None
        return dict(rows[0])
    except Exception as e:
        print(f"   ⚠️  Error fetching total stats: {str(e)}", file=sys.stderr)
        raise


def process_trainer(bq_client, storage_client, trainer_id, trainer_name):
    """1人の調教師のデータを処理してGCSにアップロード"""
    global TRAINER_ID
    TRAINER_ID = trainer_id

    print(f"\n{'='*60}")
    print(f"📊 Processing: {trainer_name} (ID: {trainer_id})")
    print(f"{'='*60}")

    try:
        # 基本情報を取得
        print("  [1/2] Fetching basic info...")
        basic_info = get_trainer_basic_info(bq_client)
        if not basic_info:
            print(f"  ⚠️  Trainer not found: {trainer_id}")
            return False

        print("  [2/2] Fetching total stats...")
        total_stats = get_total_stats(bq_client)

        # データ期間と更新日を設定
        today = datetime.now()
        yesterday = datetime(today.year, today.month, today.day - 1) if today.day > 1 else datetime(today.year, today.month - 1, 28)
        three_years_ago = datetime(yesterday.year - 3, yesterday.month, yesterday.day)

        data_period = f"直近3年間分（{three_years_ago.year}年{three_years_ago.month}月{three_years_ago.day}日〜{yesterday.year}年{yesterday.month}月{yesterday.day}日）"
        last_updated = f"{today.year}年{today.month}月{today.day}日"

        # JSONデータを構築（最小限）
        trainer_data = {
            'id': str(trainer_id).zfill(5),
            'name': basic_info['name'],
            'kana': 'やはぎよしと',  # テスト用に固定
            'stable': basic_info['stable'] or '',
            'debut_year': basic_info['debut_year'],
            'data_period': data_period,
            'last_updated': last_updated,
            'total_races': total_stats['races'] if total_stats else 0,
            'total_stats': total_stats or {},
            'yearly_leading': [],
            'yearly_stats': [],
            'distance_stats': [],
            'surface_stats': [],
            'popularity_stats': {},
            'running_style_stats': [],
            'gate_stats': [],
            'course_stats': [],
            'jockey_stats': [],
            'class_stats': [],
            'track_condition_stats': [],
            'gender_stats': [],
            'racecourse_stats': [],
            'owner_stats': [],
        }

        # GCSにアップロード
        bucket = storage_client.bucket(BUCKET_NAME)
        blob_path = f'trainer/{str(trainer_id).zfill(5)}.json'
        blob = bucket.blob(blob_path)
        blob.upload_from_string(
            json.dumps(trainer_data, ensure_ascii=False, indent=2),
            content_type='application/json'
        )

        print(f"  ✅ {trainer_name} uploaded to {blob_path}")
        return True

    except Exception as e:
        print(f"  ❌ Error processing {trainer_name}: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False


def main():
    """メイン処理"""
    import argparse

    parser = argparse.ArgumentParser(description='Export trainer data from BigQuery to GCS')
    parser.add_argument('--trainer-id', type=int, required=True, help='Process a specific trainer by ID')
    args = parser.parse_args()

    try:
        # BigQueryとGCS クライアント
        bq_client = bigquery.Client(project=PROJECT_ID)
        storage_client = storage.Client(project=PROJECT_ID)

        print(f"🚀 Starting trainer data export (TEST MODE)")
        print(f"   Processing trainer ID: {args.trainer_id}")
        success = process_trainer(bq_client, storage_client, args.trainer_id, f"ID:{args.trainer_id}")

        print(f"\n{'='*60}")
        if success:
            print(f"✅ Processing complete!")
        else:
            print(f"❌ Processing failed!")
        print(f"{'='*60}")

    except Exception as e:
        print(f"❌ Fatal error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
