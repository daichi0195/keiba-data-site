/**
 * 調教師詳細ページ（新デザイン）用の補助処理
 * - データ概要の段落に見出しを付ける
 * - コース別成績の行から、実在するコースページの URL を求める（lib/courseLinks.ts）
 */

import { emphasizeBestPlaceRate } from './summaryEmphasis';
import type { PersonSummaryBlock, PersonSummaryKey } from './dataPageText';

// ------------------------------------------------------------
// データ概要（buildTrainerSummaryKeyed の段落を見出し付きのブロックにする）
// ------------------------------------------------------------

export interface TrainerSummaryBlock {
  key: string;
  title?: string;
  text: string;
}

const BLOCKS: Partial<Record<PersonSummaryKey, { key: string; title: string }>> = {
  overall: { key: 'overall', title: '全体成績' },
  reliability: { key: 'favorite', title: '1番人気の信頼度' },
  surface: { key: 'surfaceDistance', title: '芝・ダート・距離' },
  racecourse: { key: 'racecourse', title: '競馬場・コース' },
  style: { key: 'styleClass', title: '脚質・クラス' },
  partner: { key: 'jockey', title: '騎手' },
  interval: { key: 'interval', title: 'レース間隔' },
  payback: { key: 'payback', title: '回収率' },
};

// 段落内で最も高い「複勝率○○%」を1つだけ強調表示（**〜**）にする。文言は変えない（3ページ共通の規則）
const emphasize = emphasizeBestPlaceRate;

export function toTrainerSummaryBlocks(blocks: PersonSummaryBlock[]): TrainerSummaryBlock[] {
  return blocks.map((b, i) => {
    const m = BLOCKS[b.key];
    return { key: m ? m.key : `p${i}`, title: m?.title, text: emphasize(b.text) };
  });
}

// ------------------------------------------------------------
// コース別成績 → コースページの URL（3ページ共通の lib/courseLinks.ts へ移動。互換のため再エクスポート）
// ------------------------------------------------------------

export { courseVariantOf, resolveCourseUrl, courseLabel } from './courseLinks';
export type { CourseRowLike as TrainerCourseRow } from './courseLinks';
