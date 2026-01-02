-- running_style win_rate 特徴量の追加（2つ）
-- ✅ データリーケージなし
-- 1. running_style_mode_win_rate: この馬の通常脚質が今回のレース条件で使われた場合の勝率
-- 2. running_style_last1_win_rate: この馬の前走脚質が今回のレース条件で使われた場合の勝率

WITH base_features AS (
  SELECT * FROM `umadata.keiba_data.all_features_clean_with_dev`
),

-- 脚質別勝率の計算（全期間の過去データ）
-- 馬場 × 距離 × 競馬場 × 脚質 ごとの勝率
running_style_stats AS (
  SELECT
    surface,
    distance_range,
    racecourse,
    running_style_encoded,
    COUNT(*) as sample_count,
    AVG(CASE WHEN finish_position = 1 THEN 1.0 ELSE 0.0 END) as win_rate
  FROM `umadata.keiba_data.all_features_clean`
  WHERE running_style_encoded IS NOT NULL
  GROUP BY surface, distance_range, racecourse, running_style_encoded
),

-- フォールバック用: 馬場 × 距離 × 脚質
running_style_stats_surface_distance AS (
  SELECT
    surface,
    distance_range,
    running_style_encoded,
    COUNT(*) as sample_count,
    AVG(CASE WHEN finish_position = 1 THEN 1.0 ELSE 0.0 END) as win_rate
  FROM `umadata.keiba_data.all_features_clean`
  WHERE running_style_encoded IS NOT NULL
  GROUP BY surface, distance_range, running_style_encoded
),

-- フォールバック用: 馬場 × 脚質
running_style_stats_surface AS (
  SELECT
    surface,
    running_style_encoded,
    COUNT(*) as sample_count,
    AVG(CASE WHEN finish_position = 1 THEN 1.0 ELSE 0.0 END) as win_rate
  FROM `umadata.keiba_data.all_features_clean`
  WHERE running_style_encoded IS NOT NULL
  GROUP BY surface, running_style_encoded
),

-- フォールバック用: 脚質のみ
running_style_stats_overall AS (
  SELECT
    running_style_encoded,
    COUNT(*) as sample_count,
    AVG(CASE WHEN finish_position = 1 THEN 1.0 ELSE 0.0 END) as win_rate
  FROM `umadata.keiba_data.all_features_clean`
  WHERE running_style_encoded IS NOT NULL
  GROUP BY running_style_encoded
)

SELECT
  bf.*,

  -- ✅ 特徴量1: この馬の通常脚質（mode）が今回のレース条件で使われた場合の勝率
  CASE
    WHEN rs1_mode.sample_count >= 10 THEN rs1_mode.win_rate
    WHEN rs2_mode.sample_count >= 30 THEN rs2_mode.win_rate
    WHEN rs3_mode.sample_count >= 50 THEN rs3_mode.win_rate
    WHEN rs4_mode.win_rate IS NOT NULL THEN rs4_mode.win_rate
    ELSE 0.0
  END as running_style_mode_win_rate,

  -- ✅ 特徴量2: この馬の前走脚質（last1）が今回のレース条件で使われた場合の勝率
  CASE
    WHEN rs1_last1.sample_count >= 10 THEN rs1_last1.win_rate
    WHEN rs2_last1.sample_count >= 30 THEN rs2_last1.win_rate
    WHEN rs3_last1.sample_count >= 50 THEN rs3_last1.win_rate
    WHEN rs4_last1.win_rate IS NOT NULL THEN rs4_last1.win_rate
    ELSE 0.0
  END as running_style_last1_win_rate

FROM base_features bf

-- ========================================
-- mode用のJOIN（今回のレース条件 × この馬の通常脚質）
-- ========================================
LEFT JOIN running_style_stats rs1_mode
  ON rs1_mode.surface = bf.surface
  AND rs1_mode.distance_range = bf.distance_range
  AND rs1_mode.racecourse = bf.racecourse
  AND rs1_mode.running_style_encoded = bf.running_style_mode

LEFT JOIN running_style_stats_surface_distance rs2_mode
  ON rs2_mode.surface = bf.surface
  AND rs2_mode.distance_range = bf.distance_range
  AND rs2_mode.running_style_encoded = bf.running_style_mode

LEFT JOIN running_style_stats_surface rs3_mode
  ON rs3_mode.surface = bf.surface
  AND rs3_mode.running_style_encoded = bf.running_style_mode

LEFT JOIN running_style_stats_overall rs4_mode
  ON rs4_mode.running_style_encoded = bf.running_style_mode

-- ========================================
-- last1用のJOIN（今回のレース条件 × この馬の前走脚質）
-- ========================================
LEFT JOIN running_style_stats rs1_last1
  ON rs1_last1.surface = bf.surface
  AND rs1_last1.distance_range = bf.distance_range
  AND rs1_last1.racecourse = bf.racecourse
  AND rs1_last1.running_style_encoded = bf.running_style_last1

LEFT JOIN running_style_stats_surface_distance rs2_last1
  ON rs2_last1.surface = bf.surface
  AND rs2_last1.distance_range = bf.distance_range
  AND rs2_last1.running_style_encoded = bf.running_style_last1

LEFT JOIN running_style_stats_surface rs3_last1
  ON rs3_last1.surface = bf.surface
  AND rs3_last1.running_style_encoded = bf.running_style_last1

LEFT JOIN running_style_stats_overall rs4_last1
  ON rs4_last1.running_style_encoded = bf.running_style_last1
