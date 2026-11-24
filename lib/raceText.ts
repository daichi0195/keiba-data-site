/**
 * レース別ページの文章（冒頭の要約・傾向ポイント・消去法・Q&A）をデータから組み立てる。
 * AI による概要が載せる「勝ち馬一覧＋人気・年齢・前走・枠・脚質・配当の傾向」に合わせる（docs/seo/race_serp_2026-11.md）。
 */
import type { RaceData, RaceStat, StatKey } from './races';

const SURF: Record<string, string> = { turf: '芝', dirt: 'ダート' };

export const rec = (s: Pick<RaceStat, 'races' | 'wins' | 'places_2' | 'places_3'>) =>
  `【${s.wins}-${s.places_2}-${s.places_3}-${s.races - s.wins - s.places_2 - s.places_3}】`;
const placed = (s: RaceStat) => s.wins + s.places_2 + s.places_3;
const pct = (v: number) => `${v.toFixed(1)}%`;
const yen = (v: number) => `${v.toLocaleString('ja-JP')}円`;

export function courseLabel(d: RaceData) {
  return `${d.venue}${SURF[d.surface] ?? ''}${d.distance}m`;
}

export function periodLabel(d: RaceData) {
  return `過去${d.period.count}年（${d.period.from}〜${d.period.to}年）`;
}

/** 集計対象の回の勝ち馬 */
export function winners(d: RaceData) {
  return d.editions.filter((e) => e.included).map((e) => ({ e, w: e.results.find((r) => r.fin === 1) ?? e.results[0] }));
}

/** 3連単の配当（同着は高い方） */
export function trifectaByYear(d: RaceData) {
  return d.editions
    .filter((e) => e.included && e.payouts.trifecta.length > 0)
    .map((e) => ({ year: e.year, yen: Math.max(...e.payouts.trifecta.map((p) => p.yen)) }));
}

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n === 0 ? 0 : n % 2 ? s[(n - 1) / 2] : Math.round((s[n / 2 - 1] + s[n / 2]) / 2);
}

export interface Point {
  key: string;
  title: string;
  text: string;
}

function byWins(rows: RaceStat[]) {
  return [...rows].sort((a, b) => b.wins - a.wins || placed(b) - placed(a) || b.place_rate - a.place_rate);
}

/** 3着以内が1頭もいない行（出走10以上） */
function zeroRows(rows: RaceStat[], min = 10) {
  return rows.filter((r) => r.races >= min && placed(r) === 0);
}

/** 3着以内がない年齢を「6歳以上」のようにまとめる（上の年齢から続いている場合） */
function ageZeroLabel(ages: RaceStat[]): string {
  const zero = zeroRows(ages, 1).filter((r) => r.races > 0);
  if (!zero.length) return '';
  const last = ages[ages.length - 1];
  const idx = ages.indexOf(zero[0]);
  const tail = ages.slice(idx);
  if (zero.includes(last) && tail.every((r) => zero.includes(r) || r.races === 0) && tail.reduce((a, r) => a + r.races, 0) >= 10) {
    return `${(zero[0].label ?? '').replace('以上', '')}以上`;
  }
  return zeroRows(ages).map((r) => r.label).join('・');
}

function sumRows(rows: RaceStat[]): RaceStat {
  const s = rows.reduce((a, r) => ({ races: a.races + r.races, wins: a.wins + r.wins, places_2: a.places_2 + r.places_2, places_3: a.places_3 + r.places_3 }), { races: 0, wins: 0, places_2: 0, places_3: 0 });
  return {
    ...s,
    win_rate: s.races ? (s.wins / s.races) * 100 : 0,
    quinella_rate: s.races ? ((s.wins + s.places_2) / s.races) * 100 : 0,
    place_rate: s.races ? ((s.wins + s.places_2 + s.places_3) / s.races) * 100 : 0,
    win_payback: 0, place_payback: 0, avg_popularity: null, avg_rank: 0, median_popularity: null, median_rank: 0,
  };
}

export function buildRaceSummary(d: RaceData) {
  const S = d.stats;
  const name = d.name;
  const n = d.period.count;
  const ws = winners(d);
  const fav1 = S.popularity.find((r) => r.label === '1番人気');
  const maxWinPop = Math.max(...ws.map((x) => x.w.pop ?? 99));
  const top3Total = S.popularity.reduce((a, r) => a + placed(r), 0);
  const top3Top5 = S.popularity.filter((r) => /^[1-5]番人気$/.test(r.label ?? '')).reduce((a, r) => a + placed(r), 0);
  const low = S.popularity.find((r) => r.label === '10番人気〜');

  // 年齢
  const ages = byWins(S.age);
  const ageTop = ages[0];
  const ageTies = ages.filter((r) => r.wins === ageTop?.wins);
  const ageZero = ageZeroLabel(S.age);

  // 前走
  const prevTop = byWins(S.prev_race.filter((r) => r.label !== 'その他'))[0];
  const prevG1 = S.prev_class.find((r) => r.label === 'G1');
  const prevWin = S.prev_finish.find((r) => r.label === '1着');

  // 枠
  const inner = sumRows(S.frame.filter((r) => (r.gate ?? 0) <= 4));
  const outer = sumRows(S.frame.filter((r) => (r.gate ?? 0) >= 5));
  const frameTop = byWins(S.frame)[0];
  const frameDiff = inner.place_rate - outer.place_rate;

  // 脚質
  const styles = S.style;
  const styleWins = styles.filter((r) => r.wins > 0).sort((a, b) => b.wins - a.wins);
  const styleZero = zeroRows(styles);

  // 上がり
  const l3 = S.last3f;
  const l3Top3Winners = ws.filter((x) => x.w.last3f_rank && x.w.last3f_rank <= 3).length;
  const l3Low = l3.find((r) => r.label === '6位以下');
  const pl3Top3 = sumRows(S.prev_last3f.filter((r) => ['1位', '2位', '3位'].includes(r.label ?? '')));
  const pl3Rest = sumRows(S.prev_last3f.filter((r) => !['1位', '2位', '3位'].includes(r.label ?? '')));

  // 配当
  const tri = trifectaByYear(d);
  const triMax = tri.reduce((a, b) => (b.yen > a.yen ? b : a), tri[0] ?? { year: 0, yen: 0 });
  const tri100k = tri.filter((t) => t.yen >= 100000).length;
  const triMed = median(tri.map((t) => t.yen));

  const winnerPop = maxWinPop <= 5 ? `勝ち馬${ws.length}頭はすべて${maxWinPop}番人気以内` : `勝ち馬の最低人気は${maxWinPop}番人気`;
  const lead = [
    `${name}（${courseLabel(d)}）の${periodLabel(d)}は、`,
    fav1 ? `1番人気が**${fav1.wins}勝・複勝率${pct(fav1.place_rate)}**。` : '',
    `${winnerPop}で、3着以内${top3Total}頭のうち${top3Top5}頭が5番人気以内です。`,
    ageZero ? `${ageZero}は3着以内がありません。` : '',
  ].join('');

  const points: Point[] = [];
  if (fav1) {
    points.push({
      key: 'popularity',
      title: `1番人気は${fav1.wins}勝・複勝率${pct(fav1.place_rate)}`,
      text: `1番人気は**${rec(fav1)}**。${winnerPop}です。${low && placed(low) === 0 && low.races >= 10 ? `10番人気以下は${rec(low)}で3着以内がありません。` : low ? `10番人気以下は${rec(low)}です。` : ''}`,
    });
  }
  if (ageTop) {
    points.push({
      key: 'age',
      title: `${ageTies.map((r) => r.label).join('・')}が${ageTop.wins}勝で最多`,
      text: `${S.age.filter((r) => r.races > 0).map((r) => `${r.label}${rec(r)}`).join('、')}。${ageZero ? `**${ageZero}は3着以内なし**です。` : ''}`,
    });
  }
  if (prevTop) {
    points.push({
      key: 'prev',
      title: `前走${prevTop.label}組が${prevTop.wins}勝`,
      text: `前走${prevTop.label}組は**${rec(prevTop)}**。${prevG1 ? `前走G1組は${rec(prevG1)}（複勝率${pct(prevG1.place_rate)}）、` : ''}${prevWin ? `前走1着馬は${rec(prevWin)}（複勝率${pct(prevWin.place_rate)}）です。` : ''}`,
    });
  }
  if (inner.races && outer.races) {
    points.push({
      key: 'frame',
      title: frameDiff >= 8 ? '内枠（1〜4枠）が優勢' : frameDiff <= -8 ? '外枠（5〜8枠）が優勢' : '枠の有利不利は小さい',
      text: `1〜4枠の複勝率**${pct(inner.place_rate)}**に対し、5〜8枠は**${pct(outer.place_rate)}**。最も勝っているのは${frameTop.label}の${frameTop.wins}勝${rec(frameTop)}です。`,
    });
  }
  if (styleWins.length) {
    points.push({
      key: 'style',
      title: `勝ち馬は${styleWins.map((r) => `${r.label}${r.wins}頭`).join('・')}`,
      text: `${styles.map((r) => `${r.label}${rec(r)}`).join('、')}。${styleZero.length ? `**${styleZero.map((r) => r.label).join('・')}は3着以内なし**です。` : ''}`,
    });
  }
  if (l3.length) {
    points.push({
      key: 'last3f',
      title: `勝ち馬${ws.length}頭中${l3Top3Winners}頭が上がり3位以内`,
      text: `${l3.map((r) => `上がり${r.label}${rec(r)}`).join('、')}。${l3Low && l3Low.races >= 10 ? `上がり6位以下の複勝率は**${pct(l3Low.place_rate)}**です。` : ''}${pl3Top3.races && pl3Rest.races ? `前走で上がり3位以内だった馬は${rec(pl3Top3)}（複勝率${pct(pl3Top3.place_rate)}）、4位以下は${rec(pl3Rest)}（複勝率${pct(pl3Rest.place_rate)}）です。` : ''}`,
    });
  }
  if (tri.length) {
    points.push({
      key: 'payout',
      title: tri100k === 0 ? '3連単10万円超えはなし' : `3連単10万円超えは${tri100k}回`,
      text: `3連単の中央値は**${yen(triMed)}**、最高は${triMax.year}年の${yen(triMax.yen)}です。${n}回のうち10万円を超えたのは${tri100k}回です。`,
    });
  }

  return { lead, points, tri: { max: triMax, median: triMed, over100k: tri100k } };
}

/** 消去法（3着以内がない条件）と好走条件（複勝率が高い条件）。出走10以上 */
const COND_SOURCES: { key: StatKey; fmt: (l: string) => string }[] = [
  { key: 'popularity', fmt: (l) => l },
  { key: 'frame', fmt: (l) => l },
  { key: 'number', fmt: (l) => `馬番${l}` },
  { key: 'style', fmt: (l) => `脚質：${l}` },
  { key: 'age', fmt: (l) => l },
  { key: 'sex', fmt: (l) => l },
  { key: 'affil', fmt: (l) => (l === '外国' ? '外国馬' : l === '地方' ? '地方馬' : `${l}所属`) },
  { key: 'prev_class', fmt: (l) => (l === '海外' || l === '地方' ? `前走${l}` : `前走${l}`) },
  { key: 'prev_race', fmt: (l) => `前走${l}` },
  { key: 'prev_finish', fmt: (l) => `前走${l}` },
  { key: 'prev_pop', fmt: (l) => `前走${l}` },
  { key: 'prev_last3f', fmt: (l) => `前走上がり${l}` },
  { key: 'interval', fmt: (l) => `間隔${l}` },
  { key: 'jockey_change', fmt: (l) => l },
  { key: 'body_weight', fmt: (l) => `馬体重${l}kg` },
];

export function buildConditions(d: RaceData, min = 10) {
  const all = COND_SOURCES.flatMap(({ key, fmt }) =>
    d.stats[key].filter((r) => r.label && r.label !== 'その他').map((r) => ({ ...r, label: fmt(r.label as string), src: key })),
  );
  const zero = all.filter((r) => r.races >= min && placed(r) === 0).sort((a, b) => b.races - a.races);
  const good = all.filter((r) => r.races >= min && placed(r) > 0).sort((a, b) => b.place_rate - a.place_rate || b.races - a.races).slice(0, 8);
  return { zero, good };
}

export function buildRaceFaq(d: RaceData, summary: ReturnType<typeof buildRaceSummary>) {
  const name = d.name;
  const S = d.stats;
  const ws = winners(d);
  const conds = buildConditions(d);
  const items: { q: string; a: string }[] = [];
  items.push({
    q: `${name}の過去10年の勝ち馬は？`,
    a: `${periodLabel(d)}の勝ち馬は、${ws.map(({ e, w }) => `${e.year}年${w.horse}（${w.pop}番人気）`).join('、')}です。`,
  });
  const fav1 = S.popularity.find((r) => r.label === '1番人気');
  if (fav1) items.push({ q: `${name}の1番人気の成績は？`, a: `${periodLabel(d)}の1番人気は**${rec(fav1)}**で、勝率${pct(fav1.win_rate)}・複勝率${pct(fav1.place_rate)}です。` });
  const p = summary.points;
  const pt = (k: string) => p.find((x) => x.key === k);
  if (pt('payout')) items.push({ q: `${name}は荒れる？`, a: `${pt('payout')!.text}` });
  if (pt('frame')) items.push({ q: `${name}で有利な枠は？`, a: `**${pt('frame')!.title}**です。${pt('frame')!.text}` });
  if (pt('style')) items.push({ q: `${name}で有利な脚質は？`, a: `${pt('style')!.text}` });
  if (pt('age')) items.push({ q: `${name}は何歳が強い？`, a: `**${pt('age')!.title}**です。${pt('age')!.text}` });
  if (pt('last3f')) items.push({ q: `${name}は上がりの速い馬が有利？`, a: `**${pt('last3f')!.title}**です。${pt('last3f')!.text}` });
  if (pt('prev')) items.push({ q: `${name}の前走（ステップレース）は？`, a: `${pt('prev')!.text}` });
  if (conds.zero.length) {
    items.push({
      q: `${name}の消去法データは？`,
      a: `${periodLabel(d)}で3着以内がない条件は、${conds.zero.slice(0, 6).map((r) => `${r.label}${rec(r)}`).join('、')}です。\n※出走10頭以上の条件が対象です。`,
    });
  }
  const j = S.jockey.slice(0, 3);
  if (j.length) items.push({ q: `${name}で好成績の騎手は？`, a: `勝利数の多い騎手は${j.map((r) => `${r.name}${rec(r)}`).join('、')}です。` });
  const s = S.sire.slice(0, 3);
  if (s.length) items.push({ q: `${name}で好成績の血統（種牡馬）は？`, a: `勝利数の多い種牡馬は${s.map((r) => `${r.name}${rec(r)}`).join('、')}です。` });
  return items;
}
