#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
リーディングデータ (当年の騎手・調教師・種牡馬 TOP10) を生成して out/leading.json に保存する。
旧版 (gcs/generate_leading_data.py + .sql) の BigQuery スクリプト (DECLARE / TEMP TABLE / ARRAY(SELECT AS STRUCT)) を
DuckDB で動くように Python 側で組み立て直したもの。ランキングルールは同じ: 勝ち数 → 2着 → 3着 → 出走数 (少ない方が上位)。

Usage: python generate_leading_data.py            # 当年 (SITE_AS_OF の年)
"""
import os
import re
import sys
from datetime import datetime

from localdb import LocalClient, OUT_DIR, as_of_date, save_json

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(HERE))


def load_sire_ids():
    """lib/sires.ts (本番のリスト) から 名前 → ID。out/lib/sires.ts があればそちらを優先"""
    for p in (os.path.join(OUT_DIR, 'lib', 'sires.ts'), os.path.join(PROJECT_ROOT, 'lib', 'sires.ts')):
        if os.path.exists(p):
            content = open(p, encoding='utf-8').read()
            return {m.group(2) or m.group(3): int(m.group(1))
                    for m in re.finditer(r"""\{\s*id:\s*(\d+),\s*name:\s*(?:'([^']+)'|"([^"]+)")\s*\}""", content)}
    return {}


STATS = """
  COUNT(*) as rides,
  COUNTIF(rr.finish_position = 1) as wins,
  COUNTIF(rr.finish_position = 2) as places_2,
  COUNTIF(rr.finish_position = 3) as places_3,
  ROUND(COUNTIF(rr.finish_position = 1) * 100.0 / COUNT(*), 1) as win_rate
"""
ORDER = "HAVING wins > 0 ORDER BY wins DESC, places_2 DESC, places_3 DESC, rides ASC LIMIT 10"


def main():
    client = LocalClient()
    year = as_of_date().year
    print(f"📊 {year}年のリーディングデータを生成中...")

    jockeys = list(client.query(f"""
      SELECT rr.jockey_id AS id, j.jockey_name AS name, {STATS}
      FROM `site.race_result` rr
      JOIN `site.jockey` j ON rr.jockey_id = j.jockey_id
      JOIN `site.race_master` rm ON rr.race_id = rm.race_id
      WHERE EXTRACT(YEAR FROM rm.race_date) = {year} AND rr.jockey_id IS NOT NULL
      GROUP BY rr.jockey_id, j.jockey_name {ORDER}""").result())
    trainers = list(client.query(f"""
      SELECT rr.trainer_id AS id, t.trainer_name AS name, {STATS}
      FROM `site.race_result` rr
      JOIN `site.trainer` t ON rr.trainer_id = t.trainer_id
      JOIN `site.race_master` rm ON rr.race_id = rm.race_id
      WHERE EXTRACT(YEAR FROM rm.race_date) = {year} AND rr.trainer_id IS NOT NULL
      GROUP BY rr.trainer_id, t.trainer_name {ORDER}""").result())
    sires = list(client.query(f"""
      SELECT h.father AS name, {STATS}
      FROM `site.race_result` rr
      JOIN `site.horse` h ON rr.horse_id = h.horse_id
      JOIN `site.race_master` rm ON rr.race_id = rm.race_id
      WHERE EXTRACT(YEAR FROM rm.race_date) = {year} AND h.father IS NOT NULL AND h.father != ''
      GROUP BY h.father {ORDER}""").result())

    sire_ids = load_sire_ids()

    def rows(items, with_id=True, sire=False):
        return [{
            'rank': i,
            'id': (sire_ids.get(r['name'], 0) if sire else int(r['id'])),
            'name': r['name'],
            'wins': int(r['wins']),
            'rides': int(r['rides']),
            'winRate': float(r['win_rate']),
        } for i, r in enumerate(items, 1)]

    leading = {
        'year': year,
        'last_updated': datetime.now().astimezone().isoformat(),
        'jockey_leading': rows(jockeys),
        'trainer_leading': rows(trainers),
        'sire_leading': rows(sires, sire=True),
    }
    path = save_json('leading.json', leading)
    print(f"✅ 保存: {path}")
    for key, label in (('jockey_leading', '騎手'), ('trainer_leading', '調教師'), ('sire_leading', '種牡馬')):
        print(f"📋 {label} TOP 3:")
        for item in leading[key][:3]:
            print(f"   {item['rank']}位: {item['name']} ({item['wins']}勝 / {item['rides']}走 / {item['winRate']}%)")
    return 0


if __name__ == '__main__':
    sys.exit(main())
