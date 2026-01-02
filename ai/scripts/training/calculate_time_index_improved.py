#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
タイム指数計算の改善版

変更点:
1. Fallback階層の順番変更（2と3を入れ替え）
2. fallback_level >= 3の場合、信頼度を下げる（z-scoreを0.7倍にする）
"""
from google.cloud import bigquery

PROJECT_ID = "umadata"
DATASET_ID = "keiba_data"

client = bigquery.Client(project=PROJECT_ID, location="asia-northeast1")

def create_improved_time_index():
    """タイム指数計算（改善版）"""

    print("=" * 100)
    print("📊 タイム指数計算（改善版）")
    print("=" * 100)

    query = f"""
    CREATE OR REPLACE TABLE `{PROJECT_ID}.{DATASET_ID}.all_features_complete_improved` AS

    WITH base AS (
      SELECT * FROM `{PROJECT_ID}.{DATASET_ID}.all_features_complete`
    ),

    stats AS (
      SELECT * FROM `{PROJECT_ID}.{DATASET_ID}.time_index_baseline_stats_v2`
    ),

    -- ========================================
    -- 前走（last1）の基準値取得（順番変更）
    -- ========================================
    base_with_last1 AS (
      SELECT
        b.*,
        COALESCE(s1.time_mean, s2.time_mean, s3.time_mean, s4.time_mean, s5.time_mean) as baseline_time_last1,
        COALESCE(s1.time_std, s2.time_std, s3.time_std, s4.time_std, s5.time_std) as baseline_std_last1,
        COALESCE(s1.last3f_mean, s2.last3f_mean, s3.last3f_mean, s4.last3f_mean, s5.last3f_mean) as baseline_last3f_last1,
        COALESCE(s1.last3f_std, s2.last3f_std, s3.last3f_std, s4.last3f_std, s5.last3f_std) as baseline_last3f_std_last1,
        -- fallback_levelを記録（信頼度計算に使用）
        COALESCE(s1.fallback_level, s2.fallback_level, s3.fallback_level, s4.fallback_level, s5.fallback_level) as fallback_level_last1
      FROM base b
      -- Level 1: 競馬場 + 距離 + 芝/ダート + 馬場状態
      LEFT JOIN stats s1
        ON s1.racecourse = b.venue_name_last1
        AND s1.distance = b.distance_last1
        AND s1.surface = b.surface_last1
        AND s1.going = b.track_condition_last1
        AND s1.fallback_level = 1
      -- Level 2: 距離 + 芝/ダート + 馬場状態（競馬場不問） ← 順番変更
      LEFT JOIN stats s2
        ON s2.racecourse IS NULL
        AND s2.distance = b.distance_last1
        AND s2.surface = b.surface_last1
        AND s2.going = b.track_condition_last1
        AND s2.fallback_level = 2
      -- Level 3: 競馬場 + 距離 + 芝/ダート（馬場不問） ← 順番変更
      LEFT JOIN stats s3
        ON s3.racecourse = b.venue_name_last1
        AND s3.distance = b.distance_last1
        AND s3.surface = b.surface_last1
        AND s3.going IS NULL
        AND s3.fallback_level = 3
      -- Level 4: 距離 + 芝/ダート
      LEFT JOIN stats s4
        ON s4.racecourse IS NULL
        AND s4.distance = b.distance_last1
        AND s4.surface = b.surface_last1
        AND s4.going IS NULL
        AND s4.fallback_level = 4
      -- Level 5: 距離のみ
      LEFT JOIN stats s5
        ON s5.racecourse IS NULL
        AND s5.distance = b.distance_last1
        AND s5.surface IS NULL
        AND s5.going IS NULL
        AND s5.fallback_level = 5
    ),

    -- ========================================
    -- 2走前（last2）の基準値取得
    -- ========================================
    base_with_last2 AS (
      SELECT
        b.*,
        COALESCE(s1.time_mean, s2.time_mean, s3.time_mean, s4.time_mean, s5.time_mean) as baseline_time_last2,
        COALESCE(s1.time_std, s2.time_std, s3.time_std, s4.time_std, s5.time_std) as baseline_std_last2,
        COALESCE(s1.last3f_mean, s2.last3f_mean, s3.last3f_mean, s4.last3f_mean, s5.last3f_mean) as baseline_last3f_last2,
        COALESCE(s1.last3f_std, s2.last3f_std, s3.last3f_std, s4.last3f_std, s5.last3f_std) as baseline_last3f_std_last2,
        COALESCE(s1.fallback_level, s2.fallback_level, s3.fallback_level, s4.fallback_level, s5.fallback_level) as fallback_level_last2
      FROM base_with_last1 b
      LEFT JOIN stats s1 ON s1.racecourse = b.venue_name_last2 AND s1.distance = b.distance_last2 AND s1.surface = b.surface_last2 AND s1.going = b.track_condition_last2 AND s1.fallback_level = 1
      LEFT JOIN stats s2 ON s2.racecourse IS NULL AND s2.distance = b.distance_last2 AND s2.surface = b.surface_last2 AND s2.going = b.track_condition_last2 AND s2.fallback_level = 2
      LEFT JOIN stats s3 ON s3.racecourse = b.venue_name_last2 AND s3.distance = b.distance_last2 AND s3.surface = b.surface_last2 AND s3.going IS NULL AND s3.fallback_level = 3
      LEFT JOIN stats s4 ON s4.racecourse IS NULL AND s4.distance = b.distance_last2 AND s4.surface = b.surface_last2 AND s4.going IS NULL AND s4.fallback_level = 4
      LEFT JOIN stats s5 ON s5.racecourse IS NULL AND s5.distance = b.distance_last2 AND s5.surface IS NULL AND s5.going IS NULL AND s5.fallback_level = 5
    ),

    -- ========================================
    -- 3走前（last3）の基準値取得
    -- ========================================
    base_with_last3 AS (
      SELECT
        b.*,
        COALESCE(s1.time_mean, s2.time_mean, s3.time_mean, s4.time_mean, s5.time_mean) as baseline_time_last3,
        COALESCE(s1.time_std, s2.time_std, s3.time_std, s4.time_std, s5.time_std) as baseline_std_last3,
        COALESCE(s1.last3f_mean, s2.last3f_mean, s3.last3f_mean, s4.last3f_mean, s5.last3f_mean) as baseline_last3f_last3,
        COALESCE(s1.last3f_std, s2.last3f_std, s3.last3f_std, s4.last3f_std, s5.last3f_std) as baseline_last3f_std_last3,
        COALESCE(s1.fallback_level, s2.fallback_level, s3.fallback_level, s4.fallback_level, s5.fallback_level) as fallback_level_last3
      FROM base_with_last2 b
      LEFT JOIN stats s1 ON s1.racecourse = b.venue_name_last3 AND s1.distance = b.distance_last3 AND s1.surface = b.surface_last3 AND s1.going = b.track_condition_last3 AND s1.fallback_level = 1
      LEFT JOIN stats s2 ON s2.racecourse IS NULL AND s2.distance = b.distance_last3 AND s2.surface = b.surface_last3 AND s2.going = b.track_condition_last3 AND s2.fallback_level = 2
      LEFT JOIN stats s3 ON s3.racecourse = b.venue_name_last3 AND s3.distance = b.distance_last3 AND s3.surface = b.surface_last3 AND s3.going IS NULL AND s3.fallback_level = 3
      LEFT JOIN stats s4 ON s4.racecourse IS NULL AND s4.distance = b.distance_last3 AND s4.surface = b.surface_last3 AND s4.going IS NULL AND s4.fallback_level = 4
      LEFT JOIN stats s5 ON s5.racecourse IS NULL AND s5.distance = b.distance_last3 AND s5.surface IS NULL AND s5.going IS NULL AND s5.fallback_level = 5
    ),

    -- ========================================
    -- タイム指数を計算（信頼度調整付き）
    -- ========================================
    with_improved_indices AS (
      SELECT
        *,

        -- last1のz-score（改善版）
        CASE
          WHEN baseline_std_last1 > 0 AND baseline_time_last1 IS NOT NULL AND surface_last1 IN ('芝', 'ダート')
          THEN
            -- fallback_level >= 3の場合、信頼度を0.7倍に下げる
            (time_last1 - baseline_time_last1) / baseline_std_last1 *
            CASE WHEN fallback_level_last1 >= 3 THEN 0.7 ELSE 1.0 END
          ELSE NULL
        END as time_index_zscore_last1_improved,

        CASE
          WHEN baseline_last3f_std_last1 > 0 AND baseline_last3f_last1 IS NOT NULL AND surface_last1 IN ('芝', 'ダート')
          THEN
            (last_3f_time_last1 - baseline_last3f_last1) / baseline_last3f_std_last1 *
            CASE WHEN fallback_level_last1 >= 3 THEN 0.7 ELSE 1.0 END
          ELSE NULL
        END as last3f_index_zscore_last1_improved,

        -- last2のz-score（改善版）
        CASE
          WHEN baseline_std_last2 > 0 AND baseline_time_last2 IS NOT NULL AND surface_last2 IN ('芝', 'ダート')
          THEN
            (time_last2 - baseline_time_last2) / baseline_std_last2 *
            CASE WHEN fallback_level_last2 >= 3 THEN 0.7 ELSE 1.0 END
          ELSE NULL
        END as time_index_zscore_last2_improved,

        CASE
          WHEN baseline_last3f_std_last2 > 0 AND baseline_last3f_last2 IS NOT NULL AND surface_last2 IN ('芝', 'ダート')
          THEN
            (last_3f_time_last2 - baseline_last3f_last2) / baseline_last3f_std_last2 *
            CASE WHEN fallback_level_last2 >= 3 THEN 0.7 ELSE 1.0 END
          ELSE NULL
        END as last3f_index_zscore_last2_improved,

        -- last3のz-score（改善版）
        CASE
          WHEN baseline_std_last3 > 0 AND baseline_time_last3 IS NOT NULL AND surface_last3 IN ('芝', 'ダート')
          THEN
            (time_last3 - baseline_time_last3) / baseline_std_last3 *
            CASE WHEN fallback_level_last3 >= 3 THEN 0.7 ELSE 1.0 END
          ELSE NULL
        END as time_index_zscore_last3_improved

      FROM base_with_last3
    )

    -- ========================================
    -- 集計指標を計算
    -- ========================================
    SELECT
      *,

      -- 3走平均
      (COALESCE(time_index_zscore_last1_improved, 0) + COALESCE(time_index_zscore_last2_improved, 0) + COALESCE(time_index_zscore_last3_improved, 0))
        / GREATEST(
          (CASE WHEN time_index_zscore_last1_improved IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN time_index_zscore_last2_improved IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN time_index_zscore_last3_improved IS NOT NULL THEN 1 ELSE 0 END),
          1
        ) as time_index_zscore_mean_3_improved,

      -- 3走ベスト
      GREATEST(
        COALESCE(time_index_zscore_last1_improved, -999),
        COALESCE(time_index_zscore_last2_improved, -999),
        COALESCE(time_index_zscore_last3_improved, -999)
      ) as time_index_zscore_best_3_improved,

      -- 3走ワースト
      LEAST(
        COALESCE(time_index_zscore_last1_improved, 999),
        COALESCE(time_index_zscore_last2_improved, 999),
        COALESCE(time_index_zscore_last3_improved, 999)
      ) as time_index_zscore_worst_3_improved,

      -- トレンド（last1 - last3）
      CASE
        WHEN time_index_zscore_last1_improved IS NOT NULL AND time_index_zscore_last3_improved IS NOT NULL
        THEN time_index_zscore_last1_improved - time_index_zscore_last3_improved
        ELSE NULL
      END as time_index_zscore_trend_3_improved

    FROM with_improved_indices
    """

    print("\n🔧 クエリ実行中...")
    job = client.query(query)
    job.result()

    print("\n✅ タイム指数計算完了")

    # fallback_levelの分布を確認
    fallback_dist_query = f"""
    SELECT
      fallback_level_last1,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as pct
    FROM `{PROJECT_ID}.{DATASET_ID}.all_features_complete_improved`
    WHERE fallback_level_last1 IS NOT NULL
    GROUP BY fallback_level_last1
    ORDER BY fallback_level_last1
    """

    fallback_df = client.query(fallback_dist_query).to_dataframe()

    print("\n" + "=" * 100)
    print("📊 Fallback Level分布（前走）")
    print("=" * 100)
    print(fallback_df.to_string(index=False))

    # 信頼度調整の影響を確認
    impact_query = f"""
    SELECT
      'Level 1-2（信頼度高）' as category,
      COUNT(*) as count,
      AVG(time_index_zscore_last1_improved) as avg_zscore
    FROM `{PROJECT_ID}.{DATASET_ID}.all_features_complete_improved`
    WHERE fallback_level_last1 IN (1, 2)
      AND time_index_zscore_last1_improved IS NOT NULL

    UNION ALL

    SELECT
      'Level 3-5（信頼度低）' as category,
      COUNT(*) as count,
      AVG(time_index_zscore_last1_improved) as avg_zscore
    FROM `{PROJECT_ID}.{DATASET_ID}.all_features_complete_improved`
    WHERE fallback_level_last1 >= 3
      AND time_index_zscore_last1_improved IS NOT NULL
    """

    impact_df = client.query(impact_query).to_dataframe()

    print("\n" + "=" * 100)
    print("📊 信頼度調整の影響")
    print("=" * 100)
    print(impact_df.to_string(index=False))

    print("\n" + "=" * 100)
    print("✅ すべての処理が完了しました")
    print("=" * 100)

if __name__ == '__main__':
    create_improved_time_index()
