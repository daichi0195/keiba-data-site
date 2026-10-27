/**
 * コースページの「コース概要」と冒頭の結論文（docs/seo/gap_analysis.md）
 *
 * - 形状は lib/courseFacts.ts（JRA 公式の記載値）、回り・内外回り・重賞・上がりはデータ（gcs/v2/generate_extras.py）
 * - 文の組み立ては lib/dataPageText.ts と同じ方針：数値が欠けた要素は省く、言い切りは判定がある場合だけ
 */

import { getTrackFacts, hasTurfVariants, isDirtTurfStart, straightLabel } from './courseFacts';

export interface CourseProfile {
  direction?: string | null;
  track_variant?: string | null;
  graded_races?: { race_name: string; grade: string; last_date?: string }[];
}

export interface FinishStats {
  races?: number;
  fastest_runs?: number;
  fastest_win_rate?: number | null;
  fastest_place_rate?: number | null;
  winner_avg_last3f?: number | null;
  avg_winning_time_good?: number | null;
  good_races?: number;
}

export interface OverviewItem {
  label: string;
  value: string;
  sub?: string;
}

/** 秒 → 1:33.9 */
export function formatRaceTime(sec: number | null | undefined): string | null {
  if (!sec || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return m > 0 ? `${m}:${s.toFixed(1).padStart(4, '0')}` : `${s.toFixed(1)}秒`;
}

/** 上がり最速馬の成績を表示するのに必要な最少レース数 */
const MIN_RACES_FOR_FINISH = 20;

export function buildCourseOverview(args: {
  venue: string; // 'nakayama'
  surface: string; // 'turf' | 'dirt' | 'steeplechase'
  distance: number;
  profile?: CourseProfile | null;
  finish?: FinishStats | null;
}) {
  const { venue, surface, distance, profile, finish } = args;
  if (surface !== 'turf' && surface !== 'dirt') return null;

  const facts = getTrackFacts(venue, surface, distance, profile?.track_variant);
  const variant = surface === 'turf' && hasTurfVariants(venue) && !(venue === 'niigata' && distance === 1000)
    ? (profile?.track_variant === '外' ? '外回り' : '内回り')
    : null;
  const straightCourse = venue === 'niigata' && surface === 'turf' && distance === 1000;
  const direction = straightCourse ? '直線コース' : profile?.direction ? `${profile.direction}回り` : null;
  const turfStart = isDirtTurfStart(venue, surface, distance);

  const items: OverviewItem[] = [];
  if (direction) items.push({ label: '回り', value: [direction, variant].filter(Boolean).join('・') });
  if (facts?.straight) items.push({ label: '直線の長さ', value: `${facts.straight.toLocaleString()}m`, sub: straightCourse ? undefined : straightLabel(facts.straight) ?? undefined });
  if (facts?.lap && !straightCourse) items.push({ label: '1周の距離', value: `${facts.lap.toLocaleString()}m` });
  if (facts?.elevation) items.push({ label: '高低差', value: `${facts.elevation}m` });
  if (facts?.slope) items.push({ label: '坂', value: facts.slope });
  if (turfStart) items.push({ label: 'スタート', value: '芝スタート', sub: 'スタート直後に芝を走る' });

  const enoughFinish = (finish?.races ?? 0) >= MIN_RACES_FOR_FINISH;
  const winTime = (finish?.good_races ?? 0) >= 5 ? formatRaceTime(finish?.avg_winning_time_good) : null;
  if (winTime) items.push({ label: '平均勝ちタイム', value: winTime, sub: `良馬場・${finish?.good_races}レース` });
  if (enoughFinish && finish?.winner_avg_last3f) items.push({ label: '勝ち馬の上がり3F', value: `${finish.winner_avg_last3f.toFixed(1)}秒`, sub: '平均' });
  if (enoughFinish && typeof finish?.fastest_place_rate === 'number') {
    items.push({
      label: '上がり最速馬の複勝率',
      value: `${finish.fastest_place_rate.toFixed(1)}%`,
      sub: typeof finish.fastest_win_rate === 'number' ? `勝率${finish.fastest_win_rate.toFixed(1)}%` : undefined,
    });
  }

  const graded = profile?.graded_races ?? [];
  const gradedText = graded.length > 0 ? graded.map((g) => `${g.race_name}（${g.grade}）`).join('、') : null; // 集計期間に行われた重賞（直近の格付け）

  return { items, direction, variant, straight: facts?.straight, straightText: straightLabel(facts?.straight), slope: facts?.slope, elevation: facts?.elevation, turfStart, gradedText, finish: enoughFinish ? finish : null };
}

export type CourseOverview = NonNullable<ReturnType<typeof buildCourseOverview>>;

/**
 * データ概要の先頭に置く結論文（AI概要の冒頭1文に相当）
 * 例：「中山ダート1200mは右回り・直線308mの直線が短いコースです。直近3年のデータでは逃げ・先行有利・外枠有利で、荒れやすさは標準です。」
 */
export function buildCourseLeadText(args: {
  courseName: string;
  periodYears: number;
  overview: CourseOverview | null;
  labels: { volatility?: string; gate?: string; runningStyle?: string };
}): string | null {
  const { courseName, periodYears, overview, labels } = args;
  const shape = overview && overview.direction
    ? [overview.direction + (overview.variant ? `（${overview.variant}）` : ''), overview.straight ? `直線${overview.straight.toLocaleString()}m` : null].filter(Boolean).join('・')
    : null;
  const straightAdj: Record<string, string> = { '直線が長い': '直線が長い', '直線は標準的': '直線の長さが標準的な', '直線が短い': '直線が短い' };
  const adj = overview?.straightText && overview.direction !== '直線コース' ? straightAdj[overview.straightText] : null;
  const first = overview?.direction === '直線コース' && overview.straight
    ? `${courseName}は**直線${overview.straight.toLocaleString()}m**のみのコースです。`
    : shape ? `${courseName}は**${shape}**の${adj ? `、${adj}` : ''}コースです。` : null;
  const trends: string[] = [];
  if (labels.runningStyle) trends.push(labels.runningStyle === '互角' ? '脚質の有利不利は小さめ' : `**${labels.runningStyle}**`);
  if (labels.gate) trends.push(labels.gate === '互角' ? '枠順の有利不利は小さめ' : `**${labels.gate}**`);
  const trendText = trends.length > 0 ? `${trends.join('、')}で、` : '';
  const volatilityPhrase: Record<string, string> = {
    '堅い': '配当は**堅く決まりやすい**傾向です。',
    'やや堅い': '配当は**やや堅く決まりやすい**傾向です。',
    '標準': '配当の荒れやすさは**標準的**です。',
    'やや荒れやすい': '配当は**やや荒れやすい**傾向です。',
    '荒れやすい': '配当は**荒れやすい**傾向です。',
  };
  const vol = labels.volatility ? volatilityPhrase[labels.volatility] : null;
  const second = vol ? `直近${periodYears}年のデータでは${trendText}${vol}` : trendText ? `直近${periodYears}年のデータでは${trendText.replace(/で、$/, 'です。')}` : null;
  const text = [first, second].filter(Boolean).join('');
  return text || null;
}

/** Q&A「〇〇はどんなコース？」 */
export function buildCourseShapeAnswer(courseName: string, overview: CourseOverview | null): string | null {
  if (!overview || overview.items.length === 0) return null;
  const parts: string[] = [];
  if (overview.direction) parts.push(`${overview.direction}${overview.variant ? `（${overview.variant}）` : ''}`);
  if (overview.straight) parts.push(`直線は**${overview.straight.toLocaleString()}m**${overview.straightText && overview.direction !== '直線コース' ? `（${overview.straightText}）` : ''}`);
  if (overview.elevation) parts.push(`高低差${overview.elevation}m`);
  if (overview.slope) parts.push(overview.slope);
  if (overview.turfStart) parts.push('芝スタート');
  const lines = [`${courseName}は${parts.join('、')}のコースです。`];
  if (overview.finish && typeof overview.finish.fastest_place_rate === 'number') {
    lines.push(`上がり3Fが最速だった馬の複勝率は**${overview.finish.fastest_place_rate.toFixed(1)}%**、勝ち馬の上がり3Fは平均${overview.finish.winner_avg_last3f?.toFixed(1)}秒です。`);
  }
  if (overview.gradedText) lines.push(`集計期間に行われた重賞：${overview.gradedText}`);
  return lines.join('\n');
}

/** Q&A「〇〇の道悪（重馬場）で有利な枠は？」 */
export function buildBadGateAnswer(courseName: string, bad: { gate: number; races: number; place_rate: number }[] | undefined): string | null {
  if (!bad || bad.length === 0) return null;
  const sum = (rows: typeof bad) => {
    const races = rows.reduce((a, r) => a + r.races, 0);
    const places = rows.reduce((a, r) => a + (r.place_rate * r.races) / 100, 0);
    return { races, rate: races > 0 ? (places / races) * 100 : 0 };
  };
  const inner = sum(bad.filter((r) => r.gate <= 4));
  const outer = sum(bad.filter((r) => r.gate >= 5));
  if (inner.races + outer.races < 50) return null;
  const diff = inner.rate - outer.rate;
  const verdict = Math.abs(diff) < 2 ? '内枠と外枠の差は小さめ' : diff > 0 ? (diff >= 5 ? '内枠有利' : 'やや内枠有利') : (diff <= -5 ? '外枠有利' : 'やや外枠有利');
  const best = [...bad].filter((r) => r.races >= 30).sort((a, b) => b.place_rate - a.place_rate)[0];
  return [
    `${courseName}の道悪（稍重〜不良）は${verdict}です。`,
    `内枠（1〜4枠）の複勝率は**${inner.rate.toFixed(1)}%**、外枠（5〜8枠）は**${outer.rate.toFixed(1)}%**。${best ? `複勝率が最も高いのは${best.gate}枠（${best.place_rate.toFixed(1)}%）です。` : ''}`,
  ].join('\n');
}
