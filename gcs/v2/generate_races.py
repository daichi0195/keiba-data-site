#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
レース別ページ（/races/[slug]、「〇〇 過去10年」）のデータを作る（docs/seo/race_serp_2026-11.md）。

- 対象：lib/races.ts と同じ一覧（RACES）。重賞は特別競走番号（冠名が変わっても同じ）、L・OP は略称で同じレースを束ねる。
- 集計する回：最新回と同じ「競馬場・芝ダ・距離」の回だけを新しい順に最大10回（2013年まで遡る）。
  代替開催（京都改修で阪神など）の回は勝ち馬一覧に「集計対象外」として出すだけで、集計には入れない。
- サイトのマート（site.*）は2019年以降しかないため、core を直接読む（1レースあたり数MB）。名前の表記は site と同じ正規化。

使い方:
  python generate_races.py              # 全レース → public/data/races/<slug>.json
  python generate_races.py japan-cup    # 指定したレースだけ
"""
import datetime as dt
import json
import re
import statistics
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

from google.cloud import bigquery

PROJECT = 'keibaai-v2'
HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / 'public' / 'data' / 'races'
N_EDITIONS = 10
MAX_BYTES = 20 * 10**9

# slug, 束ねるキー（'sp:<特別競走番号>' または 'nm:<略称>'）, 次回の開催日（JRA の年間開催日程から。未定なら None）
RACES = [
    {'slug': 'japan-cup', 'key': 'sp:0015', 'next_date': '2026-11-29'},
    {'slug': 'keihan-hai', 'key': 'sp:0078', 'next_date': '2026-11-29'},
    # 冠名（ラジオNIKKEI杯）を外した一般的な呼び名を使う
    {'slug': 'kyoto-nisai-stakes', 'key': 'sp:0206', 'next_date': '2026-11-28', 'name': '京都2歳ステークス'},
]

VENUES = {'01': '札幌', '02': '函館', '03': '福島', '04': '新潟', '05': '東京', '06': '中山', '07': '中京', '08': '京都', '09': '阪神', '10': '小倉'}
GRADES = {'A': 'G1', 'B': 'G2', 'C': 'G3', 'L': 'L', 'E': 'OP', 'D': '重賞'}
GOING = {'1': '良', '2': '稍重', '3': '重', '4': '不良'}
WEATHER = {'1': '晴', '2': '曇', '3': '雨', '4': '小雨', '5': '雪', '6': '小雪'}
WEIGHT_TYPE = {'1': 'ハンデ', '2': '別定', '3': '馬齢', '4': '定量'}
SEX = {'1': '牡', '2': '牝', '3': 'セ'}
AFFIL = {'1': '美浦', '2': '栗東', '3': '地方', '4': '外国'}


def norm(s):
    if s is None:
        return None
    s = unicodedata.normalize('NFKC', s)
    return ''.join(s.split()) or None


def norm_en(s):
    """血統名：欧字名の空白は残す（'Unbridled's Song'）"""
    if s is None:
        return None
    return ' '.join(unicodedata.normalize('NFKC', s).split()) or None


def q(client, sql, params):
    cfg = bigquery.QueryJobConfig(query_parameters=params, maximum_bytes_billed=MAX_BYTES)
    return [dict(r) for r in client.query(sql, job_config=cfg).result()]


# ---------------------------------------------------------------------------
# 取得
# ---------------------------------------------------------------------------
def fetch_editions(client, key):
    kind, val = key.split(':', 1)
    where = 'special_race_no = @v' if kind == 'sp' else 'race_name_short = @v'
    return q(client, f"""
      SELECT race_id, race_date, venue_code, surface, distance, track_code, race_name, race_name_short, grade_code,
             weight_type_code, race_type_code, n_runners, going_code, weather_code, first3f_sec, last3f_sec
      FROM `{PROJECT}.core.race`
      WHERE {where} AND NOT IFNULL(is_cancelled, FALSE) AND surface IN ('turf', 'dirt')
      ORDER BY race_date DESC
    """, [bigquery.ScalarQueryParameter('v', 'STRING', val)])


def fetch_entries(client, ids, dates):
    return q(client, f"""
      SELECT e.race_id, e.race_date, e.horse_id, e.horse_name, e.frame_no, e.horse_no, e.sex_code, e.age, e.affiliation_code,
             e.weight_carried_kg, e.jockey_id, e.trainer_id, e.body_weight_kg, e.body_weight_diff_kg,
             e.did_not_start, e.abnormal_code, e.finish_pos, e.time_sec, e.time_diff_sec,
             e.corner1_pos, e.corner2_pos, e.corner3_pos, e.corner4_pos, e.win_odds_final, e.win_popularity_final, e.last3f_sec,
             j.name AS jockey_name, t.name AS trainer_name,
             IFNULL(fa.canonical_name, h.sire_name) AS sire, IFNULL(ma.canonical_name, h.damsire_name) AS damsire
      FROM `{PROJECT}.core.entry` e
      LEFT JOIN `{PROJECT}.core.jockey` j ON j.jockey_id = e.jockey_id
      LEFT JOIN `{PROJECT}.core.trainer` t ON t.trainer_id = e.trainer_id
      LEFT JOIN `{PROJECT}.core.horse` h ON h.horse_id = e.horse_id
      LEFT JOIN `{PROJECT}.site.breeding_alias` fa ON fa.breeding_id = h.sire_id
      LEFT JOIN `{PROJECT}.site.breeding_alias` ma ON ma.breeding_id = h.damsire_id
      WHERE e.race_id IN UNNEST(@ids) AND e.race_date IN UNNEST(@dates)
    """, [bigquery.ArrayQueryParameter('ids', 'STRING', ids), bigquery.ArrayQueryParameter('dates', 'DATE', dates)])


def fetch_prev(client, ids, dates):
    """各出走馬の前走（中央・地方・海外のうち直近の1走）"""
    return q(client, f"""
      WITH tgt AS (
        SELECT race_id, race_date, horse_id, jockey_id FROM `{PROJECT}.core.entry`
        WHERE race_id IN UNNEST(@ids) AND race_date IN UNNEST(@dates)
      ),
      runs AS (
        SELECT e.horse_id, e.race_id, e.race_date, e.finish_pos, e.win_popularity_final AS pop, e.jockey_id,
               r.race_name_short AS name, r.grade_code, r.venue_code, r.surface, r.distance, 'jra' AS kind
        FROM `{PROJECT}.core.entry` e JOIN `{PROJECT}.core.race` r USING (race_id)
        WHERE e.horse_id IN (SELECT horse_id FROM tgt) AND NOT IFNULL(e.did_not_start, FALSE)
        UNION ALL
        SELECT x.horse_id, x.race_id, x.race_date, x.finish_pos, x.win_popularity_final, x.jockey_id,
               r.race_name, r.grade_code, r.venue_code, r.surface, r.distance, x.kind
        FROM `{PROJECT}.core.entry_external` x JOIN `{PROJECT}.core.race_external` r USING (race_id)
        WHERE x.horse_id IN (SELECT horse_id FROM tgt)
      ),
      prev AS (
        SELECT t.race_id AS target_race_id, t.horse_id, t.jockey_id AS cur_jockey_id,
               p.race_id, p.race_date, p.finish_pos, p.pop, p.jockey_id, p.name, p.grade_code, p.venue_code, p.surface, p.distance, p.kind
        FROM tgt t JOIN runs p ON p.horse_id = t.horse_id AND p.race_date < t.race_date
        QUALIFY ROW_NUMBER() OVER (PARTITION BY t.race_id, t.horse_id ORDER BY p.race_date DESC, p.race_id DESC) = 1
      ),
      -- 前走の上がり3F順位（そのレースで上がりが記録された馬の中での順位。同タイムは同順位）
      l3 AS (
        SELECT race_id, horse_id, last3f_sec, RANK() OVER (PARTITION BY race_id ORDER BY last3f_sec) AS l3_rank
        FROM `{PROJECT}.core.entry`
        WHERE race_id IN (SELECT race_id FROM prev WHERE kind = 'jra') AND race_date IN (SELECT race_date FROM prev WHERE kind = 'jra')
          AND last3f_sec > 0 AND NOT IFNULL(did_not_start, FALSE)
      )
      SELECT prev.*, l3.last3f_sec AS l3, l3.l3_rank
      FROM prev LEFT JOIN l3 ON l3.race_id = prev.race_id AND l3.horse_id = prev.horse_id AND prev.kind = 'jra'
    """, [bigquery.ArrayQueryParameter('ids', 'STRING', ids), bigquery.ArrayQueryParameter('dates', 'DATE', dates)])


def fetch_payouts(client, ids, dates):
    return q(client, f"""
      SELECT race_id, bet_type, combination, payout_yen, popularity FROM `{PROJECT}.core.payout`
      WHERE race_id IN UNNEST(@ids) AND race_date IN UNNEST(@dates)
    """, [bigquery.ArrayQueryParameter('ids', 'STRING', ids), bigquery.ArrayQueryParameter('dates', 'DATE', dates)])


# ---------------------------------------------------------------------------
# 集計
# ---------------------------------------------------------------------------
def stat(rows):
    """サイト共通の13項目（components/v6/course/stats.ts の COLS）"""
    n = len(rows)
    if n == 0:
        return None
    fin = [r['fin'] for r in rows]
    pops = [r['pop'] for r in rows if r['pop']]
    w = sum(1 for f in fin if f == 1)
    p2 = sum(1 for f in fin if f == 2)
    p3 = sum(1 for f in fin if f == 3)
    return {
        'races': n, 'wins': w, 'places_2': p2, 'places_3': p3,
        'win_rate': round(w / n * 100, 1), 'quinella_rate': round((w + p2) / n * 100, 1), 'place_rate': round((w + p2 + p3) / n * 100, 1),
        'win_payback': round(sum(r['win_pay'] for r in rows) / n, 1), 'place_payback': round(sum(r['place_pay'] for r in rows) / n, 1),
        'avg_popularity': round(sum(pops) / len(pops), 1) if pops else None,
        'avg_rank': round(sum(f if f < 99 else len(rows) for f in fin) / n, 1),
        'median_popularity': statistics.median_low(pops) if pops else None,
        'median_rank': statistics.median_low(fin),
    }


def group(rows, keyf, order=None, label=None):
    g = defaultdict(list)
    for r in rows:
        k = keyf(r)
        if k is not None:
            g[k].append(r)
    keys = order if order is not None else sorted(g)
    out = []
    for k in keys:
        if k in g:
            s = stat(g[k])
            s['label'] = label(k) if label else str(k)
            out.append(s)
    return out


def ranking(rows, keyf, idf=None, min_places=0):
    """騎手・種牡馬などの一覧（勝利数→複勝数→出走数の順）"""
    g = defaultdict(list)
    ids = {}
    for r in rows:
        k = keyf(r)
        if not k:
            continue
        g[k].append(r)
        if idf:
            ids[k] = idf(r)
    out = []
    for k, rs in g.items():
        s = stat(rs)
        s['name'] = k
        if idf:
            s['id'] = ids[k]
        out.append(s)
    out.sort(key=lambda s: (-s['wins'], -(s['wins'] + s['places_2'] + s['places_3']), -s['races'], s['name']))
    return [s for s in out if s['wins'] + s['places_2'] + s['places_3'] >= min_places]


def style_of(r, n):
    """脚質：1〜3コーナーのどこかを先頭で通過＝逃げ、最終コーナー 1/3 以内＝先行、2/3 以内＝差し、それより後ろ＝追込"""
    cs = [c for c in (r['corner1_pos'], r['corner2_pos'], r['corner3_pos'], r['corner4_pos']) if c]
    if not cs:
        return None
    if 1 in cs[:-1] or (len(cs) == 1 and cs[0] == 1):
        return '逃げ'
    last = cs[-1]
    if last <= -(-n // 3):
        return '先行'
    if last <= -(-2 * n // 3):
        return '差し'
    return '追込'


def pop_band(p):
    if not p:
        return None
    return str(p) if p <= 5 else '6〜9' if p <= 9 else '10〜'


POP_ORDER = ['1', '2', '3', '4', '5', '6〜9', '10〜']


def pop_label(k):
    return '10番人気〜' if k == '10〜' else f'{k}番人気'


def prev_finish_band(f):
    if f is None:
        return None
    return '1着' if f == 1 else '2着' if f == 2 else '3着' if f == 3 else '4〜5着' if f <= 5 else '6〜9着' if f <= 9 else '10着〜'


def interval_band(days):
    if days is None:
        return None
    w = days // 7 - 1  # 「中◯週」
    return '中2週以内' if w <= 2 else '中3〜5週' if w <= 5 else '中6〜9週' if w <= 9 else '中10週以上'


def l3_band(rank):
    if not rank:
        return None
    return '1位' if rank == 1 else '2位' if rank == 2 else '3位' if rank == 3 else '4〜5位' if rank <= 5 else '6位以下'


L3_ORDER = ['1位', '2位', '3位', '4〜5位', '6位以下']


def weight_band(kg):
    if not kg:
        return None
    return '〜459' if kg < 460 else '460〜479' if kg < 480 else '480〜499' if kg < 500 else '500〜519' if kg < 520 else '520〜'


def build(client, cfg):
    eds = fetch_editions(client, cfg['key'])
    if not eds:
        raise SystemExit(f"{cfg['slug']}: レースが見つかりません")
    latest = eds[0]
    cond = (latest['venue_code'], latest['surface'], latest['distance'])
    used = [e for e in eds if (e['venue_code'], e['surface'], e['distance']) == cond][:N_EDITIONS]
    oldest = used[-1]['race_date']
    # 集計期間内で条件が違った回（代替開催など）
    excluded = [e for e in eds if e['race_date'] >= oldest and e not in used]

    all_eds = used + excluded
    ids = [e['race_id'] for e in all_eds]
    dates = [e['race_date'] for e in all_eds]
    entries = fetch_entries(client, ids, dates)
    prevs = {(p['target_race_id'], p['horse_id']): p for p in fetch_prev(client, [e['race_id'] for e in used], [e['race_date'] for e in used])}
    pays = defaultdict(list)
    for p in fetch_payouts(client, ids, dates):
        pays[p['race_id']].append(p)

    ed_by_id = {e['race_id']: e for e in all_eds}
    runners = []
    for e in entries:
        if e['did_not_start']:
            continue
        ed = ed_by_id[e['race_id']]
        no = f"{e['horse_no']:02d}" if e['horse_no'] else None
        fin = e['finish_pos'] if e['finish_pos'] and e['finish_pos'] > 0 else 99
        win_pay = sum(p['payout_yen'] for p in pays[e['race_id']] if p['bet_type'] == 'win' and p['combination'] == no)
        place_pay = sum(p['payout_yen'] for p in pays[e['race_id']] if p['bet_type'] == 'place' and p['combination'] == no)
        pv = prevs.get((e['race_id'], e['horse_id']))
        prev = None
        if pv:
            days = (ed['race_date'] - pv['race_date']).days
            kind = pv['kind']
            pname = norm(pv['name']) if pv['name'] else None
            if pname and kind == 'local':  # 「マイルＣｈＳ南部杯（中央交流）　Ｊｐｎ１」→「マイルCS南部杯」
                pname = re.sub(r'(\(中央[^)]*\))?(Jpn[123]|G[123]|[A-C][0-9]*)?$', '', pname.replace('ChS', 'CS'))
            prev = {
                'name': pname, 'grade': GRADES.get(pv['grade_code']) if kind == 'jra' else None,
                'kind': {'jra': '中央', 'local': '地方', 'overseas': '海外'}.get(kind, kind),
                'finish': pv['finish_pos'] if pv['finish_pos'] and pv['finish_pos'] > 0 else None,
                'pop': pv['pop'] or None, 'days': days,
                'venue': VENUES.get(pv['venue_code']) if kind == 'jra' else None,
                'surface': pv['surface'], 'distance': pv['distance'],
                'same_jockey': (pv['jockey_id'] == e['jockey_id']) if (pv['jockey_id'] and kind == 'jra') else None,
                'last3f': float(pv['l3']) if pv['l3'] else None, 'last3f_rank': pv['l3_rank'],
            }
        runners.append({
            'race_id': e['race_id'], 'year': ed['race_date'].year, 'fin': fin, 'frame': e['frame_no'], 'num': e['horse_no'],
            'horse': norm(e['horse_name']), 'horse_id': e['horse_id'], 'sex': SEX.get(e['sex_code'], ''), 'age': e['age'],
            'affil': AFFIL.get(e['affiliation_code'], 'その他'), 'kg': float(e['weight_carried_kg']) if e['weight_carried_kg'] is not None else None,
            'jockey': norm(e['jockey_name']), 'jockey_id': e['jockey_id'], 'trainer': norm(e['trainer_name']), 'trainer_id': e['trainer_id'],
            'sire': norm_en(e['sire']), 'damsire': norm_en(e['damsire']),
            'bw': e['body_weight_kg'], 'bw_diff': e['body_weight_diff_kg'],
            'time': float(e['time_sec']) if e['time_sec'] else None, 'diff': float(e['time_diff_sec']) if e['time_diff_sec'] is not None else None,
            'corners': [c for c in (e['corner1_pos'], e['corner2_pos'], e['corner3_pos'], e['corner4_pos']) if c],
            'last3f': float(e['last3f_sec']) if e['last3f_sec'] else None,
            'pop': e['win_popularity_final'] or None, 'odds': float(e['win_odds_final']) if e['win_odds_final'] else None,
            'style': style_of(e, ed['n_runners'] or 18),
            'win_pay': win_pay, 'place_pay': place_pay, 'prev': prev,
        })

    # このレースでの上がり3F順位（上がりが記録された馬の中で。同タイムは同順位）
    by_race = defaultdict(list)
    for r in runners:
        if r['last3f']:
            by_race[r['race_id']].append(r['last3f'])
    for r in runners:
        r['last3f_rank'] = (1 + sum(1 for t in by_race[r['race_id']] if t < r['last3f'])) if r['last3f'] else None

    used_ids = {e['race_id'] for e in used}
    rs = [r for r in runners if r['race_id'] in used_ids]

    def prev_class(r):
        p = r['prev']
        if not p:
            return '前走なし' if r['affil'] != '外国' else '外国馬'
        if p['kind'] == '海外':
            return '海外'
        if p['kind'] == '地方':
            return '地方'
        return p['grade'] if p['grade'] in ('G1', 'G2', 'G3') else 'L・OP' if p['grade'] in ('L', 'OP') else '条件戦'

    # 前走レース：同じ前走から2走以上ある前走だけを個別に、残りはまとめる
    prev_names = defaultdict(int)
    for r in rs:
        if r['prev'] and r['prev']['name']:
            prev_names[r['prev']['name']] += 1

    def prev_race_key(r):
        p = r['prev']
        if not p or not p['name']:
            return prev_class(r)
        return p['name'] if prev_names[p['name']] >= 5 else 'その他'

    prev_race_rows = group(rs, prev_race_key)
    prev_race_rows.sort(key=lambda s: (s['label'] in ('その他', '海外', '地方', '外国馬', '前走なし'), -s['wins'], -(s['wins'] + s['places_2'] + s['places_3']), -s['races']))

    stats = {
        'popularity': group(rs, lambda r: pop_band(r['pop']), POP_ORDER, pop_label),
        'frame': [dict(s, gate=int(s['label'][0])) for s in group(rs, lambda r: r['frame'], list(range(1, 9)), lambda k: f'{k}枠')],
        'number': group(rs, lambda r: None if not r['num'] else '1〜6番' if r['num'] <= 6 else '7〜12番' if r['num'] <= 12 else '13番〜', ['1〜6番', '7〜12番', '13番〜']),
        'style': group(rs, lambda r: r['style'], ['逃げ', '先行', '差し', '追込']),
        'age': group(rs, lambda r: None if not r['age'] else f"{r['age']}歳" if r['age'] < 7 else '7歳以上', ['3歳', '4歳', '5歳', '6歳', '7歳以上']),
        'sex': group(rs, lambda r: {'牡': '牡馬', '牝': '牝馬', 'セ': 'セン馬'}.get(r['sex']), ['牡馬', '牝馬', 'セン馬']),
        'affil': group(rs, lambda r: r['affil'], ['美浦', '栗東', '地方', '外国']),
        'prev_class': group(rs, prev_class, ['G1', 'G2', 'G3', 'L・OP', '条件戦', '海外', '地方', '外国馬', '前走なし']),
        'prev_race': prev_race_rows,
        'prev_finish': group(rs, lambda r: prev_finish_band(r['prev']['finish']) if r['prev'] else None, ['1着', '2着', '3着', '4〜5着', '6〜9着', '10着〜']),
        'prev_pop': group(rs, lambda r: pop_band(r['prev']['pop']) if r['prev'] and r['prev']['kind'] == '中央' else None, POP_ORDER, pop_label),
        'last3f': group(rs, lambda r: l3_band(r['last3f_rank']), L3_ORDER),
        'prev_last3f': group(rs, lambda r: l3_band(r['prev']['last3f_rank']) if r['prev'] else None, L3_ORDER),
        'interval': group(rs, lambda r: interval_band(r['prev']['days']) if r['prev'] else None, ['中2週以内', '中3〜5週', '中6〜9週', '中10週以上']),
        'jockey_change': group(rs, lambda r: None if not r['prev'] or r['prev']['same_jockey'] is None else '継続騎乗' if r['prev']['same_jockey'] else '乗り替わり', ['継続騎乗', '乗り替わり']),
        'body_weight': group(rs, lambda r: weight_band(r['bw']), ['〜459', '460〜479', '480〜499', '500〜519', '520〜']),
        'jockey': ranking(rs, lambda r: r['jockey'], lambda r: r['jockey_id']),
        'trainer': ranking(rs, lambda r: r['trainer'], lambda r: r['trainer_id']),
        'sire': ranking(rs, lambda r: r['sire']),
        'damsire': ranking(rs, lambda r: r['damsire']),
    }

    def payout_of(rid, bt):
        ps = [p for p in pays[rid] if p['bet_type'] == bt]
        return [{'combo': p['combination'], 'yen': p['payout_yen'], 'pop': p['popularity']} for p in ps]

    editions = []
    for e in sorted(all_eds, key=lambda e: e['race_date'], reverse=True):
        er = sorted([r for r in runners if r['race_id'] == e['race_id']], key=lambda r: (r['fin'], r['num'] or 0))
        editions.append({
            'race_id': e['race_id'], 'date': e['race_date'].isoformat(), 'year': e['race_date'].year,
            'venue': VENUES[e['venue_code']], 'surface': e['surface'], 'distance': e['distance'],
            'going': GOING.get(e['going_code']), 'weather': WEATHER.get(e['weather_code']), 'runners': e['n_runners'],
            'included': e['race_id'] in used_ids, 'name': norm(e['race_name']),
            'first3f': float(e['first3f_sec']) if e['first3f_sec'] else None, 'last3f': float(e['last3f_sec']) if e['last3f_sec'] else None,
            'results': [{k: r[k] for k in ('fin', 'frame', 'num', 'horse', 'horse_id', 'sex', 'age', 'affil', 'kg', 'jockey', 'jockey_id', 'trainer', 'trainer_id',
                                          'sire', 'damsire', 'bw', 'bw_diff', 'time', 'diff', 'corners', 'last3f', 'last3f_rank', 'pop', 'odds', 'style')}
                        | {'prev': r['prev']} for r in er],
            'payouts': {bt: payout_of(e['race_id'], bt) for bt in ('win', 'place', 'quinella', 'exacta', 'wide', 'trio', 'trifecta')},
        })

    return {
        'slug': cfg['slug'],
        'name': cfg.get('name') or norm(latest['race_name_short'] if cfg['key'].startswith('nm:') else latest['race_name']),
        'grade': GRADES.get(latest['grade_code']),
        'venue': VENUES[latest['venue_code']], 'surface': latest['surface'], 'distance': latest['distance'],
        'weight_type': WEIGHT_TYPE.get(latest['weight_type_code']),
        'next_date': cfg.get('next_date'),
        'period': {'from': used[-1]['race_date'].year, 'to': used[0]['race_date'].year, 'count': len(used)},
        'total_runners': len(rs),
        'editions': editions,
        'stats': stats,
        'generated_at': dt.datetime.now().isoformat(timespec='seconds'),
    }


def main():
    slugs = sys.argv[1:]
    client = bigquery.Client(project=PROJECT)
    OUT.mkdir(parents=True, exist_ok=True)
    for cfg in RACES:
        if slugs and cfg['slug'] not in slugs:
            continue
        data = build(client, cfg)
        path = OUT / f"{cfg['slug']}.json"
        path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'), default=str))
        print(f"  {cfg['slug']}: {data['period']} 出走{data['total_runners']} → {path} ({path.stat().st_size / 1e3:.0f} KB)")


if __name__ == '__main__':
    main()
