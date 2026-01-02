-- 欠けている特徴量を追加（データリーケージ防止版）
--
-- 追加する特徴量:
-- 1. time_dev_trend_3races: タイム指数のトレンド（直近3走）
-- 2. last3f_dev_trend_3races: 上がり3F指数のトレンド（直近3走）
-- 3. time_dev_improvement: タイム指数の改善度
-- 4. last3f_dev_improvement: 上がり3F指数の改善度
-- 5. is_after_long_rest: 長期休養明けフラグ（90日以上）
-- 6. is_consecutive_race: 連闘フラグ（14日以内）
-- 7. is_debut: デビュー戦フラグ
-- 8. rest_period_category: 休養期間カテゴリ
--
-- 注: 脚質統計（running_style_mode_win_rate, running_style_last1_win_rate）は
--     データリーケージのリスクが高いため削除しました。
--     脚質自体は running_style_mode と running_style_last1 として既に含まれています。
--
-- ✅ データリーケージ防止: 既存の特徴量のみを使用し、新たな集計は行いません

CREATE OR REPLACE TABLE `umadata.keiba_data.all_features_complete_no_leakage` AS

-- メインクエリ: すべての特徴量を結合
SELECT
  base.*,

  -- 1-2. タイム指数のトレンド（直近3走）
  -- 既存のtime_index_zscore_trend_3_improvedを使用（= last1 - last3）
  -- トレンド = (last1 - last3) / 2 で平均的な改善度を表す
  COALESCE(base.time_index_zscore_trend_3_improved / 2.0, 0) as time_dev_trend_3races,
  COALESCE(base.last3f_index_zscore_trend_3 / 2.0, 0) as last3f_dev_trend_3races,

  -- 3-4. タイム指数の改善度（last1 - last3）
  -- 既存のtime_index_zscore_trend_3_improvedをそのまま使用
  COALESCE(base.time_index_zscore_trend_3_improved, 0) as time_dev_improvement,
  COALESCE(base.last3f_index_zscore_trend_3, 0) as last3f_dev_improvement,

  -- 5. 長期休養明けフラグ（90日以上）
  CASE
    WHEN base.days_since_last_race >= 90 THEN 1
    ELSE 0
  END as is_after_long_rest,

  -- 6. 連闘フラグ（14日以内）
  CASE
    WHEN base.days_since_last_race <= 14 AND base.days_since_last_race > 0 THEN 1
    ELSE 0
  END as is_consecutive_race,

  -- 7. デビュー戦フラグ
  CASE
    WHEN base.finish_position_last1 IS NULL THEN 1
    ELSE 0
  END as is_debut,

  -- 8. 休養期間カテゴリ
  CASE
    WHEN base.finish_position_last1 IS NULL THEN 4  -- 新馬
    WHEN base.days_since_last_race <= 14 THEN 0     -- 0-2週
    WHEN base.days_since_last_race <= 28 THEN 1     -- 2-4週
    WHEN base.days_since_last_race <= 90 THEN 2     -- 1-3ヶ月
    ELSE 3                                          -- 3ヶ月以上
  END as rest_period_category

FROM `umadata.keiba_data.all_features_with_trainer_stats_no_leakage` base;
