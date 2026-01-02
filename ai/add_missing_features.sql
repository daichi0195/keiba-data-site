-- 欠けている特徴量を追加
--
-- 追加する特徴量:
-- 1. running_style_mode_win_rate: 最頻脚質の勝率
-- 2. running_style_last1_win_rate: 直近脚質の勝率
-- 3. time_dev_trend_3races: タイム指数のトレンド（直近3走） ← time_index_zscore_trend_3と同じ
-- 4. last3f_dev_trend_3races: 上がり3F指数のトレンド（直近3走） ← last3f_index_zscore_trend_3と同じ
-- 5. time_dev_improvement: タイム指数の改善度 ← time_index_zscore_last1 - last3
-- 6. last3f_dev_improvement: 上がり3F指数の改善度 ← last3f_index_zscore_last1 - last3
-- 7. is_after_long_rest: 長期休養明けフラグ（90日以上）
-- 8. is_consecutive_race: 連闘フラグ（14日以内）
-- 9. is_debut: デビュー戦フラグ
-- 10. rest_period_category: 休養期間カテゴリ（0-2週、2-4週、1-3ヶ月、3ヶ月以上、新馬）
--
-- 注意: タイム偏差系は既存のタイム指数（z-score標準化）を使用
--       新しく計算し直したタイム指数を活用

CREATE OR REPLACE TABLE `umadata.keiba_data.all_features_complete` AS

WITH
-- 脚質別の勝率統計を計算（all_features_finalテーブルから）
running_style_stats AS (
  SELECT
    surface,
    distance,
    running_style_last1 as running_style,
    COUNT(*) as races,
    AVG(CASE WHEN finish_position = 1 THEN 1.0 ELSE 0.0 END) as win_rate
  FROM `umadata.keiba_data.all_features_final`
  WHERE race_date < '2025-01-01'  -- 訓練期間のみ
    AND surface IN ('芝', 'ダート')
    AND running_style_last1 IS NOT NULL
    AND finish_position IS NOT NULL
  GROUP BY surface, distance, running_style_last1
  HAVING COUNT(*) >= 10  -- 最低10走以上
)

-- タイム偏差は既存のタイム指数（z-score）を使用するため、
-- 新たに計算する必要はありません

-- メインクエリ: すべての特徴量を結合
SELECT
  base.*,

  -- 1. 脚質勝率（最頻脚質）
  COALESCE(rs_mode.win_rate, 0.05) as running_style_mode_win_rate,

  -- 2. 脚質勝率（直近脚質）
  COALESCE(rs_last1.win_rate, 0.05) as running_style_last1_win_rate,

  -- 3-4. タイム指数のトレンド（直近3走）
  -- 既存のtime_index_zscore_trend_3を使用（= last1 - last3）
  -- トレンド = (last1 - last3) / 2 で平均的な改善度を表す
  COALESCE(base.time_index_zscore_trend_3 / 2.0, 0) as time_dev_trend_3races,
  COALESCE(base.last3f_index_zscore_trend_3 / 2.0, 0) as last3f_dev_trend_3races,

  -- 5-6. タイム指数の改善度（last1 - last3）
  -- 既存のtime_index_zscore_trend_3をそのまま使用
  COALESCE(base.time_index_zscore_trend_3, 0) as time_dev_improvement,
  COALESCE(base.last3f_index_zscore_trend_3, 0) as last3f_dev_improvement,

  -- 7. 長期休養明けフラグ（90日以上）
  CASE
    WHEN base.days_since_last_race >= 90 THEN 1
    ELSE 0
  END as is_after_long_rest,

  -- 8. 連闘フラグ（14日以内）
  CASE
    WHEN base.days_since_last_race <= 14 AND base.days_since_last_race > 0 THEN 1
    ELSE 0
  END as is_consecutive_race,

  -- 9. デビュー戦フラグ
  CASE
    WHEN base.finish_position_last1 IS NULL THEN 1
    ELSE 0
  END as is_debut,

  -- 10. 休養期間カテゴリ
  CASE
    WHEN base.finish_position_last1 IS NULL THEN 4  -- 新馬
    WHEN base.days_since_last_race <= 14 THEN 0     -- 0-2週
    WHEN base.days_since_last_race <= 28 THEN 1     -- 2-4週
    WHEN base.days_since_last_race <= 90 THEN 2     -- 1-3ヶ月
    ELSE 3                                          -- 3ヶ月以上
  END as rest_period_category

FROM `umadata.keiba_data.all_features_final` base

-- 現在のレースの馬場条件を取得
LEFT JOIN `umadata.keiba_data.race_master` rm
  ON base.race_id = rm.race_id

-- 最頻脚質の勝率
LEFT JOIN running_style_stats rs_mode
  ON rm.surface = rs_mode.surface
  AND rm.distance = rs_mode.distance
  AND base.running_style_mode = rs_mode.running_style

-- 直近脚質の勝率
LEFT JOIN running_style_stats rs_last1
  ON rm.surface = rs_last1.surface
  AND rm.distance = rs_last1.distance
  AND base.running_style_last1 = rs_last1.running_style;
