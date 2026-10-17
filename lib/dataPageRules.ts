/**
 * データページ共通ルール
 *
 * 対象レース数が少ないページは統計的な傾向判定を行わず、
 * 検索エンジンにもインデックスさせない（薄いページの量産を防ぐ）。
 */

// 傾向判定・インデックス対象とする最低レース数
export const MIN_RACES_FOR_TRENDS = 30;

// 個別の騎手・調教師・種牡馬を「得意/苦手」として言及する際の最低出走数
export const MIN_RACES_FOR_MENTION = 20;

export function hasEnoughRaces(totalRaces: number | null | undefined): boolean {
  return typeof totalRaces === 'number' && Number.isFinite(totalRaces) && totalRaces >= MIN_RACES_FOR_TRENDS;
}

// 対象レース数が少ないページ向けの共通メタデータ
export const THIN_PAGE_ROBOTS = { index: false, follow: true } as const;
