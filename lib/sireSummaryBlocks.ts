/**
 * 種牡馬ページのデータ概要を、見出し付きのブロックに分ける（表示用）
 *
 * 文章は lib/dataPageText.ts の buildSireSummaryKeyed が段落の話題（key）付きで生成したものをそのまま使い、
 * key から見出しを決める。表示では要所（複勝率）を強調し、名前を詳細ページへリンクする。
 */

import { emphasizeBestPlaceRate } from './summaryEmphasis';
import type { PersonSummaryBlock, PersonSummaryKey } from './dataPageText';

export type SireSummaryKey =
  | 'lead' | 'overall' | 'surface' | 'racecourse' | 'style' | 'age' | 'condition' | 'damSire' | 'payback' | 'other';

export interface SireSummaryBlock {
  key: SireSummaryKey;
  title?: string;
  /** **…** は強調する箇所 */
  text: string;
}

const TITLES: Record<SireSummaryKey, string | undefined> = {
  lead: undefined,
  overall: undefined,
  surface: '芝・ダート・距離',
  racecourse: '競馬場・コース',
  style: '脚質・クラス',
  age: '馬齢',
  condition: '馬場状態',
  damSire: '母父',
  payback: '回収率',
  other: undefined,
};

const KEY_MAP: Record<PersonSummaryKey, SireSummaryKey> = {
  overall: 'overall', surface: 'surface', racecourse: 'racecourse', style: 'style', age: 'age',
  condition: 'condition', damSire: 'damSire', payback: 'payback', reliability: 'other', partner: 'other', interval: 'other',
};

// 段落内で最も高い「複勝率xx.x%」を1つだけ強調する（強調しすぎない）
const emphasize = emphasizeBestPlaceRate;

export function buildSireSummaryBlocks(blocks: PersonSummaryBlock[]): SireSummaryBlock[] {
  return blocks.map((b) => {
    const key = KEY_MAP[b.key];
    return { key, title: TITLES[key], text: key === 'payback' ? b.text : emphasize(b.text) };
  });
}
