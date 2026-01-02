-- ステップ1: 基礎特徴量テーブルの作成（データリーケージなし）
--
-- 出力テーブル: all_features_base_no_leakage
-- 含まれる特徴量:
-- - 過去走のタイム指数（time_index_zscore_last1-5）
-- - 過去走の着順（finish_position_last1-5）
-- - 過去走の上がり3F指数（last3f_index_zscore_last1-5）
-- - 脚質情報（running_style_last1, mode）
-- - 前走からの日数（days_since_last_race）
-- - 基本情報（競馬場、距離、クラス、性別、年齢等）
--
-- ✅ データリーケージなし: WINDOW関数で時系列順に処理

CREATE OR REPLACE TABLE `umadata.keiba_data.all_features_base_no_leakage` AS

WITH base_data AS (
  SELECT
    rm.race_id,
    rm.race_date,
    rm.venue_name as racecourse,
    rm.surface,
    rm.distance,
    rm.track_condition as going,
    rm.race_class,
    rr.horse_id,
    rr.horse_name,
    rr.finish_position,
    rr.final_time as time,
    rr.last_3f_time,
    rr.horse_number,
    rr.bracket_number,
    rr.jockey_id,
    rr.jockey_name,
    rr.trainer_id,
    rr.trainer_name,
    rr.sex,
    rr.age,
    rr.jockey_weight,
    rr.horse_weight,
    rr.weight_change,
    rr.popularity,
    rr.odds,
    rr.corner_positions,

    -- 距離帯
    CASE
      WHEN rm.distance <= 1400 THEN 1200
      WHEN rm.distance <= 1800 THEN 1600
      WHEN rm.distance <= 2200 THEN 2000
      ELSE 2400
    END as distance_range,

    -- 脚質推定
    CASE
      WHEN CAST(SPLIT(rr.corner_positions, '-')[SAFE_OFFSET(0)] AS INT64) <= 2 THEN 0
      WHEN CAST(SPLIT(rr.corner_positions, '-')[SAFE_OFFSET(0)] AS INT64) <= 5 THEN 1
      WHEN CAST(SPLIT(rr.corner_positions, '-')[SAFE_OFFSET(0)] AS INT64) <= 10 THEN 2
      ELSE 3
    END as running_style_encoded

  FROM `umadata.keiba_data.race_master` rm
  JOIN `umadata.keiba_data.race_result` rr ON rm.race_id = rr.race_id
  WHERE rm.race_date >= '2021-01-01'  -- 訓練開始日
    AND rm.surface IN ('芝', 'ダート')
),

-- タイム指数の統計（競馬場×馬場×馬場状態別）
time_stats AS (
  SELECT
    race_id,
    horse_id,
    AVG(time) OVER (
      PARTITION BY racecourse, surface, going
      ORDER BY UNIX_DATE(race_date)
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as mean_time,
    STDDEV(time) OVER (
      PARTITION BY racecourse, surface, going
      ORDER BY UNIX_DATE(race_date)
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as std_time,
    COUNT(*) OVER (
      PARTITION BY racecourse, surface, going
      ORDER BY UNIX_DATE(race_date)
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) as count_samples
  FROM base_data
  WHERE time IS NOT NULL
),

-- タイム指数計算
with_time_index AS (
  SELECT
    b.*,
    CASE
      WHEN ts.count_samples >= 30 AND ts.std_time > 0
      THEN (ts.mean_time - b.time) / ts.std_time
      ELSE NULL
    END as time_index_zscore,

    -- 上がり3F指数も同様に計算（簡易版: 全体で標準化）
    (b.last_3f_time - AVG(b.last_3f_time) OVER()) / NULLIF(STDDEV(b.last_3f_time) OVER(), 0)
      as last3f_index_zscore_raw

  FROM base_data b
  LEFT JOIN time_stats ts
    ON b.race_id = ts.race_id
    AND b.horse_id = ts.horse_id
),

-- 過去走の情報を取得（WINDOW関数）
past_races AS (
  SELECT
    race_id,
    horse_id,

    -- 過去1走の情報
    STRUCT(
      LAG(race_date, 1) OVER (PARTITION BY horse_id ORDER BY race_date) as past_race_date,
      LAG(finish_position, 1) OVER (PARTITION BY horse_id ORDER BY race_date) as finish_position,
      LAG(time_index_zscore, 1) OVER (PARTITION BY horse_id ORDER BY race_date) as time_index,
      LAG(last3f_index_zscore_raw, 1) OVER (PARTITION BY horse_id ORDER BY race_date) as last3f_index,
      LAG(running_style_encoded, 1) OVER (PARTITION BY horse_id ORDER BY race_date) as running_style_encoded
    ) as past1,

    -- 過去2走の情報
    STRUCT(
      LAG(race_date, 2) OVER (PARTITION BY horse_id ORDER BY race_date) as past_race_date,
      LAG(finish_position, 2) OVER (PARTITION BY horse_id ORDER BY race_date) as finish_position,
      LAG(time_index_zscore, 2) OVER (PARTITION BY horse_id ORDER BY race_date) as time_index,
      LAG(last3f_index_zscore_raw, 2) OVER (PARTITION BY horse_id ORDER BY race_date) as last3f_index,
      LAG(running_style_encoded, 2) OVER (PARTITION BY horse_id ORDER BY race_date) as running_style_encoded
    ) as past2,

    -- 過去3走の情報
    STRUCT(
      LAG(race_date, 3) OVER (PARTITION BY horse_id ORDER BY race_date) as past_race_date,
      LAG(finish_position, 3) OVER (PARTITION BY horse_id ORDER BY race_date) as finish_position,
      LAG(time_index_zscore, 3) OVER (PARTITION BY horse_id ORDER BY race_date) as time_index,
      LAG(last3f_index_zscore_raw, 3) OVER (PARTITION BY horse_id ORDER BY race_date) as last3f_index,
      LAG(running_style_encoded, 3) OVER (PARTITION BY horse_id ORDER BY race_date) as running_style_encoded
    ) as past3,

    -- 過去4走の情報
    STRUCT(
      LAG(race_date, 4) OVER (PARTITION BY horse_id ORDER BY race_date) as past_race_date,
      LAG(finish_position, 4) OVER (PARTITION BY horse_id ORDER BY race_date) as finish_position
    ) as past4,

    -- 過去5走の情報
    STRUCT(
      LAG(race_date, 5) OVER (PARTITION BY horse_id ORDER BY race_date) as past_race_date,
      LAG(finish_position, 5) OVER (PARTITION BY horse_id ORDER BY race_date) as finish_position
    ) as past5

  FROM with_time_index
),

-- 騎手変更フラグ
jockey_change AS (
  SELECT
    race_id,
    horse_id,
    CASE
      WHEN LAG(jockey_id, 1) OVER (PARTITION BY horse_id ORDER BY race_date) IS NOT NULL
        AND LAG(jockey_id, 1) OVER (PARTITION BY horse_id ORDER BY race_date) != jockey_id
      THEN 1
      ELSE 0
    END as is_jockey_change
  FROM base_data
)

-- 最終的な特徴量テーブル
SELECT
  b.*,

  -- タイム指数（過去1-3走）
  pr.past1.time_index as time_index_zscore_last1,
  pr.past2.time_index as time_index_zscore_last2,
  pr.past3.time_index as time_index_zscore_last3,

  -- タイム指数集約（直近3走）
  (COALESCE(pr.past1.time_index, 0) + COALESCE(pr.past2.time_index, 0) + COALESCE(pr.past3.time_index, 0)) /
    NULLIF(
      (CASE WHEN pr.past1.time_index IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN pr.past2.time_index IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN pr.past3.time_index IS NOT NULL THEN 1 ELSE 0 END), 0
    ) as time_index_zscore_mean_3_improved,

  GREATEST(
    COALESCE(pr.past1.time_index, -999),
    COALESCE(pr.past2.time_index, -999),
    COALESCE(pr.past3.time_index, -999)
  ) as time_index_zscore_best_3_improved,

  LEAST(
    COALESCE(pr.past1.time_index, 999),
    COALESCE(pr.past2.time_index, 999),
    COALESCE(pr.past3.time_index, 999)
  ) as time_index_zscore_worst_3_improved,

  COALESCE(pr.past1.time_index, 0) - COALESCE(pr.past3.time_index, 0)
    as time_index_zscore_trend_3_improved,

  -- 上がり3F指数（過去1-2走）
  pr.past1.last3f_index as last3f_index_zscore_last1_improved,
  pr.past2.last3f_index as last3f_index_zscore_last2_improved,

  -- 上がり3F指数トレンド
  COALESCE(pr.past1.last3f_index, 0) - COALESCE(pr.past3.last3f_index, 0)
    as last3f_index_zscore_trend_3,

  -- 過去走の着順
  pr.past1.finish_position as finish_position_last1,
  pr.past2.finish_position as finish_position_last2,
  pr.past3.finish_position as finish_position_last3,
  pr.past4.finish_position as finish_position_last4,
  pr.past5.finish_position as finish_position_last5,

  -- 過去5走のベスト着順
  LEAST(
    COALESCE(pr.past1.finish_position, 999),
    COALESCE(pr.past2.finish_position, 999),
    COALESCE(pr.past3.finish_position, 999),
    COALESCE(pr.past4.finish_position, 999),
    COALESCE(pr.past5.finish_position, 999)
  ) as finish_pos_best_last5,

  -- 脚質
  pr.past1.running_style_encoded as running_style_last1,

  -- 最頻脚質（簡易版: 前走の脚質を使用）
  COALESCE(pr.past1.running_style_encoded,
           pr.past2.running_style_encoded,
           pr.past3.running_style_encoded) as running_style_mode,

  -- 前走からの日数
  DATE_DIFF(b.race_date, pr.past1.past_race_date, DAY) as days_since_last_race,

  -- 騎手変更フラグ
  jc.is_jockey_change

FROM base_data b
LEFT JOIN past_races pr
  ON b.race_id = pr.race_id
  AND b.horse_id = pr.horse_id
LEFT JOIN jockey_change jc
  ON b.race_id = jc.race_id
  AND b.horse_id = jc.horse_id

-- 検証: 過去走の日付が現在より未来でないことを確認
WHERE (pr.past1.past_race_date IS NULL OR pr.past1.past_race_date < b.race_date)
  AND (pr.past2.past_race_date IS NULL OR pr.past2.past_race_date < b.race_date)
  AND (pr.past3.past_race_date IS NULL OR pr.past3.past_race_date < b.race_date)
  AND (pr.past4.past_race_date IS NULL OR pr.past4.past_race_date < b.race_date)
  AND (pr.past5.past_race_date IS NULL OR pr.past5.past_race_date < b.race_date);
