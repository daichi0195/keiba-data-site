-- リーディングデータを生成するSQL
-- 騎手、調教師、種牡馬のリーディングTOP 10を計算
-- 実行結果をJSONとしてエクスポートし、GCSに保存する

-- 現在の年度を設定（実行時に変更）
DECLARE current_year INT64 DEFAULT 2025;

-- 騎手リーディング TOP 10
-- all_features_complete_no_leakageテーブルから集計し、jockeyテーブルから名前を取得
CREATE TEMP TABLE jockey_leading AS
SELECT
  r.jockey_id,
  j.jockey_name,
  COUNT(*) as rides,
  COUNTIF(r.finish_position = 1) as wins,
  ROUND(COUNTIF(r.finish_position = 1) * 100.0 / COUNT(*), 1) as win_rate
FROM `umadata.keiba_data.all_features_complete_no_leakage` r
INNER JOIN `umadata.keiba_data.jockey` j ON r.jockey_id = j.jockey_id
WHERE EXTRACT(YEAR FROM r.race_date) = current_year
  AND r.jockey_id IS NOT NULL
GROUP BY r.jockey_id, j.jockey_name
HAVING wins > 0
ORDER BY wins DESC
LIMIT 10;

-- 調教師リーディング TOP 10
-- all_features_complete_no_leakageテーブルから集計し、trainerテーブルから名前を取得
CREATE TEMP TABLE trainer_leading AS
SELECT
  r.trainer_id,
  t.trainer_name,
  COUNT(*) as rides,
  COUNTIF(r.finish_position = 1) as wins,
  ROUND(COUNTIF(r.finish_position = 1) * 100.0 / COUNT(*), 1) as win_rate
FROM `umadata.keiba_data.all_features_complete_no_leakage` r
INNER JOIN `umadata.keiba_data.trainer` t ON r.trainer_id = t.trainer_id
WHERE EXTRACT(YEAR FROM r.race_date) = current_year
  AND r.trainer_id IS NOT NULL
GROUP BY r.trainer_id, t.trainer_name
HAVING wins > 0
ORDER BY wins DESC
LIMIT 10;

-- 種牡馬リーディング TOP 10
-- race_resultとhorseテーブルをJOINして種牡馬別に集計
CREATE TEMP TABLE sire_leading AS
SELECT
  h.father as sire_name,
  COUNT(*) as rides,
  COUNTIF(rr.finish_position = 1) as wins,
  ROUND(COUNTIF(rr.finish_position = 1) * 100.0 / COUNT(*), 1) as win_rate
FROM `umadata.keiba_data.race_result` rr
INNER JOIN `umadata.keiba_data.horse` h ON rr.horse_id = h.horse_id
INNER JOIN `umadata.keiba_data.race_master` rm ON rr.race_id = rm.race_id
WHERE EXTRACT(YEAR FROM rm.race_date) = current_year
  AND h.father IS NOT NULL
  AND h.father != ''
GROUP BY h.father
HAVING wins > 0
ORDER BY wins DESC
LIMIT 10;

-- 結果を結合してJSON形式で出力
SELECT
  current_year as year,
  CURRENT_TIMESTAMP() as last_updated,
  ARRAY(
    SELECT AS STRUCT
      ROW_NUMBER() OVER (ORDER BY wins DESC) as rank,
      jockey_id as id,
      jockey_name as name,
      wins,
      rides,
      win_rate as winRate
    FROM jockey_leading
  ) as jockey_leading,
  ARRAY(
    SELECT AS STRUCT
      ROW_NUMBER() OVER (ORDER BY wins DESC) as rank,
      trainer_id as id,
      trainer_name as name,
      wins,
      rides,
      win_rate as winRate
    FROM trainer_leading
  ) as trainer_leading,
  ARRAY(
    SELECT AS STRUCT
      ROW_NUMBER() OVER (ORDER BY wins DESC) as rank,
      sire_name as name,
      wins,
      rides,
      win_rate as winRate
    FROM sire_leading
  ) as sire_leading;
