-- 調教師の勝率・複勝率を追加（データリーケージ防止版）
--
-- 各レースに対して、そのレース日付より前のデータのみを使って統計を計算

CREATE OR REPLACE TABLE `umadata.keiba_data.all_features_with_trainer_stats_no_leakage` AS

WITH
-- 全レースの基本情報
all_races AS (
  SELECT
    af.*
  FROM `umadata.keiba_data.all_features_with_jockey_win_rate_no_leakage` af
),

-- 調教師の過去成績を計算（各レースより前のデータのみ）
trainer_past_performance AS (
  SELECT
    current_race.race_id,
    current_race.trainer_id,
    current_race.current_venue_name as venue_name,
    current_race.current_surface as surface,
    current_race.current_distance as distance,

    -- 詳細統計（競馬場×馬場×距離別）
    COUNT(CASE
      WHEN past_rm.venue_name = current_race.current_venue_name
        AND past_rm.surface = current_race.current_surface
        AND past_rm.distance = current_race.current_distance
      THEN 1
    END) as detailed_rides,
    AVG(CASE
      WHEN past_rm.venue_name = current_race.current_venue_name
        AND past_rm.surface = current_race.current_surface
        AND past_rm.distance = current_race.current_distance
        AND past_rr.finish_position = 1
      THEN 1.0
      WHEN past_rm.venue_name = current_race.current_venue_name
        AND past_rm.surface = current_race.current_surface
        AND past_rm.distance = current_race.current_distance
      THEN 0.0
    END) as detailed_win_rate,
    AVG(CASE
      WHEN past_rm.venue_name = current_race.current_venue_name
        AND past_rm.surface = current_race.current_surface
        AND past_rm.distance = current_race.current_distance
        AND past_rr.finish_position <= 3
      THEN 1.0
      WHEN past_rm.venue_name = current_race.current_venue_name
        AND past_rm.surface = current_race.current_surface
        AND past_rm.distance = current_race.current_distance
      THEN 0.0
    END) as detailed_place_rate,

    -- 中程度統計（馬場×距離別）
    COUNT(CASE
      WHEN past_rm.surface = current_race.current_surface
        AND past_rm.distance = current_race.current_distance
      THEN 1
    END) as medium_rides,
    AVG(CASE
      WHEN past_rm.surface = current_race.current_surface
        AND past_rm.distance = current_race.current_distance
        AND past_rr.finish_position = 1
      THEN 1.0
      WHEN past_rm.surface = current_race.current_surface
        AND past_rm.distance = current_race.current_distance
      THEN 0.0
    END) as medium_win_rate,
    AVG(CASE
      WHEN past_rm.surface = current_race.current_surface
        AND past_rm.distance = current_race.current_distance
        AND past_rr.finish_position <= 3
      THEN 1.0
      WHEN past_rm.surface = current_race.current_surface
        AND past_rm.distance = current_race.current_distance
      THEN 0.0
    END) as medium_place_rate,

    -- 全体統計
    COUNT(*) as overall_rides,
    AVG(CASE WHEN past_rr.finish_position = 1 THEN 1.0 ELSE 0.0 END) as overall_win_rate,
    AVG(CASE WHEN past_rr.finish_position <= 3 THEN 1.0 ELSE 0.0 END) as overall_place_rate

  FROM all_races current_race
  LEFT JOIN `umadata.keiba_data.race_result` past_rr
    ON current_race.trainer_id = past_rr.trainer_id
  LEFT JOIN `umadata.keiba_data.race_master` past_rm
    ON past_rr.race_id = past_rm.race_id
  WHERE past_rm.race_date < current_race.current_race_date  -- 重要：現在のレースより前のデータのみ
    AND past_rm.surface IN ('芝', 'ダート')
  GROUP BY
    current_race.race_id,
    current_race.trainer_id,
    current_race.current_venue_name,
    current_race.current_surface,
    current_race.current_distance
)

-- 階層的フォールバックで統計を選択
SELECT
  ar.*,

  -- 調教師勝率（階層的フォールバック）
  COALESCE(
    CASE WHEN tpp.detailed_rides >= 5 THEN tpp.detailed_win_rate END,
    CASE WHEN tpp.medium_rides >= 10 THEN tpp.medium_win_rate END,
    CASE WHEN tpp.overall_rides >= 20 THEN tpp.overall_win_rate END,
    0.05  -- デフォルト値
  ) as trainer_win_rate_surface_distance,

  -- 調教師複勝率（階層的フォールバック）
  COALESCE(
    CASE WHEN tpp.detailed_rides >= 5 THEN tpp.detailed_place_rate END,
    CASE WHEN tpp.medium_rides >= 10 THEN tpp.medium_place_rate END,
    CASE WHEN tpp.overall_rides >= 20 THEN tpp.overall_place_rate END,
    0.15  -- デフォルト値
  ) as trainer_place_rate_surface_distance,

  -- どのレベルの統計を使ったか
  CASE
    WHEN tpp.detailed_rides >= 5 THEN 'detailed'
    WHEN tpp.medium_rides >= 10 THEN 'medium'
    WHEN tpp.overall_rides >= 20 THEN 'overall'
    ELSE 'default'
  END as trainer_stat_level,

  -- 参考：過去の騎乗回数
  tpp.detailed_rides as trainer_detailed_rides,
  tpp.medium_rides as trainer_medium_rides,
  tpp.overall_rides as trainer_overall_rides

FROM all_races ar
LEFT JOIN trainer_past_performance tpp
  ON ar.race_id = tpp.race_id
  AND ar.trainer_id = tpp.trainer_id;
