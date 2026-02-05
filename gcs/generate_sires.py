#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
種牡馬データを BigQuery から取得して GCS に保存
"""

from google.cloud import bigquery, storage
import json
import sys
from datetime import datetime

# 設定
PROJECT_ID = 'umadata'
BUCKET_NAME = 'umadata'
DATASET = 'umadata.keiba_data'

# グローバル変数として現在処理中の種牡馬情報を保持
SIRE_NAME = None

def get_sire_basic_info(client):
    """種牡馬の基本情報を取得"""
    # 種牡馬を父に持つ馬の数を取得
    query = f"""
    SELECT
      '{SIRE_NAME}' as name,
      '{SIRE_NAME}' as name_en,
      COUNT(DISTINCT h.horse_id) as total_horses
    FROM
      `{DATASET}.horse` h
    WHERE
      h.father = '{SIRE_NAME}'
    """

    try:
        results = client.query(query).result()
        rows = list(results)
        if not rows:
            return None

        basic_info = dict(rows[0])
        # 仮の生年を設定（実際のデータがない場合）
        basic_info['birth_year'] = 2002  # ディープインパクトの生年
        return basic_info
    except Exception as e:
        print(f"   ⚠️  Error fetching sire basic info: {str(e)}", file=sys.stderr)
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
      ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(AVG(rr.popularity), 1) as avg_popularity,
      ROUND(AVG(rr.finish_position), 1) as avg_rank,
      APPROX_QUANTILES(rr.popularity, 100)[OFFSET(50)] as median_popularity,
      APPROX_QUANTILES(rr.finish_position, 100)[OFFSET(50)] as median_rank
    FROM
      `{DATASET}.race_master` rm
      JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
      JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
    WHERE
      h.father = '{SIRE_NAME}'
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
      JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
    WHERE
      h.father = '{SIRE_NAME}'
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
        h.father,
        SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins
      FROM
        `{DATASET}.race_master` rm
        JOIN `{DATASET}.race_result` rr ON rm.race_id = rr.race_id
        JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
      WHERE
        rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
        AND h.father IS NOT NULL
      GROUP BY year, h.father
    ),
    ranked AS (
      SELECT
        year,
        father,
        wins,
        RANK() OVER (PARTITION BY year ORDER BY wins DESC) as ranking
      FROM yearly_wins
    )
    SELECT
      year,
      wins,
      ranking
    FROM ranked
    WHERE father = '{SIRE_NAME}'
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
    - 長距離: 2101m以上
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
      JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
    WHERE
      h.father = '{SIRE_NAME}'
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
    """芝・ダート別成績を取得（過去3年間）"""
    query = f"""
    SELECT
      CASE
        WHEN rm.surface = '芝' THEN '芝'
        WHEN rm.surface = 'ダート' THEN 'ダート'
        WHEN rm.surface = '障害' THEN '障害'
        ELSE rm.surface
      END as surface,
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
      JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
    WHERE
      h.father = '{SIRE_NAME}'
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    GROUP BY surface
    ORDER BY
      CASE surface
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


def get_running_style_stats(client):
    """脚質別成績を取得（過去3年間）"""
    query = f"""
    WITH all_horses AS (
      SELECT
        rm.race_id,
        rr.horse_id,
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
    sire_horses AS (
      SELECT
        ah.race_id,
        ah.horse_id,
        ah.finish_position,
        ah.popularity,
        ah.win,
        ah.place,
        ah.entry_count,
        ah.last_3f_time,
        ah.last_3f_rank,
        ah.corner_array
      FROM
        all_horses ah
        JOIN `{DATASET}.horse` h ON ah.horse_id = h.horse_id
      WHERE
        h.father = '{SIRE_NAME}'
        AND ah.corner_array IS NOT NULL
        AND ARRAY_LENGTH(ah.corner_array) > 0
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
        sire_horses
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
    # 枠番の色定義（騎手/コースページと同じ）
    gate_colors = {
        1: '#FFFFFF',
        2: '#222222',
        3: '#C62927',
        4: '#2573CD',
        5: '#E4CA3C',
        6: '#58AF4A',
        7: '#FAA727',
        8: '#DC6179',
    }

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
      JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
    WHERE
      h.father = '{SIRE_NAME}'
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      AND rr.bracket_number BETWEEN 1 AND 8
    GROUP BY rr.bracket_number
    ORDER BY rr.bracket_number
    """

    try:
        results = client.query(query).result()
        gate_stats = []
        for row in results:
            row_dict = dict(row)
            row_dict['color'] = gate_colors.get(row_dict['gate'], '#CCCCCC')
            gate_stats.append(row_dict)
        return gate_stats
    except Exception as e:
        print(f"   ⚠️  Error fetching gate stats: {str(e)}", file=sys.stderr)
        raise


def get_track_condition_stats(client):
    """馬場状態別成績を取得（過去3年間）"""
    query = f"""
    SELECT
      rm.surface,
      CASE rm.track_condition
        WHEN '良' THEN 'good'
        WHEN '稍重' THEN 'yielding'
        WHEN '稍' THEN 'yielding'
        WHEN '重' THEN 'soft'
        WHEN '不良' THEN 'heavy'
        WHEN '不' THEN 'heavy'
        ELSE rm.track_condition
      END as condition,
      CASE rm.track_condition
        WHEN '稍重' THEN '稍重'
        WHEN '稍' THEN '稍重'
        WHEN '不良' THEN '不良'
        WHEN '不' THEN '不良'
        ELSE rm.track_condition
      END as condition_label,
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
      JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
    WHERE
      h.father = '{SIRE_NAME}'
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      AND rm.track_condition IS NOT NULL
    GROUP BY surface, condition, condition_label
    ORDER BY
      surface,
      CASE condition
        WHEN 'good' THEN 1
        WHEN 'yielding' THEN 2
        WHEN 'soft' THEN 3
        WHEN 'heavy' THEN 4
      END
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching track condition stats: {str(e)}", file=sys.stderr)
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
        JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
      WHERE
        h.father = '{SIRE_NAME}'
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
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching class stats: {str(e)}", file=sys.stderr)
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
      JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
    WHERE
      h.father = '{SIRE_NAME}'
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


def get_age_stats(client):
    """馬齢別成績を取得（過去3年間）"""
    query = f"""
    SELECT
      CONCAT(CAST(rr.age AS STRING), '歳') as age,
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
      JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
    WHERE
      h.father = '{SIRE_NAME}'
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      AND rr.age BETWEEN 2 AND 5
    GROUP BY age
    ORDER BY age
    """

    try:
        results = client.query(query).result()
        age_stats = [dict(row) for row in results]

        # 6歳以上をまとめて追加
        query_6plus = f"""
        SELECT
          '6歳-' as age,
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
          JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
        WHERE
          h.father = '{SIRE_NAME}'
          AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
          AND rr.age >= 6
        """

        results_6plus = client.query(query_6plus).result()
        for row in results_6plus:
            age_stats.append(dict(row))

        return age_stats
    except Exception as e:
        print(f"   ⚠️  Error fetching age stats: {str(e)}", file=sys.stderr)
        raise


def get_horse_weight_stats(client):
    """馬体重別成績を取得（過去3年間）"""
    query = f"""
    SELECT
      CASE
        WHEN rr.horse_weight <= 400 THEN '400kg以下'
        WHEN rr.horse_weight BETWEEN 401 AND 420 THEN '401-420kg'
        WHEN rr.horse_weight BETWEEN 421 AND 440 THEN '421-440kg'
        WHEN rr.horse_weight BETWEEN 441 AND 460 THEN '441-460kg'
        WHEN rr.horse_weight BETWEEN 461 AND 480 THEN '461-480kg'
        WHEN rr.horse_weight BETWEEN 481 AND 500 THEN '481-500kg'
        WHEN rr.horse_weight BETWEEN 501 AND 520 THEN '501-520kg'
        WHEN rr.horse_weight BETWEEN 521 AND 540 THEN '521-540kg'
        WHEN rr.horse_weight >= 541 THEN '541kg以上'
      END as weight_category,
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
      JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
    WHERE
      h.father = '{SIRE_NAME}'
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      AND rr.horse_weight IS NOT NULL
      AND rr.horse_weight > 0
    GROUP BY weight_category
    ORDER BY
      CASE weight_category
        WHEN '400kg以下' THEN 1
        WHEN '401-420kg' THEN 2
        WHEN '421-440kg' THEN 3
        WHEN '441-460kg' THEN 4
        WHEN '461-480kg' THEN 5
        WHEN '481-500kg' THEN 6
        WHEN '501-520kg' THEN 7
        WHEN '521-540kg' THEN 8
        WHEN '541kg以上' THEN 9
      END
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching horse weight stats: {str(e)}", file=sys.stderr)
        raise


def get_dam_sire_stats(client):
    """母父別成績を取得（過去3年間、上位50頭）"""
    query = f"""
    SELECT
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank,
      h.mf as name,
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
      JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
    WHERE
      h.father = '{SIRE_NAME}'
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      AND h.mf IS NOT NULL
    GROUP BY name
    ORDER BY races DESC
    LIMIT 50
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching dam sire stats: {str(e)}", file=sys.stderr)
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
      JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
    WHERE
      h.father = '{SIRE_NAME}'
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    GROUP BY rm.venue_name
    ORDER BY wins DESC
    """

    try:
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching racecourse stats: {str(e)}", file=sys.stderr)
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
        JOIN `{DATASET}.horse` h ON rr.horse_id = h.horse_id
      WHERE
        h.father = '{SIRE_NAME}'
        AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      GROUP BY
        rm.venue_name,
        rm.surface,
        rm.distance,
        rm.track_variant
    )
    SELECT
      ROW_NUMBER() OVER (ORDER BY wins DESC, win_rate DESC) as rank,
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
        WHEN '障害' THEN 'jump'
      END as surface_en,
      distance,
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
        return [dict(row) for row in results]
    except Exception as e:
        print(f"   ⚠️  Error fetching course stats: {str(e)}", file=sys.stderr)
        raise


def get_surface_change_stats(client):
    """芝・ダート変わりの成績を取得（過去3年間）"""
    # ダート変わり：芝デビュー後、初めてダートを走った際の成績
    turf_to_dirt_query = f"""
    WITH debut_surface AS (
      -- 各馬の初出走時の芝質を特定
      SELECT
        h.horse_id,
        h.horse_name,
        rm.surface as debut_surface,
        rm.race_date as debut_date
      FROM
        `{DATASET}.horse` h
        JOIN `{DATASET}.race_result` rr ON h.horse_id = rr.horse_id
        JOIN `{DATASET}.race_master` rm ON rr.race_id = rm.race_id
      WHERE
        h.father = '{SIRE_NAME}'
      QUALIFY ROW_NUMBER() OVER (PARTITION BY h.horse_id ORDER BY rm.race_date ASC) = 1
    ),
    first_dirt_race AS (
      -- 芝デビューした馬が初めてダートを走ったレースを特定
      SELECT
        ds.horse_id,
        ds.horse_name,
        rr.race_id,
        rr.finish_position,
        rr.popularity,
        rr.win,
        rr.place,
        rm.race_date
      FROM
        debut_surface ds
        JOIN `{DATASET}.race_result` rr ON ds.horse_id = rr.horse_id
        JOIN `{DATASET}.race_master` rm ON rr.race_id = rm.race_id
      WHERE
        ds.debut_surface = '芝'
        AND rm.surface = 'ダート'
        AND rm.race_date > ds.debut_date
        AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      QUALIFY ROW_NUMBER() OVER (PARTITION BY ds.horse_id ORDER BY rm.race_date ASC) = 1
    )
    SELECT
      COUNT(DISTINCT horse_id) as total_horses,
      COUNT(*) as races,
      SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN finish_position = 1 THEN win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN finish_position <= 3 THEN place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
      ROUND(AVG(popularity), 1) as avg_popularity,
      ROUND(AVG(finish_position), 1) as avg_rank,
      APPROX_QUANTILES(popularity, 100)[OFFSET(50)] as median_popularity,
      APPROX_QUANTILES(finish_position, 100)[OFFSET(50)] as median_rank
    FROM first_dirt_race
    """

    # 芝変わり：ダートデビュー後、初めて芝を走った際の成績
    dirt_to_turf_query = f"""
    WITH debut_surface AS (
      -- 各馬の初出走時の芝質を特定
      SELECT
        h.horse_id,
        h.horse_name,
        rm.surface as debut_surface,
        rm.race_date as debut_date
      FROM
        `{DATASET}.horse` h
        JOIN `{DATASET}.race_result` rr ON h.horse_id = rr.horse_id
        JOIN `{DATASET}.race_master` rm ON rr.race_id = rm.race_id
      WHERE
        h.father = '{SIRE_NAME}'
      QUALIFY ROW_NUMBER() OVER (PARTITION BY h.horse_id ORDER BY rm.race_date ASC) = 1
    ),
    first_turf_race AS (
      -- ダートデビューした馬が初めて芝を走ったレースを特定
      SELECT
        ds.horse_id,
        ds.horse_name,
        rr.race_id,
        rr.finish_position,
        rr.popularity,
        rr.win,
        rr.place,
        rm.race_date
      FROM
        debut_surface ds
        JOIN `{DATASET}.race_result` rr ON ds.horse_id = rr.horse_id
        JOIN `{DATASET}.race_master` rm ON rr.race_id = rm.race_id
      WHERE
        ds.debut_surface = 'ダート'
        AND rm.surface = '芝'
        AND rm.race_date > ds.debut_date
        AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      QUALIFY ROW_NUMBER() OVER (PARTITION BY ds.horse_id ORDER BY rm.race_date ASC) = 1
    )
    SELECT
      COUNT(DISTINCT horse_id) as total_horses,
      COUNT(*) as races,
      SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN finish_position = 2 THEN 1 ELSE 0 END) as places_2,
      SUM(CASE WHEN finish_position = 3 THEN 1 ELSE 0 END) as places_3,
      ROUND(AVG(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) as win_rate,
      ROUND(AVG(CASE WHEN finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) as quinella_rate,
      ROUND(AVG(CASE WHEN finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) as place_rate,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN finish_position = 1 THEN win ELSE 0 END), COUNT(*) * 100) * 100, 1) as win_payback,
      ROUND(SAFE_DIVIDE(SUM(CASE WHEN finish_position <= 3 THEN place ELSE 0 END), COUNT(*) * 100) * 100, 1) as place_payback,
      ROUND(AVG(popularity), 1) as avg_popularity,
      ROUND(AVG(finish_position), 1) as avg_rank,
      APPROX_QUANTILES(popularity, 100)[OFFSET(50)] as median_popularity,
      APPROX_QUANTILES(finish_position, 100)[OFFSET(50)] as median_rank
    FROM first_turf_race
    """

    try:
        # ダート変わりデータ取得
        turf_to_dirt_results = client.query(turf_to_dirt_query).result()
        turf_to_dirt_data = dict(list(turf_to_dirt_results)[0]) if turf_to_dirt_results else {}

        # 芝変わりデータ取得
        dirt_to_turf_results = client.query(dirt_to_turf_query).result()
        dirt_to_turf_data = dict(list(dirt_to_turf_results)[0]) if dirt_to_turf_results else {}

        return {
            "turf_to_dirt": turf_to_dirt_data,
            "dirt_to_turf": dirt_to_turf_data
        }
    except Exception as e:
        print(f"   ⚠️  Error fetching surface change stats: {str(e)}", file=sys.stderr)
        # エラーが発生した場合は空のデータを返す
        return {
            "turf_to_dirt": {},
            "dirt_to_turf": {}
        }


def process_sire(bq_client, storage_client, sire_id, sire_name):
    """1頭の種牡馬のデータを処理してGCSにアップロード"""
    global SIRE_NAME
    SIRE_NAME = sire_name

    print(f"\n{'='*60}")
    print(f"🏇 Processing: {sire_name} (ID: {sire_id})")
    print(f"{'='*60}")

    try:
        # 基本情報取得
        print("  [1/18] Fetching basic info...")
        basic_info = get_sire_basic_info(bq_client)
        if not basic_info:
            print(f"  ⚠️  Sire not found: {sire_name}")
            return False

        # 総合成績取得
        print("  [2/18] Fetching total stats...")
        total_stats = get_total_stats(bq_client)

        # 年度別成績取得
        print("  [3/18] Fetching yearly stats...")
        yearly_stats = get_yearly_stats(bq_client)

        print("  [4/18] Fetching yearly leading...")
        yearly_leading = get_yearly_leading(bq_client)

        # 距離別成績取得
        print("  [5/18] Fetching distance stats...")
        distance_stats = get_distance_stats(bq_client)

        # 芝・ダート別成績取得
        print("  [6/18] Fetching surface stats...")
        surface_stats = get_surface_stats(bq_client)

        # 脚質別成績取得
        print("  [7/18] Fetching running style stats...")
        running_style_stats = get_running_style_stats(bq_client)

        # 枠順別成績取得
        print("  [8/18] Fetching gate stats...")
        gate_stats = get_gate_stats(bq_client)

        # 馬場状態別成績取得
        print("  [9/18] Fetching track condition stats...")
        track_condition_stats = get_track_condition_stats(bq_client)

        # クラス別成績取得
        print("  [10/18] Fetching class stats...")
        class_stats = get_class_stats(bq_client)

        # 性別成績取得
        print("  [11/18] Fetching gender stats...")
        gender_stats = get_gender_stats(bq_client)

        # 馬齢別成績取得
        print("  [12/18] Fetching age stats...")
        age_stats = get_age_stats(bq_client)

        # 馬体重別成績取得
        print("  [13/18] Fetching horse weight stats...")
        horse_weight_stats = get_horse_weight_stats(bq_client)

        # 母父別成績取得
        print("  [14/18] Fetching dam sire stats...")
        dam_sire_stats = get_dam_sire_stats(bq_client)

        # 競馬場別成績取得
        print("  [15/18] Fetching racecourse stats...")
        racecourse_stats = get_racecourse_stats(bq_client)

        # コース別成績取得
        print("  [16/18] Fetching course stats...")
        course_stats = get_course_stats(bq_client)

        # 芝・ダート変わりデータ取得
        print("  [17/18] Fetching surface change stats...")
        surface_change_stats = get_surface_change_stats(bq_client)

        # データ期間の計算
        from datetime import timedelta
        today = datetime.now()
        yesterday = today - timedelta(days=1)
        three_years_ago = today - timedelta(days=3*365)
        data_period = f"直近3年間分（{three_years_ago.year}年{three_years_ago.month}月{three_years_ago.day}日〜{yesterday.year}年{yesterday.month}月{yesterday.day}日）"
        last_updated = f"{today.year}年{today.month}月{today.day}日"

        # JSONデータ構築
        sire_data = {
            "id": str(sire_id).zfill(5),  # 5桁ゼロパディングのID
            "name": sire_name,
            "name_en": basic_info.get('name_en', sire_name),
            "birth_year": basic_info.get('birth_year'),
            "total_stats": total_stats,
            "data_period": data_period,
            "last_updated": last_updated,
            "total_races": total_stats.get('races', 0),
            "yearly_leading": yearly_leading,
            "yearly_stats": yearly_stats,
            "distance_stats": distance_stats,
            "surface_stats": surface_stats,
            "running_style_stats": running_style_stats,
            "gate_stats": gate_stats,
            "track_condition_stats": track_condition_stats,
            "class_stats": class_stats,
            "gender_stats": gender_stats,
            "age_stats": age_stats,
            "horse_weight_stats": horse_weight_stats,
            "dam_sire_stats": dam_sire_stats,
            "racecourse_stats": racecourse_stats,
            "course_stats": course_stats,
            "surface_change_stats": surface_change_stats,
            "characteristics": {
                "volatility": 2,
                "trifecta_avg_payback_rank": 35,
                "total_courses": 120,
                "trifecta_median_payback": 58.3,
                "trifecta_all_median_payback": 58.3,
                "gate_position": 0,
                "distance_trend": 1,
            },
        }

        # GCSにアップロード
        print("  [18/18] Uploading to GCS...")
        bucket = storage_client.bucket(BUCKET_NAME)

        # ID番号を5桁のゼロパディング形式に変換（調教師・騎手と同じ形式）
        padded_id = str(sire_id).zfill(5)
        blob_path = f"sires/{padded_id}.json"
        blob = bucket.blob(blob_path)

        blob.upload_from_string(
            json.dumps(sire_data, ensure_ascii=False, indent=2),
            content_type='application/json'
        )

        print(f"  ✅ {sire_name} (ID: {sire_id}) uploaded to {blob_path}")
        return True

    except Exception as e:
        print(f"  ❌ Error processing {sire_name}: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False


def get_sire_list(client):
    """過去3年間に産駒が出走している種牡馬リストを取得"""
    query = f"""
    WITH recent_races AS (
      SELECT race_id
      FROM `{DATASET}.race_master`
      WHERE race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    ),
    sire_stats AS (
      SELECT
        h.father as name,
        rr.race_id,
        h.horse_id
      FROM `{DATASET}.race_result` rr
      JOIN `{DATASET}.horse` h ON h.horse_id = rr.horse_id
      WHERE
        rr.race_id IN (SELECT race_id FROM recent_races)
        AND h.father IS NOT NULL
        AND h.father != ''
    )
    SELECT
      name,
      COUNT(DISTINCT race_id) as race_count,
      COUNT(DISTINCT horse_id) as horse_count
    FROM sire_stats
    GROUP BY name
    HAVING
      COUNT(DISTINCT race_id) >= 50
      AND COUNT(DISTINCT horse_id) >= 10
    ORDER BY race_count DESC
    LIMIT 300
    """

    try:
        results = client.query(query).result()
        sires = []
        for row in results:
            sires.append({
                'name': row['name'],
                'race_count': row['race_count'],
                'horse_count': row['horse_count']
            })
        return sires
    except Exception as e:
        print(f"❌ Error fetching sire list: {str(e)}", file=sys.stderr)
        return []


def main():
    """メイン処理"""
    import argparse

    parser = argparse.ArgumentParser(description='Export sire data from BigQuery to GCS')
    parser.add_argument('--sire-id', type=int, help='Process a specific sire by ID')
    parser.add_argument('--sire-name', type=str, help='Process a specific sire by name')
    parser.add_argument('--test', action='store_true', help='Test mode: process only ディープインパクト')
    args = parser.parse_args()

    # lib/sires.tsからIDマッピングをロード
    import os
    sire_mapping = {}
    sires_ts_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'sires.ts')
    if os.path.exists(sires_ts_path):
        with open(sires_ts_path, 'r', encoding='utf-8') as f:
            content = f.read()
            import re
            # { id: 1, name: 'ロードカナロア' } のようなパターンをマッチ
            pattern = r"\{\s*id:\s*(\d+),\s*name:\s*'([^']+)'\s*\}"
            for match in re.finditer(pattern, content):
                sire_id = int(match.group(1))
                sire_name = match.group(2)
                sire_mapping[sire_id] = sire_name
                sire_mapping[sire_name] = sire_id

    try:
        # BigQueryとGCS クライアント
        bq_client = bigquery.Client(project=PROJECT_ID)
        storage_client = storage.Client(project=PROJECT_ID)

        if args.test:
            # テストモード: ディープインパクトのみ
            print(f"🚀 Starting sire data export (TEST MODE)")
            print(f"   Processing single sire: ディープインパクト")
            sire_name = "ディープインパクト"
            sire_id = sire_mapping.get(sire_name, 36)  # ディープインパクトはID=36
            success = process_sire(bq_client, storage_client, sire_id, sire_name)

            print(f"\n{'='*60}")
            if success:
                print(f"✅ Test processing complete!")
            else:
                print(f"❌ Test processing failed!")
            print(f"{'='*60}")
            sys.exit(0 if success else 1)

        elif args.sire_id:
            # 特定の種牡馬のみ処理（IDで指定）
            sire_id = args.sire_id
            sire_name = sire_mapping.get(sire_id)
            if not sire_name:
                print(f"❌ Sire ID {sire_id} not found in sires.ts")
                sys.exit(1)
            print(f"🚀 Starting sire data export (SINGLE SIRE MODE)")
            print(f"   Processing sire: {sire_name} (ID: {sire_id})")
            success = process_sire(bq_client, storage_client, sire_id, sire_name)

            print(f"\n{'='*60}")
            if success:
                print(f"✅ Processing complete!")
            else:
                print(f"❌ Processing failed!")
            print(f"{'='*60}")
            sys.exit(0 if success else 1)

        elif args.sire_name:
            # 特定の種牡馬のみ処理（名前で指定）
            sire_name = args.sire_name
            sire_id = sire_mapping.get(sire_name)
            if not sire_id:
                print(f"❌ Sire name '{sire_name}' not found in sires.ts")
                sys.exit(1)
            print(f"🚀 Starting sire data export (SINGLE SIRE MODE)")
            print(f"   Processing sire: {sire_name} (ID: {sire_id})")
            success = process_sire(bq_client, storage_client, sire_id, sire_name)

            print(f"\n{'='*60}")
            if success:
                print(f"✅ Processing complete!")
            else:
                print(f"❌ Processing failed!")
            print(f"{'='*60}")
            sys.exit(0 if success else 1)

        else:
            # 全種牡馬処理
            print(f"🚀 Starting sire data export (FULL MODE)")
            print(f"   Fetching all eligible sires from BigQuery...")

            sires = get_sire_list(bq_client)

            if not sires:
                print("❌ No sires found")
                sys.exit(1)

            print(f"   Found {len(sires)} eligible sires")
            print(f"\n{'='*60}")

            success_count = 0
            fail_count = 0

            for i, sire_info in enumerate(sires, 1):
                sire_name = sire_info['name']
                sire_id = sire_mapping.get(sire_name)
                if not sire_id:
                    print(f"\n[{i}/{len(sires)}] ⚠️  Skipping {sire_name} (not found in sires.ts)")
                    fail_count += 1
                    continue

                print(f"\n[{i}/{len(sires)}] Processing: {sire_name} (ID: {sire_id})")
                print(f"   (レース数: {sire_info['race_count']}, 産駒数: {sire_info['horse_count']})")

                try:
                    if process_sire(bq_client, storage_client, sire_id, sire_name):
                        success_count += 1
                    else:
                        fail_count += 1
                except Exception as e:
                    print(f"  ❌ Error: {str(e)}")
                    fail_count += 1

            print(f"\n{'='*60}")
            print(f"✅ Processing complete!")
            print(f"   Success: {success_count}/{len(sires)}")
            print(f"   Failed:  {fail_count}/{len(sires)}")
            print(f"{'='*60}")

    except Exception as e:
        print(f"❌ Fatal error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
