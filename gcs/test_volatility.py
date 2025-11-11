#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
volatility_stats のデバッグスクリプト
特定のコースでvolatility_statsがNoneになる理由を調査
"""

from google.cloud import bigquery

PROJECT_ID = 'umadata'
DATASET = 'umadata.keiba_data'

# テスト対象のコース（最初の実行で失敗したコース）
TEST_COURSES = [
    {'venue': '中山', 'surface': '芝', 'distance': 1200, 'track_variant': None},
    {'venue': '中山', 'surface': '芝', 'distance': 1600, 'track_variant': None},
    {'venue': '中山', 'surface': '芝', 'distance': 2200, 'track_variant': None},
    {'venue': '阪神', 'surface': '芝', 'distance': 1600, 'track_variant': None},
    {'venue': '阪神', 'surface': '芝', 'distance': 1800, 'track_variant': None},
    {'venue': '阪神', 'surface': '芝', 'distance': 2400, 'track_variant': None},
    {'venue': '京都', 'surface': '芝', 'distance': 2400, 'track_variant': None},
    {'venue': '京都', 'surface': '芝', 'distance': 2200, 'track_variant': None},
    {'venue': '京都', 'surface': '芝', 'distance': 1800, 'track_variant': None},
    {'venue': '新潟', 'surface': '芝', 'distance': 1600, 'track_variant': None},
    {'venue': '新潟', 'surface': '芝', 'distance': 1800, 'track_variant': None},
]


def test_volatility_data(client, venue, surface, distance, track_variant):
    """指定コースの三連単データを調査"""
    # track_variant条件を動的に生成
    track_variant_condition = "AND rm.track_variant IS NULL" if track_variant is None else f"AND rm.track_variant = '{track_variant}'"

    print(f"\n{'='*60}")
    print(f"📊 Testing: {venue} {surface} {distance}m (track_variant: {track_variant})")
    print(f"{'='*60}")

    # Step 1: このコースの三連単データ件数を確認
    count_query = f"""
    SELECT
      COUNT(*) as total_races,
      COUNT(CASE WHEN rm.sanrentan IS NOT NULL THEN 1 END) as races_with_sanrentan
    FROM
      `{DATASET}.race_master` rm
    WHERE
      rm.venue_name = '{venue}'
      AND rm.surface = '{surface}'
      AND rm.distance = {distance}
      {track_variant_condition}
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    """

    try:
        results = client.query(count_query).result()
        row = next(results)
        total_races = row['total_races']
        races_with_sanrentan = row['races_with_sanrentan']

        print(f"  📈 Total races: {total_races}")
        print(f"  🎯 Races with sanrentan data: {races_with_sanrentan}")

        if races_with_sanrentan == 0:
            print(f"  ❌ No sanrentan data available!")
            return

        if races_with_sanrentan <= 20:
            print(f"  ⚠️  Insufficient data (needs > 20, got {races_with_sanrentan})")

    except Exception as e:
        print(f"  ❌ Error in count query: {str(e)}")
        return

    # Step 2: 三連単の中央値を計算してみる
    median_query = f"""
    SELECT
      APPROX_QUANTILES(CAST(REGEXP_EXTRACT(rm.sanrentan, r': (\\d+)') AS FLOAT64), 100)[OFFSET(50)] as median_payback
    FROM
      `{DATASET}.race_master` rm
    WHERE
      rm.venue_name = '{venue}'
      AND rm.surface = '{surface}'
      AND rm.distance = {distance}
      {track_variant_condition}
      AND rm.sanrentan IS NOT NULL
      AND rm.surface != '障害'
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    """

    try:
        results = client.query(median_query).result()
        row = next(results)
        median = row['median_payback']

        if median:
            print(f"  💰 Median sanrentan payback: {int(median):,}円")
        else:
            print(f"  ⚠️  Could not calculate median (data issue)")

    except Exception as e:
        print(f"  ❌ Error in median query: {str(e)}")
        return

    # Step 3: all_course_statsに含まれるか確認
    all_courses_query = f"""
    WITH all_course_stats AS (
      SELECT
        venue_name,
        surface,
        distance,
        track_variant,
        COUNT(*) as race_count,
        APPROX_QUANTILES(CAST(REGEXP_EXTRACT(sanrentan, r': (\\d+)') AS FLOAT64), 100)[OFFSET(50)] as course_median
      FROM
        `{DATASET}.race_master` rm
      WHERE
        rm.sanrentan IS NOT NULL
        AND rm.surface != '障害'
        AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
      GROUP BY
        venue_name,
        surface,
        distance,
        track_variant
      HAVING
        COUNT(*) > 20
    )
    SELECT
      race_count,
      course_median
    FROM
      all_course_stats
    WHERE
      venue_name = '{venue}'
      AND surface = '{surface}'
      AND distance = {distance}
      {track_variant_condition.replace('rm.track_variant', 'track_variant')}
    """

    try:
        results = client.query(all_courses_query).result()
        rows = list(results)

        if rows:
            row = rows[0]
            print(f"  ✅ Found in all_course_stats:")
            print(f"     - Race count: {row['race_count']}")
            print(f"     - Course median: {int(row['course_median']):,}円")
        else:
            print(f"  ❌ NOT found in all_course_stats (filtered out by HAVING COUNT(*) > 20)")

    except Exception as e:
        print(f"  ❌ Error in all_courses query: {str(e)}")


def main():
    """メイン処理"""
    print("🔍 Volatility Stats Debug Tool")
    print("="*60)

    client = bigquery.Client(project=PROJECT_ID)

    for course in TEST_COURSES:
        test_volatility_data(
            client,
            course['venue'],
            course['surface'],
            course['distance'],
            course['track_variant']
        )

    print(f"\n{'='*60}")
    print("✅ Debug complete!")


if __name__ == "__main__":
    main()
