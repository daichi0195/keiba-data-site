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

# コース定義（85コース：79コース + 内回り・外回り3コース×2）
COURSES = [
    # 中山競馬場
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 2400, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1200, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1800, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '芝', 'surface_en': 'turf', 'distance': 2500, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '芝', 'surface_en': 'turf', 'distance': 2200, 'track_variant': None},

    # 東京競馬場
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 2100, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1300, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1400, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1400, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1600, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2400, 'track_variant': None},

    # 阪神競馬場
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 2200, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1200, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 1400, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1400, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 2000, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1800, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 2400, 'track_variant': None},

    # 京都競馬場
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1200, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1400, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1800, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1900, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 2400, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 2200, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    # 京都 内回り・外回り
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 1400, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 1400, 'track_variant': '外'},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': '外'},

    # 小倉競馬場
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1700, 'track_variant': None},
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': '芝', 'surface_en': 'turf', 'distance': 2600, 'track_variant': None},
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1000, 'track_variant': None},

    # 福島競馬場
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1700, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': '芝', 'surface_en': 'turf', 'distance': 2600, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1150, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},

    # 新潟競馬場
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 1400, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 1000, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1200, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1800, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 2200, 'track_variant': None},
    # 新潟 内回り・外回り
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': '外'},

    # 函館競馬場
    {'venue': '函館', 'venue_en': 'hakodate', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '函館', 'venue_en': 'hakodate', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '函館', 'venue_en': 'hakodate', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1700, 'track_variant': None},
    {'venue': '函館', 'venue_en': 'hakodate', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '函館', 'venue_en': 'hakodate', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1000, 'track_variant': None},

    # 札幌競馬場
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2600, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1700, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1500, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1000, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},

    # 中京競馬場
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1200, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1400, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1400, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1800, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1900, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2200, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
]

# 内回り・外回りを区別するコースのリスト（これらのコースのみtrack_variant条件を使用）
COURSES_WITH_VARIANT = [
    ('京都', '芝', 1400),
    ('京都', '芝', 1600),
    ('新潟', '芝', 2000),
]

# グローバル変数として現在処理中のコース情報を保持
VENUE = '中山'
SURFACE = 'ダート'
DISTANCE = 1800
VENUE_EN = 'nakayama'
SURFACE_EN = 'dirt'
TRACK_VARIANT = None  # None=内回り, '外'=外回り


def get_gate_stats(client):
    """枠順別データを取得（過去3年間）"""
    # track_variant条件を動的に生成（内回り・外回りを区別するコースのみ）
    if (VENUE, SURFACE, DISTANCE) in COURSES_WITH_VARIANT:
        track_variant_condition = "AND rm.track_variant IS NULL" if TRACK_VARIANT is None else f"AND rm.track_variant = '{TRACK_VARIANT}'"
    else:
        track_variant_condition = ""

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
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      rm.venue_name = '{VENUE}'
      AND rm.surface = '{SURFACE}'
      AND rm.distance = {DISTANCE}
      {track_variant_condition}
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
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
    """人気別データを取得（過去3年間）"""
    # track_variant条件を動的に生成（内回り・外回りを区別するコースのみ）
    if (VENUE, SURFACE, DISTANCE) in COURSES_WITH_VARIANT:
        track_variant_condition = "AND rm.track_variant IS NULL" if TRACK_VARIANT is None else f"AND rm.track_variant = '{TRACK_VARIANT}'"
    else:
        track_variant_condition = ""

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
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      rm.venue_name = '{VENUE}'
      AND rm.surface = '{SURFACE}'
      AND rm.distance = {DISTANCE}
      {track_variant_condition}
      AND rr.popularity IS NOT NULL
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
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
    """騎手別データを取得（過去3年間、現役のみ）"""
    # track_variant条件を動的に生成（内回り・外回りを区別するコースのみ）
    if (VENUE, SURFACE, DISTANCE) in COURSES_WITH_VARIANT:
        track_variant_condition = "AND rm.track_variant IS NULL" if TRACK_VARIANT is None else f"AND rm.track_variant = '{TRACK_VARIANT}'"
    else:
        track_variant_condition = ""

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
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      JOIN `{DATASET}.jockey` j ON CAST(rr.jockey_id AS STRING) = CAST(j.jockey_id AS STRING)
    WHERE
      rm.venue_name = '{VENUE}'
      AND rm.surface = '{SURFACE}'
      AND rm.distance = {DISTANCE}
      {track_variant_condition}
      AND rr.jockey_id IS NOT NULL
      AND j.is_active = true
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
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
    """調教師別データを取得（過去3年間、現役のみ）"""
    # track_variant条件を動的に生成（内回り・外回りを区別するコースのみ）
    if (VENUE, SURFACE, DISTANCE) in COURSES_WITH_VARIANT:
        track_variant_condition = "AND rm.track_variant IS NULL" if TRACK_VARIANT is None else f"AND rm.track_variant = '{TRACK_VARIANT}'"
    else:
        track_variant_condition = ""

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
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      JOIN `{DATASET}.trainer` t ON CAST(rr.trainer_id AS STRING) = CAST(t.trainer_id AS STRING)
    WHERE
      rm.venue_name = '{VENUE}'
      AND rm.surface = '{SURFACE}'
      AND rm.distance = {DISTANCE}
      {track_variant_condition}
      AND rr.trainer_id IS NOT NULL
      AND t.is_active = true
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
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


def get_volatility_stats(client):
    """荒れやすさデータを取得（過去3年間）

    sanrentanはJSON形式の文字列で保存されているため、REGEXPで数値を抽出する
    - 全コースの三連単中央値
    - このコースの三連単中央値
    - ランキング（何位/全コース数）
    - 荒れやすさスコア（1-5）
    """
    # track_variant条件を動的に生成（内回り・外回りを区別するコースのみ）
    if (VENUE, SURFACE, DISTANCE) in COURSES_WITH_VARIANT:
        track_variant_condition = "AND rm.track_variant IS NULL" if TRACK_VARIANT is None else f"AND rm.track_variant = '{TRACK_VARIANT}'"
        track_variant_condition_acr = "AND acr.track_variant IS NULL" if TRACK_VARIANT is None else f"AND acr.track_variant = '{TRACK_VARIANT}'"
    else:
        track_variant_condition = ""
        track_variant_condition_acr = ""

    # Step 1: このコースの三連単中央値と順位を計算
    ranking_query = f"""
    WITH payback_values AS (
      SELECT
        rm.venue_name,
        rm.surface,
        rm.distance,
        CAST(REGEXP_EXTRACT(rm.sanrentan, r': (\\d+)') AS FLOAT64) as payback_amount
      FROM
        `{DATASET}.race_master` rm
      WHERE
        rm.venue_name = '{VENUE}'
        AND rm.surface = '{SURFACE}'
        AND rm.distance = {DISTANCE}
        {track_variant_condition}
        AND rm.sanrentan IS NOT NULL
        AND rm.surface != '障害'
        AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    ),
    course_median AS (
      SELECT
        APPROX_QUANTILES(payback_amount, 100)[OFFSET(50)] as course_median
      FROM
        payback_values
    ),
    all_course_stats AS (
      SELECT
        venue_name,
        surface,
        distance,
        track_variant,
        APPROX_QUANTILES(CAST(REGEXP_EXTRACT(sanrentan, r': (\\d+)') AS FLOAT64), 100)[OFFSET(50)] as course_median
      FROM
        `{DATASET}.race_master` rm
      WHERE
        rm.sanrentan IS NOT NULL
        AND rm.surface != '障害'
        AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      GROUP BY
        venue_name,
        surface,
        distance,
        track_variant
      HAVING
        COUNT(*) > 20
    ),
    all_courses_ranked AS (
      SELECT
        venue_name,
        surface,
        distance,
        track_variant,
        course_median,
        ROW_NUMBER() OVER (ORDER BY course_median DESC) as rank,
        COUNT(*) OVER () as total_courses
      FROM
        all_course_stats
    ),
    global_median AS (
      SELECT
        APPROX_QUANTILES(CAST(REGEXP_EXTRACT(sanrentan, r': (\\d+)') AS FLOAT64), 100)[OFFSET(50)] as global_median
      FROM
        `{DATASET}.race_master` rm
      WHERE
        rm.sanrentan IS NOT NULL
        AND rm.surface != '障害'
        AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
        AND STRUCT(rm.venue_name, rm.surface, rm.distance, rm.track_variant) IN (
          SELECT AS STRUCT venue_name, surface, distance, track_variant
          FROM `{DATASET}.race_master`
          WHERE
            sanrentan IS NOT NULL
            AND surface != '障害'
            AND race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
          GROUP BY venue_name, surface, distance, track_variant
          HAVING COUNT(*) > 20
        )
    )
    SELECT
      cm.course_median as trifecta_median_payback,
      gm.global_median as trifecta_all_median_payback,
      acr.rank as trifecta_avg_payback_rank,
      acr.total_courses as total_courses
    FROM
      course_median cm
      CROSS JOIN global_median gm
      CROSS JOIN all_courses_ranked acr
    WHERE
      acr.venue_name = '{VENUE}'
      AND acr.surface = '{SURFACE}'
      AND acr.distance = {DISTANCE}
      {track_variant_condition_acr}
    """

    try:
        results = client.query(ranking_query).result()
        rows = list(results)
        if not rows:
            return None

        row = rows[0]
        course_median = float(row['trifecta_median_payback']) if row['trifecta_median_payback'] else 0
        global_median = float(row['trifecta_all_median_payback']) if row['trifecta_all_median_payback'] else 0
        rank = row['trifecta_avg_payback_rank']
        total_courses = row['total_courses']

        # Step 2: 荒れやすさスコア（1-5）を計算
        # 配当が高いほど荒れやすい
        # percentileに基づいて5段階評価
        if rank <= total_courses * 0.2:
            volatility_score = 5  # 上位20%：最も荒れやすい
        elif rank <= total_courses * 0.4:
            volatility_score = 4
        elif rank <= total_courses * 0.6:
            volatility_score = 3  # 中央：標準
        elif rank <= total_courses * 0.8:
            volatility_score = 2
        else:
            volatility_score = 1  # 下位20%：最も堅い

        return {
            'volatility': volatility_score,
            'trifecta_median_payback': int(course_median),
            'trifecta_all_median_payback': int(global_median),
            'trifecta_avg_payback_rank': rank,
            'total_courses': total_courses
        }

    except Exception as e:
        print(f"   ⚠️  Error fetching volatility stats: {str(e)}", file=sys.stderr)
        raise


def get_pedigree_stats(client):
    """種牡馬別データを取得（過去3年間）"""
    # track_variant条件を動的に生成（内回り・外回りを区別するコースのみ）
    if (VENUE, SURFACE, DISTANCE) in COURSES_WITH_VARIANT:
        track_variant_condition = "AND rm.track_variant IS NULL" if TRACK_VARIANT is None else f"AND rm.track_variant = '{TRACK_VARIANT}'"
    else:
        track_variant_condition = ""

    query = f"""
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) DESC,
          ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) DESC,
          h.father ASC
      ) as rank,
      h.father as name,
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      JOIN `{DATASET}.horse` h ON CAST(rr.horse_id AS STRING) = CAST(h.horse_id AS STRING)
    WHERE
      rm.venue_name = '{VENUE}'
      AND rm.surface = '{SURFACE}'
      AND rm.distance = {DISTANCE}
      {track_variant_condition}
      AND h.father IS NOT NULL
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    GROUP BY h.father
    HAVING COUNT(*) >= 3
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
        print(f"   ⚠️  Error fetching pedigree stats: {str(e)}", file=sys.stderr)
        raise


def get_dam_sire_stats(client):
    """母父別データを取得（過去3年間）"""
    # track_variant条件を動的に生成（内回り・外回りを区別するコースのみ）
    if (VENUE, SURFACE, DISTANCE) in COURSES_WITH_VARIANT:
        track_variant_condition = "AND rm.track_variant IS NULL" if TRACK_VARIANT is None else f"AND rm.track_variant = '{TRACK_VARIANT}'"
    else:
        track_variant_condition = ""

    query = f"""
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) DESC,
          ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) DESC,
          h.mf ASC
      ) as rank,
      h.mf as name,
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      JOIN `{DATASET}.horse` h ON CAST(rr.horse_id AS STRING) = CAST(h.horse_id AS STRING)
    WHERE
      rm.venue_name = '{VENUE}'
      AND rm.surface = '{SURFACE}'
      AND rm.distance = {DISTANCE}
      {track_variant_condition}
      AND h.mf IS NOT NULL
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    GROUP BY h.mf
    HAVING COUNT(*) >= 3
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
        print(f"   ⚠️  Error fetching dam_sire stats: {str(e)}", file=sys.stderr)
        raise


def get_running_style_stats(client):
    """脚質別データを取得（過去3年間）

    脚質の定義：
    - 逃げ: 最終コーナー以外（1,2,3番目）のいずれかを1位で通過
    - 先行: 逃げに該当しない馬で、最終コーナーを4位以内で通過
    - 差し: 逃げ・先行に該当しない馬で、最終コーナーが出走頭数の3分の2以内（出走頭数≧8）
    - 追込: 逃げ・先行・差しに該当しない馬
    """
    # track_variant条件を動的に生成（内回り・外回りを区別するコースのみ）
    if (VENUE, SURFACE, DISTANCE) in COURSES_WITH_VARIANT:
        track_variant_condition = "AND rm.track_variant IS NULL" if TRACK_VARIANT is None else f"AND rm.track_variant = '{TRACK_VARIANT}'"
    else:
        track_variant_condition = ""

    query = f"""
    WITH corner_data AS (
      SELECT
        rm.race_id,
        rr.horse_id,
        rr.finish_position,
        rr.win,
        rr.place,
        rm.entry_count,
        rr.last_3f_time,
        SPLIT(rr.corner_positions, '-') as corner_array
      FROM
        `{DATASET}.race_master` rm
        JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      WHERE
        rm.venue_name = '{VENUE}'
        AND rm.surface = '{SURFACE}'
        AND rm.distance = {DISTANCE}
        {track_variant_condition}
        AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
        AND rr.corner_positions IS NOT NULL
        AND ARRAY_LENGTH(SPLIT(rr.corner_positions, '-')) > 0
    ),
    corner_parsed AS (
      SELECT
        race_id,
        horse_id,
        finish_position,
        win,
        place,
        entry_count,
        last_3f_time,
        corner_array,
        ARRAY_LENGTH(corner_array) as corner_count,
        -- 各コーナーを取得（存在しない場合はNULL）
        CAST(IF(ARRAY_LENGTH(corner_array) >= 1, corner_array[OFFSET(0)], NULL) AS INT64) as corner_1,
        CAST(IF(ARRAY_LENGTH(corner_array) >= 2, corner_array[OFFSET(1)], NULL) AS INT64) as corner_2,
        CAST(IF(ARRAY_LENGTH(corner_array) >= 3, corner_array[OFFSET(2)], NULL) AS INT64) as corner_3,
        -- 最終コーナーを動的に取得
        CAST(corner_array[OFFSET(ARRAY_LENGTH(corner_array)-1)] AS INT64) as final_corner,
        -- 各レース内での上がり（ラスト3ハロン）ランク（タイムが短い順）
        RANK() OVER (PARTITION BY race_id ORDER BY last_3f_time ASC) as last_3f_rank
      FROM
        corner_data
    ),
    running_style_classified AS (
      SELECT
        race_id,
        horse_id,
        finish_position,
        win,
        place,
        CASE
          WHEN corner_count >= 1 AND (
            COALESCE(corner_1, 0) = 1 OR
            COALESCE(corner_2, 0) = 1 OR
            COALESCE(corner_3, 0) = 1
          )
            THEN 'escape'
          WHEN COALESCE(final_corner, 999) <= CAST(CEIL(entry_count / 3.0) AS INT64)
            THEN 'lead'
          WHEN COALESCE(final_corner, 999) > CAST(CEIL(entry_count / 3.0) AS INT64)
            AND COALESCE(final_corner, 999) <= CAST(CEIL(2 * entry_count / 3.0) AS INT64)
            AND last_3f_rank <= 5
            THEN 'pursue'
          WHEN COALESCE(final_corner, 999) > CAST(CEIL(2 * entry_count / 3.0) AS INT64)
            AND last_3f_rank <= 5
            THEN 'close'
          ELSE NULL
        END as running_style
      FROM
        corner_parsed
    )
    SELECT
      running_style,
      CASE
        WHEN running_style = 'escape' THEN '逃げ'
        WHEN running_style = 'lead' THEN '先行'
        WHEN running_style = 'pursue' THEN '差し'
        WHEN running_style = 'close' THEN '追込'
      END as style_label,
      COUNT(*) as races,
      SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END), COUNT(*)) * 100, 1) as win_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN finish_position <= 2 THEN 1 ELSE 0 END), COUNT(*)) * 100, 1) as quinella_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN finish_position <= 3 THEN 1 ELSE 0 END), COUNT(*)) * 100, 1) as place_rate,
      ROUND(SAFE_DIVIDE(
        SUM(CASE WHEN finish_position = 1 THEN COALESCE(win, 0) ELSE 0 END),
        COUNT(*) * 100
      ) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(
        SUM(CASE WHEN finish_position <= 3 THEN COALESCE(place, 0) ELSE 0 END),
        COUNT(*) * 100
      ) * 100, 1) as place_payback
    FROM
      running_style_classified
    WHERE
      running_style IS NOT NULL
    GROUP BY
      running_style
    ORDER BY
      CASE running_style
        WHEN 'escape' THEN 1
        WHEN 'lead' THEN 2
        WHEN 'pursue' THEN 3
        WHEN 'close' THEN 4
      END
    """

    try:
        from google.cloud.bigquery import QueryJobConfig
        job_config = QueryJobConfig(use_query_cache=False)
        results = client.query(query, job_config=job_config).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching running style stats: {str(e)}", file=sys.stderr)
        raise


def get_running_style_trends(client):
    """脚質傾向データを取得（「逃げ・先行」と「差し・追込」に分類、5段階評価）"""
    # track_variant条件を動的に生成（内回り・外回りを区別するコースのみ）
    if (VENUE, SURFACE, DISTANCE) in COURSES_WITH_VARIANT:
        track_variant_condition = "AND rm.track_variant IS NULL" if TRACK_VARIANT is None else f"AND rm.track_variant = '{TRACK_VARIANT}'"
    else:
        track_variant_condition = ""

    query = f"""
    WITH corner_data AS (
      SELECT
        rm.race_id,
        rr.horse_id,
        rr.finish_position,
        rr.win,
        rr.place,
        rm.entry_count,
        rr.corner_positions,
        rr.last_3f_time,
        SPLIT(rr.corner_positions, '-') as corner_array
      FROM
        `{DATASET}.race_master` rm
        JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      WHERE
        rm.venue_name = '{VENUE}'
        AND rm.surface = '{SURFACE}'
        AND rm.distance = {DISTANCE}
        {track_variant_condition}
        AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
        AND rr.corner_positions IS NOT NULL
        AND ARRAY_LENGTH(SPLIT(rr.corner_positions, '-')) > 0
    ),
    corner_parsed AS (
      SELECT
        race_id,
        horse_id,
        finish_position,
        win,
        place,
        entry_count,
        last_3f_time,
        corner_array,
        ARRAY_LENGTH(corner_array) as corner_count,
        CAST(IF(ARRAY_LENGTH(corner_array) >= 1, corner_array[OFFSET(0)], NULL) AS INT64) as corner_1,
        CAST(IF(ARRAY_LENGTH(corner_array) >= 2, corner_array[OFFSET(1)], NULL) AS INT64) as corner_2,
        CAST(IF(ARRAY_LENGTH(corner_array) >= 3, corner_array[OFFSET(2)], NULL) AS INT64) as corner_3,
        CAST(corner_array[OFFSET(ARRAY_LENGTH(corner_array)-1)] AS INT64) as final_corner,
        RANK() OVER (PARTITION BY race_id ORDER BY last_3f_time ASC) as last_3f_rank
      FROM
        corner_data
    ),
    running_style_classified AS (
      SELECT
        race_id,
        horse_id,
        finish_position,
        COALESCE(win, 0) as win,
        COALESCE(place, 0) as place,
        CASE
          -- 逃げ: 最初の3コーナー（1,2,3番目）のいずれかを1位で通過
          WHEN corner_count >= 1 AND (
            COALESCE(corner_1, 0) = 1 OR
            COALESCE(corner_2, 0) = 1 OR
            COALESCE(corner_3, 0) = 1
          )
            THEN 'escape'
          -- 先行: 最終コーナーが第1集団（1位～出走馬/3）
          WHEN COALESCE(final_corner, 999) <= CAST(CEIL(entry_count / 3.0) AS INT64)
            THEN 'lead'
          -- 差し: 最終コーナーが第2集団（出走馬/3+1～2*出走馬/3）かつ上がり（ラスト3F）が5位以内
          WHEN COALESCE(final_corner, 999) > CAST(CEIL(entry_count / 3.0) AS INT64)
            AND COALESCE(final_corner, 999) <= CAST(CEIL(2 * entry_count / 3.0) AS INT64)
            AND last_3f_rank <= 5
            THEN 'pursue'
          -- 追込: 最終コーナーが第3集団（2*出走馬/3+1～）かつ上がり（ラスト3F）が5位以内
          WHEN COALESCE(final_corner, 999) > CAST(CEIL(2 * entry_count / 3.0) AS INT64)
            AND last_3f_rank <= 5
            THEN 'close'
          -- その他: カウント対象外（NULLを返す）
          ELSE NULL
        END as running_style
      FROM
        corner_parsed
    )
    SELECT
      CASE
        WHEN running_style IN ('escape', 'lead') THEN 'early_lead'
        WHEN running_style IN ('pursue', 'close') THEN 'comeback'
      END as trend_group,
      CASE
        WHEN running_style IN ('escape', 'lead') THEN '逃げ・先行'
        WHEN running_style IN ('pursue', 'close') THEN '差し・追込'
      END as trend_label,
      COUNT(*) as races,
      SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END), COUNT(*)) * 100, 1) as win_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN finish_position <= 2 THEN 1 ELSE 0 END), COUNT(*)) * 100, 1) as quinella_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN finish_position <= 3 THEN 1 ELSE 0 END), COUNT(*)) * 100, 1) as place_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN finish_position = 1 THEN COALESCE(win, 0) ELSE 0 END), SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) * 100), 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN finish_position <= 3 THEN COALESCE(place, 0) ELSE 0 END), SUM(CASE WHEN finish_position <= 3 THEN 1 ELSE 0 END) * 100), 1) as place_payback
    FROM
      running_style_classified
    WHERE
      running_style IS NOT NULL
    GROUP BY
      trend_group, trend_label
    ORDER BY
      trend_group
    """

    try:
        from google.cloud.bigquery import QueryJobConfig
        job_config = QueryJobConfig(use_query_cache=False)
        results = client.query(query, job_config=job_config).result()

        # Convert results to dict and calculate trend_value (0-4 scale based on place_rate)
        trends = [dict(row) for row in results]

        # Calculate trend values based on place rate
        if len(trends) == 2:
            place_rates = [t['place_rate'] for t in trends]
            max_rate = max(place_rates)
            min_rate = min(place_rates)

            for trend in trends:
                # Normalize to 0-4 scale
                if max_rate == min_rate:
                    trend['trend_value'] = 2  # Middle if they're equal
                else:
                    # 0-4 scale where higher place_rate = higher value
                    normalized = (trend['place_rate'] - min_rate) / (max_rate - min_rate)
                    trend['trend_value'] = round(normalized * 4)

        return trends
    except Exception as e:
        print(f"   ⚠️  Error fetching running style trends: {str(e)}", file=sys.stderr)
        raise


def get_total_races(client):
    """対象コースの総レース数を取得（過去3年間）"""
    # track_variant条件を動的に生成（内回り・外回りを区別するコースのみ）
    if (VENUE, SURFACE, DISTANCE) in COURSES_WITH_VARIANT:
        track_variant_condition = "AND rm.track_variant IS NULL" if TRACK_VARIANT is None else f"AND rm.track_variant = '{TRACK_VARIANT}'"
    else:
        track_variant_condition = ""

    query = f"""
    SELECT
      COUNT(*) as total_races
    FROM
      `{DATASET}.race_master` rm
    WHERE
      rm.venue_name = '{VENUE}'
      AND rm.surface = '{SURFACE}'
      AND rm.distance = {DISTANCE}
      {track_variant_condition}
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    """

    try:
        results = client.query(query).result()
        row = next(results)
        return row['total_races']
    except Exception as e:
        print(f"   ⚠️  Error fetching total races: {str(e)}", file=sys.stderr)
        raise


def process_course(bq_client, storage_client, venue, venue_en, surface, surface_en, distance, track_variant):
    """単一コースのデータを処理してGCSにアップロード"""
    global VENUE, SURFACE, DISTANCE, VENUE_EN, SURFACE_EN, TRACK_VARIANT

    # グローバル変数を更新
    VENUE = venue
    SURFACE = surface
    DISTANCE = distance
    VENUE_EN = venue_en
    SURFACE_EN = surface_en
    TRACK_VARIANT = track_variant

    # コース名の表示用（内回り・外回りを含む）
    track_label = "（外回り）" if track_variant == '外' else "（内回り）" if track_variant is None and venue in ['京都', '新潟'] and surface == '芝' and distance in [1400, 1600, 2000] else ""

    try:
        print(f"  🚀 Processing {venue} {surface} {distance}m{track_label}")

        # 各データを取得
        gate_stats = get_gate_stats(bq_client)
        popularity_stats = get_popularity_stats(bq_client)
        jockey_stats = get_jockey_stats(bq_client)
        trainer_stats = get_trainer_stats(bq_client)
        volatility_stats = get_volatility_stats(bq_client)
        pedigree_stats = get_pedigree_stats(bq_client)
        dam_sire_stats = get_dam_sire_stats(bq_client)
        running_style_stats = get_running_style_stats(bq_client)
        running_style_trends = get_running_style_trends(bq_client)
        total_races = get_total_races(bq_client)

        # 統合データ作成
        course_data = {
            'total_races': total_races,
            'gate_stats': gate_stats,
            'popularity_stats': popularity_stats,
            'jockey_stats': jockey_stats,
            'trainer_stats': trainer_stats,
            'pedigree_stats': pedigree_stats,
            'dam_sire_stats': dam_sire_stats,
            'running_style_stats': running_style_stats,
            'running_style_trends': running_style_trends,
        }

        # volatility_statsがNoneの場合のデフォルト値を設定
        if volatility_stats:
            course_data['characteristics'] = {
                'volatility': volatility_stats['volatility'],
                'trifecta_median_payback': volatility_stats['trifecta_median_payback'],
                'trifecta_all_median_payback': volatility_stats['trifecta_all_median_payback'],
                'trifecta_avg_payback_rank': volatility_stats['trifecta_avg_payback_rank'],
                'total_courses': volatility_stats['total_courses']
            }
        else:
            # データ不足の場合はデフォルト値
            course_data['characteristics'] = {
                'volatility': 3,
                'trifecta_median_payback': 0,
                'trifecta_all_median_payback': 0,
                'trifecta_avg_payback_rank': 0,
                'total_courses': 0
            }

        # GCSにアップロード
        bucket = storage_client.bucket(BUCKET_NAME)
        # 内回り・外回りに応じてパスを変更
        if track_variant == '外':
            blob_path = f'course/{venue_en}/{surface_en}/{distance}-outer.json'
        elif track_variant is None and venue in ['京都', '新潟'] and surface == '芝' and distance in [1400, 1600, 2000]:
            blob_path = f'course/{venue_en}/{surface_en}/{distance}-inner.json'
        else:
            blob_path = f'course/{venue_en}/{surface_en}/{distance}.json'

        blob = bucket.blob(blob_path)
        blob.upload_from_string(
            json.dumps(course_data, ensure_ascii=False, indent=2),
            content_type='application/json'
        )

        print(f"    ✅ {venue} {surface} {distance}m{track_label} uploaded to {blob_path}")
        return True

    except Exception as e:
        print(f"    ❌ Error processing {venue} {surface} {distance}m: {str(e)}", file=sys.stderr)
        return False


def main():
    """メイン処理 - 全コースをバッチ処理"""
    try:
        print("🚀 Starting batch data export for 85 courses")

        # BigQueryとGCS クライアント
        bq_client = bigquery.Client(project=PROJECT_ID)
        storage_client = storage.Client(project=PROJECT_ID)

        total_courses = 0
        successful = 0
        failed = 0

        # 全コースを処理
        for course in COURSES:
            venue = course['venue']
            venue_en = course['venue_en']
            surface = course['surface']
            surface_en = course['surface_en']
            distance = course['distance']
            track_variant = course['track_variant']

            total_courses += 1

            if process_course(bq_client, storage_client, venue, venue_en, surface, surface_en, distance, track_variant):
                successful += 1
            else:
                failed += 1

        print(f"\n{'='*60}")
        print(f"✅ Batch processing complete!")
        print(f"   Total courses: {total_courses}")
        print(f"   Successful: {successful}")
        print(f"   Failed: {failed}")
        print(f"{'='*60}")

    except Exception as e:
        print(f"❌ Fatal error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()