-- BigQueryで特徴量を計算
--
-- 戦略:
-- 1. タイム統計量を事前計算（ウィンドウ関数）
-- 2. 過去5走の特徴量を計算（LAG関数）
-- 3. 騎手特徴量を計算（集約+JOIN）

-- ========================================
-- ステップ1: タイム統計量の計算
-- ========================================
CREATE OR REPLACE TABLE `umadata.keiba_ai.time_statistics` AS
WITH all_data AS (
  SELECT * FROM `umadata.keiba_ai.train_raw`
  UNION ALL
  SELECT * FROM `umadata.keiba_ai.test_raw`
),
-- 各レースに対して、過去データの統計量を計算
time_stats_level1 AS (
  -- Level 1: 競馬場 × 芝ダ × 距離±200m × 馬場状態
  SELECT
    race_id,
    race_date,
    racecourse,
    surface,
    distance,
    going,
    AVG(time) OVER (
      PARTITION BY racecourse, surface, going
      ORDER BY UNIX_DATE(PARSE_DATE('%Y-%m-%d', race_date))
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as mean_time_l1,
    STDDEV(time) OVER (
      PARTITION BY racecourse, surface, going
      ORDER BY UNIX_DATE(PARSE_DATE('%Y-%m-%d', race_date))
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as std_time_l1,
    COUNT(*) OVER (
      PARTITION BY racecourse, surface, going
      ORDER BY UNIX_DATE(PARSE_DATE('%Y-%m-%d', race_date))
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as count_l1
  FROM all_data
),
time_stats_level2 AS (
  -- Level 2: 芝ダ × 距離±200m × 馬場状態
  SELECT
    race_id,
    AVG(time) OVER (
      PARTITION BY surface, going
      ORDER BY UNIX_DATE(PARSE_DATE('%Y-%m-%d', race_date))
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as mean_time_l2,
    STDDEV(time) OVER (
      PARTITION BY surface, going
      ORDER BY UNIX_DATE(PARSE_DATE('%Y-%m-%d', race_date))
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as std_time_l2,
    COUNT(*) OVER (
      PARTITION BY surface, going
      ORDER BY UNIX_DATE(PARSE_DATE('%Y-%m-%d', race_date))
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as count_l2
  FROM all_data
)
SELECT
  l1.*,
  l2.mean_time_l2,
  l2.std_time_l2,
  l2.count_l2,
  -- 最適な統計量を選択（Level 1優先、サンプル数200以上）
  CASE
    WHEN l1.count_l1 >= 200 AND l1.std_time_l1 > 0 THEN l1.mean_time_l1
    WHEN l2.count_l2 >= 200 AND l2.std_time_l2 > 0 THEN l2.mean_time_l2
    ELSE NULL
  END as mean_time,
  CASE
    WHEN l1.count_l1 >= 200 AND l1.std_time_l1 > 0 THEN l1.std_time_l1
    WHEN l2.count_l2 >= 200 AND l2.std_time_l2 > 0 THEN l2.std_time_l2
    ELSE NULL
  END as std_time,
  CASE
    WHEN l1.count_l1 >= 200 AND l1.std_time_l1 > 0 THEN 1
    WHEN l2.count_l2 >= 200 AND l2.std_time_l2 > 0 THEN 2
    ELSE 0
  END as time_dev_level
FROM time_stats_level1 l1
LEFT JOIN time_stats_level2 l2 USING (race_id);


-- ========================================
-- ステップ2: 過去5走の特徴量
-- ========================================
CREATE OR REPLACE TABLE `umadata.keiba_ai.past_races_features` AS
WITH all_data AS (
  SELECT * FROM `umadata.keiba_ai.train_raw`
  UNION ALL
  SELECT * FROM `umadata.keiba_ai.test_raw`
),
-- 各レースにタイム偏差値を追加
races_with_time_dev AS (
  SELECT
    r.*,
    ts.mean_time,
    ts.std_time,
    -- タイム偏差値（速いほど高い値）
    CASE
      WHEN ts.std_time > 0 THEN (ts.mean_time - r.time) / ts.std_time
      ELSE NULL
    END as time_deviation
  FROM all_data r
  LEFT JOIN `umadata.keiba_ai.time_statistics` ts
    ON r.race_id = ts.race_id
),
-- 過去5走の特徴量
past_features AS (
  SELECT
    race_id,
    horse_id,
    race_date,
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
      PARSE_DATE('%Y-%m-%d', race_date),
      PARSE_DATE('%Y-%m-%d', LAG(race_date, 1) OVER (PARTITION BY horse_id ORDER BY race_date)),
      DAY
    ) as days_since_last_race,
    -- 騎手変更フラグ
    CASE
      WHEN LAG(jockey_id, 1) OVER (PARTITION BY horse_id ORDER BY race_date) IS NOT NULL
        AND LAG(jockey_id, 1) OVER (PARTITION BY horse_id ORDER BY race_date) != jockey_id
      THEN 1
      ELSE 0
    END as is_jockey_change
  FROM races_with_time_dev
)
SELECT
  pf.*,
  -- 集約特徴量
  (COALESCE(time_dev_last1, 0) + COALESCE(time_dev_last2, 0) + COALESCE(time_dev_last3, 0) +
   COALESCE(time_dev_last4, 0) + COALESCE(time_dev_last5, 0)) /
   (CASE WHEN time_dev_last1 IS NULL THEN 0 ELSE 1 END +
    CASE WHEN time_dev_last2 IS NULL THEN 0 ELSE 1 END +
    CASE WHEN time_dev_last3 IS NULL THEN 0 ELSE 1 END +
    CASE WHEN time_dev_last4 IS NULL THEN 0 ELSE 1 END +
    CASE WHEN time_dev_last5 IS NULL THEN 0 ELSE 1 END +
    0.0001) as time_dev_mean_5,
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
   (CASE WHEN finish_pos_last1 IS NULL THEN 0 ELSE 1 END +
    CASE WHEN finish_pos_last2 IS NULL THEN 0 ELSE 1 END +
    CASE WHEN finish_pos_last3 IS NULL THEN 0 ELSE 1 END +
    CASE WHEN finish_pos_last4 IS NULL THEN 0 ELSE 1 END +
    CASE WHEN finish_pos_last5 IS NULL THEN 0 ELSE 1 END +
    0.0001) as finish_pos_mean_last5,
  LEAST(
    COALESCE(finish_pos_last1, 999),
    COALESCE(finish_pos_last2, 999),
    COALESCE(finish_pos_last3, 999),
    COALESCE(finish_pos_last4, 999),
    COALESCE(finish_pos_last5, 999)
  ) as finish_pos_best_last5
FROM past_features;


-- ========================================
-- ステップ3: 騎手特徴量
-- ========================================
CREATE OR REPLACE TABLE `umadata.keiba_ai.jockey_features` AS
WITH all_data AS (
  SELECT * FROM `umadata.keiba_ai.train_raw`
  UNION ALL
  SELECT * FROM `umadata.keiba_ai.test_raw`
),
-- 各レース時点での騎手の過去成績を計算
jockey_stats AS (
  SELECT
    r1.race_id,
    r1.jockey_id,
    r1.surface,
    r1.distance,
    r1.race_date,
    -- 同じ騎手×芝ダ×距離帯の過去データ
    COUNT(r2.race_id) as jockey_rides_surface_distance,
    AVG(CASE WHEN r2.finish_position <= 3 THEN 1.0 ELSE 0.0 END) as jockey_place_rate_surface_distance
  FROM all_data r1
  LEFT JOIN all_data r2
    ON r1.jockey_id = r2.jockey_id
    AND r1.surface = r2.surface
    AND ABS(r1.distance - r2.distance) <= 200
    AND r2.race_date < r1.race_date
  GROUP BY 1, 2, 3, 4, 5
)
SELECT * FROM jockey_stats;


-- ========================================
-- ステップ4: 全特徴量を結合
-- ========================================
CREATE OR REPLACE TABLE `umadata.keiba_ai.all_features` AS
WITH all_data AS (
  SELECT * FROM `umadata.keiba_ai.train_raw`
  UNION ALL
  SELECT * FROM `umadata.keiba_ai.test_raw`
)
SELECT
  r.*,
  pf.time_dev_last1,
  pf.time_dev_last2,
  pf.time_dev_last3,
  pf.time_dev_last4,
  pf.time_dev_last5,
  pf.time_dev_mean_5,
  pf.time_dev_max_5,
  pf.time_dev_trend_5,
  pf.finish_pos_last1,
  pf.finish_pos_last2,
  pf.finish_pos_last3,
  pf.finish_pos_last4,
  pf.finish_pos_last5,
  pf.finish_pos_mean_last5,
  pf.finish_pos_best_last5,
  pf.days_since_last_race,
  pf.is_jockey_change,
  jf.jockey_place_rate_surface_distance,
  jf.jockey_rides_surface_distance
FROM all_data r
LEFT JOIN `umadata.keiba_ai.past_races_features` pf
  ON r.race_id = pf.race_id AND r.horse_id = pf.horse_id
LEFT JOIN `umadata.keiba_ai.jockey_features` jf
  ON r.race_id = jf.race_id;
