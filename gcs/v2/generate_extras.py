#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_*.py が書き出した out/ の JSON に、検索意図に合わせた追加項目を書き足す（docs/seo/gap_analysis.md）。

- 種牡馬: profile（父・母父・生年・生産地）、notable_progeny（代表産駒）、distance_surface_stats（芝・ダート別の距離帯成績）
- 騎手: profile（生年月日・免許取得日）、graded_wins（重賞勝ち一覧）、sire_stats（種牡馬別成績）
- 調教師: profile、graded_wins、age_stats（馬齢別）、active_horses（現役の主な管理馬）
- コース: course_profile（回り・内外回り・重賞）、finish_stats（上がり3F・勝ちタイム）、gate_stats_by_condition（良／道悪の枠順）

集計はすべてローカルの DuckDB。BigQuery を使うのは --fetch の種牡馬血統（core.breeding_horse、約15MB）だけ。

使い方:
  python generate_extras.py --fetch   # 種牡馬の父・母父を data/sire_pedigree.parquet に取得（weekly.sh では localdb fetch の後）
  python generate_extras.py           # out/ の JSON に追記
"""
import datetime as dt
import json
import sys
import unicodedata

import duckdb

from localdb import DATA_DIR, OUT_DIR, as_of_date

YEARS = 3
GRADE_ORDER = {'G1': 1, 'G2': 2, 'G3': 3}
SEX_LABEL = {1: '牡', 2: '牝', 3: 'セ'}

# generate_*.py と同じ13項目（サイトの ConditionCard / RankingTable がそのまま使える形）
STAT_COLS = """
  COUNT(*) AS races,
  SUM(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) AS wins,
  SUM(CASE WHEN rr.finish_position = 2 THEN 1 ELSE 0 END) AS places_2,
  SUM(CASE WHEN rr.finish_position = 3 THEN 1 ELSE 0 END) AS places_3,
  ROUND(AVG(CASE WHEN rr.finish_position = 1 THEN 1 ELSE 0 END) * 100, 1) AS win_rate,
  ROUND(AVG(CASE WHEN rr.finish_position <= 2 THEN 1 ELSE 0 END) * 100, 1) AS quinella_rate,
  ROUND(AVG(CASE WHEN rr.finish_position <= 3 THEN 1 ELSE 0 END) * 100, 1) AS place_rate,
  ROUND(SUM(CASE WHEN rr.finish_position = 1 THEN rr.win ELSE 0 END) / (COUNT(*) * 100) * 100, 1) AS win_payback,
  ROUND(SUM(CASE WHEN rr.finish_position <= 3 THEN rr.place ELSE 0 END) / (COUNT(*) * 100) * 100, 1) AS place_payback,
  ROUND(AVG(rr.popularity), 1) AS avg_popularity,
  ROUND(AVG(rr.finish_position), 1) AS avg_rank,
  quantile_disc(rr.popularity, 0.5) AS median_popularity,
  quantile_disc(rr.finish_position, 0.5) AS median_rank
"""

# 種牡馬の芝・ダート別距離帯（サイトの「得意距離」カード）
DISTANCE_BANDS = [
    ('〜1200m', 0, 1200),
    ('1300〜1400m', 1201, 1400),
    ('1500〜1600m', 1401, 1600),
    ('1700〜1800m', 1601, 1800),
    ('1900〜2000m', 1801, 2000),
    ('2100〜2400m', 2001, 2400),
    ('2500m〜', 2401, 9999),
]


def fetch_sire_pedigree():
    """種牡馬の父・母父・生産地を BigQuery から取得（約15MB の読み取り）"""
    from google.cloud import bigquery
    import pyarrow.parquet as pq
    client = bigquery.Client(project='keibaai-v2')
    sql = """
    SELECT s.name, b.birth_year, b.birthplace, b.import_kubun, f.name AS father, mf.name AS damsire
    FROM `keibaai-v2.site.sire` s
    JOIN `keibaai-v2.core.breeding_horse` b USING (breeding_id)
    LEFT JOIN `keibaai-v2.core.breeding_horse` f ON f.breeding_id = b.sire_id
    LEFT JOIN `keibaai-v2.core.breeding_horse` d ON d.breeding_id = b.dam_id
    LEFT JOIN `keibaai-v2.core.breeding_horse` mf ON mf.breeding_id = d.sire_id
    """
    job = client.query(sql, job_config=bigquery.QueryJobConfig(maximum_bytes_billed=2 * 10**9))
    table = job.result().to_arrow()
    pq.write_table(table, DATA_DIR / 'sire_pedigree.parquet')
    print(f'  sire_pedigree {table.num_rows} rows ({(job.total_bytes_billed or 0) / 1e6:.0f} MB billed)')


def connect():
    con = duckdb.connect()
    for t in ['race_master', 'race_result', 'horse', 'jockey', 'trainer']:
        con.execute(f"CREATE VIEW {t} AS SELECT * FROM '{DATA_DIR / (t + '.parquet')}'")
    ped = DATA_DIR / 'sire_pedigree.parquet'
    if ped.exists():
        con.execute(f"CREATE VIEW sire_pedigree AS SELECT * FROM '{ped}'")
    else:
        con.execute("CREATE VIEW sire_pedigree AS SELECT NULL::VARCHAR AS name, NULL::BIGINT AS birth_year, NULL::VARCHAR AS birthplace, NULL::VARCHAR AS import_kubun, NULL::VARCHAR AS father, NULL::VARCHAR AS damsire WHERE false")
    return con


def rows(con, sql, params=None):
    cur = con.execute(sql, params or [])
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def jsonable(v):
    if isinstance(v, (dt.date, dt.datetime)):
        return v.isoformat()[:10]
    if isinstance(v, float) and v != v:  # NaN
        return None
    return v


def clean(obj):
    if isinstance(obj, dict):
        # レース名は全角英数（ＮＨＫ など）を半角に揃える
        return {k: (unicodedata.normalize('NFKC', v) if k == 'race_name' and isinstance(v, str)
                    else [unicodedata.normalize('NFKC', t) for t in v] if k == 'titles' and isinstance(v, list)
                    else clean(v)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean(v) for v in obj]
    return jsonable(obj)


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def save(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(clean(data), f, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# 重賞勝ち一覧（騎手・調教師）
# ---------------------------------------------------------------------------
def graded_wins(con, col, entity_id, since, limit=30):
    return rows(con, f"""
      SELECT rm.race_date AS date, rm.race_name, rm.grade, rm.venue_name AS venue, rm.surface, rm.distance,
             rr.horse_id, rr.horse_name, rr.jockey_name, rr.trainer_name, rr.popularity
      FROM race_master rm JOIN race_result rr USING (race_id)
      WHERE rr.{col} = ? AND rr.finish_position = 1 AND rm.grade IN ('G1','G2','G3') AND rm.race_date >= ?
      ORDER BY rm.race_date DESC
      LIMIT {limit}
    """, [entity_id, since])


def profile_of(con, table, id_col, entity_id):
    r = rows(con, f"SELECT birth_date, license_date, region FROM {table} WHERE {id_col} = ?", [entity_id])
    return r[0] if r else {}


# ---------------------------------------------------------------------------
# 種牡馬
# ---------------------------------------------------------------------------
_AGE_BASELINE = {}


def age_baseline(con, since):
    """全出走馬（平地）の馬齢別の複勝率。種牡馬ページの「早熟？晩成？」で産駒の数値と並べる基準。
    2歳戦は新馬・未勝利が中心で素質馬ほど好走しやすく、上位の種牡馬はほぼ全て「2歳が高い」形になるため、
    早熟・晩成の判定はせず数値の比較だけを出す"""
    if since not in _AGE_BASELINE:
        r = rows(con, """
          SELECT AVG(CASE WHEN rr.age = 2 THEN (rr.finish_position BETWEEN 1 AND 3)::INT END) * 100 AS a2,
                 AVG(CASE WHEN rr.age = 3 THEN (rr.finish_position BETWEEN 1 AND 3)::INT END) * 100 AS a3,
                 AVG(CASE WHEN rr.age >= 4 THEN (rr.finish_position BETWEEN 1 AND 3)::INT END) * 100 AS a4
          FROM race_master rm JOIN race_result rr USING (race_id)
          WHERE rm.race_date >= ? AND rm.surface IN ('芝', 'ダート')
        """, [since])[0]
        _AGE_BASELINE[since] = {'2歳': round(r['a2'], 1), '3歳': round(r['a3'], 1), '4歳以上': round(r['a4'], 1)}
    return _AGE_BASELINE[since]


def growth_rates(con, name, since):
    """産駒の馬齢別（2歳／3歳／4歳以上・平地）の複勝率と、全出走馬の同じ値"""
    r = rows(con, """
      SELECT CASE WHEN rr.age = 2 THEN '2歳' WHEN rr.age = 3 THEN '3歳' ELSE '4歳以上' END AS age,
             COUNT(*) AS races,
             ROUND(AVG((rr.finish_position BETWEEN 1 AND 3)::INT) * 100, 1) AS place_rate
      FROM race_master rm JOIN race_result rr USING (race_id) JOIN horse h ON h.horse_id = rr.horse_id
      WHERE h.father = ? AND rm.race_date >= ? AND rm.surface IN ('芝', 'ダート')
      GROUP BY 1 ORDER BY 1
    """, [name, since])
    base = age_baseline(con, since)
    return [{**x, 'all_place_rate': base.get(x['age'])} for x in r]


def sire_extras(con, data, since, as_of):
    name = data['name']
    data['growth_rates'] = growth_rates(con, name, since)
    ped = rows(con, "SELECT * FROM sire_pedigree WHERE name = ?", [name])
    if ped:
        p = ped[0]
        data['profile'] = {
            'father': p['father'], 'damsire': p['damsire'], 'birth_year': p['birth_year'],
            'birthplace': p['birthplace'], 'imported': str(p['import_kubun'] or '0') != '0',
        }
        if p['birth_year']:
            data['birth_year'] = p['birth_year']  # 生成側は仮の値（2002）が入っている

    # 代表産駒：集計期間の重賞勝ち（G1→G2→G3 の数）→勝利数の順
    progeny = rows(con, """
      WITH r AS (
        SELECT rr.horse_id, rr.horse_name, h.sex, h.birth_date, h.mf, rr.finish_position, rm.grade, rm.race_name, rm.race_date
        FROM race_master rm JOIN race_result rr USING (race_id) JOIN horse h ON h.horse_id = rr.horse_id
        WHERE h.father = ? AND rm.race_date >= ?
      )
      SELECT horse_id, any_value(horse_name) AS horse_name, any_value(sex) AS sex, any_value(birth_date) AS birth_date,
             any_value(mf) AS damsire,
             COUNT(*) AS races,
             SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) AS wins,
             SUM(CASE WHEN finish_position = 1 AND grade = 'G1' THEN 1 ELSE 0 END) AS g1_wins,
             SUM(CASE WHEN finish_position = 1 AND grade IN ('G1','G2','G3') THEN 1 ELSE 0 END) AS graded_wins,
             list(CASE WHEN finish_position = 1 AND grade IN ('G1','G2','G3') THEN grade || ' ' || race_name END ORDER BY grade, race_date DESC) AS titles
      FROM r GROUP BY horse_id
      HAVING SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) > 0
      ORDER BY g1_wins DESC, graded_wins DESC, wins DESC, races ASC
      LIMIT 10
    """, [name, since])
    for p in progeny:
        p['titles'] = [t for t in (p['titles'] or []) if t][:3]
        p['sex'] = SEX_LABEL.get(p['sex'], '')
        p['age'] = as_of.year - p['birth_date'].year if p['birth_date'] else None
        del p['birth_date']
    data['notable_progeny'] = progeny

    # 芝・ダート別の距離帯
    band_case = 'CASE ' + ' '.join(f"WHEN rm.distance BETWEEN {lo} AND {hi} THEN '{label}'" for label, lo, hi in DISTANCE_BANDS) + ' END'
    order_case = 'CASE ' + ' '.join(f"WHEN rm.distance BETWEEN {lo} AND {hi} THEN {i}" for i, (_, lo, hi) in enumerate(DISTANCE_BANDS)) + ' END'
    out = {}
    for key, surface in [('turf', '芝'), ('dirt', 'ダート')]:
        out[key] = rows(con, f"""
          SELECT {band_case} AS category, {STAT_COLS}
          FROM race_master rm JOIN race_result rr USING (race_id) JOIN horse h ON h.horse_id = rr.horse_id
          WHERE h.father = ? AND rm.surface = ? AND rm.race_date >= ?
          GROUP BY category, {order_case} ORDER BY {order_case}
        """, [name, surface, since])
    data['distance_surface_stats'] = out


# ---------------------------------------------------------------------------
# 騎手
# ---------------------------------------------------------------------------
def jockey_extras(con, data, since, as_of):
    jid = int(data['id'])
    data['profile'] = profile_of(con, 'jockey', 'jockey_id', jid)
    data['graded_wins'] = graded_wins(con, 'jockey_id', jid, since)
    data['sire_stats'] = rows(con, f"""
      SELECT h.father AS name, {STAT_COLS}
      FROM race_master rm JOIN race_result rr USING (race_id) JOIN horse h ON h.horse_id = rr.horse_id
      WHERE rr.jockey_id = ? AND rm.race_date >= ? AND h.father IS NOT NULL
      GROUP BY h.father
      ORDER BY wins DESC, place_rate DESC, races DESC
      LIMIT 50
    """, [jid, since])
    for i, r in enumerate(data['sire_stats'], 1):
        r['rank'] = i


# ---------------------------------------------------------------------------
# 調教師
# ---------------------------------------------------------------------------
def trainer_extras(con, data, since, as_of):
    tid = int(data['id'])
    data['profile'] = profile_of(con, 'trainer', 'trainer_id', tid)
    data['graded_wins'] = graded_wins(con, 'trainer_id', tid, since)
    data['age_stats'] = rows(con, f"""
      SELECT CASE WHEN rr.age = 2 THEN '2歳' WHEN rr.age = 3 THEN '3歳' ELSE '4歳以上' END AS age, {STAT_COLS}
      FROM race_master rm JOIN race_result rr USING (race_id)
      WHERE rr.trainer_id = ? AND rm.race_date >= ?
      GROUP BY 1 ORDER BY min(rr.age)
    """, [tid, since])
    # 現役の主な管理馬：直近半年に出走した馬（最終出走時の調教師がこの厩舎）を、集計期間の重賞勝ち→勝利数→3着内の順に
    recent = as_of - dt.timedelta(days=183)
    horses = rows(con, """
      WITH last AS (
        SELECT rr.horse_id, arg_max(rr.trainer_id, rm.race_date) AS last_trainer, max(rm.race_date) AS last_date
        FROM race_master rm JOIN race_result rr USING (race_id)
        GROUP BY rr.horse_id
      ),
      r AS (
        SELECT rr.horse_id, rr.horse_name, rr.finish_position, rm.grade, rm.race_name, rm.race_date
        FROM race_master rm JOIN race_result rr USING (race_id)
        WHERE rm.race_date >= ?
      )
      SELECT r.horse_id, any_value(r.horse_name) AS horse_name, any_value(h.sex) AS sex, any_value(h.birth_date) AS birth_date,
             any_value(h.father) AS father, any_value(last.last_date) AS last_date,
             COUNT(*) AS races,
             SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) AS wins,
             SUM(CASE WHEN finish_position = 2 THEN 1 ELSE 0 END) AS places_2,
             SUM(CASE WHEN finish_position = 3 THEN 1 ELSE 0 END) AS places_3,
             SUM(CASE WHEN finish_position = 1 AND grade IN ('G1','G2','G3') THEN 1 ELSE 0 END) AS graded_wins,
             SUM(CASE WHEN finish_position = 1 AND grade = 'G1' THEN 1 ELSE 0 END) AS g1_wins,
             list(CASE WHEN finish_position = 1 AND grade IN ('G1','G2','G3') THEN grade || ' ' || race_name END ORDER BY grade, race_date DESC) AS titles
      FROM r JOIN last USING (horse_id) JOIN horse h ON h.horse_id = r.horse_id
      WHERE last.last_trainer = ? AND last.last_date >= ?
      GROUP BY r.horse_id
      ORDER BY g1_wins DESC, graded_wins DESC, wins DESC, (places_2 + places_3) DESC
      LIMIT 10
    """, [since, tid, recent])
    for h in horses:
        h['titles'] = [t for t in (h['titles'] or []) if t][:3]
        h['sex'] = SEX_LABEL.get(h['sex'], '')
        h['age'] = as_of.year - h['birth_date'].year if h['birth_date'] else None
        del h['birth_date']
    data['active_horses'] = horses


# ---------------------------------------------------------------------------
# コース
# ---------------------------------------------------------------------------
VENUE_JA = {'sapporo': '札幌', 'hakodate': '函館', 'fukushima': '福島', 'niigata': '新潟', 'tokyo': '東京',
            'nakayama': '中山', 'chukyo': '中京', 'kyoto': '京都', 'hanshin': '阪神', 'kokura': '小倉'}
SURFACE_JA = {'turf': '芝', 'dirt': 'ダート', 'steeplechase': '障害'}
# generate_courses.py と同じく、この3コースだけ内回り・外回りを分けて集計する
COURSES_WITH_VARIANT = {('京都', '芝', 1400), ('京都', '芝', 1600), ('新潟', '芝', 2000)}


def course_extras(con, data, venue_en, surface_en, dist_key, as_of):
    venue, surface = VENUE_JA[venue_en], SURFACE_JA[surface_en]
    distance = int(dist_key.split('-')[0])
    variant = dist_key.split('-')[1] if '-' in dist_key else None
    years = data.get('period_years') or YEARS
    since = as_of.replace(year=as_of.year - years)
    cond = "rm.venue_name = ? AND rm.surface = ? AND rm.distance = ? AND rm.race_date >= ?"
    params = [venue, surface, distance, since]
    if (venue, surface, distance) in COURSES_WITH_VARIANT:
        cond += " AND rm.track_variant IS NULL" if variant == 'inner' else " AND rm.track_variant = '外'"

    meta = rows(con, f"""
      SELECT mode(rm.direction) AS direction,
             SUM(CASE WHEN rm.track_variant = '外' THEN 1 ELSE 0 END) AS outer_races,
             COUNT(*) AS n
      FROM race_master rm WHERE {cond}
    """, params)[0]
    graded = rows(con, f"""
      SELECT rm.race_name, any_value(rm.grade) AS grade, max(rm.race_date) AS last_date
      FROM race_master rm WHERE {cond} AND rm.grade IN ('G1','G2','G3')
      GROUP BY rm.race_name
      ORDER BY any_value(rm.grade), last_date DESC
    """, params)
    data['course_profile'] = {
        'direction': meta['direction'],
        'track_variant': ('外' if meta['n'] and meta['outer_races'] * 2 > meta['n'] else '内') if surface == '芝' else None,
        'graded_races': graded,
    }

    if surface == '障害':
        return
    # 決め手：上がり3F最速馬（同タイムは全頭）の成績、勝ち馬の平均上がり、良馬場の平均勝ちタイム
    fin = rows(con, f"""
      WITH r AS (
        SELECT rm.race_id, rm.track_condition, rr.finish_position, rr.last_3f_time, rr.final_time, rr.corner_positions,
               rr.last_3f_time = min(rr.last_3f_time) OVER (PARTITION BY rm.race_id) AS fastest
        FROM race_master rm JOIN race_result rr USING (race_id)
        WHERE {cond} AND rr.finish_position > 0 AND rr.last_3f_time > 0
      )
      SELECT
        COUNT(DISTINCT race_id) AS races,
        SUM(CASE WHEN fastest THEN 1 ELSE 0 END) AS fastest_runs,
        ROUND(AVG(CASE WHEN fastest THEN (finish_position = 1)::INT END) * 100, 1) AS fastest_win_rate,
        ROUND(AVG(CASE WHEN fastest THEN (finish_position <= 3)::INT END) * 100, 1) AS fastest_place_rate,
        ROUND(AVG(CASE WHEN finish_position = 1 THEN last_3f_time END), 1) AS winner_avg_last3f,
        ROUND(AVG(CASE WHEN finish_position = 1 AND track_condition = '良' THEN final_time END), 1) AS avg_winning_time_good,
        SUM(CASE WHEN finish_position = 1 AND track_condition = '良' THEN 1 ELSE 0 END) AS good_races
      FROM r
    """, params)[0]
    data['finish_stats'] = fin

    gates = {}
    for key, conds in [('good', "('良')"), ('bad', "('稍','重','不')")]:
        gates[key] = rows(con, f"""
          SELECT rr.bracket_number AS gate, {STAT_COLS}
          FROM race_master rm JOIN race_result rr USING (race_id)
          WHERE {cond} AND rm.track_condition IN {conds}
          GROUP BY rr.bracket_number ORDER BY rr.bracket_number
        """, params)
    data['gate_stats_by_condition'] = gates


def main():
    if '--fetch' in sys.argv:
        fetch_sire_pedigree()
        return
    as_of = as_of_date()
    since = as_of.replace(year=as_of.year - YEARS)
    con = connect()
    n = 0
    for kind, fn in [('sires', sire_extras), ('jockey', jockey_extras), ('trainer', trainer_extras)]:
        for path in sorted((OUT_DIR / kind).glob('*.json')):
            data = load(path)
            try:
                fn(con, data, since, as_of)
            except Exception as e:  # 1件の失敗で全体を止めない（追加項目なのでサイトは無くても表示できる）
                print(f'  ❌ {path}: {e}', file=sys.stderr)
                continue
            save(path, data)
            n += 1
    for path in sorted((OUT_DIR / 'course').glob('*/*/*.json')):
        data = load(path)
        try:
            course_extras(con, data, path.parent.parent.name, path.parent.name, path.stem, as_of)
        except Exception as e:
            print(f'  ❌ {path}: {e}', file=sys.stderr)
            continue
        save(path, data)
        n += 1
    print(f'  ✅ extras added to {n} files')


if __name__ == '__main__':
    main()
