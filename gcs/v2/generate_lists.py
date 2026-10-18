#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ページ一覧 (lib/jockeys.ts / lib/trainers.ts / lib/sires.ts) を生成する。URL を維持するため、既存のリストを正として「足すだけ」にする。

ルール
- 既存エントリ: 直近 3 年に 1 走以上あれば ID・名前をそのまま残す (引退・短期免許切れでも残す = URL 維持)。
  0 走なら候補から外して報告する (ページが空になるため。残すかはユーザー判断)。
- 追加: 騎手・調教師は「現役 (美浦・栗東は免許有効、地方・海外は直近 3 年に騎乗)」かつ地方所属でなく、直近 3 年に 30 走以上。
        種牡馬は直近 3 年に 50 レース以上かつ産駒 10 頭以上。
- ID: 騎手・調教師は JRA コード (netkeiba と同じ)。種牡馬は名前の SHA256 ハッシュ (gcs/generate_sire_list.py と同じ)、
      既存 ID と衝突したら既存の連番 (99557〜) の続きを振る。
- カナ: マート (JRA-VAN の半角カナ) をひらがなにしたもの。既存エントリのカナも最新の読みに更新する。

出力: out/lib/{jockeys,trainers,sires}.ts (リポジトリの lib/ へコピーして使う)、out/index/*.json (同じ内容の JSON)
"""
import hashlib
import json
import os
import re
import sys
from datetime import datetime

from localdb import LocalClient, OUT_DIR, as_of_date, save_json

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
WINDOW = "rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)"


def hira(k):
    return ''.join(chr(ord(ch) - 0x60) if 0x30A1 <= ord(ch) <= 0x30F6 else ch for ch in (k or ''))


def sire_hash_id(name):
    return int(hashlib.sha256(name.encode('utf-8')).hexdigest(), 16) % 99999 + 1


def read_ts(path):
    """既存の lib/*.ts から [{id, name, kana?}] を読む"""
    if not os.path.exists(path):
        return []
    s = open(path, encoding='utf-8').read()
    pat = r"""\{\s*id:\s*(\d+),\s*name:\s*(?:'([^']+)'|"([^"]+)")(?:,\s*kana:\s*(?:'([^']*)'|"([^"]*)"))?\s*\}"""
    return [{'id': int(m.group(1)), 'name': m.group(2) or m.group(3), 'kana': (m.group(4) or m.group(5) or '')}
            for m in re.finditer(pat, s)]


def ts_literal(s):
    return '"' + s.replace('"', '\\"') + '"' if "'" in s else "'" + s + "'"


def write_ts(kind, entries, header_lines):
    iface = {'jockeys': ('JockeyInfo', 'ALL_JOCKEYS'), 'trainers': ('TrainerInfo', 'ALL_TRAINERS'), 'sires': ('SireInfo', 'ALL_SIRES')}[kind]
    with_kana = kind != 'sires'
    lines = ['/**'] + [f' * {l}' for l in header_lines] + [' */', '', f'export interface {iface[0]} {{', '  id: number;', '  name: string;']
    if with_kana:
        lines.append('  kana: string;')
    lines += ['}', '', f'export const {iface[1]}: {iface[0]}[] = [']
    for e in entries:
        if with_kana:
            lines.append(f"  {{ id: {e['id']}, name: {ts_literal(e['name'])}, kana: {ts_literal(e['kana'])} }},")
        else:
            lines.append(f"  {{ id: {e['id']}, name: {ts_literal(e['name'])} }},")
    lines += ['];', '']
    path = os.path.join(OUT_DIR, 'lib', f'{kind}.ts')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write('\n'.join(lines))
    save_json(f'index/{kind}.json', entries)
    return path


def build_people(client, kind):
    """kind: 'jockey' | 'trainer'"""
    idcol, namecol, table = f'{kind}_id', f'{kind}_name', kind
    rows = list(client.query(f"""
      SELECT j.{idcol} AS id, j.{namecol} AS name, j.kana, j.region, j.is_active, COUNT(*) AS recent_races
      FROM `site.{table}` j
      JOIN `site.race_result` rr ON j.{idcol} = rr.{idcol}
      JOIN `site.race_master` rm ON rr.race_id = rm.race_id
      WHERE {WINDOW}
      GROUP BY 1, 2, 3, 4, 5""").result())
    by_id = {int(r['id']): r for r in rows}
    existing = read_ts(os.path.join(REPO, 'lib', f'{kind}s.ts'))
    out, dropped, added = [], [], []
    for e in existing:
        r = by_id.get(e['id'])
        if r is None:
            dropped.append(e)
            continue
        out.append({'id': e['id'], 'name': r['name'], 'kana': hira(r['kana']) or e['kana']})
    have = {e['id'] for e in out}
    for r in sorted(rows, key=lambda r: -r['recent_races']):
        if int(r['id']) in have:
            continue
        if r['is_active'] and r['region'] != '地方' and r['recent_races'] >= 30:
            e = {'id': int(r['id']), 'name': r['name'], 'kana': hira(r['kana'])}
            out.append(e); added.append(e); have.add(e['id'])
    return out, added, dropped, existing


def build_sires(client):
    rows = list(client.query(f"""
      SELECT h.father AS name, COUNT(DISTINCT rr.race_id) AS race_count, COUNT(DISTINCT rr.horse_id) AS horse_count
      FROM `site.race_result` rr
      JOIN `site.horse` h ON h.horse_id = rr.horse_id
      JOIN `site.race_master` rm ON rr.race_id = rm.race_id
      WHERE {WINDOW} AND h.father IS NOT NULL AND h.father != ''
      GROUP BY 1""").result())
    by_name = {r['name']: r for r in rows}
    existing = read_ts(os.path.join(REPO, 'lib', 'sires.ts'))
    out, dropped, added = [], [], []
    for e in existing:
        if e['name'] not in by_name:
            dropped.append(e)
            continue
        out.append({'id': e['id'], 'name': e['name']})
    have_ids = {e['id'] for e in existing}
    have_names = {e['name'] for e in out}
    next_seq = max([e['id'] for e in existing if e['id'] >= 99557] + [99556]) + 1
    for r in sorted(rows, key=lambda r: -r['race_count']):
        if r['name'] in have_names or r['race_count'] < 50 or r['horse_count'] < 10:
            continue
        sid = sire_hash_id(r['name'])
        if sid in have_ids:
            sid = next_seq; next_seq += 1
        e = {'id': sid, 'name': r['name']}
        out.append(e); added.append(e); have_ids.add(sid); have_names.add(r['name'])
    return out, added, dropped, existing


def main():
    client = LocalClient()
    stamp = as_of_date().strftime('%Y-%m-%d')
    report = {}
    for kind in ('jockey', 'trainer'):
        out, added, dropped, existing = build_people(client, kind)
        label = '騎手' if kind == 'jockey' else '調教師'
        path = write_ts(f'{kind}s', out, [f'全{label}のIDリスト', '',
                                         f'過去3年間に出走記録のある{label} (既存ページは維持し、現役で30レース以上の{label}を追加)',
                                         f'gcs/v2/generate_lists.py が JRA-VAN 由来のデータから自動生成（{stamp}時点: {len(out)}{label}）'])
        report[kind] = (len(existing), len(out), added, dropped)
        print(f'✅ {path}: 既存 {len(existing)} → {len(out)} (追加 {len(added)}, 0走で除外 {len(dropped)})')
    out, added, dropped, existing = build_sires(client)
    path = write_ts('sires', out, ['全種牡馬のIDリスト', '', '過去3年間に産駒が出走している種牡馬 (既存ページは維持し、50レース以上・産駒10頭以上の種牡馬を追加)',
                                   f'gcs/v2/generate_lists.py が JRA-VAN 由来のデータから自動生成（{stamp}時点: {len(out)}頭）'])
    report['sire'] = (len(existing), len(out), added, dropped)
    print(f'✅ {path}: 既存 {len(existing)} → {len(out)} (追加 {len(added)}, 0走で除外 {len(dropped)})')
    for k, (n0, n1, added, dropped) in report.items():
        if added:
            print(f'  追加 ({k}): ' + ', '.join(f"{e['name']}({e['id']})" for e in added))
        if dropped:
            print(f'  0走で除外 ({k}): ' + ', '.join(f"{e['name']}({e['id']})" for e in dropped))
    save_json('index/lists_report.json', {k: {'before': v[0], 'after': v[1], 'added': v[2], 'dropped': v[3]} for k, v in report.items()})
    return 0


if __name__ == '__main__':
    sys.exit(main())
