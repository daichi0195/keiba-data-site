// 騎手詳細・種牡馬詳細・調教師詳細で共通の数値の書式と行の型（見本 docs/redesign/src/pages/_entity-st.mjs と同じ規則）
import type { ReactNode } from 'react';

/** 13項目（現行 components/course/statColumns.ts と同じ並び・書式・ハイライト対象。見出しは2行） */
export type ColFormat = 'int' | 'pct' | 'dec';
export const COLS: [key: string, label: string, format: ColFormat, highlight: boolean][] = [
  ['races', '出走数', 'int', true],
  ['wins', '1着', 'int', true],
  ['places_2', '2着', 'int', true],
  ['places_3', '3着', 'int', true],
  ['win_rate', '勝率', 'pct', true],
  ['quinella_rate', '連対率', 'pct', true],
  ['place_rate', '複勝率', 'pct', true],
  ['win_payback', ['単勝', '回収率'].join('\n'), 'pct', true],
  ['place_payback', ['複勝', '回収率'].join('\n'), 'pct', true],
  ['avg_popularity', ['平均', '人気'].join('\n'), 'dec', false],
  ['avg_rank', ['平均', '着順'].join('\n'), 'dec', false],
  ['median_popularity', ['人気', '中央値'].join('\n'), 'int', false],
  ['median_rank', ['着順', '中央値'].join('\n'), 'int', false],
];

export const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v)
    ? v
    : typeof v === 'string' && v !== '' && Number.isFinite(+v)
      ? +v
      : undefined;

export function fmt(v: unknown, f: ColFormat): string {
  const n = num(v);
  if (n === undefined) return '-';
  return f === 'pct' ? `${n.toFixed(1)}%` : f === 'dec' ? n.toFixed(1) : Math.round(n).toLocaleString('ja-JP');
}
export const pct = (v: unknown) => fmt(v, 'pct');
export const int = (v: unknown) => fmt(v, 'int');

/** 成績の1行（GCS の各 *_stats の行） */
export type Stat = {
  races: number;
  wins: number;
  places_2: number;
  places_3: number;
  win_rate: number;
  quinella_rate: number;
  place_rate: number;
  win_payback?: number;
  place_payback?: number;
  avg_popularity?: number;
  avg_rank?: number;
  median_popularity?: number;
  median_rank?: number;
  [k: string]: unknown;
};

/** 表・棒の1行：key＝1列目の中身、text＝文字だけの名前、listSub＝スマホの棒の行に添える文字 */
export type Row = Stat & { key: ReactNode; text: string; listSub?: string; rowKey?: string };

export const ZERO: Stat = { races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, quinella_rate: 0, place_rate: 0, win_payback: 0, place_payback: 0 };

/** 行を作る（見本の R） */
export const R = (r: Partial<Stat> | undefined | null, key: ReactNode, text?: string): Row => ({
  ...ZERO,
  ...(r ?? {}),
  key,
  text: text ?? (typeof key === 'string' ? key : ''),
});

/** 並びを固定して、データがない区分は 0 で埋める（現行どおり。見本の fill） */
export function fill<T extends Partial<Stat>>(order: string[], rows: T[], keyOf: (r: T) => unknown, labelOf: (k: string) => string = (k) => k): Row[] {
  return order.map((k) => R(rows.find((r) => keyOf(r) === k), labelOf(k)));
}

/** 横棒で「最も高い」を言うときの出走数の下限（現行どおり） */
export const MIN_BAR = 30;
export const enoughOf = (rows: Row[]) => rows.filter((r) => (r.races ?? 0) >= MIN_BAR);
export const bestOf = (rows: Row[]): Row | null => {
  const e = enoughOf(rows);
  return e.length ? e.reduce((m, r) => (r.place_rate > m.place_rate ? r : m)) : null;
};

/** 日付 'YYYY-MM-DD…' → 'YYYY/M/D' */
export const slashDate = (iso: string) => iso.slice(0, 10).split('-').map(Number).join('/');

/** 年度別（直近3年）：データがない年は 0 で埋める */
export function lastYears(year: number) {
  return [year - 2, year - 1, year];
}
