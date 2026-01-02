-- 騎手の勝率を追加
--
-- 現在: jockey_place_rate_surface_distance (複勝率)
-- 追加: jockey_win_rate_surface_distance (勝率)
--
-- KPIがTop-1的中率（1着予測）なので、勝率を使うべき

CREATE OR REPLACE TABLE `umadata.keiba_data.all_features_with_jockey_win_rate` AS

WITH
-- 各騎手の競馬場×馬場×距離別の勝率を計算
jockey_stats_detailed AS (
  SELECT
    rm.venue_name,
    rm.surface,
    rm.distance,
    rr.jockey_id,
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
  GROUP BY rm.venue_name, rm.surface, rm.distance, rr.jockey_id
  HAVING COUNT(*) >= 5  -- 最低5走以上
),

-- 各騎手の馬場×距離別の勝率（競馬場を問わず）
jockey_stats_medium AS (
  SELECT
    rm.surface,
    rm.distance,
    rr.jockey_id,
    COUNT(*) as rides,
    SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
    AVG(CASE WHEN rr.finish_position = 1 THEN 1.0 ELSE 0.0 END) as win_rate,
    AVG(CASE WHEN rr.finish_position <= 3 THEN 1.0 ELSE 0.0 END) as place_rate
  FROM `umadata.keiba_data.race_result` rr
  JOIN `umadata.keiba_data.race_master` rm
    ON rr.race_id = rm.race_id
  WHERE rm.race_date < '2025-01-01'
    AND rm.surface IN ('芝', 'ダート')
  GROUP BY rm.surface, rm.distance, rr.jockey_id
  HAVING COUNT(*) >= 10
),

-- 各騎手の全体勝率
jockey_stats_overall AS (
  SELECT
    rr.jockey_id,
    COUNT(*) as rides,
    SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) as wins,
    AVG(CASE WHEN rr.finish_position = 1 THEN 1.0 ELSE 0.0 END) as win_rate,
    AVG(CASE WHEN rr.finish_position <= 3 THEN 1.0 ELSE 0.0 END) as place_rate
  FROM `umadata.keiba_data.race_result` rr
  JOIN `umadata.keiba_data.race_master` rm
    ON rr.race_id = rm.race_id
  WHERE rm.race_date < '2025-01-01'
    AND rm.surface IN ('芝', 'ダート')
  GROUP BY rr.jockey_id
  HAVING COUNT(*) >= 20
)

-- 既存のall_featuresに騎手勝率を追加
SELECT
  af.*,

  -- 階層的フォールバック: 詳細 → 中程度 → 全体
  COALESCE(
    jsd.win_rate,
    jsm.win_rate,
    jso.win_rate,
    0.05  -- デフォルト値（全体平均の約5%）
  ) as jockey_win_rate_surface_distance,

  -- 参考: 複勝率も残しておく（比較用）
  COALESCE(
    jsd.place_rate,
    jsm.place_rate,
    jso.place_rate,
    0.15
  ) as jockey_place_rate_surface_distance_v2,

  -- どのレベルの統計を使ったか
  CASE
    WHEN jsd.win_rate IS NOT NULL THEN 'detailed'
    WHEN jsm.win_rate IS NOT NULL THEN 'medium'
    WHEN jso.win_rate IS NOT NULL THEN 'overall'
    ELSE 'default'
  END as jockey_stat_level

FROM `umadata.keiba_data.all_features_with_aggregated_time_index` af
LEFT JOIN `umadata.keiba_data.race_master` rm
  ON af.race_id = rm.race_id
LEFT JOIN jockey_stats_detailed jsd
  ON af.jockey_id = jsd.jockey_id
  AND rm.venue_name = jsd.venue_name
  AND rm.surface = jsd.surface
  AND rm.distance = jsd.distance
LEFT JOIN jockey_stats_medium jsm
  ON af.jockey_id = jsm.jockey_id
  AND rm.surface = jsm.surface
  AND rm.distance = jsm.distance
LEFT JOIN jockey_stats_overall jso
  ON af.jockey_id = jso.jockey_id;
