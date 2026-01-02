
    -- リーケージ対策版: 過去走特徴量の計算

    WITH base_data AS (
      SELECT
        rm.race_id,
        rm.race_date,
        rm.venue_name as racecourse,
        rm.surface,
        rm.distance,
        rm.track_condition as going,
        rm.race_class,
        rr.horse_id,
        rr.horse_name,
        rr.finish_position,
        rr.final_time as time,
        rr.last_3f_time,
        rr.horse_number,
        rr.bracket_number,
        rr.jockey_id,
        rr.jockey_name,
        rr.trainer_id,
        rr.trainer_name,
        rr.sex,
        rr.age,
        rr.jockey_weight,
        rr.horse_weight,
        rr.weight_change,
        rr.popularity,
        rr.odds,
        rr.corner_positions,

        -- 距離帯
        CASE
          WHEN rm.distance <= 1400 THEN 1200
          WHEN rm.distance <= 1800 THEN 1600
          WHEN rm.distance <= 2200 THEN 2000
          ELSE 2400
        END as distance_range,

        -- 脚質推定
        CASE
          WHEN CAST(SPLIT(rr.corner_positions, '-')[SAFE_OFFSET(0)] AS INT64) <= 2 THEN 0
          WHEN CAST(SPLIT(rr.corner_positions, '-')[SAFE_OFFSET(0)] AS INT64) <= 5 THEN 1
          WHEN CAST(SPLIT(rr.corner_positions, '-')[SAFE_OFFSET(0)] AS INT64) <= 10 THEN 2
          ELSE 3
        END as running_style_encoded

      FROM `umadata.keiba_data.race_master` rm
      JOIN `umadata.keiba_data.race_result` rr ON rm.race_id = rr.race_id
      WHERE rm.race_date >= '2020-01-01'
    ),

    -- 過去走を取得（厳密な日付チェック付き）
    past_races AS (
      SELECT
        curr.race_id,
        curr.race_date,
        curr.horse_id,

        -- 過去走1（直近）
        (
          SELECT AS STRUCT
            past.time,
            past.last_3f_time,
            past.finish_position,
            past.running_style_encoded,
            past.race_date as past_race_date
          FROM base_data past
          WHERE past.horse_id = curr.horse_id
            AND past.race_date < curr.race_date  -- 厳密に過去のみ
          ORDER BY past.race_date DESC
          LIMIT 1
        ) as past1,

        -- 過去走2
        (
          SELECT AS STRUCT
            past.time,
            past.last_3f_time,
            past.finish_position,
            past.running_style_encoded,
            past.race_date as past_race_date
          FROM base_data past
          WHERE past.horse_id = curr.horse_id
            AND past.race_date < curr.race_date
          ORDER BY past.race_date DESC
          LIMIT 1 OFFSET 1
        ) as past2,

        -- 過去走3
        (
          SELECT AS STRUCT
            past.time,
            past.last_3f_time,
            past.finish_position,
            past.running_style_encoded,
            past.race_date as past_race_date
          FROM base_data past
          WHERE past.horse_id = curr.horse_id
            AND past.race_date < curr.race_date
          ORDER BY past.race_date DESC
          LIMIT 1 OFFSET 2
        ) as past3,

        -- 過去走4
        (
          SELECT AS STRUCT
            past.time,
            past.last_3f_time,
            past.finish_position,
            past.running_style_encoded,
            past.race_date as past_race_date
          FROM base_data past
          WHERE past.horse_id = curr.horse_id
            AND past.race_date < curr.race_date
          ORDER BY past.race_date DESC
          LIMIT 1 OFFSET 3
        ) as past4,

        -- 過去走5
        (
          SELECT AS STRUCT
            past.time,
            past.last_3f_time,
            past.finish_position,
            past.running_style_encoded,
            past.race_date as past_race_date
          FROM base_data past
          WHERE past.horse_id = curr.horse_id
            AND past.race_date < curr.race_date
          ORDER BY past.race_date DESC
          LIMIT 1 OFFSET 4
        ) as past5

      FROM base_data curr
    )

    SELECT
      b.*,

      -- 過去走のデータを展開
      pr.past1.time as time_last1,
      pr.past2.time as time_last2,
      pr.past3.time as time_last3,
      pr.past4.time as time_last4,
      pr.past5.time as time_last5,

      pr.past1.last_3f_time as last_3f_time_last1,
      pr.past2.last_3f_time as last_3f_time_last2,
      pr.past3.last_3f_time as last_3f_time_last3,
      pr.past4.last_3f_time as last_3f_time_last4,
      pr.past5.last_3f_time as last_3f_time_last5,

      pr.past1.finish_position as finish_position_last1,
      pr.past2.finish_position as finish_position_last2,
      pr.past3.finish_position as finish_position_last3,
      pr.past4.finish_position as finish_position_last4,
      pr.past5.finish_position as finish_position_last5,

      -- 過去走の日付も保存（検証用）
      pr.past1.past_race_date as past_race_date_1,
      pr.past2.past_race_date as past_race_date_2,
      pr.past3.past_race_date as past_race_date_3,
      pr.past4.past_race_date as past_race_date_4,
      pr.past5.past_race_date as past_race_date_5,

      -- 集約特徴量
      (COALESCE(pr.past1.finish_position, 0) +
       COALESCE(pr.past2.finish_position, 0) +
       COALESCE(pr.past3.finish_position, 0) +
       COALESCE(pr.past4.finish_position, 0) +
       COALESCE(pr.past5.finish_position, 0)) / 5.0 as finish_pos_mean_last5,

      LEAST(
        COALESCE(pr.past1.finish_position, 999),
        COALESCE(pr.past2.finish_position, 999),
        COALESCE(pr.past3.finish_position, 999),
        COALESCE(pr.past4.finish_position, 999),
        COALESCE(pr.past5.finish_position, 999)
      ) as finish_pos_best_last5,

      pr.past1.running_style_encoded as running_style_last1,

      -- 最頻脚質（簡易版）
      COALESCE(pr.past1.running_style_encoded,
               pr.past2.running_style_encoded,
               pr.past3.running_style_encoded) as running_style_mode,

      -- 前走からの日数
      DATE_DIFF(b.race_date, pr.past1.past_race_date, DAY) as days_since_last_race

    FROM base_data b
    LEFT JOIN past_races pr
      ON b.race_id = pr.race_id
      AND b.horse_id = pr.horse_id

    -- 検証: 過去走の日付が現在より未来でないことを確認
    WHERE (pr.past1.past_race_date IS NULL OR pr.past1.past_race_date < b.race_date)
      AND (pr.past2.past_race_date IS NULL OR pr.past2.past_race_date < b.race_date)
      AND (pr.past3.past_race_date IS NULL OR pr.past3.past_race_date < b.race_date)
      AND (pr.past4.past_race_date IS NULL OR pr.past4.past_race_date < b.race_date)
      AND (pr.past5.past_race_date IS NULL OR pr.past5.past_race_date < b.race_date)
    