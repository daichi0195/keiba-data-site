#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新旧データの突合: 本番 GCS (gs://umadata, netkeiba 版) の JSON と、ローカル生成 (out/, JRA-VAN 版) の JSON を比べる。

使い方:
  python compare.py course/tokyo/turf/1600.json [...]     # 個別ファイル
  python compare.py --all                                   # out/ 以下の全ファイル
出力: セクションごとの行数・主要な数値 (出走数・勝率・複勝率・回収率) の差。大きな差は !! を付ける。
"""
import json
import sys
import urllib.request
from pathlib import Path

from localdb import OUT_DIR

BASE_URL = 'https://storage.googleapis.com/umadata'
KEY_FIELDS = ['races', 'wins', 'win_rate', 'place_rate', 'win_payback', 'place_payback']


def fetch_live(blob_path):
    try:
        with urllib.request.urlopen(f'{BASE_URL}/{blob_path}', timeout=30) as r:
            return json.load(r)
    except Exception as e:
        return {'__error__': str(e)}


def label_of(row):
    for k in ('name', 'gate', 'popularity_group', 'running_style', 'trend_group', 'weight_category', 'category',
              'surface', 'style', 'year', 'class_name', 'condition_label', 'interval', 'age', 'racecourse_en'):
        if k in row:
            v = row[k]
            if k == 'surface' and 'condition' in row:
                v = f"{row['surface']}/{row['condition']}"
            if k == 'racecourse_en' and 'distance' in row:
                v = f"{row['racecourse_en']}/{row.get('surface_en')}/{row['distance']}/{row.get('variant') or ''}"
            return str(v)
    return '?'


def diff_section(name, old, new, out):
    if isinstance(old, list) and isinstance(new, list):
        if not old or not isinstance(old[0], dict):
            if old != new:
                out.append(f'  {name}: {old} → {new}')
            return
        o = {label_of(r): r for r in old}
        n = {label_of(r): r for r in new}
        only_old = [k for k in o if k not in n]
        only_new = [k for k in n if k not in o]
        line = f'  {name}: {len(old)} → {len(new)} 行'
        if only_old or only_new:
            line += f'  旧のみ={only_old[:6]} 新のみ={only_new[:6]}'
        out.append(line)
        worst = []
        for k in o:
            if k not in n:
                continue
            for f in KEY_FIELDS:
                a, b = o[k].get(f), n[k].get(f)
                if isinstance(a, (int, float)) and isinstance(b, (int, float)):
                    d = b - a
                    rel = abs(d) / max(abs(a), 1)
                    if (f == 'races' and rel > 0.05 and abs(d) >= 3) or (f != 'races' and abs(d) >= 3):
                        worst.append((rel if f == 'races' else abs(d), f'    !! {k}.{f}: {a} → {b}'))
        worst.sort(reverse=True)
        out.extend(w[1] for w in worst[:8])
    elif isinstance(old, dict) and isinstance(new, dict):
        keys = sorted(set(old) | set(new))
        for k in keys:
            a, b = old.get(k), new.get(k)
            if isinstance(a, (dict, list)) or isinstance(b, (dict, list)):
                diff_section(f'{name}.{k}', a, b, out)
            elif a != b:
                flag = '!!' if isinstance(a, (int, float)) and isinstance(b, (int, float)) and abs(b - a) >= 3 else '  '
                out.append(f'  {flag} {name}.{k}: {a} → {b}')
    elif old != new:
        out.append(f'  {name}: {old} → {new}')


def compare(blob_path):
    new = json.loads((OUT_DIR / blob_path).read_text(encoding='utf-8'))
    old = fetch_live(blob_path)
    out = [f'== {blob_path}']
    if '__error__' in old:
        out.append(f'  本番 JSON 取得失敗: {old["__error__"]}')
        return out
    for k in sorted(set(old) | set(new)):
        if k not in new:
            out.append(f'  {k}: 新に無い')
        elif k not in old:
            out.append(f'  {k}: 旧に無い')
        else:
            diff_section(k, old[k], new[k], out)
    return out


def summarize(paths):
    """全ファイルの差を集計: 取得失敗 / セクション欠落 / 行数差 / 大きな数値差 の件数と、差の多いファイル"""
    import re
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(8) as ex:
        results = list(ex.map(lambda p: (p, compare(p)), paths))
    tot = {'files': len(paths), 'fetch_error': 0, 'missing_section': 0, 'row_diff': 0, 'big_diff': 0, 'identical': 0}
    per_file = []
    sec_rows = {}
    for p, out in results:
        text = '\n'.join(out)
        if '取得失敗' in text:
            tot['fetch_error'] += 1
            continue
        ms = text.count('新に無い') + text.count('旧に無い')
        rd = len([l for l in out if re.search(r': (\d+) → (\d+) 行', l) and not re.search(r': (\d+) → \1 行', l)])
        bd = len([l for l in out if l.strip().startswith('!!')])
        for l in out:
            m = re.match(r'  (\w+): (\d+) → (\d+) 行', l)
            if m:
                sec_rows.setdefault(m.group(1), [0, 0]); sec_rows[m.group(1)][0] += 1
                if m.group(2) != m.group(3):
                    sec_rows[m.group(1)][1] += 1
        tot['missing_section'] += ms; tot['row_diff'] += rd; tot['big_diff'] += bd
        if ms == 0 and rd == 0 and bd == 0:
            tot['identical'] += 1
        per_file.append((ms * 100 + rd * 10 + bd, p, ms, rd, bd))
    print('## 集計', tot)
    print('## セクション別 (比較回数, 行数が違った回数)')
    for k, v in sorted(sec_rows.items()):
        print(f'  {k:24s} {v[0]:4d} {v[1]:4d}')
    print('## 差の大きいファイル (欠落セクション, 行数差セクション, 大きな数値差)')
    for sc, p, ms, rd, bd in sorted(per_file, reverse=True)[:25]:
        print(f'  {p:40s} 欠落={ms} 行数差={rd} 数値差={bd}')


if __name__ == '__main__':
    paths = sys.argv[1:]
    if paths and paths[0] in ('--all', '--summary'):
        mode = paths[0]
        sub = paths[1] if len(paths) > 1 else ''
        paths = [str(p.relative_to(OUT_DIR)) for p in sorted(OUT_DIR.rglob('*.json')) if str(p.relative_to(OUT_DIR)).startswith(sub) and p.name != 'leading.json']
        if mode == '--summary':
            summarize(paths)
            sys.exit(0)
    for p in paths:
        print('\n'.join(compare(p)))
