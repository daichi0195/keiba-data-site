/**
 * 調教師詳細ページ（新デザイン）用の補助処理
 * - データ概要の段落に見出しを付ける
 * - コース別成績の行から、実在するコースページの URL を求める
 */

import { ALL_COURSES, getCourseUrl } from './courses';

// ------------------------------------------------------------
// データ概要（buildTrainerSummary の段落を見出し付きのブロックにする）
// ------------------------------------------------------------

export interface TrainerSummaryBlock {
  key: string;
  title?: string;
  text: string;
}

// 段落の書き出し・含まれる語から、どの話題の段落かを判定する（判定順が大事なので配列で持つ）
const BLOCK_RULES: { key: string; title: string; test: (p: string) => boolean }[] = [
  { key: 'overall', title: '全体成績', test: (p) => p.includes('集計期間（') },
  { key: 'favorite', title: '1番人気の信頼度', test: (p) => p.includes('1番人気に支持されたときの複勝率') },
  { key: 'payback', title: '回収率', test: (p) => p.includes('単勝回収率が100%を超えている条件') },
  { key: 'interval', title: 'レース間隔', test: (p) => p.startsWith('レース間隔別では') },
  { key: 'jockey', title: '騎手', test: (p) => p.includes('騎乗依頼している') },
  { key: 'racecourse', title: '競馬場・コース', test: (p) => p.includes('競馬場別（') || p.includes('コース別（10戦以上）') },
  { key: 'styleClass', title: '脚質・クラス', test: (p) => p.includes('脚質別の複勝率') || p.includes('クラス別では') },
  { key: 'surfaceDistance', title: '芝・ダート・距離', test: (p) => p.includes('の芝は') || p.includes('距離別では') },
];

// 各段落の最初の「複勝率○○%」だけを強調表示（**〜**）にする。文言は変えない（騎手ページと同じ規則）
function emphasize(text: string): string {
  return text.replace(/(複勝率は?)(\d+(?:\.\d+)?%)/, '$1**$2**');
}

export function toTrainerSummaryBlocks(paragraphs: string[]): TrainerSummaryBlock[] {
  return paragraphs.map((text, i) => {
    const rule = BLOCK_RULES.find((r) => r.test(text));
    return { key: rule ? rule.key : `p${i}`, title: rule?.title, text: emphasize(text) };
  });
}

// ------------------------------------------------------------
// コース別成績 → コースページの URL
// ------------------------------------------------------------

export interface TrainerCourseRow {
  name: string;
  racecourse: string;
  racecourse_en: string;
  surface_en: string;
  distance: number;
  variant?: string;
  link?: string;
}

const COURSE_URLS = new Set(ALL_COURSES.map((c) => getCourseUrl(c)));

/** 内回り・外回りの区別（データの variant、またはコース名末尾の「内」「外」） */
export function courseVariantOf(row: TrainerCourseRow): 'inner' | 'outer' | undefined {
  const v = row.variant ?? '';
  if (v === 'inner' || v === '内' || v === '内回り') return 'inner';
  if (v === 'outer' || v === '外' || v === '外回り') return 'outer';
  const m = row.name.match(/m(内|外)(回り)?$|（(内|外)回り）$/);
  const mark = m?.[1] ?? m?.[3];
  if (mark === '内') return 'inner';
  if (mark === '外') return 'outer';
  return undefined;
}

/**
 * 実在するコースページの URL（内回り・外回りのページがあるコースはそちらへ）。
 * ページが存在しないコースは undefined（リンク切れを作らない）
 */
export function resolveCourseUrl(row: TrainerCourseRow): string | undefined {
  const base = `/courses/${row.racecourse_en}/${row.surface_en}/${row.distance}`;
  const variant = courseVariantOf(row);
  if (variant && COURSE_URLS.has(`${base}-${variant}`)) return `${base}-${variant}`;
  if (COURSE_URLS.has(base)) return base;
  if (row.link && COURSE_URLS.has(row.link)) return row.link;
  return undefined;
}

/**
 * 表示用のコース名（データのコース名から競馬場名と空白を除く。例：「京都競馬場 芝 1400m外」→「芝1400m外」）
 * withRacecourse で「京都芝1400m外」、shortDirt で「ダ」表記
 */
export function courseLabel(row: TrainerCourseRow, opts: { withRacecourse?: boolean; shortDirt?: boolean } = {}): string {
  const rc = String(row.racecourse ?? '').replace(/競馬場$/, '');
  let label = row.name.replace(/[^\s]*競馬場/, '').replace(/\s+/g, '').replace(/（外回り）/g, '外').replace(/（内回り）/g, '内');
  if (opts.shortDirt) label = label.replace(/ダート/g, 'ダ');
  return opts.withRacecourse ? `${rc}${label}` : label;
}
