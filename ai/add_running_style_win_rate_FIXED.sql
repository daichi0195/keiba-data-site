-- running_style_combined_win_rate 特徴量の追加（修正版）
-- ✅ 前走の脚質（running_style_last1）を使用してデータリーケージを防止
-- 馬場 × 距離 × 競馬場 × 脚質 の条件別勝率（階層的フォールバック付き）

WITH base_features AS (
  SELECT * FROM `umadata.keiba_data.all_features_clean_with_dev`
),

-- 脚質別勝率の計算（全期間のデータを使用）
running_style_stats AS (
  SELECT
    surface,
    distance_range,
    racecourse,
    running_style_encoded,

    -- サンプル数
    COUNT(*) as sample_count,

    -- 勝率
    AVG(CASE WHEN finish_position = 1 THEN 1.0 ELSE 0.0 END) as win_rate

  FROM `umadata.keiba_data.all_features_clean`
  WHERE running_style_encoded IS NOT NULL
  GROUP BY surface, distance_range, racecourse, running_style_encoded
),

-- より粗い粒度の統計（フォールバック用）
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

running_style_stats_overall AS (
  SELECT
    running_style_encoded,
    COUNT(*) as sample_count,
    AVG(CASE WHEN finish_position = 1 THEN 1.0 ELSE 0.0 END) as win_rate
  FROM `umadata.keiba_data.all_features_clean`
  WHERE running_style_encoded IS NOT NULL
  GROUP BY running_style_encoded
)

-- 階層的フォールバックで特徴量を追加
SELECT
  bf.*,

  -- 階層的フォールバック
  -- ✅ 修正: bf.running_style_encoded → bf.running_style_last1（前走の脚質を使用）
  CASE
    -- Level 1: 競馬場 × 馬場 × 距離 × 脚質（最も詳細、サンプル数10以上）
    WHEN rs1.sample_count >= 10 THEN rs1.win_rate

    -- Level 2: 馬場 × 距離 × 脚質（サンプル数30以上）
    WHEN rs2.sample_count >= 30 THEN rs2.win_rate

    -- Level 3: 馬場 × 脚質（サンプル数50以上）
    WHEN rs3.sample_count >= 50 THEN rs3.win_rate

    -- Level 4: 脚質のみ（全体統計）
    ELSE rs4.win_rate
  END as running_style_combined_win_rate

FROM base_features bf

-- ✅ 修正: 前走の脚質（running_style_last1）を使用
-- Level 1: 最も詳細
LEFT JOIN running_style_stats rs1
  ON rs1.surface = bf.surface
  AND rs1.distance_range = bf.distance_range
  AND rs1.racecourse = bf.racecourse
  AND rs1.running_style_encoded = bf.running_style_last1

-- Level 2: 馬場×距離×脚質
LEFT JOIN running_style_stats_surface_distance rs2
  ON rs2.surface = bf.surface
  AND rs2.distance_range = bf.distance_range
  AND rs2.running_style_encoded = bf.running_style_last1

-- Level 3: 馬場×脚質
LEFT JOIN running_style_stats_surface rs3
  ON rs3.surface = bf.surface
  AND rs3.running_style_encoded = bf.running_style_last1

-- Level 4: 脚質のみ（全体）
LEFT JOIN running_style_stats_overall rs4
  ON rs4.running_style_encoded = bf.running_style_last1
