#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
track_variant の値を調査
"""

from google.cloud import bigquery

PROJECT_ID = 'umadata'
DATASET = 'umadata.keiba_data'

# テスト対象のコース
TEST_COURSES = [
    {'venue': '中山', 'surface': '芝', 'distance': 1200},
    {'venue': '中山', 'surface': '芝', 'distance': 1600},
    {'venue': '阪神', 'surface': '芝', 'distance': 1600},
    {'venue': '京都', 'surface': '芝', 'distance': 1400},
    {'venue': '京都', 'surface': '芝', 'distance': 1600},
    {'venue': '新潟', 'surface': '芝', 'distance': 2000},
]


def check_track_variant(client, venue, surface, distance):
    """指定コースのtrack_variantの値を調査"""
    query = f"""
    SELECT
      track_variant,
      COUNT(*) as race_count
    FROM
      `{DATASET}.race_master` rm
    WHERE
      rm.venue_name = '{venue}'
      AND rm.surface = '{surface}'
      AND rm.distance = {distance}
      AND rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    GROUP BY
      track_variant
    ORDER BY
      race_count DESC
    """

    print(f"\n{'='*60}")
    print(f"📊 {venue} {surface} {distance}m")
    print(f"{'='*60}")

    try:
        results = client.query(query).result()
        rows = list(results)

        if not rows:
            print(f"  ❌ No data found")
            return

        print(f"  Track variant values:")
        for row in rows:
            variant = row['track_variant'] if row['track_variant'] else 'NULL'
            count = row['race_count']
            print(f"    - {variant}: {count} races")

    except Exception as e:
        print(f"  ❌ Error: {str(e)}")


def main():
    """メイン処理"""
    print("🔍 Track Variant Investigation Tool")
    print("="*60)

    client = bigquery.Client(project=PROJECT_ID)

    for course in TEST_COURSES:
        check_track_variant(
            client,
            course['venue'],
            course['surface'],
            course['distance']
        )

    print(f"\n{'='*60}")
    print("✅ Investigation complete!")


if __name__ == "__main__":
    main()
