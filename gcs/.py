#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
コースデータを BigQuery から取得して GCS に保存
"""

from google.cloud import bigquery, storage
import json
import sys

# 設定
PROJECT_ID = 'umadata'
BUCKET_NAME = 'umadata'
DATASET = 'umadata.keiba_data'

# コース情報
VENUE = '中山'
SURFACE = 'ダート'
DISTANCE = 1800

# 英語名マッピング
VENUE_EN = 'nakayama'
SURFACE_EN = 'dirt'


def get_gate_stats(client):
    """枠順別データを取得"""
    query = f"""
    SELECT
      rr.bracket_number as gate,
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(COALESCE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), 0) / COUNT(*), 0) as win_payback,
      ROUND(COALESCE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), 0) / COUNT(*), 0) as place_payback
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      rm.venue_name = '{VENUE}'
      AND rm.surface = '{SURFACE}'
      AND rm.distance = {DISTANCE}
    GROUP BY rr.bracket_number
    ORDER BY rr.bracket_number
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching gate stats: {str(e)}", file=sys.stderr)
        raise


def get_popularity_stats(client):
    """人気別データを取得"""
    query = f"""
    SELECT 
      CASE 
        WHEN rr.popularity = 1 THEN 'fav1'
        WHEN rr.popularity = 2 THEN 'fav2'
        WHEN rr.popularity = 3 THEN 'fav3'
        WHEN rr.popularity = 4 THEN 'fav4'
        WHEN rr.popularity = 5 THEN 'fav5'
        WHEN rr.popularity BETWEEN 6 AND 9 THEN 'fav6to9'
        WHEN rr.popularity >= 10 THEN 'fav10plus'
      END as popularity_group,
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(COALESCE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), 0) / COUNT(*), 0) as win_payback,
      ROUND(COALESCE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), 0) / COUNT(*), 0) as place_payback
    FROM 
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE 
      rm.venue_name = '{VENUE}'
      AND rm.surface = '{SURFACE}'
      AND rm.distance = {DISTANCE}
      AND rr.popularity IS NOT NULL
    GROUP BY popularity_group
    """
    
    try:
        results = client.query(query).result()
        data_dict = {row['popularity_group']: dict(row) for row in results}

        # 順序を保証して返す
        order = ['fav1', 'fav2', 'fav3', 'fav4', 'fav5', 'fav6to9', 'fav10plus']
        return [data_dict.get(key, {}) for key in order if key in data_dict]
    except Exception as e:
        print(f"   ⚠️  Error fetching popularity stats: {str(e)}", file=sys.stderr)
        raise


def get_jockey_stats(client):
    """騎手別データを取得"""
    query = f"""
    SELECT 
      ROW_NUMBER() OVER (
        ORDER BY 
          SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) DESC,
          ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) DESC,
          j.jockey_name ASC
      ) as rank,
      j.jockey_name as name,
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(COALESCE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), 0) / COUNT(*), 0) as win_payback,
      ROUND(COALESCE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), 0) / COUNT(*), 0) as place_payback
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      JOIN `{DATASET}.jockey` j ON CAST(rr.jockey_id AS STRING) = CAST(j.jockey_id AS STRING)
    WHERE
      rm.venue_name = '{VENUE}'
      AND rm.surface = '{SURFACE}'
      AND rm.distance = {DISTANCE}
      AND rr.jockey_id IS NOT NULL
    GROUP BY j.jockey_name
    HAVING COUNT(*) >= 5
    ORDER BY 
      wins DESC,
      win_rate DESC,
      name ASC
    LIMIT 50
    """
    
    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching jockey stats: {str(e)}", file=sys.stderr)
        raise


def get_trainer_stats(client):
    """調教師別データを取得"""
    query = f"""
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) DESC,
          ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) DESC,
          t.trainer_name ASC
      ) as rank,
      t.trainer_name as name,
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(COALESCE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), 0) / COUNT(*), 0) as win_payback,
      ROUND(COALESCE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), 0) / COUNT(*), 0) as place_payback
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      JOIN `{DATASET}.trainer` t ON CAST(rr.trainer_id AS STRING) = CAST(t.trainer_id AS STRING)
    WHERE
      rm.venue_name = '{VENUE}'
      AND rm.surface = '{SURFACE}'
      AND rm.distance = {DISTANCE}
      AND rr.trainer_id IS NOT NULL
    GROUP BY t.trainer_name
    HAVING COUNT(*) >= 5
    ORDER BY
      wins DESC,
      win_rate DESC,
      name ASC
    LIMIT 50
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching trainer stats: {str(e)}", file=sys.stderr)
        raise


def get_total_races(client):
    """対象コースの総出走数を取得"""
    query = f"""
    SELECT
      COUNT(*) as total_races
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      rm.venue_name = '{VENUE}'
      AND rm.surface = '{SURFACE}'
      AND rm.distance = {DISTANCE}
    """

    try:
        results = client.query(query).result()
        row = next(results)
        return row['total_races']
    except Exception as e:
        print(f"   ⚠️  Error fetching total races: {str(e)}", file=sys.stderr)
        raise


def main():
    """メイン処理"""
    try:
        print(f"🚀 Starting data export for {VENUE} {SURFACE} {DISTANCE}m")

        # BigQueryクライアント
        bq_client = bigquery.Client(project=PROJECT_ID)

        # 各データを取得
        print("📊 Fetching gate stats...")
        gate_stats = get_gate_stats(bq_client)
        print(f"   ✅ {len(gate_stats)} gates")

        print("📊 Fetching popularity stats...")
        popularity_stats = get_popularity_stats(bq_client)
        print(f"   ✅ {len(popularity_stats)} popularity groups")

        print("📊 Fetching jockey stats...")
        jockey_stats = get_jockey_stats(bq_client)
        print(f"   ✅ {len(jockey_stats)} jockeys")

        print("📊 Fetching trainer stats...")
        trainer_stats = get_trainer_stats(bq_client)
        print(f"   ✅ {len(trainer_stats)} trainers")

        print("📊 Fetching total races...")
        total_races = get_total_races(bq_client)
        print(f"   ✅ Total races: {total_races}")

        # 統合データ作成
        course_data = {
            'total_races': total_races,
            'gate_stats': gate_stats,
            'popularity_stats': popularity_stats,
            'jockey_stats': jockey_stats,
            'trainer_stats': trainer_stats,
        }

        # GCSにアップロード
        print(f"☁️  Uploading to GCS...")
        storage_client = storage.Client(project=PROJECT_ID)
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(f'course/{VENUE_EN}/{SURFACE_EN}/{DISTANCE}.json')

        blob.upload_from_string(
            json.dumps(course_data, ensure_ascii=False, indent=2),
            content_type='application/json'
        )

        print(f"✅ Successfully uploaded to gs://{BUCKET_NAME}/course/{VENUE_EN}/{SURFACE_EN}/{DISTANCE}.json")
        print(f"🌐 Public URL: https://storage.googleapis.com/{BUCKET_NAME}/course/{VENUE_EN}/{SURFACE_EN}/{DISTANCE}.json")

    except Exception as e:
        print(f"❌ Error occurred: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()