#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
騎手データを BigQuery から取得して GCS に保存
"""

from localdb import LocalClient, save_json, as_of_date, OUT_DIR
import json
import sys
from datetime import datetime

# 設定
PROJECT_ID = 'umadata'
BUCKET_NAME = 'umadata'
DATASET = 'site'

# グローバル変数として現在処理中の騎手情報を保持
JOCKEY_ID = None


def get_jockey_basic_info(client):
    """騎手の基本情報を取得"""
    query = f"""
    SELECT
      jockey_id,
      jockey_name as name,
      kana as kana,
      region as affiliation,
      debut_year,
      is_active
    FROM
      `{DATASET}.jockey`
    WHERE
      jockey_id = {JOCKEY_ID}
    """

    try:
        results = client.query(query).result()
        rows = list(results)
        if not rows:
            return None
        return dict(rows[0])
    except Exception as e:
        print(f"   ⚠️  Error fetching jockey basic info: {str(e)}", file=sys.stderr)
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
      rr.jockey_id = {JOCKEY_ID}
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


def get_yearly_stats(client):
    """年度別成績を取得（過去3年間）"""
    query = f"""
    SELECT
      EXTRACT(YEAR FROM rm.race_date) as year,
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
      ROUND(AVG(rr.popularity), 1) as avg_popularity,
      ROUND(AVG(rr.finish_position), 1) as avg_rank,
      APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
      APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      rr.jockey_id = {JOCKEY_ID}
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    GROUP BY year
    ORDER BY year DESC
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching yearly stats: {str(e)}", file=sys.stderr)
        raise


def get_yearly_leading(client):
    """年度別リーディング順位を取得（過去3年間）"""
    query = f"""
    WITH yearly_wins AS (
      SELECT
        EXTRACT(YEAR FROM rm.race_date) as year,
        rr.jockey_id,
        SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
        SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
        COUNT(*) as rides
      FROM
        `{DATASET}.race_master` rm
        JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      WHERE
        rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      GROUP BY year, rr.jockey_id
    ),
    ranked AS (
      SELECT
        year,
        jockey_id,
        wins,
        RANK() OVER (PARTITION BY year ORDER BY wins DESC, places_2 DESC, places_3 DESC, rides ASC) as ranking
      FROM yearly_wins
    )
    SELECT
      year,
      wins,
      ranking
    FROM ranked
    WHERE jockey_id = {JOCKEY_ID}
    ORDER BY year DESC
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching yearly leading: {str(e)}", file=sys.stderr)
        raise


def get_distance_stats(client):
    """距離別成績を取得（過去3年間）

    距離カテゴリ定義:
    - 短距離: 1000-1400m
    - マイル: 1401-1800m
    - 中距離: 1801-2100m
    - 長距離: 2101m以上（旧「中長距離」と「長距離」を統合）
    """
    query = f"""
    SELECT
      CASE
        WHEN rm.distance <= 1400 THEN '短距離'
        WHEN rm.distance <= 1800 THEN 'マイル'
        WHEN rm.distance <= 2100 THEN '中距離'
        ELSE '長距離'
      END as category,
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
      ROUND(AVG(rr.popularity), 1) as avg_popularity,
      ROUND(AVG(rr.finish_position), 1) as avg_rank,
      APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
      APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      rr.jockey_id = {JOCKEY_ID}
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    GROUP BY category
    ORDER BY
      CASE category
        WHEN '短距離' THEN 1
        WHEN 'マイル' THEN 2
        WHEN '中距離' THEN 3
        WHEN '長距離' THEN 4
      END
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching distance stats: {str(e)}", file=sys.stderr)
        raise


def get_surface_stats(client):
    """路面別成績を取得（過去3年間）"""
    query = f"""
    SELECT
      rm.surface,
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
      ROUND(AVG(rr.popularity), 1) as avg_popularity,
      ROUND(AVG(rr.finish_position), 1) as avg_rank,
      APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
      APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      rr.jockey_id = {JOCKEY_ID}
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      AND rm.surface IN ('芝', 'ダート', '障害')
    GROUP BY rm.surface
    ORDER BY
      CASE rm.surface
        WHEN '芝' THEN 1
        WHEN 'ダート' THEN 2
        WHEN '障害' THEN 3
        ELSE 4
      END
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching surface stats: {str(e)}", file=sys.stderr)
        raise


def get_popularity_stats(client):
    """人気別成績を取得（過去3年間）"""
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
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
      ROUND(AVG(rr.popularity), 1) as avg_popularity,
      ROUND(AVG(rr.finish_position), 1) as avg_rank,
      APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
      APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      rr.jockey_id = {JOCKEY_ID}
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
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


def get_running_style_stats(client):
    """脚質別成績を取得（過去3年間）"""
    query = f"""
    WITH all_horses AS (
      SELECT
        rm.race_id,
        rr.horse_id,
        rr.jockey_id,
        rr.finish_position,
        rr.popularity,
        rr.win,
        rr.place,
        rm.entry_count,
        rr.last_3f_time,
        SPLIT(rr.corner_positions, '-') as corner_array,
        RANK() OVER (PARTITION BY rm.race_id ORDER BY rr.last_3f_time ASC) as last_3f_rank
      FROM
        `{DATASET}.race_master` rm
        JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      WHERE
        rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    ),
    corner_data AS (
      SELECT
        race_id,
        horse_id,
        finish_position,
        popularity,
        win,
        place,
        entry_count,
        last_3f_time,
        last_3f_rank,
        corner_array
      FROM
        all_horses
      WHERE
        jockey_id = {JOCKEY_ID}
        AND corner_array IS NOT NULL
        AND ARRAY_LENGTH(corner_array) > 0
    ),
    corner_parsed AS (
      SELECT
        race_id,
        horse_id,
        finish_position,
        popularity,
        win,
        place,
        entry_count,
        last_3f_time,
        last_3f_rank,
        corner_array,
        ARRAY_LENGTH(corner_array) as corner_count,
        CAST(IF(ARRAY_LENGTH(corner_array) >= 1, corner_array[OFFSET(0)], NULL) AS INT64) as corner_1,
        CAST(IF(ARRAY_LENGTH(corner_array) >= 2, corner_array[OFFSET(1)], NULL) AS INT64) as corner_2,
        CAST(IF(ARRAY_LENGTH(corner_array) >= 3, corner_array[OFFSET(2)], NULL) AS INT64) as corner_3,
        CAST(corner_array[OFFSET(ARRAY_LENGTH(corner_array)-1)] AS INT64) as final_corner
      FROM
        corner_data
    ),
    running_style_classified AS (
      SELECT
        race_id,
        horse_id,
        finish_position,
        popularity,
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
            AND last_3f_rank <= 3
            THEN 'pursue'
          WHEN COALESCE(final_corner, 999) > CAST(CEIL(2 * entry_count / 3.0) AS INT64)
            AND last_3f_rank <= 3
            THEN 'close'
          ELSE NULL
        END as running_style
      FROM
        corner_parsed
    )
    SELECT
      running_style as style,
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
      ) * 100, 1) as place_payback,
      ROUND(AVG(popularity), 1) as avg_popularity,
      ROUND(AVG(finish_position), 1) as avg_rank,
      APPROX_QUANTILES(popularity, 100)[OFFSET(50)] as median_popularity,
      APPROX_QUANTILES(finish_position, 100)[OFFSET(50)] as median_rank
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


def get_gate_stats(client):
    """枠順別成績を取得（過去3年間）"""
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
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
      ROUND(AVG(rr.popularity), 1) as avg_popularity,
      ROUND(AVG(rr.finish_position), 1) as avg_rank,
      APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
      APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      rr.jockey_id = {JOCKEY_ID}
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    GROUP BY rr.bracket_number
    ORDER BY rr.bracket_number
    """

    try:
        results = client.query(query).result()

        # 枠番の色を定義
        GATE_COLORS = {
            1: '#FFFFFF',
            2: '#222222',
            3: '#C62927',
            4: '#2573CD',
            5: '#E4CA3C',
            6: '#58AF4A',
            7: '#FAA727',
            8: '#DC6179',
        }

        # 色情報を追加
        gate_data = []
        for row in results:
            row_dict = dict(row)
            gate_num = row_dict['gate']
            row_dict['color'] = GATE_COLORS.get(gate_num, '#999999')
            gate_data.append(row_dict)

        return gate_data
    except Exception as e:
        print(f"   ⚠️  Error fetching gate stats: {str(e)}", file=sys.stderr)
        raise


def get_course_stats(client):
    """コース別成績を取得（過去3年間）"""
    query = f"""
    WITH course_data AS (
      SELECT
        rm.venue_name,
        rm.surface,
        rm.distance,
        rm.track_variant,
        COUNT(*) as races,
        SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
        SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
        ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
        ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
        ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
        ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
        ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
        ROUND(AVG(rr.popularity), 1) as avg_popularity,
        ROUND(AVG(rr.finish_position), 1) as avg_rank,
        APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
        APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
      FROM
        `{DATASET}.race_master` rm
        JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      WHERE
        rr.jockey_id = {JOCKEY_ID}
        AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      GROUP BY
        rm.venue_name,
        rm.surface,
        rm.distance,
        rm.track_variant
    )
    SELECT
      ROW_NUMBER() OVER (ORDER BY wins DESC, places_2 DESC, places_3 DESC, races ASC) as rank,
      CONCAT(venue_name, '競馬場 ',
        CASE surface
          WHEN 'ダート' THEN 'ダ'
          ELSE surface
        END,
        ' ', CAST(distance AS STRING), 'm',
        CASE
          -- 京都1400m・1600mは内外両方あるので表記する
          WHEN (venue_name = '京都' AND surface = '芝' AND distance IN (1400, 1600) AND track_variant = '外') THEN '外'
          WHEN (venue_name = '京都' AND surface = '芝' AND distance IN (1400, 1600) AND track_variant IS NULL) THEN '内'
          -- 新潟2000mは内外両方あるので表記する
          WHEN (venue_name = '新潟' AND surface = '芝' AND distance = 2000 AND track_variant = '外') THEN '外'
          WHEN (venue_name = '新潟' AND surface = '芝' AND distance = 2000 AND track_variant IS NULL) THEN '内'
          -- それ以外のコースは外のみなので表記しない
          ELSE ''
        END
      ) as name,
      venue_name as racecourse,
      CASE venue_name
        WHEN '札幌' THEN 'sapporo'
        WHEN '函館' THEN 'hakodate'
        WHEN '福島' THEN 'fukushima'
        WHEN '新潟' THEN 'niigata'
        WHEN '東京' THEN 'tokyo'
        WHEN '中山' THEN 'nakayama'
        WHEN '中京' THEN 'chukyo'
        WHEN '京都' THEN 'kyoto'
        WHEN '阪神' THEN 'hanshin'
        WHEN '小倉' THEN 'kokura'
      END as racecourse_en,
      surface,
      CASE surface
        WHEN '芝' THEN 'turf'
        WHEN 'ダート' THEN 'dirt'
        WHEN '障害' THEN 'steeplechase'
      END as surface_en,
      distance,
      track_variant as variant,
      races,
      wins,
      places_2,
      places_3,
      win_rate,
      quinella_rate,
      place_rate,
      win_payback,
      place_payback,
      avg_popularity,
      avg_rank,
      median_popularity,
      median_rank
    FROM course_data
    ORDER BY
      CASE surface
        WHEN '芝' THEN 1
        WHEN 'ダート' THEN 2
        WHEN '障害' THEN 3
        ELSE 4
      END,
      distance ASC
    """

    try:
        results = client.query(query).result()
        # リンクを追加
        course_list = []
        for row in results:
            row_dict = dict(row)
            # コース別ページへのリンクを生成
            if row_dict.get('racecourse_en') and row_dict.get('surface_en') and row_dict.get('distance'):
                link = f"/courses/{row_dict['racecourse_en']}/{row_dict['surface_en']}/{row_dict['distance']}"
                row_dict['link'] = link
            course_list.append(row_dict)
        return course_list
    except Exception as e:
        print(f"   ⚠️  Error fetching course stats: {str(e)}", file=sys.stderr)
        raise


def get_trainer_stats(client):
    """調教師別成績を取得（過去3年間、現役のみ、Top 50）"""
    query = f"""
    WITH trainer_data AS (
      SELECT
        t.trainer_id,
        t.trainer_name as name,
        COUNT(*) as races,
        SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
        SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
        ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
        ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
        ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
        ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
        ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
        ROUND(AVG(rr.popularity), 1) as avg_popularity,
        ROUND(AVG(rr.finish_position), 1) as avg_rank,
        APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
        APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
      FROM
        `{DATASET}.race_master` rm
        JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
        JOIN `{DATASET}.trainer` t ON CAST(rr.trainer_id AS STRING) = CAST(t.trainer_id AS STRING)
      WHERE
        rr.jockey_id = {JOCKEY_ID}
        AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
        AND t.is_active = true
      GROUP BY t.trainer_id, t.trainer_name
    )
    SELECT
      ROW_NUMBER() OVER (ORDER BY wins DESC, places_2 DESC, places_3 DESC, races ASC) as rank,
      trainer_id,
      name,
      races,
      wins,
      places_2,
      places_3,
      win_rate,
      quinella_rate,
      place_rate,
      win_payback,
      place_payback,
      avg_popularity,
      avg_rank,
      median_popularity,
      median_rank
    FROM trainer_data
    ORDER BY wins DESC, places_2 DESC, places_3 DESC, races ASC
    LIMIT 50
    """

    try:
        results = client.query(query).result()
        # リンクを追加
        return [{**dict(row), 'link': f'/trainers/{row.trainer_id}'} for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching trainer stats: {str(e)}", file=sys.stderr)
        raise


def get_class_stats(client):
    """クラス別成績を取得（過去3年間）"""
    query = f"""
    WITH class_data AS (
      SELECT
        CASE
          WHEN rm.grade = 'G1' THEN 'G1'
          WHEN rm.grade = 'G2' THEN 'G2'
          WHEN rm.grade = 'G3' THEN 'G3'
          WHEN rm.race_class = 'オープン' AND rm.grade IS NULL THEN 'オープン'
          WHEN rm.race_class = '３勝クラス' THEN '3勝'
          WHEN rm.race_class = '２勝クラス' THEN '2勝'
          WHEN rm.race_class = '１勝クラス' THEN '1勝'
          WHEN rm.race_class = '未勝利' THEN '未勝利'
          WHEN rm.race_class = '新馬' THEN '新馬'
          ELSE rm.race_class
        END as class_name,
        COUNT(*) as races,
        SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
        SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
        ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
        ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
        ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
        ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
        ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
        ROUND(AVG(rr.popularity), 1) as avg_popularity,
        ROUND(AVG(rr.finish_position), 1) as avg_rank,
        APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
        APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
      FROM
        `{DATASET}.race_master` rm
        JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      WHERE
        rr.jockey_id = {JOCKEY_ID}
        AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
        AND rm.race_class IS NOT NULL
      GROUP BY class_name
    )
    SELECT
      ROW_NUMBER() OVER (ORDER BY
        CASE class_name
          WHEN 'G1' THEN 1
          WHEN 'G2' THEN 2
          WHEN 'G3' THEN 3
          WHEN 'オープン' THEN 4
          WHEN '3勝' THEN 5
          WHEN '2勝' THEN 6
          WHEN '1勝' THEN 7
          WHEN '未勝利' THEN 8
          WHEN '新馬' THEN 9
          ELSE 10
        END
      ) as rank,
      class_name,
      races,
      wins,
      places_2,
      places_3,
      win_rate,
      quinella_rate,
      place_rate,
      win_payback,
      place_payback,
      avg_popularity,
      avg_rank,
      median_popularity,
      median_rank
    FROM class_data
    ORDER BY
      CASE class_name
        WHEN 'G1' THEN 1
        WHEN 'G2' THEN 2
        WHEN 'G3' THEN 3
        WHEN 'オープン' THEN 4
        WHEN '3勝' THEN 5
        WHEN '2勝' THEN 6
        WHEN '1勝' THEN 7
        WHEN '未勝利' THEN 8
        WHEN '新馬' THEN 9
        ELSE 10
      END
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching class stats: {str(e)}", file=sys.stderr)
        raise


def get_track_condition_stats(client):
    """馬場状態別成績を取得（過去3年間）"""
    query = f"""
    SELECT
      CASE rm.surface
        WHEN 'ダート' THEN 'ダ'
        WHEN '障害' THEN '障'
        ELSE rm.surface
      END as surface,
      rm.track_condition as condition,
      rm.track_condition as condition_label,
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
      ROUND(AVG(rr.popularity), 1) as avg_popularity,
      ROUND(AVG(rr.finish_position), 1) as avg_rank,
      APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
      APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      rr.jockey_id = {JOCKEY_ID}
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      AND rm.track_condition IS NOT NULL
      AND rm.surface IN ('芝', 'ダート', '障害')
    GROUP BY rm.surface, rm.track_condition
    ORDER BY
      CASE rm.surface
        WHEN '芝' THEN 1
        WHEN 'ダート' THEN 2
        WHEN '障害' THEN 3
        ELSE 4
      END,
      CASE rm.track_condition
        WHEN '良' THEN 1
        WHEN '稍' THEN 2
        WHEN '稍重' THEN 2
        WHEN '重' THEN 3
        WHEN '不' THEN 4
        WHEN '不良' THEN 4
        ELSE 5
      END
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching track condition stats: {str(e)}", file=sys.stderr)
        raise


def get_gender_stats(client):
    """性別成績を取得（過去3年間）"""
    query = f"""
    SELECT
      CASE rr.sex
        WHEN 1 THEN '牡馬'
        WHEN 2 THEN '牝馬'
        WHEN 3 THEN 'セン馬'
        ELSE '不明'
      END as name,
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
      ROUND(AVG(rr.popularity), 1) as avg_popularity,
      ROUND(AVG(rr.finish_position), 1) as avg_rank,
      APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
      APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      rr.jockey_id = {JOCKEY_ID}
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      AND rr.sex IS NOT NULL
    GROUP BY rr.sex
    ORDER BY
      CASE rr.sex
        WHEN 1 THEN 1
        WHEN 2 THEN 2
        WHEN 3 THEN 3
        ELSE 4
      END
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching gender stats: {str(e)}", file=sys.stderr)
        raise


def get_racecourse_stats(client):
    """競馬場別成績を取得（過去3年間）"""
    query = f"""
    SELECT
      rm.venue_name as name,
      rm.venue_name as racecourse_ja,
      CASE rm.venue_name
        WHEN '札幌' THEN 'sapporo'
        WHEN '函館' THEN 'hakodate'
        WHEN '福島' THEN 'fukushima'
        WHEN '新潟' THEN 'niigata'
        WHEN '東京' THEN 'tokyo'
        WHEN '中山' THEN 'nakayama'
        WHEN '中京' THEN 'chukyo'
        WHEN '京都' THEN 'kyoto'
        WHEN '阪神' THEN 'hanshin'
        WHEN '小倉' THEN 'kokura'
      END as racecourse_en,
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
      ROUND(AVG(rr.popularity), 1) as avg_popularity,
      ROUND(AVG(rr.finish_position), 1) as avg_rank,
      APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
      APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      rr.jockey_id = {JOCKEY_ID}
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    GROUP BY rm.venue_name
    ORDER BY wins DESC
    """

    try:
        results = client.query(query).result()
        racecourse_data = [dict(row) for row in results]

        # 中央・ローカルの集計行を追加
        central_racecourses = ['東京', '中山', '阪神', '京都']
        local_racecourses = ['札幌', '函館', '福島', '新潟', '中京', '小倉']

        # 中央競馬場の集計
        central_data = [r for r in racecourse_data if r['name'] in central_racecourses]
        if central_data:
            total_races = sum(r['races'] for r in central_data)
            total_wins = sum(r['wins'] for r in central_data)
            total_places_2 = sum(r['places_2'] for r in central_data)
            total_places_3 = sum(r['places_3'] for r in central_data)

            # 中央値は加重平均ではなく、全レースから直接計算
            central_median_query = f"""
            SELECT
              APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
              APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
            FROM
              `{DATASET}.race_master` rm
              JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
            WHERE
              rr.jockey_id = {JOCKEY_ID}
              AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
              AND rm.venue_name IN ('東京', '中山', '阪神', '京都')
            """
            central_median_results = client.query(central_median_query).result()
            central_median_row = dict(list(central_median_results)[0])

            central_summary = {
                'name': '中央',
                'racecourse_ja': '中央',
                'racecourse_en': 'central',
                'races': total_races,
                'wins': total_wins,
                'places_2': total_places_2,
                'places_3': total_places_3,
                'win_rate': round((total_wins / total_races * 100), 1) if total_races > 0 else 0,
                'quinella_rate': round(((total_wins + total_places_2) / total_races * 100), 1) if total_races > 0 else 0,
                'place_rate': round(((total_wins + total_places_2 + total_places_3) / total_races * 100), 1) if total_races > 0 else 0,
                'win_payback': round(sum(r['win_payback'] * r['races'] for r in central_data) / total_races, 1) if total_races > 0 else 0,
                'place_payback': round(sum(r['place_payback'] * r['races'] for r in central_data) / total_races, 1) if total_races > 0 else 0,
                'avg_popularity': round(sum(r['avg_popularity'] * r['races'] for r in central_data) / total_races, 1) if total_races > 0 else None,
                'avg_rank': round(sum(r['avg_rank'] * r['races'] for r in central_data) / total_races, 1) if total_races > 0 else None,
                'median_popularity': central_median_row['median_popularity'],
                'median_rank': central_median_row['median_rank'],
            }
            racecourse_data.append(central_summary)

        # ローカル競馬場の集計
        local_data = [r for r in racecourse_data if r['name'] in local_racecourses]
        if local_data:
            total_races = sum(r['races'] for r in local_data)
            total_wins = sum(r['wins'] for r in local_data)
            total_places_2 = sum(r['places_2'] for r in local_data)
            total_places_3 = sum(r['places_3'] for r in local_data)

            # 中央値は加重平均ではなく、全レースから直接計算
            local_median_query = f"""
            SELECT
              APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
              APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
            FROM
              `{DATASET}.race_master` rm
              JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
            WHERE
              rr.jockey_id = {JOCKEY_ID}
              AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
              AND rm.venue_name IN ('札幌', '函館', '福島', '新潟', '中京', '小倉')
            """
            local_median_results = client.query(local_median_query).result()
            local_median_row = dict(list(local_median_results)[0])

            local_summary = {
                'name': 'ローカル',
                'racecourse_ja': 'ローカル',
                'racecourse_en': 'local',
                'races': total_races,
                'wins': total_wins,
                'places_2': total_places_2,
                'places_3': total_places_3,
                'win_rate': round((total_wins / total_races * 100), 1) if total_races > 0 else 0,
                'quinella_rate': round(((total_wins + total_places_2) / total_races * 100), 1) if total_races > 0 else 0,
                'place_rate': round(((total_wins + total_places_2 + total_places_3) / total_races * 100), 1) if total_races > 0 else 0,
                'win_payback': round(sum(r['win_payback'] * r['races'] for r in local_data) / total_races, 1) if total_races > 0 else 0,
                'place_payback': round(sum(r['place_payback'] * r['races'] for r in local_data) / total_races, 1) if total_races > 0 else 0,
                'avg_popularity': round(sum(r['avg_popularity'] * r['races'] for r in local_data) / total_races, 1) if total_races > 0 else None,
                'avg_rank': round(sum(r['avg_rank'] * r['races'] for r in local_data) / total_races, 1) if total_races > 0 else None,
                'median_popularity': local_median_row['median_popularity'],
                'median_rank': local_median_row['median_rank'],
            }
            racecourse_data.append(local_summary)

        return racecourse_data
    except Exception as e:
        print(f"   ⚠️  Error fetching racecourse stats: {str(e)}", file=sys.stderr)
        raise


def get_owner_stats(client):
    """馬主別成績を取得（過去3年間、Top 50）"""
    query = f"""
    WITH owner_data AS (
      SELECT
        h.owner_name as name,
        COUNT(*) as races,
        SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) as places_2,
        SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) as places_3,
        ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
        ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
        ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
        ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
        ROUND(SAFE_DIVIDE(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
        ROUND(AVG(rr.popularity), 1) as avg_popularity,
        ROUND(AVG(rr.finish_position), 1) as avg_rank,
        APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
        APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
      FROM
        `{DATASET}.race_master` rm
        JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
        JOIN `{DATASET}.horse` h ON CAST(rr.horse_id AS STRING) = CAST(h.horse_id AS STRING)
      WHERE
        rr.jockey_id = {JOCKEY_ID}
        AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
        AND h.owner_name IS NOT NULL
      GROUP BY h.owner_name
    )
    SELECT
      ROW_NUMBER() OVER (ORDER BY wins DESC, places_2 DESC, places_3 DESC, races ASC) as rank,
      name,
      races,
      wins,
      places_2,
      places_3,
      win_rate,
      quinella_rate,
      place_rate,
      win_payback,
      place_payback,
      avg_popularity,
      avg_rank,
      median_popularity,
      median_rank
    FROM owner_data
    ORDER BY wins DESC, places_2 DESC, places_3 DESC, races ASC
    LIMIT 50
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching owner stats: {str(e)}", file=sys.stderr)
        raise


def get_fav1_place_rate(client):
    """1番人気時の複勝率を取得"""
    query = f"""
    SELECT
      COUNT(*) as races,
      SUM(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) as places,
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
    WHERE
      rr.jockey_id = {JOCKEY_ID}
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      AND rr.popularity = 1
    """

    try:
        results = client.query(query).result()
        rows = list(results)
        if not rows or rows[0]['races'] == 0:
            return None
        return dict(rows[0])
    except Exception as e:
        print(f"   ⚠️  Error fetching fav1 place rate: {str(e)}", file=sys.stderr)
        return None


def get_all_jockeys_fav1_stats(client):
    """1番人気が10走以上ある全騎手の統計を取得"""
    query = f"""
    WITH jockey_fav1 AS (
      SELECT
        rr.jockey_id,
        COUNT(*) as races,
        SUM(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) as places,
        ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate
      FROM
        `{DATASET}.race_master` rm
        JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      WHERE
        rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
        AND rr.popularity = 1
      GROUP BY rr.jockey_id
      HAVING races >= 10
    )
    SELECT
      jockey_id,
      races,
      place_rate,
      RANK() OVER (ORDER BY place_rate DESC) as ranking
    FROM jockey_fav1
    ORDER BY place_rate DESC
    """

    try:
        results = client.query(query).result()
        jockeys_data = [dict(row) for row in results]

        # 全体の平均複勝率を計算
        if jockeys_data:
            avg_place_rate = sum(j['place_rate'] for j in jockeys_data) / len(jockeys_data)
        else:
            avg_place_rate = 0

        return {
            'jockeys': jockeys_data,
            'total_jockeys': len(jockeys_data),
            'avg_place_rate': round(avg_place_rate, 1)
        }
    except Exception as e:
        print(f"   ⚠️  Error fetching all jockeys fav1 stats: {str(e)}", file=sys.stderr)
        return None


def calculate_reliability_level(ranking, total_jockeys):
    """信頼度レベルを順位から計算（1〜5）"""
    if ranking is None or total_jockeys is None or total_jockeys == 0:
        return 3  # デフォルトは標準

    # パーセンタイルを計算
    percentile = (ranking / total_jockeys) * 100

    # 5段階評価（上位20%ごと）
    if percentile <= 20:
        return 5  # 高い（上位20%）
    elif percentile <= 40:
        return 4  # やや高い（上位21-40%）
    elif percentile <= 60:
        return 3  # 標準（上位41-60%）
    elif percentile <= 80:
        return 2  # やや低い（上位61-80%）
    else:
        return 1  # 低い（上位81-100%）


def get_characteristics(client):
    """特性データを取得（荒れやすさなど）"""
    # 1番人気時の複勝率を取得
    fav1_data = get_fav1_place_rate(client)
    all_jockeys_data = get_all_jockeys_fav1_stats(client)

    jockey_fav1_place_rate = fav1_data['place_rate'] if fav1_data else 0
    fav1_races = fav1_data['races'] if fav1_data else 0

    # この騎手のランキングを探す
    ranking = None
    total_jockeys = 0
    avg_place_rate = 0

    if all_jockeys_data:
        total_jockeys = all_jockeys_data['total_jockeys']
        avg_place_rate = all_jockeys_data['avg_place_rate']

        for jockey in all_jockeys_data['jockeys']:
            if jockey['jockey_id'] == JOCKEY_ID:
                ranking = jockey['ranking']
                break

    # 信頼度レベルを計算
    volatility = calculate_reliability_level(ranking, total_jockeys)

    return {
        'volatility': volatility,
        'fav1_place_rate': jockey_fav1_place_rate,
        'all_fav1_place_rate': avg_place_rate,
        'fav1_races': fav1_races,
        'fav1_ranking': ranking if ranking else 0,
        'total_jockeys': total_jockeys,
        'gate_position': 3,
        'running_style_trend_position': 3,
        'distance_trend_position': 3
    }


def process_jockey(bq_client, storage_client, jockey_id, jockey_name):
    """1人の騎手のデータを処理してGCSにアップロード"""
    global JOCKEY_ID
    JOCKEY_ID = jockey_id

    print(f"\n{'='*60}")
    print(f"📊 Processing: {jockey_name} (ID: {jockey_id})")
    print(f"{'='*60}")

    try:
        # 各種データを取得
        print("  [1/17] Fetching basic info...")
        basic_info = get_jockey_basic_info(bq_client)
        if not basic_info:
            print(f"  ⚠️  Jockey not found: {jockey_id}")
            return False

        print("  [2/17] Fetching total stats...")
        total_stats = get_total_stats(bq_client)

        print("  [3/17] Fetching yearly stats...")
        yearly_stats = get_yearly_stats(bq_client)

        print("  [4/17] Fetching yearly leading...")
        yearly_leading = get_yearly_leading(bq_client)

        print("  [5/17] Fetching distance stats...")
        distance_stats = get_distance_stats(bq_client)

        print("  [6/17] Fetching surface stats...")
        surface_stats = get_surface_stats(bq_client)

        print("  [7/17] Fetching popularity stats...")
        popularity_stats = get_popularity_stats(bq_client)

        print("  [8/17] Fetching running style stats...")
        running_style_stats = get_running_style_stats(bq_client)

        print("  [9/17] Fetching gate stats...")
        gate_stats = get_gate_stats(bq_client)

        print("  [10/17] Fetching course stats...")
        course_stats = get_course_stats(bq_client)

        print("  [11/17] Fetching trainer stats...")
        trainer_stats = get_trainer_stats(bq_client)

        print("  [12/17] Fetching class stats...")
        class_stats = get_class_stats(bq_client)

        print("  [13/17] Fetching track condition stats...")
        track_condition_stats = get_track_condition_stats(bq_client)

        print("  [14/17] Fetching gender stats...")
        gender_stats = get_gender_stats(bq_client)

        print("  [15/17] Fetching racecourse stats...")
        racecourse_stats = get_racecourse_stats(bq_client)

        print("  [16/17] Fetching owner stats...")
        owner_stats = get_owner_stats(bq_client)

        print("  [17/17] Calculating characteristics...")
        characteristics = get_characteristics(bq_client)

        # 傾向計算を追加
        # 1. 芝・ダート傾向
        surface_trend_position = 3  # デフォルト: 互角
        turf_stat = next((s for s in surface_stats if s['surface'] == '芝'), None)
        dirt_stat = next((s for s in surface_stats if s['surface'] == 'ダート'), None)
        if turf_stat and dirt_stat:
            diff = turf_stat['place_rate'] - dirt_stat['place_rate']
            if diff >= 5:
                surface_trend_position = 5  # 芝が得意
            elif diff >= 2:
                surface_trend_position = 4  # やや芝が得意
            elif diff <= -5:
                surface_trend_position = 1  # ダートが得意
            elif diff <= -2:
                surface_trend_position = 2  # ややダートが得意

        # 2. 脚質傾向
        running_style_trend_position = 3  # デフォルト: 互角
        front_runners = [s for s in running_style_stats if s['style'] in ['escape', 'lead']]
        closers = [s for s in running_style_stats if s['style'] in ['pursue', 'close']]
        if front_runners and closers:
            front_total_races = sum(s['races'] for s in front_runners)
            front_weighted_place_rate = sum(s['place_rate'] * s['races'] for s in front_runners) / front_total_races if front_total_races > 0 else 0
            closer_total_races = sum(s['races'] for s in closers)
            closer_weighted_place_rate = sum(s['place_rate'] * s['races'] for s in closers) / closer_total_races if closer_total_races > 0 else 0
            diff = front_weighted_place_rate - closer_weighted_place_rate
            if diff >= 5:
                running_style_trend_position = 1  # 逃げ・先行が得意
            elif diff >= 2:
                running_style_trend_position = 2  # やや逃げ・先行が得意
            elif diff <= -5:
                running_style_trend_position = 5  # 差し・追込が得意
            elif diff <= -2:
                running_style_trend_position = 4  # やや差し・追込が得意

        # 3. 距離傾向
        distance_trend_position = 3  # デフォルト: 互角
        short_distances = [d for d in distance_stats if d['category'] in ['短距離', 'マイル']]
        long_distances = [d for d in distance_stats if d['category'] in ['中距離', '中長距離', '長距離']]
        if short_distances and long_distances:
            short_total_races = sum(d['races'] for d in short_distances)
            short_weighted_place_rate = sum(d['place_rate'] * d['races'] for d in short_distances) / short_total_races if short_total_races > 0 else 0
            long_total_races = sum(d['races'] for d in long_distances)
            long_weighted_place_rate = sum(d['place_rate'] * d['races'] for d in long_distances) / long_total_races if long_total_races > 0 else 0
            diff = short_weighted_place_rate - long_weighted_place_rate
            if diff >= 5:
                distance_trend_position = 1  # 短距離が得意
            elif diff >= 2:
                distance_trend_position = 2  # やや短距離が得意
            elif diff <= -5:
                distance_trend_position = 5  # 長距離が得意
            elif diff <= -2:
                distance_trend_position = 4  # やや長距離が得意

        # characteristicsに傾向を追加
        if characteristics is None:
            characteristics = {}
        characteristics['surface_trend_position'] = surface_trend_position
        characteristics['running_style_trend_position'] = running_style_trend_position
        characteristics['distance_trend_position'] = distance_trend_position

        # データ期間と更新日を設定
        today = datetime.combine(as_of_date(), datetime.min.time())  # SITE_AS_OF で固定可
        yesterday = datetime(today.year, today.month, today.day - 1) if today.day > 1 else datetime(today.year, today.month - 1, 28)
        three_years_ago = datetime(yesterday.year - 3, yesterday.month, yesterday.day)

        data_period = f"直近3年間分（{three_years_ago.year}年{three_years_ago.month}月{three_years_ago.day}日〜{yesterday.year}年{yesterday.month}月{yesterday.day}日）"
        last_updated = f"{today.year}年{today.month}月{today.day}日"

        # popularity_stats を配列からオブジェクト形式に変換
        popularity_dict = {}
        for item in popularity_stats:
            key = item.get('popularity_group')
            if key:
                popularity_dict[key] = item

        # JSONデータを構築
        jockey_data = {
            'id': str(jockey_id).zfill(5),
            'name': basic_info['name'],
            'kana': basic_info['kana'] or '',
            'affiliation': basic_info['affiliation'] or '',
            'debut_year': basic_info['debut_year'],
            'data_period': data_period,
            'last_updated': last_updated,
            'total_races': total_stats['races'] if total_stats else 0,
            'total_stats': total_stats or {},
            'yearly_leading': yearly_leading or [],
            'yearly_stats': yearly_stats or [],
            'distance_stats': distance_stats or [],
            'surface_stats': surface_stats or [],
            'popularity_stats': popularity_dict,
            'running_style_stats': running_style_stats or [],
            'gate_stats': gate_stats or [],
            'course_stats': course_stats or [],
            'trainer_stats': trainer_stats or [],
            'class_stats': class_stats or [],
            'track_condition_stats': track_condition_stats or [],
            'gender_stats': gender_stats or [],
            'racecourse_stats': racecourse_stats or [],
            'owner_stats': owner_stats or [],
            'characteristics': characteristics
        }

        # GCSにアップロード
        blob_path = f'jockey/{str(jockey_id).zfill(5)}.json'
        save_json(blob_path, jockey_data)

        print(f"  ✅ {jockey_name} saved to {blob_path}")
        return True

    except Exception as e:
        print(f"  ❌ Error processing {jockey_name}: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False


def main():
    """メイン処理"""
    import argparse

    parser = argparse.ArgumentParser(description='Export jockey data from BigQuery to GCS')
    parser.add_argument('--test', action='store_true', help='Test mode: process only 武豊 (ID: 666)')
    parser.add_argument('--jockey-id', type=int, help='Process a specific jockey by ID')
    args = parser.parse_args()

    try:
        # BigQueryとGCS クライアント
        bq_client = LocalClient()
        storage_client = None

        if args.test:
            # テストモード: 武豊のみ
            print(f"🚀 Starting jockey data export (TEST MODE)")
            print(f"   Processing single jockey: 武豊 (ID: 666)")
            success = process_jockey(bq_client, storage_client, 666, "武豊")

            print(f"\n{'='*60}")
            if success:
                print(f"✅ Test processing complete!")
            else:
                print(f"❌ Test processing failed!")
            print(f"{'='*60}")

        elif args.jockey_id:
            # 特定の騎手のみ処理
            print(f"🚀 Starting jockey data export (SINGLE JOCKEY MODE)")
            print(f"   Processing jockey ID: {args.jockey_id}")
            success = process_jockey(bq_client, storage_client, args.jockey_id, f"ID:{args.jockey_id}")

            print(f"\n{'='*60}")
            if success:
                print(f"✅ Processing complete!")
            else:
                print(f"❌ Processing failed!")
            print(f"{'='*60}")

        else:
            # 全騎手処理
            print(f"🚀 Starting jockey data export (FULL MODE)")
            print(f"   Fetching all active jockeys from BigQuery...")

            # 現役中央騎手で過去3年間に30レース以上出走している騎手を取得
            query = f"""
            SELECT DISTINCT
              j.jockey_id as id,
              j.jockey_name as name,
              COUNT(*) as recent_races
            FROM `{DATASET}.jockey` j
            JOIN `{DATASET}.race_result` rr ON j.jockey_id = rr.jockey_id
            JOIN `{DATASET}.race_master` rm ON rr.race_id = rm.race_id
            WHERE rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
              AND j.is_active = true
              AND j.region <> '地方'
              AND j.jockey_id IS NOT NULL
              AND j.jockey_name IS NOT NULL
            GROUP BY j.jockey_id, j.jockey_name
            HAVING recent_races >= 30
            ORDER BY recent_races DESC
            """

            from generate_lists import read_ts
            import os
            jockeys = [(e['id'], e['name']) for e in read_ts(os.path.join(OUT_DIR, 'lib', 'jockeys.ts'))]  # 一覧 (generate_lists.py) と同じ集合を生成する
            if not jockeys:
                raise SystemExit('out/lib/jockeys.ts がありません。先に generate_lists.py を実行してください')

            print(f"   Found {len(jockeys)} active jockeys")
            print(f"\n{'='*60}")

            success_count = 0
            fail_count = 0

            for i, (jockey_id, jockey_name) in enumerate(jockeys, 1):
                print(f"\n[{i}/{len(jockeys)}] Processing: {jockey_name} (ID: {jockey_id})")

                try:
                    if process_jockey(bq_client, storage_client, jockey_id, jockey_name):
                        success_count += 1
                    else:
                        fail_count += 1
                except Exception as e:
                    print(f"  ❌ Error: {str(e)}")
                    fail_count += 1

            print(f"\n{'='*60}")
            print(f"✅ Processing complete!")
            print(f"   Success: {success_count}/{len(jockeys)}")
            print(f"   Failed:  {fail_count}/{len(jockeys)}")
            print(f"{'='*60}")

    except Exception as e:
        print(f"❌ Fatal error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
