/**
 * 調教師詳細ページ（新デザイン）用の補助処理
 * - データ概要の段落に見出しを付ける
 * - コース別成績の行から、実在するコースページの URL を求める（lib/courseLinks.ts）
 */

import { emphasizeBestPlaceRate } from './summaryEmphasis';

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

// 段落内で最も高い「複勝率○○%」を1つだけ強調表示（**〜**）にする。文言は変えない（3ページ共通の規則）
const emphasize = emphasizeBestPlaceRate;

export function toTrainerSummaryBlocks(paragraphs: string[]): TrainerSummaryBlock[] {
  return paragraphs.map((text, i) => {
    const rule = BLOCK_RULES.find((r) => r.test(text));
    return { key: rule ? rule.key : `p${i}`, title: rule?.title, text: emphasize(text) };
  });
}

// ------------------------------------------------------------
// コース別成績 → コースページの URL（3ページ共通の lib/courseLinks.ts へ移動。互換のため再エクスポート）
// ------------------------------------------------------------

export { courseVariantOf, resolveCourseUrl, courseLabel } from './courseLinks';
export type { CourseRowLike as TrainerCourseRow } from './courseLinks';
