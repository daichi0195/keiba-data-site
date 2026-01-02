-- 調教師の勝率・複勝率を追加
--
-- 騎手統計と同様に、調教師のコース×馬場×距離別の勝率・複勝率を計算
-- 階層的フォールバック: 詳細 → 中程度 → 全体

CREATE OR REPLACE TABLE `umadata.keiba_data.all_features_with_trainer_stats` AS

WITH
-- 各調教師の競馬場×馬場×距離別の勝率を計算
trainer_stats_detailed AS (
  SELECT
    rm.venue_name,
    rm.surface,
    rm.distance,
    rr.trainer_id,
    COUNT(*) as rides,
    SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) as places,
    AVG(CASE WHEN rr.finish_position = 1 THEN 1.0 ELSE 0.0 END) as win_rate,
    AVG(CASE WHEN rr.finish_position <= 3 THEN 1.0 ELSE 0.0 END) as place_rate
  FROM `umadata.keiba_data.race_result` rr
  JOIN `umadata.keiba_data.race_master` rm
    ON rr.race_id = rm.race_id
  WHERE rm.race_date < '2025-01-01'  -- 訓練期間のデータのみ
    AND rm.surface IN ('芝', 'ダート')
  GROUP BY rm.venue_name, rm.surface, rm.distance, rr.trainer_id
  HAVING COUNT(*) >= 5  -- 最低5走以上
),

-- 各調教師の馬場×距離別の勝率（競馬場を問わず）
trainer_stats_medium AS (
  SELECT
    rm.surface,
    rm.distance,
    rr.trainer_id,
    COUNT(*) as rides,
    SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
    AVG(CASE WHEN rr.finish_position = 1 THEN 1.0 ELSE 0.0 END) as win_rate,
    AVG(CASE WHEN rr.finish_position <= 3 THEN 1.0 ELSE 0.0 END) as place_rate
  FROM `umadata.keiba_data.race_result` rr
  JOIN `umadata.keiba_data.race_master` rm
    ON rr.race_id = rm.race_id
  WHERE rm.race_date < '2025-01-01'
    AND rm.surface IN ('芝', 'ダート')
  GROUP BY rm.surface, rm.distance, rr.trainer_id
  HAVING COUNT(*) >= 10
),

-- 各調教師の全体勝率
trainer_stats_overall AS (
  SELECT
    rr.trainer_id,
    COUNT(*) as rides,
    SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
    AVG(CASE WHEN rr.finish_position = 1 THEN 1.0 ELSE 0.0 END) as win_rate,
    AVG(CASE WHEN rr.finish_position <= 3 THEN 1.0 ELSE 0.0 END) as place_rate
  FROM `umadata.keiba_data.race_result` rr
  JOIN `umadata.keiba_data.race_master` rm
    ON rr.race_id = rm.race_id
  WHERE rm.race_date < '2025-01-01'
    AND rm.surface IN ('芝', 'ダート')
  GROUP BY rr.trainer_id
  HAVING COUNT(*) >= 20
)

-- 既存のall_features_complete_improvedに調教師勝率・複勝率を追加
SELECT
  af.*,

  -- 階層的フォールバック: 詳細 → 中程度 → 全体
  COALESCE(
    tsd.win_rate,
    tsm.win_rate,
    tso.win_rate,
    0.05  -- デフォルト値（全体平均の約5%）
  ) as trainer_win_rate_surface_distance,

  -- 複勝率
  COALESCE(
    tsd.place_rate,
    tsm.place_rate,
    tso.place_rate,
    0.15  -- デフォルト値（全体平均の約15%）
  ) as trainer_place_rate_surface_distance,

  -- どのレベルの統計を使ったか
  CASE
    WHEN tsd.win_rate IS NOT NULL THEN 'detailed'
    WHEN tsm.win_rate IS NOT NULL THEN 'medium'
    WHEN tso.win_rate IS NOT NULL THEN 'overall'
    ELSE 'default'
  END as trainer_stat_level,

  -- 参考：騎乗回数
  COALESCE(tsd.rides, tsm.rides, tso.rides, 0) as trainer_rides_surface_distance

FROM `umadata.keiba_data.all_features_complete_improved` af
LEFT JOIN `umadata.keiba_data.race_master` rm
  ON af.race_id = rm.race_id
LEFT JOIN trainer_stats_detailed tsd
  ON af.trainer_id = tsd.trainer_id
  AND rm.venue_name = tsd.venue_name
  AND rm.surface = tsd.surface
  AND rm.distance = tsd.distance
LEFT JOIN trainer_stats_medium tsm
  ON af.trainer_id = tsm.trainer_id
  AND rm.surface = tsm.surface
  AND rm.distance = tsm.distance
LEFT JOIN trainer_stats_overall tso
  ON af.trainer_id = tso.trainer_id;
