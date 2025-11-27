#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lib/courses.ts から Python の COURSES リストを生成するスクリプト
"""

# lib/courses.ts のデータをベースに137コースを生成

COURSES = [
    # 札幌競馬場
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1000, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1500, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2600, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1000, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1700, 'track_variant': None},
    {'venue': '札幌', 'venue_en': 'sapporo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 2400, 'track_variant': None},

    # 函館競馬場
    {'venue': '函館', 'venue_en': 'hakodate', 'surface': '芝', 'surface_en': 'turf', 'distance': 1000, 'track_variant': None},
    {'venue': '函館', 'venue_en': 'hakodate', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '函館', 'venue_en': 'hakodate', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '函館', 'venue_en': 'hakodate', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '函館', 'venue_en': 'hakodate', 'surface': '芝', 'surface_en': 'turf', 'distance': 2600, 'track_variant': None},
    {'venue': '函館', 'venue_en': 'hakodate', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1000, 'track_variant': None},
    {'venue': '函館', 'venue_en': 'hakodate', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1700, 'track_variant': None},
    {'venue': '函館', 'venue_en': 'hakodate', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 2400, 'track_variant': None},

    # 福島競馬場
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': '芝', 'surface_en': 'turf', 'distance': 2600, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1150, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1700, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 2400, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 2750, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 2770, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3350, 'track_variant': None},
    {'venue': '福島', 'venue_en': 'fukushima', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3380, 'track_variant': None},

    # 新潟競馬場
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 1000, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 1400, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': 'inner'},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': 'outer'},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 2200, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '芝', 'surface_en': 'turf', 'distance': 2400, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1200, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1800, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 2500, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 2850, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 2890, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3250, 'track_variant': None},
    {'venue': '新潟', 'venue_en': 'niigata', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3290, 'track_variant': None},

    # 東京競馬場
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1400, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2300, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2400, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2500, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 3400, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1300, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1400, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1600, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 2100, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3000, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3100, 'track_variant': None},
    {'venue': '東京', 'venue_en': 'tokyo', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3110, 'track_variant': None},

    # 中山競馬場
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '芝', 'surface_en': 'turf', 'distance': 2200, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '芝', 'surface_en': 'turf', 'distance': 2500, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '芝', 'surface_en': 'turf', 'distance': 3600, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1200, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1800, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 2400, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 2500, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 2880, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3200, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3210, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3350, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3570, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 4100, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 4250, 'track_variant': None},
    {'venue': '中山', 'venue_en': 'nakayama', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 4260, 'track_variant': None},

    # 中京競馬場
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1400, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 2200, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '芝', 'surface_en': 'turf', 'distance': 3000, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1200, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1400, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1800, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1900, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3000, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3300, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3330, 'track_variant': None},
    {'venue': '中京', 'venue_en': 'chukyo', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3900, 'track_variant': None},

    # 京都競馬場
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 1400, 'track_variant': 'inner'},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 1400, 'track_variant': 'outer'},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': 'inner'},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': 'outer'},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 2200, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 2400, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 3000, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '芝', 'surface_en': 'turf', 'distance': 3200, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1200, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1400, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1800, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1900, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 2910, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3170, 'track_variant': None},
    {'venue': '京都', 'venue_en': 'kyoto', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3930, 'track_variant': None},

    # 阪神競馬場
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 1400, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 1600, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 2200, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 2400, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 2600, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 3000, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '芝', 'surface_en': 'turf', 'distance': 3200, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1200, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1400, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1800, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 2000, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 2970, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3110, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3140, 'track_variant': None},
    {'venue': '阪神', 'venue_en': 'hanshin', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3900, 'track_variant': None},

    # 小倉競馬場
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': '芝', 'surface_en': 'turf', 'distance': 1200, 'track_variant': None},
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': '芝', 'surface_en': 'turf', 'distance': 1800, 'track_variant': None},
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': '芝', 'surface_en': 'turf', 'distance': 2000, 'track_variant': None},
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': '芝', 'surface_en': 'turf', 'distance': 2600, 'track_variant': None},
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1000, 'track_variant': None},
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 1700, 'track_variant': None},
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': 'ダート', 'surface_en': 'dirt', 'distance': 2400, 'track_variant': None},
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 2860, 'track_variant': None},
    {'venue': '小倉', 'venue_en': 'kokura', 'surface': '障害', 'surface_en': 'steeplechase', 'distance': 3390, 'track_variant': None},
]

# 出力
if __name__ == "__main__":
    print(f"# Total courses: {len(COURSES)}")
    print("\n# Courses with variants:")
    variants = [c for c in COURSES if c['track_variant'] is not None]
    for c in variants:
        print(f"  - {c['venue']} {c['surface']} {c['distance']}m ({c['track_variant']})")

    print("\n# Steeplechase courses:")
    steeplechase = [c for c in COURSES if c['surface'] == '障害']
    print(f"  Total: {len(steeplechase)} courses")
