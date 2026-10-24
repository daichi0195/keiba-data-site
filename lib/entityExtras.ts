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
}

export interface SireProfile {
  father?: string | null;
  damsire?: string | null;
  birth_year?: number | null;
  birthplace?: string | null;
  imported?: boolean;
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

const titleList = (h: NotableHorse) => (h.titles.length > 0 ? `（${h.titles.slice(0, 2).join('、')}）` : '');

// ------------------------------------------------------------
// 種牡馬
// ------------------------------------------------------------

/** データ概要の先頭に置く結論文 */
export function buildSireLead(args: {
  name: string;
  profile?: SireProfile | null;
  surfaceTrendText: string;
  distanceTrendText: string;
  bestTurf: StatLike | null;
  bestDirt: StatLike | null;
  progeny?: NotableHorse[];
}): string {
  const { name, profile, surfaceTrendText, distanceTrendText, bestTurf, bestDirt, progeny } = args;
  const lines: string[] = [];
  const pedigree = [profile?.father ? `父${profile.father}` : null, profile?.damsire ? `母父${profile.damsire}` : null].filter(Boolean).join('、');
  if (pedigree) lines.push(`${name}は${pedigree}の種牡馬です。`);
  const surface = surfaceTrendText === '差分なし' ? '芝・ダートの成績差は小さく' : `**${surfaceTrendText}**で`;
  const distance = distanceTrendText === '差分なし' ? '距離による差も小さめです。' : `距離は**${distanceTrendText}**です。`;
  lines.push(`${pedigree ? '産駒' : `${name}産駒`}は${surface}、${distance}`);
  const bands = [
    bestTurf ? `芝が**${bestTurf.category}**（複勝率${bestTurf.place_rate.toFixed(1)}%）` : null,
    bestDirt ? `ダートが**${bestDirt.category}**（複勝率${bestDirt.place_rate.toFixed(1)}%）` : null,
  ].filter(Boolean);
  if (bands.length > 0) lines.push(`最も成績が良い距離帯は、${bands.join('、')}です。`);
  const stars = (progeny ?? []).filter((h) => h.graded_wins > 0).slice(0, 2);
  if (stars.length > 0) lines.push(`集計期間の代表産駒は${stars.map((h) => `${h.horse_name}${titleList(h)}`).join('、')}など。`);
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

/** Q&A「早熟？晩成？」：判定はせず、馬齢別の複勝率を全出走馬と並べる */
export function buildSireGrowthAnswer(name: string, rates: GrowthRate[] | undefined): string | null {
  const ok = (rates ?? []).filter((r) => r.races >= 30);
  if (ok.length < 2) return null;
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
  return [`${name}産駒の馬齢別の複勝率は${detail}です。`, drop, '※平地の芝・ダート。2歳戦は新馬・未勝利戦が中心のため、上位の種牡馬ほど2歳の数値が高く出やすい点に注意してください。'].filter(Boolean).join('\n');
}

/** Q&A「代表産駒は？」 */
export function buildProgenyAnswer(name: string, progeny: NotableHorse[] | undefined): string | null {
  const list = (progeny ?? []).slice(0, 5);
  if (list.length === 0) return null;
  return `集計期間に勝ち星を挙げた${name}産駒では、${list.map((h) => `**${h.horse_name}**${titleList(h)}`).join('、')}が代表的です。\n※重賞の勝利数→勝利数の順。集計期間外の実績は含みません。`;
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
