/**
 * データ概要の段落の強調（騎手・種牡馬・調教師ページ共通）
 *
 * 段落内の「複勝率○○%」のうち、値が最も大きいものを1つだけ **〜** で強調する（同値なら最初）。
 * 段落の最初の値を機械的に強調すると、比較文で劣っている方の数字が目立ってしまうため。
 * ただし全体成績の段落（「集計期間」で始まる通算の段落）は、通算の値が年度別の値より目立つよう最初の値を強調する。
 * 文言そのものは変えない。すでに強調（**）を含む段落はそのまま返す。
 */
export function emphasizeBestPlaceRate(text: string): string {
  if (text.includes('**')) return text;
  const pattern = /(複勝率は?)(\d+(?:\.\d+)?)%/g;
  let best: { index: number; length: number; prefix: string; num: string } | null = null;
  const firstOnly = text.includes('集計期間');
  for (const m of text.matchAll(pattern)) {
    const value = Number(m[2]);
    if (!Number.isFinite(value)) continue;
    if (best === null || (!firstOnly && value > Number(best.num))) {
      best = { index: m.index ?? 0, length: m[0].length, prefix: m[1], num: m[2] };
    }
  }
  if (!best) return text;
  return `${text.slice(0, best.index)}${best.prefix}**${best.num}%**${text.slice(best.index + best.length)}`;
}
