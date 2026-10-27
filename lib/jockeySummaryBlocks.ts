/**
 * 騎手ページのデータ概要を「見出し付きのブロック」に分ける
 *
 * 文章は lib/dataPageText.ts の buildJockeySummaryKeyed が段落の話題（key）付きで生成する。
 * ここでは key に見出しを対応させ、複勝率の強調を付けるだけにする（文言は変えない）。
 */

import { buildJockeySummaryKeyed, type PersonSummaryKey } from './dataPageText';
import { emphasizeBestPlaceRate } from './summaryEmphasis';

export type JockeySummaryBlockKey =
  | 'lead'
  | 'overall'
  | 'reliability'
  | 'surface'
  | 'racecourse'
  | 'style'
  | 'trainer'
  | 'payback'
  | 'other';

export interface JockeySummaryBlock {
  key: JockeySummaryBlockKey;
  title?: string;
  text: string;
}

const TITLES: Record<JockeySummaryBlockKey, string | undefined> = {
  lead: undefined,
  overall: '全体の成績',
  reliability: '人気時の信頼度',
  surface: '芝・ダート・距離',
  racecourse: '競馬場・コース',
  style: '脚質・クラス',
  trainer: '調教師',
  payback: '回収率',
  other: undefined,
};

const KEY_MAP: Record<PersonSummaryKey, JockeySummaryBlockKey> = {
  overall: 'overall', reliability: 'reliability', surface: 'surface', racecourse: 'racecourse', style: 'style',
  partner: 'trainer', payback: 'payback', interval: 'other', age: 'other', condition: 'other', damSire: 'other',
};

export function buildJockeySummaryBlocks(jockey: Parameters<typeof buildJockeySummaryKeyed>[0]): JockeySummaryBlock[] {
  return buildJockeySummaryKeyed(jockey).map((b) => {
    const key = KEY_MAP[b.key];
    return { key, title: TITLES[key], text: emphasizeBestPlaceRate(b.text) };  // 段落内で最も高い複勝率を1つだけ強調
  });
}
