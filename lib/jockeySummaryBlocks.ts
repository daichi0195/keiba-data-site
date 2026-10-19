/**
 * 騎手ページのデータ概要を「見出し付きのブロック」に分ける
 *
 * 文章そのものは lib/dataPageText.ts の buildJockeySummary が生成したものを使い、
 * ここでは各段落がどの話題の文かを判定して見出しを付けるだけにする（文言は変えない）。
 * buildJockeySummary は数値が欠けた段落を省くため、順番ではなく文の書き出しで判定する。
 */

import { buildJockeySummary } from './dataPageText';
import { emphasizeBestPlaceRate } from './summaryEmphasis';

export type JockeySummaryBlockKey =
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
  overall: '全体の成績',
  reliability: '人気時の信頼度',
  surface: '芝・ダート・距離',
  racecourse: '競馬場・コース',
  style: '脚質・クラス',
  trainer: '調教師',
  payback: '回収率',
  other: undefined,
};

function classify(text: string, subject: string): JockeySummaryBlockKey {
  if (text.includes('集計期間（')) return 'overall';
  if (text.includes('1番人気に支持されたときの')) return 'reliability';
  if (text.startsWith(`${subject}の芝は`) || text.startsWith(`${subject}の距離別`)) return 'surface';
  if (text.startsWith(`${subject}の競馬場別`) || text.startsWith(`${subject}のコース別`)) return 'racecourse';
  if (text.startsWith(`${subject}の脚質別`) || text.startsWith(`${subject}のクラス別`)) return 'style';
  if (text.startsWith('最も多くコンビを組んでいる調教師')) return 'trainer';
  if (text.includes('単勝回収率が100%を超えている')) return 'payback';
  return 'other';
}

export function buildJockeySummaryBlocks(jockey: Parameters<typeof buildJockeySummary>[0]): JockeySummaryBlock[] {
  const subject = `${jockey.name}騎手`;
  return buildJockeySummary(jockey).map((text) => {
    const key = classify(text, subject);
    return { key, title: TITLES[key], text: emphasizeBestPlaceRate(text) };  // 段落内で最も高い複勝率を1つだけ強調
  });
}
