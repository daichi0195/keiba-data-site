/**
 * 種牡馬・騎手・調教師ページの追加項目（docs/seo/gap_analysis.md）
 * データは gcs/v2/generate_extras.py が JSON に書き足したもの。文の方針は lib/dataPageText.ts と同じ
 * （数値は必ずデータから入れる・欠けた要素は省く・言い切りはサンプルが十分なときだけ）
 */

export interface GradedWin {
  date: string;
  race_name: string;
  grade: string;
  venue: string;
  surface: string;
  distance: number;
  horse_id: number;
  horse_name: string;
  jockey_name?: string;
  trainer_name?: string;
  popularity?: number | null;
}

export interface NotableHorse {
  horse_id: number;
  horse_name: string;
  sex: string;
  age: number | null;
  races: number;
  wins: number;
  places_2?: number;
  places_3?: number;
  graded_wins: number;
  titles: string[];
  damsire?: string | null;
  father?: string | null;
  last_date?: string;
  g1_wins?: number;
  birth_year?: number | null;
}

export interface SireProfile {
  father?: string | null;
  damsire?: string | null;
  birth_year?: number | null;
  birthplace?: string | null;
  imported?: boolean;
  /** 父系の系統（例 { name: 'ロベルト系', via: 'スクリーンヒーロー' }） */
  sire_line?: { name: string; via?: string | null } | null;
}

/** 早熟・晩成の判定（generate_extras.py growth_trend）。pos 1=早熟〜5=晩成 */
export interface GrowthTrend {
  pos: number;
  label: string;
  place_rate_2: number;
  place_rate_4: number;
  all_place_rate_2: number;
  all_place_rate_4: number;
}

/** 牡馬・牝馬の判定（generate_extras.py gender_trend）。pos 1=牡馬が優勢〜5=牝馬が優勢 */
export interface GenderTrend {
  pos: number;
  label: string;
  male_races: number;
  female_races: number;
  male_place_rate: number;
  female_place_rate: number;
  all_male_place_rate: number;
  all_female_place_rate: number;
}

/** 世代（生年）別の勝ち上がり率 */
export interface CropStat {
  crop: number;
  starters: number;
  winners: number;
  graded_winners: number;
  rate: number;
  all_rate: number | null;
  /** 3歳の年が終わった世代 */
  complete: boolean;
}

export interface PersonProfile {
  birth_date?: string | null;
  license_date?: string | null;
  region?: string | null;
}

export interface GrowthRate {
  age: string;
  races: number;
  place_rate: number;
  all_place_rate?: number | null;
}

interface StatLike {
  category?: string;
  races: number;
  place_rate: number;
}

interface ClassStatLike {
  class_name?: string;
  races: number;
  wins: number;
}

/** 'YYYY-MM-DD' → 'YYYY年M月D日' */
export function jaDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return `${y}年${m}月${d}日`;
}

/** 'YYYY-MM-DD' → 'YYYY/M/D'（表の日付） */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${y}/${m}/${d}`;
}

/** 満年齢（基準日はデータの最終更新日） */
export function ageAt(birthIso: string | null | undefined, asOf: Date): number | null {
  if (!birthIso) return null;
  const [y, m, d] = birthIso.slice(0, 10).split('-').map(Number);
  let age = asOf.getFullYear() - y;
  if (asOf.getMonth() + 1 < m || (asOf.getMonth() + 1 === m && asOf.getDate() < d)) age -= 1;
  return age;
}

/** 重賞（G1〜G3）の勝利数と出走数（クラス別データから） */
export function gradedTotals(classStats: ClassStatLike[] | undefined) {
  const rows = (classStats ?? []).filter((c) => c.class_name && ['G1', 'G2', 'G3'].includes(c.class_name));
  const by = (g: string) => rows.find((c) => c.class_name === g)?.wins ?? 0;
  return {
    wins: rows.reduce((a, c) => a + (c.wins ?? 0), 0),
    races: rows.reduce((a, c) => a + (c.races ?? 0), 0),
    g1: by('G1'),
    g2: by('G2'),
    g3: by('G3'),
  };
}

/** 距離帯のうち複勝率が最も高いもの（出走 minRaces 以上） */
export function bestBand<T extends StatLike>(rows: T[] | undefined, minRaces = 50): T | null {
  const ok = (rows ?? []).filter((r) => r.races >= minRaces);
  if (ok.length === 0) return null;
  return [...ok].sort((a, b) => b.place_rate - a.place_rate)[0];
}

/** 同じ重賞を複数回勝っている場合は「G1 高松宮記念×2」のようにまとめる（勝った順を保つ） */
export function formatTitles(titles: string[], limit?: number): string[] {
  const counts = new Map<string, number>();
  titles.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  const list = [...counts].map(([t, n]) => (n > 1 ? `${t}×${n}` : t));
  return limit ? list.slice(0, limit) : list;
}

const titleList = (h: NotableHorse) => (h.titles.length > 0 ? `（${formatTitles(h.titles, 2).join('、')}）` : '');

// ------------------------------------------------------------
// 種牡馬
// ------------------------------------------------------------

/** 系統の表記（例「ロベルト系（スクリーンヒーロー経由）」） */
export function sireLineText(profile?: SireProfile | null): string | null {
  const l = profile?.sire_line;
  if (!l?.name) return null;
  return l.via ? `${l.name}（${l.via}経由）` : l.name;
}

/** 成長の判定を文中で使う形（「早熟タイプ」「やや晩成寄り」「成長曲線は標準的」） */
export function growthPhrase(g?: GrowthTrend | null): string | null {
  if (!g) return null;
  return { 1: '**早熟タイプ**', 2: '**やや早熟寄り**', 3: '成長曲線は標準的', 4: '**やや晩成寄り**', 5: '**晩成タイプ**' }[g.pos] ?? null;
}

/** データ概要の先頭に置く結論文 */
export function buildSireLead(args: {
  name: string;
  profile?: SireProfile | null;
  surfaceTrendText: string;
  distanceTrendText: string;
  bestTurf: StatLike | null;
  bestDirt: StatLike | null;
  progeny?: NotableHorse[];
  growth?: GrowthTrend | null;
}): string {
  const { name, profile, surfaceTrendText, distanceTrendText, bestTurf, bestDirt, progeny, growth } = args;
  const lines: string[] = [];
  const line = sireLineText(profile);
  const pedigree = [profile?.father ? `父${profile.father}` : null, profile?.damsire ? `母父${profile.damsire}` : null].filter(Boolean).join('、');
  if (line) lines.push(`${name}は**${line}**の種牡馬です${pedigree ? `（${pedigree}）` : ''}。`);
  else if (pedigree) lines.push(`${name}は${pedigree}の種牡馬です。`);
  const surface = surfaceTrendText === '差分なし' ? '芝・ダートの成績差は小さく' : `**${surfaceTrendText}**で`;
  const g = growthPhrase(growth);
  const distance = distanceTrendText === '差分なし' ? '距離による差も小さめ' : `距離は**${distanceTrendText}**`;
  lines.push(`${line || pedigree ? '産駒' : `${name}産駒`}は${surface}、${distance}${g ? `、${g}` : ''}です。`);
  const bands = [
    bestTurf ? `芝が**${bestTurf.category}**（複勝率${bestTurf.place_rate.toFixed(1)}%）` : null,
    bestDirt ? `ダートが**${bestDirt.category}**（複勝率${bestDirt.place_rate.toFixed(1)}%）` : null,
  ].filter(Boolean);
  if (bands.length > 0) lines.push(`最も成績が良い距離帯は、${bands.join('、')}です。`);
  const stars = (progeny ?? []).filter((h) => h.graded_wins > 0).slice(0, 3);
  if (stars.length > 0) lines.push(`代表産駒は${stars.map((h) => `${h.horse_name}${titleList(h)}`).join('、')}など。`);
  return lines.join('');
}

/** Q&A「芝とダートで得意な距離は？」 */
export function buildSireBandAnswer(name: string, turf: StatLike[] | undefined, dirt: StatLike[] | undefined): string | null {
  const t = bestBand(turf);
  const d = bestBand(dirt);
  if (!t && !d) return null;
  const parts = [
    t ? `芝は${t.category}の**${t.place_rate.toFixed(1)}%**` : null,
    d ? `ダートは${d.category}の**${d.place_rate.toFixed(1)}%**` : null,
  ].filter(Boolean);
  return `${name}産駒の複勝率が最も高い距離帯は、${parts.join('、')}です。\n※距離帯ごとに出走50回以上を対象にしています。`;
}

/**
 * 早熟・晩成の判定方法の説明（ページ本文とQ&Aで使う）。
 * 一般的な「2歳の成績が良い＝早熟」という見方は、2歳戦の構造による偏りを含んでいる。当サイトはそれを補正して判定している、という点を伝える
 */
export const GROWTH_METHOD =
  '一般に「2歳戦の成績が良い種牡馬＝早熟」と言われがちですが、2歳戦は新馬・未勝利戦が中心で、素質のある馬が多い成績上位の種牡馬ほど2歳の数値が高く出ます。2歳の成績だけで比べると、上位の種牡馬はほとんどが「早熟」になってしまいます。当サイトではこの偏りを補正するため、2歳と4歳以上の成績の差を、全体の成績水準が近い種牡馬と比べて判定しています。';

/** Q&A「早熟？晩成？」：判定はせず、馬齢別の複勝率を全出走馬と並べる */
export function buildSireGrowthAnswer(name: string, rates: GrowthRate[] | undefined, trend?: GrowthTrend | null): string | null {
  const ok = (rates ?? []).filter((r) => r.races >= 30);
  if (ok.length < 2) return null;
  const verdict = trend
    ? trend.pos === 3
      ? `${name}産駒の成長曲線は**標準的**で、早熟・晩成どちらにも偏っていません。`
      : `${name}産駒は**${trend.label}**の傾向があります。`
    : '';
  const detail = ok
    .map((r) => `${r.age}**${r.place_rate.toFixed(1)}%**${typeof r.all_place_rate === 'number' ? `（全体${r.all_place_rate.toFixed(1)}%）` : ''}`)
    .join('、');
  const young = ok.find((r) => r.age === '2歳');
  const old = ok.find((r) => r.age === '4歳以上');
  const drop = young && old && typeof young.all_place_rate === 'number' && typeof old.all_place_rate === 'number'
    ? (() => {
        const diff = young.place_rate - old.place_rate;
        const base = (young.all_place_rate as number) - (old.all_place_rate as number);
        return `2歳から4歳以上にかけて複勝率は${Math.abs(diff).toFixed(1)}ポイント${diff >= 0 ? '下がっています' : '上がっています'}（全出走馬は${base.toFixed(1)}ポイント下がる）。`;
      })()
    : '';
  return [
    verdict,
    `馬齢別の複勝率は${detail}です。`,
    drop,
    trend ? GROWTH_METHOD : null,
    trend ? '※平地の芝・ダート。2歳・4歳以上ともに30走以上の種牡馬が対象です。' : '※平地の芝・ダート。2歳戦は新馬・未勝利戦が中心のため、上位の種牡馬ほど2歳の数値が高く出やすい点に注意してください。',
  ].filter(Boolean).join('\n');
}

/** Q&A「代表産駒は？」 */
export function buildProgenyAnswer(name: string, progeny: NotableHorse[] | undefined): string | null {
  const list = (progeny ?? []).slice(0, 5);
  if (list.length === 0) return null;
  return `${name}産駒では、${list.map((h) => `**${h.horse_name}**${titleList(h)}`).join('、')}が代表的です。\n※2019年以降のJRAの成績。G1の勝利数→重賞の勝利数→勝利数の順です。`;
}

/** Q&A「牝馬の特徴は？」：牡馬（セン馬を含む）と牝馬の、芝・ダートそれぞれの得意距離帯 */
export function buildSireFemaleAnswer(
  name: string,
  sex: { male?: { turf?: StatLike[]; dirt?: StatLike[] }; female?: { turf?: StatLike[]; dirt?: StatLike[] } } | undefined,
  trend?: GenderTrend | null,
): string | null {
  if (!sex) return null;
  const best = (g?: { turf?: StatLike[]; dirt?: StatLike[] }) =>
    [bestBand(g?.turf, 30), bestBand(g?.dirt, 30)]
      .map((b, i) => (b ? `${i === 0 ? '芝' : 'ダート'}の${b.category}（複勝率${b.place_rate.toFixed(1)}%）` : null))
      .filter(Boolean)
      .join('、');
  const f = best(sex.female);
  const m = best(sex.male);
  if (!f) return null;
  const head = trend
    ? trend.pos === 3
      ? `${name}産駒の牝馬の複勝率は${trend.female_place_rate.toFixed(1)}%（牡馬${trend.male_place_rate.toFixed(1)}%）で、全出走馬の牡馬と牝馬の差と比べて、性別による差は小さめです。`
      : `${name}産駒は**${trend.label}**です。牝馬の複勝率は${trend.female_place_rate.toFixed(1)}%、牡馬は${trend.male_place_rate.toFixed(1)}%です（全出走馬は牝馬${trend.all_female_place_rate.toFixed(1)}%・牡馬${trend.all_male_place_rate.toFixed(1)}%）。`
    : '';
  return [head, `牝馬の成績が最も良い距離帯は**${f}**です。${m ? `牡馬は${m}です。` : ''}`, '※牡馬はセン馬を含みます。距離帯ごとに出走30回以上を対象にしています。']
    .filter(Boolean)
    .join('\n');
}

/** Q&A「距離短縮・延長の成績は？」 */
export function buildDistanceChangeAnswer(name: string, rows: (StatLike & { category: string })[] | undefined): string | null {
  const ok = (rows ?? []).filter((r) => r.races >= 30);
  const by = (c: string) => ok.find((r) => r.category === c);
  const s = by('距離短縮');
  const e = by('距離延長');
  const same = by('同距離');
  if (!s || !e) return null;
  const diff = s.place_rate - e.place_rate;
  const head = Math.abs(diff) < 2
    ? `${name}産駒は距離短縮と延長の成績差が小さく、`
    : `${name}産駒は**${diff > 0 ? '距離短縮' : '距離延長'}**の方が成績が良く、`;
  return `${head}前走からの距離短縮の複勝率は${s.place_rate.toFixed(1)}%、延長は${e.place_rate.toFixed(1)}%${same ? `、同距離は${same.place_rate.toFixed(1)}%` : ''}です。\n※前走・今走とも平地（芝・ダート）のレースが対象です。`;
}

/** 勝ち上がり率（3歳の年が終わった世代の合計）と全出走馬の同じ値 */
export function cropTotals(crops: CropStat[] | undefined) {
  const done = (crops ?? []).filter((c) => c.complete);
  const starters = done.reduce((a, c) => a + c.starters, 0);
  if (starters < 30) return null;
  const winners = done.reduce((a, c) => a + c.winners, 0);
  const allRates = done.map((c) => c.all_rate).filter((v): v is number => typeof v === 'number');
  return {
    starters,
    winners,
    rate: (winners / starters) * 100,
    allRate: allRates.length ? allRates.reduce((a, v) => a + v, 0) / allRates.length : null,
    from: Math.min(...done.map((c) => c.crop)),
    to: Math.max(...done.map((c) => c.crop)),
  };
}

/** Q&A「勝ち上がり率は？」 */
export function buildCropAnswer(name: string, crops: CropStat[] | undefined): string | null {
  const t = cropTotals(crops);
  if (!t) return null;
  const cmp = t.allRate === null ? '' : `（全出走馬の平均${t.allRate.toFixed(1)}%）`;
  return `${t.from}〜${t.to}年生まれの${name}産駒は、JRAで出走した${t.starters.toLocaleString()}頭のうち${t.winners.toLocaleString()}頭が勝ち上がり、勝ち上がり率は**${t.rate.toFixed(1)}%**${cmp}です。\n※JRAで1勝以上した割合。3歳の年が終わった世代が対象です。`;
}

// ------------------------------------------------------------
// 騎手・調教師
// ------------------------------------------------------------

/**
 * データ概要の先頭に置く結論文（騎手・調教師共通）。直後の「全体の成績」と重ならないよう、
 * 判定（芝ダート・脚質・距離など）と重賞を中心にまとめる
 * 例：「坂井瑠星騎手（栗東・2016年デビュー）は、データ上ややダートが得意・差し・追込が得意な騎手です。直近3年間の重賞は16勝（うちG1 4勝）で、最近ではアンタレスステークス（ムルソー）を勝っています。」
 */
export function buildPersonLead(args: {
  kind: '騎手' | '調教師';
  name: string;
  region?: string | null;
  debutYear?: number | string | null;
  /** 判定の文言（「差分なし」「互角」「標準」は渡さない） */
  traits: string[];
  graded?: { wins: number; g1: number } | null;
  recentWin?: GradedWin | null;
  extra?: string | null;
}): string {
  const { kind, name, region, debutYear, traits, graded, recentWin, extra } = args;
  const who = kind === '騎手' ? `${name}騎手` : `${name}調教師`;
  const head = [region, debutYear ? `${debutYear}年${kind === '騎手' ? 'デビュー' : '開業'}` : null].filter(Boolean).join('・');
  const lines: string[] = [];
  lines.push(
    traits.length > 0
      ? `${who}${head ? `（${head}）` : ''}のデータ上の特徴は、${traits.map((t) => `**${t}**`).join('、')}です。`
      : `${who}${head ? `（${head}）` : ''}は、芝・ダートや距離による成績の偏りが小さい${kind}です。`
  );
  if (graded && graded.wins > 0) {
    lines.push(`直近3年間の平地重賞は${graded.wins}勝${graded.g1 > 0 ? `（うちG1 ${graded.g1}勝）` : ''}${recentWin ? `で、最近では${recentWin.race_name}（${recentWin.horse_name}）を勝っています。` : 'です。'}`);
  }
  if (extra) lines.push(extra);
  return lines.join('');
}

/** Q&A「重賞成績は？」 */
export function buildGradedAnswer(who: string, graded: ReturnType<typeof gradedTotals>, wins: GradedWin[] | undefined): string {
  if (graded.races === 0) return `${who}は集計期間に平地重賞への出走がありません。`;
  const recent = (wins ?? []).slice(0, 3).map((w) => `${w.race_name}（${w.grade}・${w.horse_name}）`).join('、');
  return [
    `${who}の集計期間の平地重賞成績は${graded.races}戦**${graded.wins}勝**（G1 ${graded.g1}勝・G2 ${graded.g2}勝・G3 ${graded.g3}勝）です。`,
    recent ? `直近の重賞勝ちは${recent}。` : '',
  ].filter(Boolean).join('\n');
}

/** 基本情報の「今年の成績」 */
export function thisYearOf(leading: { year: number; wins: number; ranking: number }[] | undefined) {
  if (!leading || leading.length === 0) return null;
  return [...leading].sort((a, b) => b.year - a.year)[0];
}

// ---------------------------------------------------------------------------
// 騎手：道悪・人気薄・ローカル・乗り替わりの判定（gcs/v2/generate_extras.py jockey_trends）
// ---------------------------------------------------------------------------
export type JockeyTrend = {
  pos: number;
  label: string;
  index: number;
  /** 実績÷見込み（%）。乗り替わり等は条件A÷条件B */
  ratio: number;
  races_a: number;
  races_b: number | null;
  rate_a: number | null;
  rate_b: number | null;
  /** 乗った馬の単勝オッズから見込まれる複勝率（判定の基準） */
  exp_a?: number | null;
  exp_b?: number | null;
  all_rate_a: number | null;
  all_rate_b: number | null;
  payback?: number | null;
};
export type JockeyTrends = Partial<Record<'wet' | 'longshot' | 'local' | 'change', JockeyTrend>>;
export type RideChangeRow = StatLike & { category: string };

/** 判定方法の説明（他サイトとの違い。オーナー指示で本文にも明記） */
export const JOCKEY_TREND_METHOD =
  '騎手の成績は、どんな馬に乗ったかで大きく変わります。たとえば継続騎乗は人気馬が多いため、複勝率をそのまま比べると、ほとんどの騎手で「継続騎乗の方が得意」に見えてしまいます。当サイトではこの偏りを補正するため、単勝オッズから見込まれる複勝数に対して実際に何回3着以内に入ったかを、条件ごとに比べて判定しています。';

const isNeutral = (label: string) => /差分なし|標準/.test(label);
const p1 = (v: number | null | undefined) => (typeof v === 'number' ? `${v.toFixed(1)}%` : '—');

/** データ概要の冒頭：騎乗スタイルの要約（騎手のみ。調教師は buildPersonLead のまま） */
export function buildJockeyLead(args: {
  name: string;
  region?: string | null;
  debutYear?: number | string | null;
  traits: string[];
  graded?: { wins: number; g1: number } | null;
  recentWin?: GradedWin | null;
}): string {
  const { name, region, debutYear, traits, graded, recentWin } = args;
  const head = [region ? `${region}所属` : null, debutYear ? `${debutYear}年デビュー` : null].filter(Boolean).join('・');
  const lines: string[] = [];
  const t = traits.filter((x) => x && !isNeutral(x)).slice(0, 4);
  lines.push(
    t.length > 0
      ? `${name}騎手${head ? `（${head}）` : ''}は、データ上${t.map((x) => `「**${x}**」`).join('')}という特徴がある騎手です。`
      : `${name}騎手${head ? `（${head}）` : ''}は、条件による成績の偏りが小さい騎手です。`
  );
  if (graded && graded.wins > 0) {
    lines.push(`直近3年間の平地重賞は${graded.wins}勝${graded.g1 > 0 ? `（うちG1 ${graded.g1}勝）` : ''}${recentWin ? `で、最近では${recentWin.race_name}（${recentWin.horse_name}）を勝っています。` : 'です。'}`);
  }
  return lines.join('');
}

/** Q&A「乗り替わりの成績は？」 */
export function buildRideChangeAnswer(name: string, rows: RideChangeRow[] | undefined, trend?: JockeyTrend | null): string | null {
  const by = (c: string) => (rows ?? []).find((r) => r.category === c && r.races >= 30);
  const keep = by('継続騎乗');
  const first = by('乗り替わり（初騎乗）');
  const again = by('乗り替わり（再騎乗）');
  if (!keep || (!first && !again)) return null;
  const parts = [
    `${name}騎手の複勝率は、継続騎乗で**${keep.place_rate.toFixed(1)}%**`,
    first ? `、乗り替わり（初めて乗る馬）で**${first.place_rate.toFixed(1)}%**` : '',
    again ? `、乗り替わり（以前に乗った馬）で${again.place_rate.toFixed(1)}%` : '',
    'です。',
  ].join('');
  const exp = trend && trend.exp_a != null && trend.exp_b != null
    ? `乗った馬の人気（単勝オッズ）から見込まれる複勝率は、継続騎乗${p1(trend.exp_b)}、乗り替わり${p1(trend.exp_a)}です。`
    : '';
  const verdict = trend
    ? exp + (isNeutral(trend.label)
      ? 'この見込みとの差で比べると、継続騎乗と乗り替わりで**差はありません**。'
      : `この見込みとの差で比べた判定は**${trend.label}**です。`)
    : null;
  return [parts, verdict, trend ? JOCKEY_TREND_METHOD : null, '※平地（芝・ダート）。継続騎乗＝前走と同じ騎手、乗り替わり＝前走と違う騎手。'].filter(Boolean).join('\n');
}

/** Q&A「道悪は得意？」 */
export function buildWetAnswer(name: string, trend?: JockeyTrend | null): string | null {
  if (!trend) return null;
  return [
    `${name}騎手の判定は**${trend.label}**です。`,
    `芝・ダートの稍重〜不良での複勝率は**${p1(trend.rate_a)}**、良馬場では${p1(trend.rate_b)}です。`,
    `乗った馬の人気（単勝オッズ）から見込まれる複勝率は、稍重〜不良${p1(trend.exp_a)}、良${p1(trend.exp_b)}で、判定はこの見込みとの差を比べています。`,
  ].join('\n');
}

/** Q&A「人気薄でも走る？」 */
export function buildLongshotAnswer(name: string, trend?: JockeyTrend | null): string | null {
  if (!trend) return null;
  return [
    `${name}騎手の判定は**${trend.label}**です。`,
    `6番人気以下での複勝率は**${p1(trend.rate_a)}**（全騎手${p1(trend.all_rate_a)}）、複勝回収率は${p1(trend.payback)}です。乗った馬の単勝オッズから見込まれる複勝率は${p1(trend.exp_a)}で、実績は見込みの${trend.ratio.toFixed(0)}%でした。`,
    `※平地の6番人気以下（${trend.races_a.toLocaleString('ja-JP')}回騎乗）が対象です。`,
  ].join('\n');
}

/** Q&A「中央とローカルどちらが得意？」 */
export function buildLocalAnswer(name: string, trend?: JockeyTrend | null): string | null {
  if (!trend) return null;
  return [
    `${name}騎手の判定は**${trend.label}**です。`,
    `ローカル（札幌・函館・福島・新潟・中京・小倉）の複勝率は**${p1(trend.rate_a)}**、中央4場（東京・中山・京都・阪神）は**${p1(trend.rate_b)}**です。`,
    `乗った馬の人気（単勝オッズ）から見込まれる複勝率は、ローカル${p1(trend.exp_a)}、中央4場${p1(trend.exp_b)}で、判定はこの見込みとの差を比べています。`,
  ].join('\n');
}

/** 狙い目・消し条件の候補 */
export type AimRow = { label: string; races: number; place_rate: number; place_payback: number; win_payback: number };
export function pickAim(cands: AimRow[], minRaces = 30, n = 5) {
  const ok = cands.filter((r) => r.races >= minRaces && typeof r.place_payback === 'number');
  const hi = [...ok].sort((a, b) => b.place_payback - a.place_payback).slice(0, n);
  const used = new Set(hi.map((r) => r.label));
  const lo = [...ok].sort((a, b) => a.place_payback - b.place_payback).filter((r) => !used.has(r.label)).slice(0, n);
  return { hi, lo };
}

/** Q&A「狙い目の条件は？」 */
export function buildAimAnswer(name: string, aim: { hi: AimRow[]; lo: AimRow[] }, minRaces = 30): string | null {
  if (aim.hi.length === 0) return null;
  const f = (r: AimRow) => `${r.label}（複勝回収率**${r.place_payback.toFixed(0)}%**・複勝率${r.place_rate.toFixed(1)}%）`;
  return [
    `${name}騎手で複勝回収率が高い条件は、${aim.hi.slice(0, 3).map(f).join('、')}です。`,
    aim.lo.length ? `反対に低いのは、${aim.lo.slice(0, 3).map(f).join('、')}です。` : '',
    `※直近3年間で${minRaces}回以上騎乗した条件（競馬場・コース・距離・クラス・人気・枠・馬場・性別・調教師・種牡馬）が対象です。`,
  ].filter(Boolean).join('\n');
}

/** Q&A「G1の勝ち鞍は？」 */
export type G1Win = { date: string; race_name: string; horse_name: string; horse_id?: number; popularity?: number | null };
export function buildG1Answer(name: string, wins: G1Win[] | undefined, since: string | undefined): string | null {
  const list = wins ?? [];
  const y = since ? since.slice(0, 4) : '2019';
  if (list.length === 0) return `${name}騎手は${y}年以降、JRAのG1を勝っていません。`;
  const recent = list.slice(0, 5).map((w) => `${w.date.slice(0, 4)}年${w.race_name}（${w.horse_name}）`).join('、');
  return `${name}騎手は${y}年以降、JRAのG1を**${list.length}勝**しています。最近の勝ち鞍は${recent}です。`;
}
