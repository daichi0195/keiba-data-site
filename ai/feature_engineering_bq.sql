-- BigQueryで特徴量を計算（最適化版）

-- ========================================
-- ステップ1: 全データの結合
-- ========================================
CREATE OR REPLACE TABLE `umadata.keiba_ai.all_races` AS
SELECT * FROM `umadata.keiba_ai.train_raw`
UNION ALL
SELECT * FROM `umadata.keiba_ai.test_raw`;


-- ========================================
-- ステップ2: 各レースのタイム偏差値を計算
-- ========================================
CREATE OR REPLACE TABLE `umadata.keiba_ai.races_with_time_dev` AS
WITH
-- Level 1統計量: 競馬場 × 芝ダ × 馬場状態
time_stats_l1 AS (
  SELECT
    *,
    AVG(time) OVER (
      PARTITION BY racecourse, surface, going
      ORDER BY race_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as mean_time_l1,
    STDDEV(time) OVER (
      PARTITION BY racecourse, surface, going
      ORDER BY race_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as std_time_l1,
    COUNT(*) OVER (
      PARTITION BY racecourse, surface, going
      ORDER BY race_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as count_l1
  FROM `umadata.keiba_ai.all_races`
),
-- Level 2統計量: 芝ダ × 馬場状態
time_stats_l2 AS (
  SELECT
    race_id,
    horse_id,
    AVG(time) OVER (
      PARTITION BY surface, going
      ORDER BY race_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as mean_time_l2,
    STDDEV(time) OVER (
      PARTITION BY surface, going
      ORDER BY race_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as std_time_l2,
    COUNT(*) OVER (
      PARTITION BY surface, going
      ORDER BY race_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as count_l2
  FROM `umadata.keiba_ai.all_races`
)
SELECT
  l1.*,
  l2.mean_time_l2,
  l2.std_time_l2,
  l2.count_l2,
  -- 最適な統計量を選択（Level 1優先、サンプル数200以上）
  CASE
    WHEN l1.count_l1 >= 200 AND l1.std_time_l1 > 0 THEN (l1.mean_time_l1 - l1.time) / l1.std_time_l1
    WHEN l2.count_l2 >= 200 AND l2.std_time_l2 > 0 THEN (l2.mean_time_l2 - l1.time) / l2.std_time_l2
    ELSE NULL
  END as time_deviation,
  CASE
    WHEN l1.count_l1 >= 200 AND l1.std_time_l1 > 0 THEN 1
    WHEN l2.count_l2 >= 200 AND l2.std_time_l2 > 0 THEN 2
    ELSE 0
  END as time_dev_level
FROM time_stats_l1 l1
LEFT JOIN time_stats_l2 l2
  ON l1.race_id = l2.race_id AND l1.horse_id = l2.horse_id;


-- ========================================
-- ステップ3: 過去5走の特徴量
-- ========================================
CREATE OR REPLACE TABLE `umadata.keiba_ai.with_past_features` AS
SELECT
  *,
  -- 過去5走のタイム偏差値
  LAG(time_deviation, 1) OVER (PARTITION BY horse_id ORDER BY race_date) as time_dev_last1,
  LAG(time_deviation, 2) OVER (PARTITION BY horse_id ORDER BY race_date) as time_dev_last2,
  LAG(time_deviation, 3) OVER (PARTITION BY horse_id ORDER BY race_date) as time_dev_last3,
  LAG(time_deviation, 4) OVER (PARTITION BY horse_id ORDER BY race_date) as time_dev_last4,
  LAG(time_deviation, 5) OVER (PARTITION BY horse_id ORDER BY race_date) as time_dev_last5,

  -- 過去5走の着順
  LAG(finish_position, 1) OVER (PARTITION BY horse_id ORDER BY race_date) as finish_pos_last1,
  LAG(finish_position, 2) OVER (PARTITION BY horse_id ORDER BY race_date) as finish_pos_last2,
  LAG(finish_position, 3) OVER (PARTITION BY horse_id ORDER BY race_date) as finish_pos_last3,
  LAG(finish_position, 4) OVER (PARTITION BY horse_id ORDER BY race_date) as finish_pos_last4,
  LAG(finish_position, 5) OVER (PARTITION BY horse_id ORDER BY race_date) as finish_pos_last5,

  -- 前走からの日数
  DATE_DIFF(
    race_date,
    LAG(race_date, 1) OVER (PARTITION BY horse_id ORDER BY race_date),
    DAY
  ) as days_since_last_race,

  -- 騎手変更フラグ
  CASE
    WHEN LAG(jockey_id, 1) OVER (PARTITION BY horse_id ORDER BY race_date) IS NOT NULL
      AND LAG(jockey_id, 1) OVER (PARTITION BY horse_id ORDER BY race_date) != jockey_id
    THEN 1
    ELSE 0
  END as is_jockey_change
FROM `umadata.keiba_ai.races_with_time_dev`;


-- ========================================
-- ステップ4: 集約特徴量を追加
-- ========================================
CREATE OR REPLACE TABLE `umadata.keiba_ai.with_agg_features` AS
SELECT
  *,
  -- タイム偏差値の集約
  (COALESCE(time_dev_last1, 0) + COALESCE(time_dev_last2, 0) + COALESCE(time_dev_last3, 0) +
   COALESCE(time_dev_last4, 0) + COALESCE(time_dev_last5, 0)) /
  NULLIF(
    (CASE WHEN time_dev_last1 IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN time_dev_last2 IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN time_dev_last3 IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN time_dev_last4 IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN time_dev_last5 IS NOT NULL THEN 1 ELSE 0 END), 0
  ) as time_dev_mean_5,

  GREATEST(
    COALESCE(time_dev_last1, -999),
    COALESCE(time_dev_last2, -999),
    COALESCE(time_dev_last3, -999),
    COALESCE(time_dev_last4, -999),
    COALESCE(time_dev_last5, -999)
  ) as time_dev_max_5,

  COALESCE(time_dev_last1, 0) - COALESCE(time_dev_last5, 0) as time_dev_trend_5,

  -- 着順の集約
  (COALESCE(finish_pos_last1, 0) + COALESCE(finish_pos_last2, 0) + COALESCE(finish_pos_last3, 0) +
   COALESCE(finish_pos_last4, 0) + COALESCE(finish_pos_last5, 0)) /
  NULLIF(
    (CASE WHEN finish_pos_last1 IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN finish_pos_last2 IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN finish_pos_last3 IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN finish_pos_last4 IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN finish_pos_last5 IS NOT NULL THEN 1 ELSE 0 END), 0
  ) as finish_pos_mean_last5,

  LEAST(
    COALESCE(finish_pos_last1, 999),
    COALESCE(finish_pos_last2, 999),
    COALESCE(finish_pos_last3, 999),
    COALESCE(finish_pos_last4, 999),
    COALESCE(finish_pos_last5, 999)
  ) as finish_pos_best_last5
FROM `umadata.keiba_ai.with_past_features`;


-- ========================================
-- ステップ5: 騎手特徴量
-- ========================================
CREATE OR REPLACE TABLE `umadata.keiba_ai.jockey_stats` AS
SELECT
  r1.race_id,
  r1.horse_id,
  r1.jockey_id,
  COUNT(r2.race_id) as jockey_rides_surface_distance,
  AVG(CASE WHEN r2.finish_position <= 3 THEN 1.0 ELSE 0.0 END) as jockey_place_rate_surface_distance
FROM `umadata.keiba_ai.all_races` r1
LEFT JOIN `umadata.keiba_ai.all_races` r2
  ON r1.jockey_id = r2.jockey_id
  AND r1.surface = r2.surface
  AND ABS(r1.distance - r2.distance) <= 200
  AND r2.race_date < r1.race_date
GROUP BY 1, 2, 3;


-- ========================================
-- ステップ6: 全特徴量を結合
-- ========================================
CREATE OR REPLACE TABLE `umadata.keiba_ai.all_features` AS
SELECT
  a.*,
  j.jockey_place_rate_surface_distance,
  j.jockey_rides_surface_distance
FROM `umadata.keiba_ai.with_agg_features` a
LEFT JOIN `umadata.keiba_ai.jockey_stats` j
  ON a.race_id = j.race_id AND a.horse_id = j.horse_id;
