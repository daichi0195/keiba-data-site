-- トレンド特徴量と休養関連特徴量の追加

WITH base_features AS (
  SELECT * FROM `umadata.keiba_data.all_features_with_running_style_win_rates`
),

trend_features AS (
  SELECT 
    race_id,
    horse_id,
    
    -- タイム偏差値のトレンド（直近3走）
    CASE 
      WHEN time_dev_last1 IS NOT NULL AND time_dev_last2 IS NOT NULL AND time_dev_last3 IS NOT NULL
      THEN (time_dev_last1 - time_dev_last3) / 2.0
      ELSE 0.0
    END as time_dev_trend_3races,
    
    -- 上がり偏差値のトレンド（直近3走）
    CASE 
      WHEN last3f_dev_last1 IS NOT NULL AND last3f_dev_last2 IS NOT NULL AND last3f_dev_last3 IS NOT NULL
      THEN (last3f_dev_last1 - last3f_dev_last3) / 2.0
      ELSE 0.0
    END as last3f_dev_trend_3races,
    
    -- 前走からの改善度
    CASE 
      WHEN time_dev_last1 IS NOT NULL AND time_dev_last2 IS NOT NULL
      THEN time_dev_last1 - time_dev_last2
      ELSE 0.0
    END as time_dev_improvement,
    
    CASE 
      WHEN last3f_dev_last1 IS NOT NULL AND last3f_dev_last2 IS NOT NULL
      THEN last3f_dev_last1 - last3f_dev_last2
      ELSE 0.0
    END as last3f_dev_improvement,
    
    -- 休養関連フラグ
    CASE WHEN days_since_last_race >= 90 THEN 1 ELSE 0 END as is_after_long_rest,
    CASE WHEN days_since_last_race <= 14 AND days_since_last_race IS NOT NULL THEN 1 ELSE 0 END as is_consecutive_race,
    CASE WHEN days_since_last_race IS NULL THEN 1 ELSE 0 END as is_debut,
    
    -- 休養期間のカテゴリ
    CASE 
      WHEN days_since_last_race IS NULL THEN 0
      WHEN days_since_last_race <= 14 THEN 1
      WHEN days_since_last_race <= 30 THEN 2
      WHEN days_since_last_race <= 60 THEN 3
      WHEN days_since_last_race <= 90 THEN 4
      ELSE 5
    END as rest_period_category
    
  FROM base_features
)

SELECT 
  bf.*,
  tf.time_dev_trend_3races,
  tf.last3f_dev_trend_3races,
  tf.time_dev_improvement,
  tf.last3f_dev_improvement,
  tf.is_after_long_rest,
  tf.is_consecutive_race,
  tf.is_debut,
  tf.rest_period_category
FROM base_features bf
LEFT JOIN trend_features tf
  ON bf.race_id = tf.race_id 
  AND bf.horse_id = tf.horse_id
