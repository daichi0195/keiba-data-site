/**
 * データページ用の固有解説文ジェネレーター
 *
 * 各ページの実データ（出走数・勝率・複勝率・回収率など）から
 * そのページ固有の要約文を組み立てる。数値が欠けている場合は
 * その文を省略し、断定的な表現はサンプル数が十分な場合のみ使う。
 */

import { MIN_RACES_FOR_MENTION, MIN_RACES_FOR_TRENDS, hasEnoughRaces } from './dataPageRules';

// 汎用の成績行
export interface StatRow {
  name?: string;
  label?: string;
  races?: number;
  wins?: number;
  places_2?: number;
  places_3?: number;
  win_rate?: number;
  place_rate?: number;
  quinella_rate?: number;
  win_payback?: number;
  place_payback?: number;
  [key: string]: unknown;
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

const pct = (v: unknown): string | null => {
  const n = num(v);
  return n === null ? null : `${n.toFixed(1)}%`;
};

const int = (v: unknown): string | null => {
  const n = num(v);
  return n === null ? null : Math.round(n).toLocaleString('ja-JP');
};

const yen = (v: unknown): string | null => {
  const n = num(v);
  return n === null || n <= 0 ? null : `${Math.round(n).toLocaleString('ja-JP')}円`;
};

const joinJa = (items: string[]): string => items.filter(Boolean).join('、');

// 出走数が閾値以上の行だけに絞る
const qualified = (rows: StatRow[] | undefined, min = MIN_RACES_FOR_MENTION): StatRow[] =>
  (rows ?? []).filter((r) => (num(r.races) ?? 0) >= min);

const maxBy = (rows: StatRow[], key: keyof StatRow): StatRow | undefined =>
  rows.length === 0
    ? undefined
    : rows.reduce((best, r) => ((num(r[key]) ?? -Infinity) > (num(best[key]) ?? -Infinity) ? r : best));

const minBy = (rows: StatRow[], key: keyof StatRow): StatRow | undefined =>
  rows.length === 0
    ? undefined
    : rows.reduce((best, r) => ((num(r[key]) ?? Infinity) < (num(best[key]) ?? Infinity) ? r : best));

const nameOf = (r: StatRow | undefined): string => String(r?.name ?? r?.label ?? '');

// ------------------------------------------------------------
// コースページ
// ------------------------------------------------------------

export interface CourseSummaryInput {
  courseName: string; // 例: 東京芝1600m
  totalRaces: number;
  periodText: string; // 例: 2023年10月9日〜2026年10月9日
  popularity: Record<string, StatRow> | undefined;
  gateStats: StatRow[] | undefined; // gate: number を含む
  runningStyleStats: StatRow[] | undefined; // style_label を含む
  jockeyStats: StatRow[] | undefined;
  trainerStats: StatRow[] | undefined;
  sireStats: StatRow[] | undefined;
  damSireStats: StatRow[] | undefined;
  characteristics: {
    volatility?: number;
    gate_position?: number;
    running_style_trend_position?: number;
    trifecta_median_payback?: number;
    trifecta_all_median_payback?: number;
    trifecta_avg_payback_rank?: number;
    total_courses?: number;
  };
  labels: {
    volatility?: string;
    gate?: string;
    runningStyle?: string;
  };
}

export function buildCourseSummary(input: CourseSummaryInput): string[] {
  const {
    courseName, totalRaces, periodText, popularity, gateStats, runningStyleStats,
    jockeyStats, trainerStats, sireStats, damSireStats, characteristics, labels,
  } = input;
  const enough = hasEnoughRaces(totalRaces);
  const paragraphs: string[] = [];

  // 1. サンプル数と期間
  {
    let p = `${courseName}では、集計期間（${periodText}）に${int(totalRaces)}レースが行われました。`;
    if (!enough) {
      p += `対象レース数が${MIN_RACES_FOR_TRENDS}レースに満たないため、このページでは「荒れやすさ」「枠順傾向」「脚質傾向」の判定や注目ポイントの抽出は行っていません。以下の数値はサンプル数が少なく、偶然の影響を強く受けるため、参考程度にご覧ください。`;
    } else {
      p += `このページでは、人気・枠順・脚質・騎手・血統・調教師の切り口で成績を集計し、コースの傾向を読み解く材料をまとめています。`;
    }
    paragraphs.push(p);
  }

  // 2. 人気と配当
  {
    const fav1 = popularity?.fav1;
    const fav10 = popularity?.fav10plus;
    const parts: string[] = [];
    if (fav1 && num(fav1.races)) {
      parts.push(
        `1番人気馬の成績は${int(fav1.races)}走${int(fav1.wins)}勝で勝率${pct(fav1.win_rate)}、複勝率${pct(fav1.place_rate)}、単勝回収率${pct(fav1.win_payback)}です。`
      );
    }
    if (fav10 && num(fav10.races)) {
      parts.push(`10番人気以下の馬は${int(fav10.races)}走で複勝率${pct(fav10.place_rate)}、複勝回収率${pct(fav10.place_payback)}となっています。`);
    }
    const median = num(characteristics.trifecta_median_payback);
    const allMedian = num(characteristics.trifecta_all_median_payback);
    const rank = num(characteristics.trifecta_avg_payback_rank);
    const total = num(characteristics.total_courses);
    if (enough && median && allMedian && rank && total) {
      const diff = median > allMedian ? '上回って' : median < allMedian ? '下回って' : 'ほぼ同じで';
      parts.push(
        `三連単配当の中央値は${yen(median)}で、全${int(total)}コースの中央値${yen(allMedian)}を${diff}おり（配当の高い順に${int(rank)}位）、総合的な荒れやすさは「${labels.volatility ?? '標準'}」と判定しています。`
      );
    }
    if (parts.length) paragraphs.push(parts.join(''));
  }

  // 3. 枠順
  {
    const gates = (gateStats ?? []).filter((g) => num(g.races));
    if (gates.length >= 2) {
      const sum = (rows: StatRow[], key: keyof StatRow) => rows.reduce((s, r) => s + (num(r[key]) ?? 0), 0);
      const inner = gates.filter((g) => (num(g.gate) ?? 0) <= 4);
      const outer = gates.filter((g) => (num(g.gate) ?? 0) >= 5);
      const rate = (rows: StatRow[]) => {
        const races = sum(rows, 'races');
        return races > 0 ? ((sum(rows, 'wins') + sum(rows, 'places_2') + sum(rows, 'places_3')) / races) * 100 : null;
      };
      const innerRate = rate(inner);
      const outerRate = rate(outer);
      const best = maxBy(gates, 'place_rate');
      const worst = minBy(gates, 'place_rate');
      const parts: string[] = [];
      if (innerRate !== null && outerRate !== null) {
        parts.push(`枠順別では、内枠（1〜4枠）の複勝率が${innerRate.toFixed(1)}%、外枠（5〜8枠）が${outerRate.toFixed(1)}%です。`);
      }
      if (best && worst && best !== worst) {
        parts.push(`枠番ごとに見ると${int(best.gate)}枠の複勝率${pct(best.place_rate)}が最も高く、${int(worst.gate)}枠の${pct(worst.place_rate)}が最も低くなっています。`);
      }
      if (enough && labels.gate) {
        parts.push(`内外の差を総合すると「${labels.gate}」と判定しています。`);
      }
      if (parts.length) paragraphs.push(parts.join(''));
    }
  }

  // 4. 脚質
  {
    const styles = (runningStyleStats ?? []).filter((s) => num(s.races) && (s.style_label || s.label));
    if (styles.length >= 2) {
      const list = styles.map((s) => `${String(s.style_label ?? s.label)}${pct(s.place_rate)}`);
      const best = maxBy(styles, 'place_rate');
      const parts: string[] = [`脚質別の複勝率は${joinJa(list)}で、${String(best?.style_label ?? best?.label)}が最も好成績です。`];
      const payback = styles.filter((s) => (num(s.win_payback) ?? 0) >= 100);
      if (payback.length) {
        parts.push(`単勝回収率が100%を超えているのは${joinJa(payback.map((s) => String(s.style_label ?? s.label)))}で、馬券的な妙味がある脚質と言えます。`);
      }
      if (enough && labels.runningStyle) {
        parts.push(`展開面では「${labels.runningStyle}」と判定しています。`);
      }
      paragraphs.push(parts.join(''));
    }
  }

  // 5. 騎手・調教師
  {
    const parts: string[] = [];
    const jq = qualified(jockeyStats);
    if (jq.length) {
      const topWins = maxBy(jq, 'wins');
      const topRate = maxBy(jq, 'win_rate');
      if (topWins) {
        const base = `騎手別（${MIN_RACES_FOR_MENTION}走以上）では${nameOf(topWins)}騎手が${int(topWins.wins)}勝（勝率${pct(topWins.win_rate)}）で最多勝`;
        parts.push(topRate && topRate !== topWins
          ? `${base}、勝率では${nameOf(topRate)}騎手の${pct(topRate.win_rate)}がトップです。`
          : `${base}です。`);
      }
      const bargain = jq.filter((r) => (num(r.win_payback) ?? 0) >= 100).sort((a, b) => (num(b.win_payback) ?? 0) - (num(a.win_payback) ?? 0)).slice(0, 3);
      if (bargain.length) {
        parts.push(`単勝回収率が100%を超えているのは${joinJa(bargain.map((r) => `${nameOf(r)}騎手（${pct(r.win_payback)}）`))}で、人気薄でも押さえておきたい存在です。`);
      }
    }
    const tq = qualified(trainerStats);
    if (tq.length) {
      const topWins = maxBy(tq, 'wins');
      if (topWins) parts.push(`調教師別では${nameOf(topWins)}厩舎が${int(topWins.wins)}勝（複勝率${pct(topWins.place_rate)}）で最多勝です。`);
    }
    if (parts.length) paragraphs.push(parts.join(''));
  }

  // 6. 血統
  {
    const parts: string[] = [];
    const sq = qualified(sireStats);
    if (sq.length) {
      const topWins = maxBy(sq, 'wins');
      const topPlace = maxBy(sq, 'place_rate');
      if (topWins) {
        const base = `種牡馬別（${MIN_RACES_FOR_MENTION}走以上）では${nameOf(topWins)}産駒が${int(topWins.wins)}勝で最多`;
        parts.push(topPlace && topPlace !== topWins
          ? `${base}、複勝率では${nameOf(topPlace)}産駒の${pct(topPlace.place_rate)}が最も高くなっています。`
          : `${base}です。`);
      }
    }
    const dq = qualified(damSireStats);
    if (dq.length) {
      const topWins = maxBy(dq, 'wins');
      if (topWins) parts.push(`母父別では${nameOf(topWins)}が${int(topWins.wins)}勝（複勝率${pct(topWins.place_rate)}）でトップです。`);
    }
    if (parts.length) paragraphs.push(parts.join(''));
  }

  return paragraphs;
}

// ------------------------------------------------------------
// 騎手・調教師・種牡馬ページ共通
// ------------------------------------------------------------

interface PersonLike {
  name: string;
  total_races?: number;
  total_stats?: StatRow;
  data_period?: string;
  yearly_stats?: Array<StatRow & { year?: number }>;
  yearly_leading?: Array<{ year?: number; wins?: number; ranking?: number }>;
  surface_stats?: StatRow[];
  distance_stats?: Array<StatRow & { category?: string }>;
  racecourse_stats?: StatRow[];
  course_stats?: StatRow[];
  running_style_stats?: Array<StatRow & { style_label?: string }>;
  class_stats?: Array<StatRow & { class_name?: string }>;
  popularity_stats?: Record<string, StatRow>;
  characteristics?: {
    fav1_place_rate?: number;
    all_fav1_place_rate?: number;
    fav1_ranking?: number;
    total_jockeys?: number;
    total_trainers?: number;
  };
}

const periodOf = (p?: string): string => p?.match(/（([^）]+)）/)?.[1] ?? '直近3年間';

// 「東京」「中山」など単独の競馬場だけを対象（中央/ローカルの集計行を除く）
const RACECOURSE_NAMES = ['札幌', '函館', '福島', '新潟', '東京', '中山', '中京', '京都', '阪神', '小倉'];
const realRacecourses = (rows?: StatRow[]) => (rows ?? []).filter((r) => RACECOURSE_NAMES.includes(nameOf(r)));

function overallSentence(subject: string, p: PersonLike, periodText: string): string | null {
  const t = p.total_stats;
  const total = num(p.total_races) ?? num(t?.races);
  if (!total) return null;
  let s = `${subject}は、集計期間（${periodText}）に${int(total)}レースに出走し、`;
  if (t && num(t.wins) !== null) {
    s += `${int(t.wins)}勝・2着${int(t.places_2)}回・3着${int(t.places_3)}回、勝率${pct(t.win_rate)}、連対率${pct(t.quinella_rate)}、複勝率${pct(t.place_rate)}という成績です。`;
  } else {
    s += 'その成績をまとめています。';
  }
  const latest = (p.yearly_stats ?? []).filter((y) => num(y.races)).sort((a, b) => (num(b.year) ?? 0) - (num(a.year) ?? 0))[0];
  if (latest) {
    const lead = (p.yearly_leading ?? []).find((l) => l.year === latest.year);
    s += `${String(latest.year)}年は${int(latest.races)}戦${int(latest.wins)}勝（複勝率${pct(latest.place_rate)}`;
    s += lead?.ranking ? `、リーディング${int(lead.ranking)}位）です。` : '）です。';
  }
  return s;
}

function surfaceDistanceSentence(subject: string, p: PersonLike): string | null {
  const parts: string[] = [];
  const turf = (p.surface_stats ?? []).find((s) => s.surface === '芝');
  const dirt = (p.surface_stats ?? []).find((s) => s.surface === 'ダート');
  if (turf && dirt && num(turf.races) && num(dirt.races)) {
    const better = (num(turf.place_rate) ?? 0) >= (num(dirt.place_rate) ?? 0) ? '芝' : 'ダート';
    parts.push(`芝は${int(turf.races)}戦で複勝率${pct(turf.place_rate)}、ダートは${int(dirt.races)}戦で複勝率${pct(dirt.place_rate)}と、${better}の方が安定しています。`);
  }
  const dq = qualified(p.distance_stats);
  if (dq.length >= 2) {
    const best = maxBy(dq, 'place_rate');
    const worst = minBy(dq, 'place_rate');
    if (best && worst && best !== worst) {
      parts.push(`距離別では${String(best.category)}（${int(best.races)}戦）の複勝率${pct(best.place_rate)}が最も高く、${String(worst.category)}の${pct(worst.place_rate)}が最も低くなっています。`);
    }
  }
  return parts.length ? `${subject}の${parts.join('')}` : null;
}

function racecourseSentence(subject: string, p: PersonLike): string | null {
  const parts: string[] = [];
  const rq = qualified(realRacecourses(p.racecourse_stats));
  if (rq.length >= 2) {
    const sorted = [...rq].sort((a, b) => (num(b.place_rate) ?? 0) - (num(a.place_rate) ?? 0));
    const top = sorted.slice(0, 2).map((r) => `${nameOf(r)}競馬場（${int(r.races)}戦・複勝率${pct(r.place_rate)}）`);
    const bottom = sorted[sorted.length - 1];
    parts.push(`競馬場別（${MIN_RACES_FOR_MENTION}戦以上）で複勝率が高いのは${joinJa(top)}で、最も低いのは${nameOf(bottom)}競馬場（${pct(bottom.place_rate)}）です。`);
  }
  const cq = qualified(p.course_stats, 10);
  if (cq.length) {
    const best = maxBy(cq, 'wins');
    if (best) parts.push(`コース別（10戦以上）では${nameOf(best)}で${int(best.wins)}勝（複勝率${pct(best.place_rate)}）を挙げています。`);
  }
  return parts.length ? `${subject}の${parts.join('')}` : null;
}

function runningStyleClassSentence(subject: string, p: PersonLike): string | null {
  const parts: string[] = [];
  const sq = qualified(p.running_style_stats);
  if (sq.length >= 2) {
    const list = sq.map((s) => `${String(s.style_label)}${pct(s.place_rate)}`);
    const best = maxBy(sq, 'place_rate');
    parts.push(`脚質別の複勝率は${joinJa(list)}で、${String(best?.style_label)}のときが最も好成績です。`);
  }
  const cq = qualified(p.class_stats);
  if (cq.length >= 2) {
    const best = maxBy(cq, 'place_rate');
    if (best) parts.push(`クラス別では${String(best.class_name)}（${int(best.races)}戦）の複勝率${pct(best.place_rate)}が最も高くなっています。`);
  }
  return parts.length ? `${subject}の${parts.join('')}` : null;
}

function reliabilitySentence(subject: string, p: PersonLike, peerLabel: string): string | null {
  const c = p.characteristics;
  const mine = num(c?.fav1_place_rate);
  const all = num(c?.all_fav1_place_rate);
  if (!mine || !all) return null;
  const diff = mine > all ? '上回って' : mine < all ? '下回って' : 'ほぼ同じで';
  let s = `${subject}が1番人気に支持されたときの複勝率は${mine.toFixed(1)}%で、${peerLabel}全体の平均${all.toFixed(1)}%を${diff}います`;
  const rank = num(c?.fav1_ranking);
  const total = num(c?.total_jockeys) ?? num(c?.total_trainers);
  if (rank && total) s += `（対象${int(total)}${peerLabel.includes('種牡馬') ? '頭' : '人'}中${int(rank)}位）`;
  return `${s}。`;
}

function paybackSentence(subject: string, p: PersonLike): string | null {
  const candidates: string[] = [];
  const add = (rows: StatRow[] | undefined, labelKey: string, suffix = '') => {
    qualified(rows).forEach((r) => {
      if ((num(r.win_payback) ?? 0) >= 100) candidates.push(`${String(r[labelKey] ?? r.name ?? r.label)}${suffix}（${pct(r.win_payback)}）`);
    });
  };
  add(p.surface_stats, 'surface');
  add(p.distance_stats, 'category');
  add(p.class_stats, 'class_name');
  add(realRacecourses(p.racecourse_stats), 'name', '競馬場');
  if (!candidates.length) return null;
  return `${subject}の単勝回収率が100%を超えている条件は${joinJa(candidates.slice(0, 4))}で、人気と実力のギャップが生まれやすい条件と言えます。`;
}

export function buildJockeySummary(j: PersonLike & { affiliation?: string; debut_year?: number; trainer_stats?: StatRow[] }): string[] {
  const subject = `${j.name}騎手`;
  const period = periodOf(j.data_period);
  const intro = j.affiliation || j.debut_year
    ? `${subject}（${[j.affiliation ? `${j.affiliation}所属` : '', j.debut_year ? `${j.debut_year}年デビュー` : ''].filter(Boolean).join('・')}）`
    : subject;
  const paragraphs = [
    overallSentence(intro, j, period),
    reliabilitySentence(subject, j, '騎手'),
    surfaceDistanceSentence(subject, j),
    racecourseSentence(subject, j),
    runningStyleClassSentence(subject, j),
  ];
  const tq = qualified(j.trainer_stats);
  if (tq.length) {
    const top = maxBy(tq, 'races');
    if (top) paragraphs.push(`最も多くコンビを組んでいる調教師は${nameOf(top)}調教師で、${int(top.races)}戦${int(top.wins)}勝（複勝率${pct(top.place_rate)}）です。`);
  }
  paragraphs.push(paybackSentence(subject, j));
  return paragraphs.filter((p): p is string => Boolean(p));
}

export function buildTrainerSummary(t: PersonLike & { stable?: string; debut_year?: number; jockey_stats?: StatRow[]; interval_stats?: Array<StatRow & { interval?: string }> }): string[] {
  const subject = `${t.name}調教師`;
  const period = periodOf(t.data_period);
  const intro = t.stable || t.debut_year
    ? `${subject}（${[t.stable ? `${t.stable}所属` : '', t.debut_year ? `${t.debut_year}年開業` : ''].filter(Boolean).join('・')}）`
    : subject;
  const paragraphs = [
    overallSentence(intro, t, period),
    reliabilitySentence(subject, t, '調教師'),
    surfaceDistanceSentence(`${subject}の管理馬`, t),
    racecourseSentence(`${subject}の管理馬`, t),
    runningStyleClassSentence(`${subject}の管理馬`, t),
  ];
  const jq = qualified(t.jockey_stats);
  if (jq.length) {
    const top = maxBy(jq, 'races');
    if (top) paragraphs.push(`最も多く騎乗依頼しているのは${nameOf(top)}騎手で、${int(top.races)}戦${int(top.wins)}勝（複勝率${pct(top.place_rate)}）です。`);
  }
  const iq = qualified(t.interval_stats);
  if (iq.length >= 2) {
    const best = maxBy(iq, 'place_rate');
    if (best) paragraphs.push(`レース間隔別では${String(best.interval)}（${int(best.races)}戦）の複勝率${pct(best.place_rate)}が最も高く、ローテーションの傾向を読む手がかりになります。`);
  }
  paragraphs.push(paybackSentence(`${subject}の管理馬`, t));
  return paragraphs.filter((p): p is string => Boolean(p));
}

export function buildSireSummary(s: PersonLike & { birth_year?: number; age_stats?: Array<StatRow & { age?: string }>; dam_sire_stats?: StatRow[]; track_condition_stats?: Array<StatRow & { surface?: string; condition_label?: string }> }): string[] {
  const subject = `${s.name}産駒`;
  const period = periodOf(s.data_period);
  const paragraphs = [
    overallSentence(subject, s, period),
    surfaceDistanceSentence(subject, s),
    racecourseSentence(subject, s),
    runningStyleClassSentence(subject, s),
  ];
  const aq = qualified(s.age_stats);
  if (aq.length >= 2) {
    const best = maxBy(aq, 'place_rate');
    const worst = minBy(aq, 'place_rate');
    if (best && worst && best !== worst) {
      paragraphs.push(`馬齢別では${String(best.age)}（${int(best.races)}戦）の複勝率${pct(best.place_rate)}が最も高く、${String(worst.age)}の${pct(worst.place_rate)}が最も低くなっており、成長曲線を読む参考になります。`);
    }
  }
  const tc = qualified(s.track_condition_stats);
  if (tc.length >= 2) {
    const heavy = tc.filter((r) => r.condition_label === '重' || r.condition_label === '不');
    const good = tc.filter((r) => r.condition_label === '良');
    const rate = (rows: StatRow[]) => {
      const races = rows.reduce((a, r) => a + (num(r.races) ?? 0), 0);
      const hits = rows.reduce((a, r) => a + (num(r.wins) ?? 0) + (num(r.places_2) ?? 0) + (num(r.places_3) ?? 0), 0);
      return races > 0 ? (hits / races) * 100 : null;
    };
    const g = rate(good);
    const h = rate(heavy);
    if (g !== null && h !== null) {
      paragraphs.push(`馬場状態別では、良馬場の複勝率${g.toFixed(1)}%に対して重・不良馬場では${h.toFixed(1)}%で、道悪は${h > g ? '得意' : h < g ? '苦手' : '良馬場と同程度'}な傾向です。`);
    }
  }
  const dq = qualified(s.dam_sire_stats);
  if (dq.length) {
    const top = maxBy(dq, 'wins');
    const best = maxBy(dq, 'place_rate');
    if (top) {
      let p = `母父別（${MIN_RACES_FOR_MENTION}走以上）では${nameOf(top)}との配合が${int(top.wins)}勝で最多`;
      p += best && best !== top ? `、複勝率では${nameOf(best)}との配合（${pct(best.place_rate)}）が最も高くなっています。` : 'です。';
      paragraphs.push(p);
    }
  }
  paragraphs.push(paybackSentence(subject, s));
  return paragraphs.filter((p): p is string => Boolean(p));
}
