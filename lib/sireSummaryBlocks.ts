/**
 * 種牡馬ページのデータ概要を、見出し付きのブロックに分ける（表示用）
 *
 * 文章そのものは lib/dataPageText.ts の buildSireSummary が生成したものをそのまま使い、
 * 段落の内容から見出しを決める。表示では要所（複勝率）を強調し、名前を詳細ページへリンクする。
 */

export type SireSummaryKey =
  | 'overall' | 'surface' | 'racecourse' | 'style' | 'age' | 'condition' | 'damSire' | 'payback' | 'other';

export interface SireSummaryBlock {
  key: SireSummaryKey;
  title?: string;
  /** **…** は強調する箇所 */
  text: string;
}

const TITLES: Record<SireSummaryKey, string | undefined> = {
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

function classify(subject: string, text: string): SireSummaryKey {
  if (text.includes('集計期間（')) return 'overall';
  if (text.startsWith(`${subject}の芝は`) || text.startsWith(`${subject}の距離別`)) return 'surface';
  if (text.startsWith(`${subject}の競馬場別`) || text.startsWith(`${subject}のコース別`)) return 'racecourse';
  if (text.startsWith(`${subject}の脚質別`) || text.startsWith(`${subject}のクラス別`)) return 'style';
  if (text.startsWith('馬齢別')) return 'age';
  if (text.startsWith('馬場状態別')) return 'condition';
  if (text.startsWith('母父別')) return 'damSire';
  if (text.includes('単勝回収率が100%を超えている')) return 'payback';
  return 'other';
}

// 段落の中で最初に出てくる「複勝率xx.x%」だけを強調する（強調しすぎない）
function emphasize(text: string): string {
  return text.replace(/複勝率(\d+(?:\.\d+)?%)/, '複勝率**$1**');
}

export function buildSireSummaryBlocks(sireName: string, paragraphs: string[]): SireSummaryBlock[] {
  const subject = `${sireName}産駒`;
  return paragraphs.map((text) => {
    const key = classify(subject, text);
    return { key, title: TITLES[key], text: key === 'payback' ? text : emphasize(text) };
  });
}
