-- 過去走のレース条件情報をall_featuresテーブルに追加
--
-- 追加カラム:
-- - venue_name_last1-5: 過去1-5走の競馬場
-- - distance_last1-5: 過去1-5走の距離
-- - surface_last1-5: 過去1-5走の馬場
-- - track_condition_last1-5: 過去1-5走の馬場状態

CREATE OR REPLACE TABLE `umadata.keiba_data.all_features_with_past_conditions` AS

WITH
-- 各馬の過去走race_idを取得
horse_past_races AS (
  SELECT
    rr.race_id,
    rr.horse_id,
    rm.race_date,

    -- 過去1-5走のrace_idを取得（WINDOW関数）
    LAG(rr.race_id, 1) OVER (PARTITION BY rr.horse_id ORDER BY rm.race_date) as race_id_last1,
    LAG(rr.race_id, 2) OVER (PARTITION BY rr.horse_id ORDER BY rm.race_date) as race_id_last2,
    LAG(rr.race_id, 3) OVER (PARTITION BY rr.horse_id ORDER BY rm.race_date) as race_id_last3,
    LAG(rr.race_id, 4) OVER (PARTITION BY rr.horse_id ORDER BY rm.race_date) as race_id_last4,
    LAG(rr.race_id, 5) OVER (PARTITION BY rr.horse_id ORDER BY rm.race_date) as race_id_last5
  FROM `umadata.keiba_data.race_result` rr
  JOIN `umadata.keiba_data.race_master` rm
    ON rr.race_id = rm.race_id
),

-- 過去1走のレース条件を取得
past1_conditions AS (
  SELECT
    hpr.race_id,
    hpr.horse_id,
    rm.venue_name as venue_name_last1,
    rm.distance as distance_last1,
    rm.surface as surface_last1,
    rm.track_condition as track_condition_last1
  FROM horse_past_races hpr
  LEFT JOIN `umadata.keiba_data.race_master` rm
    ON hpr.race_id_last1 = rm.race_id
),

-- 過去2走のレース条件を取得
past2_conditions AS (
  SELECT
    hpr.race_id,
    hpr.horse_id,
    rm.venue_name as venue_name_last2,
    rm.distance as distance_last2,
    rm.surface as surface_last2,
    rm.track_condition as track_condition_last2
  FROM horse_past_races hpr
  LEFT JOIN `umadata.keiba_data.race_master` rm
    ON hpr.race_id_last2 = rm.race_id
),

-- 過去3走のレース条件を取得
past3_conditions AS (
  SELECT
    hpr.race_id,
    hpr.horse_id,
    rm.venue_name as venue_name_last3,
    rm.distance as distance_last3,
    rm.surface as surface_last3,
    rm.track_condition as track_condition_last3
  FROM horse_past_races hpr
  LEFT JOIN `umadata.keiba_data.race_master` rm
    ON hpr.race_id_last3 = rm.race_id
),

-- 過去4走のレース条件を取得
past4_conditions AS (
  SELECT
    hpr.race_id,
    hpr.horse_id,
    rm.venue_name as venue_name_last4,
    rm.distance as distance_last4,
    rm.surface as surface_last4,
    rm.track_condition as track_condition_last4
  FROM horse_past_races hpr
  LEFT JOIN `umadata.keiba_data.race_master` rm
    ON hpr.race_id_last4 = rm.race_id
),

-- 過去5走のレース条件を取得
past5_conditions AS (
  SELECT
    hpr.race_id,
    hpr.horse_id,
    rm.venue_name as venue_name_last5,
    rm.distance as distance_last5,
    rm.surface as surface_last5,
    rm.track_condition as track_condition_last5
  FROM horse_past_races hpr
  LEFT JOIN `umadata.keiba_data.race_master` rm
    ON hpr.race_id_last5 = rm.race_id
)

-- 既存のall_featuresに過去走のレース条件を結合
SELECT
  af.*,

  -- 過去1走のレース条件
  p1.venue_name_last1,
  p1.distance_last1,
  p1.surface_last1,
  p1.track_condition_last1,

  -- 過去2走のレース条件
  p2.venue_name_last2,
  p2.distance_last2,
  p2.surface_last2,
  p2.track_condition_last2,

  -- 過去3走のレース条件
  p3.venue_name_last3,
  p3.distance_last3,
  p3.surface_last3,
  p3.track_condition_last3,

  -- 過去4走のレース条件
  p4.venue_name_last4,
  p4.distance_last4,
  p4.surface_last4,
  p4.track_condition_last4,

  -- 過去5走のレース条件
  p5.venue_name_last5,
  p5.distance_last5,
  p5.surface_last5,
  p5.track_condition_last5

FROM `umadata.keiba_data.all_features` af
LEFT JOIN past1_conditions p1
  ON af.race_id = p1.race_id AND af.horse_id = p1.horse_id
LEFT JOIN past2_conditions p2
  ON af.race_id = p2.race_id AND af.horse_id = p2.horse_id
LEFT JOIN past3_conditions p3
  ON af.race_id = p3.race_id AND af.horse_id = p3.horse_id
LEFT JOIN past4_conditions p4
  ON af.race_id = p4.race_id AND af.horse_id = p4.horse_id
LEFT JOIN past5_conditions p5
  ON af.race_id = p5.race_id AND af.horse_id = p5.horse_id;
