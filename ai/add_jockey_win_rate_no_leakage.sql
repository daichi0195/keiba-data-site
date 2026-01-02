-- 騎手の勝率・複勝率を追加（データリーケージ防止版）
--
-- 各レースに対して、そのレース日付より前のデータのみを使って統計を計算

CREATE OR REPLACE TABLE `umadata.keiba_data.all_features_with_jockey_win_rate_no_leakage` AS

WITH
-- 全レースの基本情報
all_races AS (
  SELECT
    af.*,
    rm.race_date as current_race_date,
    rm.venue_name as current_venue_name,
    rm.surface as current_surface,
    rm.distance as current_distance
  FROM `umadata.keiba_data.all_features_base_no_leakage` af
  JOIN `umadata.keiba_data.race_master` rm
    ON af.race_id = rm.race_id
),

-- 騎手の過去成績を計算（各レースより前のデータのみ）
jockey_past_performance AS (
  SELECT
    current_race.race_id,
    current_race.jockey_id,
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
    ON current_race.jockey_id = past_rr.jockey_id
  LEFT JOIN `umadata.keiba_data.race_master` past_rm
    ON past_rr.race_id = past_rm.race_id
  WHERE past_rm.race_date < current_race.current_race_date  -- 重要：現在のレースより前のデータのみ
    AND past_rm.surface IN ('芝', 'ダート')
  GROUP BY
    current_race.race_id,
    current_race.jockey_id,
    current_race.current_venue_name,
    current_race.current_surface,
    current_race.current_distance
)

-- 階層的フォールバックで統計を選択
SELECT
  ar.*,

  -- 騎手勝率（階層的フォールバック）
  COALESCE(
    CASE WHEN jpp.detailed_rides >= 5 THEN jpp.detailed_win_rate END,
    CASE WHEN jpp.medium_rides >= 10 THEN jpp.medium_win_rate END,
    CASE WHEN jpp.overall_rides >= 20 THEN jpp.overall_win_rate END,
    0.05  -- デフォルト値
  ) as jockey_win_rate_surface_distance,

  -- 騎手複勝率（階層的フォールバック）
  COALESCE(
    CASE WHEN jpp.detailed_rides >= 5 THEN jpp.detailed_place_rate END,
    CASE WHEN jpp.medium_rides >= 10 THEN jpp.medium_place_rate END,
    CASE WHEN jpp.overall_rides >= 20 THEN jpp.overall_place_rate END,
    0.15  -- デフォルト値
  ) as jockey_place_rate_surface_distance,

  -- どのレベルの統計を使ったか
  CASE
    WHEN jpp.detailed_rides >= 5 THEN 'detailed'
    WHEN jpp.medium_rides >= 10 THEN 'medium'
    WHEN jpp.overall_rides >= 20 THEN 'overall'
    ELSE 'default'
  END as jockey_stat_level,

  -- 参考：過去の騎乗回数
  jpp.detailed_rides,
  jpp.medium_rides,
  jpp.overall_rides

FROM all_races ar
LEFT JOIN jockey_past_performance jpp
  ON ar.race_id = jpp.race_id
  AND ar.jockey_id = jpp.jockey_id;
