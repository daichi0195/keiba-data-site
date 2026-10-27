/**
 * データページ用の固有解説文ジェネレーター
 *
 * 各ページの実データ（出走数・勝率・複勝率・回収率など）から
 * そのページ固有の要約文を組み立てる。数値が欠けている場合は
 * その文を省略し、断定的な表現はサンプル数が十分な場合のみ使う。
 */

import { MIN_RACES_FOR_MENTION, MIN_RACES_FOR_TRENDS, hasEnoughRaces } from './dataPageRules';
import { periodFromDataPeriod } from './dataDate';

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

// データ概要の段落。key で段落の種類を表し、text の **…** は強調する箇所
export type CourseSummaryBlockKey = 'lead' | 'intro' | 'popularity' | 'gate' | 'runningStyle' | 'people' | 'pedigree';
export interface CourseSummaryBlock {
  key: CourseSummaryBlockKey;
  text: string;
}

const stripEmphasis = (text: string): string => text.replace(/\*\*([^*]+)\*\*/g, '$1');

export function buildCourseSummary(input: CourseSummaryInput): string[] {
  return buildCourseSummaryBlocks(input).map((b) => stripEmphasis(b.text));
}


// ------------------------------------------------------------
// 書き分けの共通処理
// 同じ骨格に数字を差し込むだけの文にならないよう、差の大きさ（強い／やや／小さい）で
// 文の組み立てを変え、偏りの大きい切り口から順に書く。言い換えのランダム化はしない。
// ------------------------------------------------------------

type Tier = 'strong' | 'mild' | 'flat';
// 判定ゲージと同じ閾値（5ポイント・2ポイント。/about/data の「傾向判定のルール」）
const tierOf = (diff: number): Tier => (Math.abs(diff) >= 5 ? 'strong' : Math.abs(diff) >= 2 ? 'mild' : 'flat');
const pt = (diff: number): string => `${Math.abs(diff).toFixed(1)}ポイント`;

// 複数行をまとめた複勝率（出走数で重み付け）
const pooledPlaceRate = (rows: StatRow[]): { races: number; rate: number | null } => {
  const races = rows.reduce((s, r) => s + (num(r.races) ?? 0), 0);
  const hits = rows.reduce((s, r) => s + (num(r.wins) ?? 0) + (num(r.places_2) ?? 0) + (num(r.places_3) ?? 0), 0);
  return { races, rate: races > 0 ? (hits / races) * 100 : null };
};

// 1位が2位を大きく引き離しているか（1.5倍以上かつ3勝差以上）
const dominates = (top: StatRow, second: StatRow | undefined): boolean => {
  if (!second) return false;
  const a = num(top.wins) ?? 0;
  const b = num(second.wins) ?? 0;
  return a >= b * 1.5 && a - b >= 3;
};

const byDesc = (key: keyof StatRow) => (a: StatRow, b: StatRow) => (num(b[key]) ?? 0) - (num(a[key]) ?? 0);

const styleLabelOf = (r: StatRow): string => String(r.style_label ?? r.label ?? '');
const FRONT_STYLES = ['逃げ', '先行'];
const CLOSER_STYLES = ['差し', '追込'];

export function buildCourseSummaryBlocks(input: CourseSummaryInput): CourseSummaryBlock[] {
  const {
    courseName, totalRaces, periodText, popularity, gateStats, runningStyleStats,
    jockeyStats, trainerStats, sireStats, damSireStats, characteristics, labels,
  } = input;
  const enough = hasEnoughRaces(totalRaces);
  const blocks: CourseSummaryBlock[] = [];
  // 人気・枠順・脚質の3段落は、偏りの大きい順に並べ替える
  const trendBlocks: Array<CourseSummaryBlock & { salience: number }> = [];

  // 1. サンプル数と期間
  {
    let p = `${courseName}では、集計期間（${periodText}）に${int(totalRaces)}レースが行われました。`;
    if (!enough) {
      p += `対象レース数が${MIN_RACES_FOR_TRENDS}レースに満たないため、このページでは「荒れやすさ」「枠順傾向」「脚質傾向」の判定や注目ポイントの抽出は行っていません。以下の数値はサンプル数が少なく、偶然の影響を強く受けるため、参考程度にご覧ください。`;
    }
    blocks.push({ key: 'intro', text: p });
  }

  // 2. 人気と配当（荒れやすさの判定で、人気馬と人気薄のどちらから書くかを変える）
  {
    const fav1 = popularity?.fav1 && num(popularity.fav1.races) ? popularity.fav1 : undefined;
    const fav10 = popularity?.fav10plus && num(popularity.fav10plus.races) ? popularity.fav10plus : undefined;
    const median = num(characteristics.trifecta_median_payback);
    const allMedian = num(characteristics.trifecta_all_median_payback);
    const rank = num(characteristics.trifecta_avg_payback_rank);
    const total = num(characteristics.total_courses);
    const vol = enough ? labels.volatility : undefined;
    const firm = !!vol && vol.includes('堅い');
    const rough = !!vol && vol.includes('荒れ');

    const fav1Text = fav1
      ? `1番人気は${int(fav1.races)}走${int(fav1.wins)}勝で勝率${pct(fav1.win_rate)}、**複勝率${pct(fav1.place_rate)}**、単勝回収率${pct(fav1.win_payback)}です。`
      : '';
    const fav10Text = fav10
      ? `10番人気以下は${int(fav10.races)}走で複勝率${pct(fav10.place_rate)}、複勝回収率${pct(fav10.place_payback)}です。`
      : '';
    const medianText = enough && median && allMedian && rank && total
      ? `三連単配当の中央値は**${yen(median)}**で、全${int(total)}コースの中央値${yen(allMedian)}を${median > allMedian ? '上回り' : median < allMedian ? '下回り' : 'ほぼ同じで'}、配当の高い順に${int(rank)}位です。`
      : '';

    const parts: string[] = [];
    if (firm) {
      parts.push(`${vol === '堅い' ? '上位人気が崩れにくい' : '比較的、人気どおりに決まりやすい'}コースです。`, fav1Text, medianText);
      if (fav1 && (num(fav1.win_payback) ?? 0) >= 85) parts.push(`1番人気の単勝回収率が${pct(fav1.win_payback)}と高めで、人気馬を素直に評価しやすい条件です。`);
      if (fav10) parts.push(`一方、10番人気以下の複勝率は${pct(fav10.place_rate)}にとどまります。`);
    } else if (rough) {
      // 荒れやすさの判定は三連単配当の中央値によるので、人気薄の好走率ではなく配当の高さとして書く
      parts.push(`${vol === '荒れやすい' ? '高配当が出やすい' : 'やや波乱が起きやすい'}コースです。`);
      if (fav10) {
        parts.push(`10番人気以下でも${int(fav10.races)}走で複勝率${pct(fav10.place_rate)}、複勝回収率${pct(fav10.place_payback)}を記録しています。`);
        if ((num(fav10.place_payback) ?? 0) >= 100) parts.push('複勝回収率が100%を超えており、人気薄を押さえる価値がある数字です。');
      }
      parts.push(medianText, fav1Text);
    } else {
      parts.push(fav1Text, fav10Text, medianText);
      if (vol) parts.push('配当の荒れやすさは全コースの中で標準的な水準です。');
    }
    const text = parts.filter(Boolean).join('');
    const salience = vol === '堅い' || vol === '荒れやすい' ? 6 : firm || rough ? 3 : 0;
    if (text) trendBlocks.push({ key: 'popularity', text, salience });
  }

  // 3. 枠順・4. 脚質（内外の差・前後の差の大きさで書き出しを変え、両方に偏りがあれば1文で組み合わせる）
  const gates = (gateStats ?? []).filter((g) => num(g.races));
  const innerRate = pooledPlaceRate(gates.filter((g) => (num(g.gate) ?? 0) <= 4)).rate;
  const outerRate = pooledPlaceRate(gates.filter((g) => (num(g.gate) ?? 0) >= 5)).rate;
  const gateDiff = innerRate !== null && outerRate !== null ? innerRate - outerRate : null;
  const styles = (runningStyleStats ?? []).filter((s) => num(s.races) && styleLabelOf(s));
  const frontRate = pooledPlaceRate(styles.filter((s) => FRONT_STYLES.includes(styleLabelOf(s)))).rate;
  const closerRate = pooledPlaceRate(styles.filter((s) => CLOSER_STYLES.includes(styleLabelOf(s)))).rate;
  const styleDiff = frontRate !== null && closerRate !== null ? frontRate - closerRate : null;

  if (gates.length >= 2 && innerRate !== null && outerRate !== null && gateDiff !== null) {
    const parts: string[] = [];
    const better = gateDiff > 0 ? '内枠' : '外枠';
    const rates = `内枠（1〜4枠）の複勝率が${innerRate.toFixed(1)}%、外枠（5〜8枠）が${outerRate.toFixed(1)}%`;
    const tier = enough ? tierOf(gateDiff) : null;
    if (tier === 'strong') parts.push(`**${better}の好走率が高い**コースで、${rates}と${pt(gateDiff)}の差があります。`);
    else if (tier === 'mild') parts.push(`${rates}で、${better}がやや優勢です。`);
    else if (tier === 'flat') parts.push(`${rates}と内外の差は${pt(gateDiff)}にとどまり、枠順の有利不利は小さいコースです。`);
    else parts.push(`枠順別では、${rates}です。`);
    const best = maxBy(gates, 'place_rate');
    const worst = minBy(gates, 'place_rate');
    const spread = (num(best?.place_rate) ?? 0) - (num(worst?.place_rate) ?? 0);
    if (best && worst && best !== worst) {
      parts.push(spread >= 4
        ? `枠番ごとでは**${int(best.gate)}枠の複勝率${pct(best.place_rate)}**が最も高く、${int(worst.gate)}枠の${pct(worst.place_rate)}が最も低くなっています。`
        : `枠番ごとの複勝率も${pct(worst.place_rate)}〜${pct(best.place_rate)}の範囲に収まっています。`);
    }
    trendBlocks.push({ key: 'gate', text: parts.join(''), salience: enough ? Math.abs(gateDiff) : 0 });
  }

  if (styles.length >= 2) {
    const parts: string[] = [];
    const list = styles.map((s) => `${styleLabelOf(s)}${pct(s.place_rate)}`);
    const tier = enough && styleDiff !== null ? tierOf(styleDiff) : null;
    if (styleDiff !== null && frontRate !== null && closerRate !== null && tier) {
      const rates = `逃げ・先行の複勝率${frontRate.toFixed(1)}%、差し・追込${closerRate.toFixed(1)}%`;
      if (tier === 'strong') {
        parts.push(styleDiff > 0
          ? `**先行力が問われる**コースで、${rates}と${pt(styleDiff)}の差があります。`
          : `**差し・追込が届きやすい**コースで、${rates}と後方からの馬が${pt(styleDiff)}上回ります。`);
      } else if (tier === 'mild') {
        parts.push(`${rates}で、${styleDiff > 0 ? '逃げ・先行' : '差し・追込'}がやや有利です。`);
      } else {
        parts.push(`${rates}と、脚質による差は小さめです。`);
      }
    }
    // 傾向を判定できるときは、すぐ下の脚質別の表と同じ数字の羅列を省く
    if (!tier) parts.push(`脚質別の複勝率は${joinJa(list)}です。`);
    const escape = styles.find((s) => styleLabelOf(s) === '逃げ');
    if (enough && escape && (num(escape.place_rate) ?? 0) >= 45) {
      parts.push(`特に逃げ馬は複勝率${pct(escape.place_rate)}と、ハナを切れれば粘り込みやすい舞台です。`);
    }
    // 枠順と脚質の両方に偏りがあるときは、狙いやすい馬のタイプを1文で示す
    if (enough && gateDiff !== null && styleDiff !== null && tierOf(gateDiff) !== 'flat' && tierOf(styleDiff) !== 'flat') {
      const inner = gateDiff > 0;
      const front = styleDiff > 0;
      parts.push(
        inner && front ? '内枠有利とあわせると、内から前に付けられる馬が狙いやすい形です。'
          : !inner && !front ? '外枠有利とあわせると、外から脚を伸ばせる馬が向く形です。'
            : inner && !front ? '内枠有利でありながら差しも届くため、内で脚をためられる馬が理想的です。'
              : '外枠有利で前も残るため、外からでも先行できる馬が狙いやすい形です。'
      );
    }
    const payback = styles.filter((s) => (num(s.win_payback) ?? 0) >= 100);
    if (payback.length) {
      parts.push(`単勝回収率が100%を超えているのは${joinJa(payback.map((s) => `${styleLabelOf(s)}（${pct(s.win_payback)}）`))}です。`);
    }
    trendBlocks.push({ key: 'runningStyle', text: parts.join(''), salience: enough && styleDiff !== null ? Math.abs(styleDiff) : 0 });
  }

  if (enough) trendBlocks.sort((a, b) => b.salience - a.salience);
  trendBlocks.forEach(({ key, text }) => blocks.push({ key, text }));

  // 5. 騎手・調教師（1位が抜けているか、上位が拮抗しているかで書き分ける）
  {
    const parts: string[] = [];
    const jq = qualified(jockeyStats).sort(byDesc('wins'));
    if (jq.length) {
      const [top, second] = jq;
      if (dominates(top, second)) {
        parts.push(`騎手別（${MIN_RACES_FOR_MENTION}走以上）では**${nameOf(top)}騎手が${int(top.wins)}勝**と頭ひとつ抜けており、2位の${nameOf(second)}騎手（${int(second.wins)}勝）に${int((num(top.wins) ?? 0) - (num(second.wins) ?? 0))}勝差をつけています。`);
      } else if (second) {
        parts.push(`騎手別（${MIN_RACES_FOR_MENTION}走以上）の最多勝は**${nameOf(top)}騎手の${int(top.wins)}勝**で、${nameOf(second)}騎手が${int(second.wins)}勝で続く接戦です。`);
      } else {
        parts.push(`騎手別（${MIN_RACES_FOR_MENTION}走以上）では**${nameOf(top)}騎手が${int(top.wins)}勝**で最多勝です。`);
      }
      const topRate = maxBy(jq, 'win_rate');
      if (topRate && topRate !== top) parts.push(`勝率では${nameOf(topRate)}騎手の${pct(topRate.win_rate)}が最も高くなっています。`);
      if ((num(top.win_payback) ?? 0) >= 100) {
        parts.push(`最多勝の${nameOf(top)}騎手は単勝回収率も${pct(top.win_payback)}と、人気以上に勝ち切っています。`);
      } else {
        const bargain = jq.filter((r) => r !== top && (num(r.win_payback) ?? 0) >= 100).sort(byDesc('win_payback')).slice(0, 3);
        if (bargain.length) parts.push(`単勝回収率が100%を超えているのは${joinJa(bargain.map((r) => `${nameOf(r)}騎手（${pct(r.win_payback)}）`))}です。`);
      }
    }
    const tq = qualified(trainerStats).sort(byDesc('wins'));
    if (tq.length) {
      const [top, second] = tq;
      parts.push(dominates(top, second)
        ? `調教師別では${nameOf(top)}厩舎が${int(top.wins)}勝（複勝率${pct(top.place_rate)}）と、ほかの厩舎を大きく引き離しています。`
        : `調教師別では${nameOf(top)}厩舎の${int(top.wins)}勝（複勝率${pct(top.place_rate)}）が最多です。`);
    }
    if (parts.length) blocks.push({ key: 'people', text: parts.join('') });
  }

  // 6. 血統
  {
    const parts: string[] = [];
    const sq = qualified(sireStats).sort(byDesc('wins'));
    if (sq.length) {
      const [top, second] = sq;
      parts.push(dominates(top, second)
        ? `種牡馬別（${MIN_RACES_FOR_MENTION}走以上）では**${nameOf(top)}産駒が${int(top.wins)}勝**と突出しており、2位の${nameOf(second)}産駒（${int(second.wins)}勝）を大きく上回ります。`
        : `種牡馬別（${MIN_RACES_FOR_MENTION}走以上）の最多勝は**${nameOf(top)}産駒の${int(top.wins)}勝**${second ? `で、${nameOf(second)}産駒（${int(second.wins)}勝）が続きます` : 'です'}。`);
      const topPlace = maxBy(sq, 'place_rate');
      if (topPlace && topPlace !== top) parts.push(`複勝率では${nameOf(topPlace)}産駒の${pct(topPlace.place_rate)}が最も高くなっています。`);
    }
    const dq = qualified(damSireStats).sort(byDesc('wins'));
    if (dq.length) {
      const top = dq[0];
      parts.push(`母父別では${nameOf(top)}が${int(top.wins)}勝（複勝率${pct(top.place_rate)}）でトップです。`);
    }
    if (parts.length) blocks.push({ key: 'pedigree', text: parts.join('') });
  }

  return blocks;
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

/** データ概要の段落。key で段落の話題を表し、各ページで見出しを付ける */
export type PersonSummaryKey =
  | 'overall' | 'reliability' | 'surface' | 'racecourse' | 'style' | 'partner'
  | 'interval' | 'age' | 'condition' | 'damSire' | 'payback';
export interface PersonSummaryBlock {
  key: PersonSummaryKey;
  text: string;
}
interface ScoredBlock extends PersonSummaryBlock {
  salience: number;
}

const periodOf = (p?: string): string => periodFromDataPeriod(p) ?? '直近3年間';

// 「東京」「中山」など単独の競馬場だけを対象（中央/ローカルの集計行を除く）
const MAJOR_RACECOURSES = ['東京', '中山', '京都', '阪神'];
const RACECOURSE_NAMES = ['札幌', '函館', '福島', '新潟', '東京', '中山', '中京', '京都', '阪神', '小倉'];
const realRacecourses = (rows?: StatRow[]) => (rows ?? []).filter((r) => RACECOURSE_NAMES.includes(nameOf(r)));

// 期間全体の複勝率（各条件の比較の基準にする）
const baseRateOf = (p: PersonLike): number | null => num(p.total_stats?.place_rate);

function overallBlock(intro: string, p: PersonLike, periodText: string): ScoredBlock | null {
  const t = p.total_stats;
  const total = num(p.total_races) ?? num(t?.races);
  if (!total) return null;
  let s = `${intro}は、集計期間（${periodText}）に${int(total)}レースに出走し、`;
  s += t && num(t.wins) !== null
    ? `${int(t.wins)}勝・2着${int(t.places_2)}回・3着${int(t.places_3)}回、勝率${pct(t.win_rate)}、連対率${pct(t.quinella_rate)}、複勝率${pct(t.place_rate)}という成績です。`
    : 'その成績をまとめています。';

  // 年ごとの推移：直近の年を期間平均と比べ、3年以上そろえば伸びているか落ちているかも書く
  const base = baseRateOf(p);
  const years = (p.yearly_stats ?? [])
    .filter((y) => (num(y.races) ?? 0) >= MIN_RACES_FOR_MENTION && num(y.place_rate) !== null)
    .sort((a, b) => (num(a.year) ?? 0) - (num(b.year) ?? 0));
  const latest = years[years.length - 1];
  if (latest) {
    const lead = (p.yearly_leading ?? []).find((l) => l.year === latest.year);
    const head = `${String(latest.year)}年は${int(latest.races)}戦${int(latest.wins)}勝（複勝率${pct(latest.place_rate)}${lead?.ranking ? `、リーディング${int(lead.ranking)}位` : ''}）`;
    const diff = base !== null ? (num(latest.place_rate) ?? 0) - base : 0;
    const tier = base !== null ? tierOf(diff) : 'flat';
    s += tier === 'flat' ? `${head}で、期間全体と同程度の水準です。`
      : diff > 0 ? `${head}と、期間全体の複勝率を${pt(diff)}上回っています。`
        : `${head}で、期間全体の複勝率を${pt(diff)}下回っています。`;
  }
  if (years.length >= 3) {
    const rates = years.map((y) => num(y.place_rate) ?? 0);
    const rising = rates.every((r, i) => i === 0 || r > rates[i - 1]);
    const falling = rates.every((r, i) => i === 0 || r < rates[i - 1]);
    const span = `${String(years[0].year)}年${rates[0].toFixed(1)}%→${String(latest.year)}年${rates[rates.length - 1].toFixed(1)}%`;
    if (rising && rates[rates.length - 1] - rates[0] >= 2) s += `複勝率は年を追うごとに上がっています（${span}）。`;
    else if (falling && rates[0] - rates[rates.length - 1] >= 2) s += `複勝率は年を追うごとに下がっています（${span}）。`;
  }
  return { key: 'overall', text: s, salience: Infinity };
}

function surfaceDistanceBlock(subject: string, p: PersonLike): ScoredBlock | null {
  const parts: string[] = [];
  let salience = 0;
  const base = baseRateOf(p);
  const turf = (p.surface_stats ?? []).find((s) => s.surface === '芝');
  const dirt = (p.surface_stats ?? []).find((s) => s.surface === 'ダート');
  const tr = num(turf?.races) ?? 0;
  const dr = num(dirt?.races) ?? 0;
  if (turf && dirt && tr && dr) {
    const share = tr / (tr + dr);
    const diff = (num(turf.place_rate) ?? 0) - (num(dirt.place_rate) ?? 0);
    const better = diff >= 0 ? '芝' : 'ダート';
    const worse = diff >= 0 ? 'ダート' : '芝';
    if (share >= 0.85 || share <= 0.15) {
      const [main, mainRow, other, otherRow] = share >= 0.85 ? ['芝', turf, 'ダート', dirt] as const : ['ダート', dirt, '芝', turf] as const;
      parts.push(`${subject}の主戦場は${main}で、出走の${Math.round(Math.max(share, 1 - share) * 100)}%を占めます（${main}の複勝率${pct(mainRow.place_rate)}）。${other}は${int(otherRow.races)}戦で複勝率${pct(otherRow.place_rate)}です。`);
    } else {
      const tier = tierOf(diff);
      salience = Math.abs(diff);
      parts.push(
        tier === 'strong' ? `${subject}は**${better}で好成績**を残しており、複勝率は${better}${pct(diff >= 0 ? turf.place_rate : dirt.place_rate)}、${worse}${pct(diff >= 0 ? dirt.place_rate : turf.place_rate)}と${pt(diff)}の差があります。`
          : tier === 'mild' ? `${subject}の複勝率は芝${pct(turf.place_rate)}、ダート${pct(dirt.place_rate)}で、${better}の方がやや上です。`
            : `${subject}の複勝率は芝${pct(turf.place_rate)}、ダート${pct(dirt.place_rate)}とほぼ同じで、芝・ダートを問わず安定しています。`
      );
    }
  }
  const dq = qualified(p.distance_stats);
  if (dq.length >= 2) {
    const best = maxBy(dq, 'place_rate');
    const worst = minBy(dq, 'place_rate');
    if (best && worst && best !== worst) {
      const spread = (num(best.place_rate) ?? 0) - (num(worst.place_rate) ?? 0);
      const tier = tierOf(spread);
      salience = Math.max(salience, spread * 0.8);
      const lead = parts.length ? '距離別では' : `${subject}の距離別成績では、`;
      if (tier === 'strong' && base !== null && (num(best.place_rate) ?? 0) - base >= 2) {
        parts.push(`${lead}**${String(best.category)}（複勝率${pct(best.place_rate)}）**が得意条件で、期間全体の${base.toFixed(1)}%を${pt((num(best.place_rate) ?? 0) - base)}上回ります。最も低いのは${String(worst.category)}の${pct(worst.place_rate)}です。`);
      } else if (tier === 'flat') {
        parts.push(`${lead}複勝率が${pct(worst.place_rate)}〜${pct(best.place_rate)}の範囲に収まり、距離による差は小さめです。`);
      } else {
        parts.push(`${lead}${String(best.category)}（${int(best.races)}戦）の複勝率${pct(best.place_rate)}が最も高く、${String(worst.category)}の${pct(worst.place_rate)}が最も低くなっています。`);
      }
    }
  }
  return parts.length ? { key: 'surface', text: parts.join(''), salience } : null;
}

function racecourseBlock(subject: string, p: PersonLike): ScoredBlock | null {
  const parts: string[] = [];
  let salience = 0;
  const base = baseRateOf(p);
  const rq = qualified(realRacecourses(p.racecourse_stats));
  if (rq.length >= 2) {
    const sorted = [...rq].sort(byDesc('place_rate'));
    const top = sorted.slice(0, 2);
    const bottom = sorted[sorted.length - 1];
    const topRate = num(top[0].place_rate) ?? 0;
    salience = base !== null ? Math.abs(topRate - base) : 0;
    // 中央4場とローカル開催の差がはっきりしていれば先に書く
    const major = pooledPlaceRate(rq.filter((r) => MAJOR_RACECOURSES.includes(nameOf(r))));
    const local = pooledPlaceRate(rq.filter((r) => !MAJOR_RACECOURSES.includes(nameOf(r))));
    if (major.rate !== null && local.rate !== null && major.races >= MIN_RACES_FOR_MENTION && local.races >= MIN_RACES_FOR_MENTION && Math.abs(local.rate - major.rate) >= 3) {
      const localBetter = local.rate > major.rate;
      parts.push(`${subject}は${localBetter ? 'ローカル開催' : '中央4場（東京・中山・京都・阪神）'}の方が成績が良く、複勝率は中央4場${major.rate.toFixed(1)}%、ローカル${local.rate.toFixed(1)}%です。`);
      salience = Math.max(salience, Math.abs(local.rate - major.rate));
    }
    const lead = parts.length ? '競馬場別' : `${subject}の競馬場別成績`;
    parts.push(`${lead}（${MIN_RACES_FOR_MENTION}戦以上）では${joinJa(top.map((r) => `${nameOf(r)}競馬場（${int(r.races)}戦・複勝率${pct(r.place_rate)}）`))}が上位で、最も低いのは${nameOf(bottom)}競馬場（${pct(bottom.place_rate)}）です。`);
    if (base !== null && topRate - base >= 5) parts.push(`特に${nameOf(top[0])}競馬場は期間全体の複勝率を${pt(topRate - base)}上回っています。`);
  }
  const cq = qualified(p.course_stats, 10);
  if (cq.length) {
    const best = maxBy(cq, 'wins');
    if (best) parts.push(`コース別（10戦以上）では${nameOf(best)}で${int(best.wins)}勝（複勝率${pct(best.place_rate)}）を挙げています。`);
  }
  return parts.length ? { key: 'racecourse', text: parts.join(''), salience } : null;
}

// 脚質は定義上（差し・追込は上がり3位以内の馬だけを数える）どの騎手・種牡馬でも差しの数値が高く出て、
// 個別の特徴を表さないため文章にせず、脚質別の表と特徴の判定（逃げ・先行と差し・追込の比較）に任せる
function runningStyleClassBlock(subject: string, p: PersonLike): ScoredBlock | null {
  const parts: string[] = [];
  const cq = qualified(p.class_stats);
  if (cq.length >= 2) {
    const best = maxBy(cq, 'place_rate');
    const worst = minBy(cq, 'place_rate');
    if (best) {
      parts.push(best !== worst && worst
        ? `${subject}のクラス別成績では${String(best.class_name)}（${int(best.races)}戦）の複勝率${pct(best.place_rate)}が最も高く、${String(worst.class_name)}は${pct(worst.place_rate)}です。`
        : `${subject}のクラス別成績では${String(best.class_name)}（${int(best.races)}戦）の複勝率${pct(best.place_rate)}が最も高くなっています。`);
    }
  }
  return parts.length ? { key: 'style', text: parts.join(''), salience: 0 } : null;
}

function reliabilityBlock(subject: string, p: PersonLike, peerLabel: string): ScoredBlock | null {
  const c = p.characteristics;
  const mine = num(c?.fav1_place_rate);
  const all = num(c?.all_fav1_place_rate);
  if (!mine || !all) return null;
  const diff = mine - all;
  const rank = num(c?.fav1_ranking);
  const total = num(c?.total_jockeys) ?? num(c?.total_trainers);
  const rankText = rank && total ? `（対象${int(total)}人中${int(rank)}位）` : '';
  const tier = tierOf(diff);
  const text = tier === 'strong' && diff > 0
    ? `${subject}は**1番人気での信頼度が高く**、1番人気に支持されたときの複勝率${mine.toFixed(1)}%は${peerLabel}全体の平均${all.toFixed(1)}%を${pt(diff)}上回ります${rankText}。`
    : tier === 'strong'
      ? `${subject}が1番人気に支持されたときの複勝率は${mine.toFixed(1)}%で、${peerLabel}全体の平均${all.toFixed(1)}%を${pt(diff)}下回ります${rankText}。人気を背負った場面では過信は禁物です。`
      : tier === 'mild'
        ? `${subject}が1番人気に支持されたときの複勝率は${mine.toFixed(1)}%で、${peerLabel}全体の平均${all.toFixed(1)}%をやや${diff > 0 ? '上回って' : '下回って'}います${rankText}。`
        : `${subject}が1番人気に支持されたときの複勝率は${mine.toFixed(1)}%で、${peerLabel}全体の平均${all.toFixed(1)}%と同程度です${rankText}。`;
  return { key: 'reliability', text, salience: Math.abs(diff) };
}

// 最も多く組んでいる相手（騎手ページなら調教師、調教師ページなら騎手）
function partnerBlock(p: PersonLike, rows: StatRow[] | undefined, firstText: (top: StatRow) => string, partnerSuffix: string): ScoredBlock | null {
  const q = qualified(rows);
  if (!q.length) return null;
  const top = maxBy(q, 'races');
  if (!top) return null;
  const parts = [firstText(top)];
  const total = num(p.total_races) ?? num(p.total_stats?.races);
  const share = total ? (num(top.races) ?? 0) / total : 0;
  if (share >= 0.08) parts.push(`全出走の${Math.round(share * 100)}%を占める関係です。`);
  const base = baseRateOf(p);
  const diff = base !== null ? (num(top.place_rate) ?? 0) - base : 0;
  if (base !== null && tierOf(diff) === 'strong') {
    parts.push(diff > 0 ? `このコンビでは期間全体の複勝率を${pt(diff)}上回っています。` : `ただし、このコンビでの複勝率は期間全体を${pt(diff)}下回ります。`);
  }
  const best = maxBy(q, 'place_rate');
  if (best && best !== top) parts.push(`複勝率が最も高い組み合わせは${nameOf(best)}${partnerSuffix}（${int(best.races)}戦・${pct(best.place_rate)}）です。`);
  return { key: 'partner', text: parts.join(''), salience: 0 };
}

function paybackBlock(subject: string, p: PersonLike): ScoredBlock | null {
  const candidates: Array<{ label: string; v: number }> = [];
  const add = (rows: StatRow[] | undefined, labelKey: string, suffix = '') => {
    qualified(rows).forEach((r) => {
      const v = num(r.win_payback) ?? 0;
      if (v >= 100) candidates.push({ label: `${String(r[labelKey] ?? r.name ?? r.label)}${suffix}`, v });
    });
  };
  add(p.surface_stats, 'surface');
  add(p.distance_stats, 'category');
  add(p.class_stats, 'class_name');
  add(realRacecourses(p.racecourse_stats), 'name', '競馬場');
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.v - a.v);
  const list = joinJa(candidates.slice(0, 4).map((c) => `${c.label}（${c.v.toFixed(1)}%）`));
  const text = candidates.length === 1
    ? `${subject}の単勝回収率が100%を超えている条件は${list}だけです。`
    : `${subject}の単勝回収率が100%を超えている条件は${list}です。${candidates[0].v >= 150 ? `特に${candidates[0].label}は人気以上の結果を残しています。` : ''}`;
  return { key: 'payback', text, salience: 0 };
}

// 全体成績を先頭に、偏りの大きい切り口（salience > 0）から順に並べ、残りは決まった順で続ける
function orderBlocks(blocks: Array<ScoredBlock | null>): PersonSummaryBlock[] {
  const list = blocks.filter((b): b is ScoredBlock => Boolean(b));
  const ranked = list.filter((b) => b.salience > 0).sort((a, b) => b.salience - a.salience);
  const rest = list.filter((b) => !(b.salience > 0));
  return [...ranked, ...rest].map(({ key, text }) => ({ key, text }));
}

type JockeyInput = PersonLike & { affiliation?: string; debut_year?: number; trainer_stats?: StatRow[] };
type TrainerInput = PersonLike & { stable?: string; debut_year?: number; jockey_stats?: StatRow[]; interval_stats?: Array<StatRow & { interval?: string }> };
type SireInput = PersonLike & { birth_year?: number; age_stats?: Array<StatRow & { age?: string }>; dam_sire_stats?: StatRow[]; track_condition_stats?: Array<StatRow & { surface?: string; condition_label?: string }> };

export function buildJockeySummaryKeyed(j: JockeyInput): PersonSummaryBlock[] {
  const subject = `${j.name}騎手`;
  const intro = j.affiliation || j.debut_year
    ? `${subject}（${[j.affiliation ? `${j.affiliation}所属` : '', j.debut_year ? `${j.debut_year}年デビュー` : ''].filter(Boolean).join('・')}）`
    : subject;
  return orderBlocks([
    overallBlock(intro, j, periodOf(j.data_period)),
    reliabilityBlock(subject, j, '騎手'),
    surfaceDistanceBlock(subject, j),
    racecourseBlock(subject, j),
    runningStyleClassBlock(subject, j),
    partnerBlock(j, j.trainer_stats, (top) => `最も多くコンビを組んでいる調教師は${nameOf(top)}調教師で、${int(top.races)}戦${int(top.wins)}勝（複勝率${pct(top.place_rate)}）です。`, '調教師'),
    paybackBlock(subject, j),
  ]);
}

export function buildTrainerSummaryKeyed(t: TrainerInput): PersonSummaryBlock[] {
  const subject = `${t.name}調教師`;
  const horses = `${subject}の管理馬`;
  const intro = t.stable || t.debut_year
    ? `${subject}（${[t.stable ? `${t.stable}所属` : '', t.debut_year ? `${t.debut_year}年開業` : ''].filter(Boolean).join('・')}）`
    : subject;
  let interval: ScoredBlock | null = null;
  const iq = qualified(t.interval_stats);
  if (iq.length >= 2) {
    const best = maxBy(iq, 'place_rate');
    const base = baseRateOf(t);
    if (best) {
      const diff = base !== null ? (num(best.place_rate) ?? 0) - base : 0;
      interval = {
        key: 'interval',
        text: base !== null && tierOf(diff) === 'strong'
          ? `レース間隔別では**${String(best.interval)}（${int(best.races)}戦）の複勝率${pct(best.place_rate)}**が最も高く、期間全体を${pt(diff)}上回ります。`
          : `レース間隔別では${String(best.interval)}（${int(best.races)}戦）の複勝率${pct(best.place_rate)}が最も高くなっています。`,
        salience: 0,
      };
    }
  }
  return orderBlocks([
    overallBlock(intro, t, periodOf(t.data_period)),
    reliabilityBlock(subject, t, '調教師'),
    surfaceDistanceBlock(horses, t),
    racecourseBlock(horses, t),
    runningStyleClassBlock(horses, t),
    partnerBlock(t, t.jockey_stats, (top) => `最も多く騎乗依頼しているのは${nameOf(top)}騎手で、${int(top.races)}戦${int(top.wins)}勝（複勝率${pct(top.place_rate)}）です。`, '騎手'),
    interval,
    paybackBlock(horses, t),
  ]);
}

export function buildSireSummaryKeyed(s: SireInput): PersonSummaryBlock[] {
  const subject = `${s.name}産駒`;
  let age: ScoredBlock | null = null;
  const aq = qualified(s.age_stats);
  if (aq.length >= 2) {
    const best = maxBy(aq, 'place_rate');
    const worst = minBy(aq, 'place_rate');
    if (best && worst && best !== worst) {
      // 2歳戦の構造上、ほぼ全ての種牡馬で2歳が高く出るため、早熟・晩成の判定はせず数値の比較だけにする
      age = { key: 'age', text: `馬齢別では${String(best.age)}（${int(best.races)}戦）の複勝率${pct(best.place_rate)}が最も高く、${String(worst.age)}の${pct(worst.place_rate)}が最も低くなっています。`, salience: 0 };
    }
  }
  let condition: ScoredBlock | null = null;
  const tc = qualified(s.track_condition_stats);
  if (tc.length >= 2) {
    const g = pooledPlaceRate(tc.filter((r) => r.condition_label === '良')).rate;
    const h = pooledPlaceRate(tc.filter((r) => r.condition_label === '重' || r.condition_label === '不')).rate;
    if (g !== null && h !== null) {
      const diff = h - g;
      const tier = tierOf(diff);
      const rates = `重・不良馬場の複勝率${h.toFixed(1)}%は良馬場の${g.toFixed(1)}%`;
      condition = {
        key: 'condition',
        text: tier === 'strong'
          ? `馬場状態別では**${diff > 0 ? '道悪巧者' : '道悪は苦手'}**の傾向がはっきりしており、${rates}を${pt(diff)}${diff > 0 ? '上回ります' : '下回ります'}。`
          : tier === 'mild'
            ? `馬場状態別では、${rates}をやや${diff > 0 ? '上回り' : '下回り'}、道悪は${diff > 0 ? 'こなせる' : 'やや割り引きたい'}傾向です。`
            : `馬場状態別では、良馬場${g.toFixed(1)}%、重・不良馬場${h.toFixed(1)}%と、馬場状態による差はほとんどありません。`,
        salience: Math.abs(diff),
      };
    }
  }
  let damSire: ScoredBlock | null = null;
  const dq = qualified(s.dam_sire_stats);
  if (dq.length) {
    const top = maxBy(dq, 'wins');
    const best = maxBy(dq, 'place_rate');
    if (top) {
      damSire = {
        key: 'damSire',
        text: `母父別（${MIN_RACES_FOR_MENTION}走以上）では${nameOf(top)}との配合が${int(top.wins)}勝で最多${best && best !== top ? `、複勝率では${nameOf(best)}との配合（${pct(best.place_rate)}）が最も高くなっています。` : 'です。'}`,
        salience: 0,
      };
    }
  }
  return orderBlocks([
    overallBlock(subject, s, periodOf(s.data_period)),
    surfaceDistanceBlock(subject, s),
    racecourseBlock(subject, s),
    condition,
    runningStyleClassBlock(subject, s),
    age,
    damSire,
    paybackBlock(subject, s),
  ]);
}

export function buildJockeySummary(j: JockeyInput): string[] {
  return buildJockeySummaryKeyed(j).map((b) => b.text);
}

export function buildTrainerSummary(t: TrainerInput): string[] {
  return buildTrainerSummaryKeyed(t).map((b) => b.text);
}

export function buildSireSummary(s: SireInput): string[] {
  return buildSireSummaryKeyed(s).map((b) => b.text);
}
