-- 2025年8月～11月のテストデータ作成
-- 訓練期間: 2020年1月～2025年7月
-- テスト期間: 2025年8月～2025年11月

CREATE OR REPLACE TABLE keiba_ai.test_features_extended AS
WITH
-- 過去レースのタイムデータ
past_race_times AS (
  SELECT
    horse_id,
    race_date,
    time,
    finish_position,
    jockey_id,
    ROW_NUMBER() OVER (PARTITION BY horse_id ORDER BY race_date DESC) as race_rank
  FROM keiba_ai.all_races
  WHERE race_date < '2025-08-01'  -- テスト期間より前
),

-- 各馬の過去5走のタイム偏差値
horse_time_stats AS (
  SELECT
    t.horse_id,
    -- 過去5走のタイム偏差値
    MAX(CASE WHEN p.race_rank = 1 THEN
      CASE
        WHEN l1.count_l1 >= 200 AND l1.std_time_l1 > 0
        THEN (l1.mean_time_l1 - p.time) / l1.std_time_l1
        WHEN l2.count_l2 >= 200 AND l2.std_time_l2 > 0
        THEN (l2.mean_time_l2 - p.time) / l2.std_time_l2
        ELSE NULL
      END
    END) as time_dev_last1,
    MAX(CASE WHEN p.race_rank = 2 THEN
      CASE
        WHEN l1.count_l1 >= 200 AND l1.std_time_l1 > 0
        THEN (l1.mean_time_l1 - p.time) / l1.std_time_l1
        WHEN l2.count_l2 >= 200 AND l2.std_time_l2 > 0
        THEN (l2.mean_time_l2 - p.time) / l2.std_time_l2
        ELSE NULL
      END
    END) as time_dev_last2,
    MAX(CASE WHEN p.race_rank = 3 THEN
      CASE
        WHEN l1.count_l1 >= 200 AND l1.std_time_l1 > 0
        THEN (l1.mean_time_l1 - p.time) / l1.std_time_l1
        WHEN l2.count_l2 >= 200 AND l2.std_time_l2 > 0
        THEN (l2.mean_time_l2 - p.time) / l2.std_time_l2
        ELSE NULL
      END
    END) as time_dev_last3,
    MAX(CASE WHEN p.race_rank = 4 THEN
      CASE
        WHEN l1.count_l1 >= 200 AND l1.std_time_l1 > 0
        THEN (l1.mean_time_l1 - p.time) / l1.std_time_l1
        WHEN l2.count_l2 >= 200 AND l2.std_time_l2 > 0
        THEN (l2.mean_time_l2 - p.time) / l2.std_time_l2
        ELSE NULL
      END
    END) as time_dev_last4,
    MAX(CASE WHEN p.race_rank = 5 THEN
      CASE
        WHEN l1.count_l1 >= 200 AND l1.std_time_l1 > 0
        THEN (l1.mean_time_l1 - p.time) / l1.std_time_l1
        WHEN l2.count_l2 >= 200 AND l2.std_time_l2 > 0
        THEN (l2.mean_time_l2 - p.time) / l2.std_time_l2
        ELSE NULL
      END
    END) as time_dev_last5,

    -- 過去5走の着順統計
    AVG(CASE WHEN p.race_rank <= 5 THEN p.finish_position END) as finish_pos_mean_last5,
    MIN(CASE WHEN p.race_rank <= 5 THEN p.finish_position END) as finish_pos_best_last5,

    -- 前走の騎手ID
    MAX(CASE WHEN p.race_rank = 1 THEN p.jockey_id END) as last_jockey_id,

    -- 前走からの日数計算用に前走日を保存
    MAX(CASE WHEN p.race_rank = 1 THEN p.race_date END) as last_race_date

  FROM (SELECT DISTINCT horse_id FROM keiba_ai.all_races WHERE race_date BETWEEN '2025-08-01' AND '2025-11-30') t
  LEFT JOIN past_race_times p ON t.horse_id = p.horse_id

  -- Level 1: コース×馬場×距離の統計
  LEFT JOIN (
    SELECT
      racecourse, surface, distance,
      AVG(time) as mean_time_l1,
      STDDEV(time) as std_time_l1,
      COUNT(*) as count_l1
    FROM keiba_ai.all_races
    WHERE time IS NOT NULL AND race_date < '2025-08-01'
    GROUP BY racecourse, surface, distance
  ) l1 ON l1.racecourse = (SELECT racecourse FROM keiba_ai.all_races r WHERE r.horse_id = t.horse_id AND r.race_date = p.race_date LIMIT 1)
     AND l1.surface = (SELECT surface FROM keiba_ai.all_races r WHERE r.horse_id = t.horse_id AND r.race_date = p.race_date LIMIT 1)
     AND l1.distance = (SELECT distance FROM keiba_ai.all_races r WHERE r.horse_id = t.horse_id AND r.race_date = p.race_date LIMIT 1)

  -- Level 2: 馬場×距離帯の統計
  LEFT JOIN (
    SELECT
      surface,
      CASE
        WHEN distance < 1400 THEN 1200
        WHEN distance < 1800 THEN 1600
        WHEN distance < 2200 THEN 2000
        ELSE 2400
      END as distance_range,
      AVG(time) as mean_time_l2,
      STDDEV(time) as std_time_l2,
      COUNT(*) as count_l2
    FROM keiba_ai.all_races
    WHERE time IS NOT NULL AND race_date < '2025-08-01'
    GROUP BY surface, distance_range
  ) l2 ON l2.surface = (SELECT surface FROM keiba_ai.all_races r WHERE r.horse_id = t.horse_id AND r.race_date = p.race_date LIMIT 1)
     AND l2.distance_range = (
       SELECT CASE
         WHEN distance < 1400 THEN 1200
         WHEN distance < 1800 THEN 1600
         WHEN distance < 2200 THEN 2000
         ELSE 2400
       END
       FROM keiba_ai.all_races r WHERE r.horse_id = t.horse_id AND r.race_date = p.race_date LIMIT 1
     )

  GROUP BY t.horse_id
),

-- 騎手の成績統計
jockey_stats AS (
  SELECT
    jockey_id,
    surface,
    CASE
      WHEN distance < 1400 THEN 1200
      WHEN distance < 1800 THEN 1600
      WHEN distance < 2200 THEN 2000
      ELSE 2400
    END as distance_range,
    COUNT(*) as rides,
    AVG(CASE WHEN finish_position <= 3 THEN 1.0 ELSE 0.0 END) as place_rate
  FROM keiba_ai.all_races
  WHERE race_date < '2025-08-01'
  GROUP BY jockey_id, surface, distance_range
)

-- メインクエリ
SELECT
  r.race_id,
  r.race_date,
  r.horse_id,
  r.horse_name,
  r.finish_position,
  r.odds,
  r.popularity,
  r.jockey_id,
  r.jockey_name,
  r.bracket_number,
  r.horse_number,
  r.sex,
  r.age,
  r.horse_weight,
  r.weight_change,
  r.racecourse,
  r.surface,
  r.distance,
  r.going,
  r.race_class,

  -- タイム偏差値特徴量
  COALESCE(h.time_dev_last1, 0.0) as time_dev_last1,
  COALESCE(h.time_dev_last2, 0.0) as time_dev_last2,
  COALESCE(h.time_dev_last3, 0.0) as time_dev_last3,
  COALESCE(h.time_dev_last4, 0.0) as time_dev_last4,
  COALESCE(h.time_dev_last5, 0.0) as time_dev_last5,

  -- タイム偏差値の統計
  COALESCE((h.time_dev_last1 + h.time_dev_last2 + h.time_dev_last3 + h.time_dev_last4 + h.time_dev_last5) / 5.0, 0.0) as time_dev_mean_5,
  GREATEST(
    COALESCE(h.time_dev_last1, -999),
    COALESCE(h.time_dev_last2, -999),
    COALESCE(h.time_dev_last3, -999),
    COALESCE(h.time_dev_last4, -999),
    COALESCE(h.time_dev_last5, -999)
  ) as time_dev_max_5,
  COALESCE((h.time_dev_last1 - h.time_dev_last5) / 4.0, 0.0) as time_dev_trend_5,

  -- 騎手成績特徴量
  COALESCE(j.place_rate, 0.0) as jockey_place_rate_surface_distance,
  COALESCE(j.rides, 0) as jockey_rides_surface_distance,

  -- 騎手変更フラグ
  CASE WHEN h.last_jockey_id IS NULL THEN 0
       WHEN h.last_jockey_id = r.jockey_id THEN 0
       ELSE 1
  END as is_jockey_change,

  -- 着順統計
  COALESCE(h.finish_pos_mean_last5, 9.0) as finish_pos_mean_last5,
  COALESCE(h.finish_pos_best_last5, 18) as finish_pos_best_last5,

  -- 前走からの日数
  COALESCE(DATE_DIFF(r.race_date, h.last_race_date, DAY), 90) as days_since_last_race,

  -- エンコード済み特徴量
  CASE r.racecourse
    WHEN 'nakayama' THEN 0
    WHEN 'tokyo' THEN 1
    WHEN 'hanshin' THEN 2
    WHEN 'kyoto' THEN 3
    WHEN 'chukyo' THEN 4
    WHEN 'niigata' THEN 5
    WHEN 'fukushima' THEN 6
    WHEN 'sapporo' THEN 7
    WHEN 'hakodate' THEN 8
    WHEN 'kokura' THEN 9
    ELSE 0
  END as racecourse_encoded,

  CASE r.surface
    WHEN 'turf' THEN 0
    WHEN 'dirt' THEN 1
    ELSE 0
  END as surface_encoded,

  CASE r.going
    WHEN 'good' THEN 0
    WHEN 'yielding' THEN 1
    WHEN 'soft' THEN 2
    WHEN 'heavy' THEN 3
    ELSE 0
  END as going_encoded,

  CASE r.race_class
    WHEN 'G1' THEN 0
    WHEN 'G2' THEN 1
    WHEN 'G3' THEN 2
    WHEN 'OP' THEN 3
    WHEN '3win' THEN 4
    WHEN '2win' THEN 5
    WHEN '1win' THEN 6
    WHEN 'maiden' THEN 7
    ELSE 7
  END as race_class_encoded

FROM keiba_ai.all_races r
LEFT JOIN horse_time_stats h ON r.horse_id = h.horse_id
LEFT JOIN jockey_stats j ON r.jockey_id = j.jockey_id
  AND j.surface = r.surface
  AND j.distance_range = CASE
    WHEN r.distance < 1400 THEN 1200
    WHEN r.distance < 1800 THEN 1600
    WHEN r.distance < 2200 THEN 2000
    ELSE 2400
  END

WHERE r.race_date BETWEEN '2025-08-01' AND '2025-11-30'
ORDER BY r.race_date, r.race_id, r.horse_number;
