// コース詳細の表で使う13項目と、表示・最大値の共通処理（見本 docs/redesign/src/pages/course.mjs の COLS / fmt / maxOf）

export type StatKey =
  | 'races' | 'wins' | 'places_2' | 'places_3'
  | 'win_rate' | 'quinella_rate' | 'place_rate' | 'win_payback' | 'place_payback'
  | 'avg_popularity' | 'avg_rank' | 'median_popularity' | 'median_rank';

export type StatRow = Partial<Record<StatKey, number>> & Record<string, unknown>;

type Format = 'int' | 'pct' | 'dec';

// label の配列は見出しの改行位置（「単勝」「回収率」）。hl＝最大値をハイライトする列（現行と同じく出走数〜複勝回収率の9列）
export const COLS: { key: StatKey; label: string[]; format: Format; hl: boolean }[] = [
  { key: 'races', label: ['出走数'], format: 'int', hl: true },
  { key: 'wins', label: ['1着'], format: 'int', hl: true },
  { key: 'places_2', label: ['2着'], format: 'int', hl: true },
  { key: 'places_3', label: ['3着'], format: 'int', hl: true },
  { key: 'win_rate', label: ['勝率'], format: 'pct', hl: true },
  { key: 'quinella_rate', label: ['連対率'], format: 'pct', hl: true },
  { key: 'place_rate', label: ['複勝率'], format: 'pct', hl: true },
  { key: 'win_payback', label: ['単勝', '回収率'], format: 'pct', hl: true },
  { key: 'place_payback', label: ['複勝', '回収率'], format: 'pct', hl: true },
  { key: 'avg_popularity', label: ['平均', '人気'], format: 'dec', hl: false },
  { key: 'avg_rank', label: ['平均', '着順'], format: 'dec', hl: false },
  { key: 'median_popularity', label: ['人気', '中央値'], format: 'int', hl: false },
  { key: 'median_rank', label: ['着順', '中央値'], format: 'int', hl: false },
];

export function fmt(v: unknown, f: Format): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '-';
  if (f === 'pct') return `${v.toFixed(1)}%`;
  if (f === 'dec') return v.toFixed(1);
  return Math.round(v).toLocaleString('ja-JP');
}

/** 列ごとの最大値（全行の中で判定） */
export function maxOf(rows: StatRow[]): Partial<Record<StatKey, number>> {
  const max: Partial<Record<StatKey, number>> = {};
  COLS.forEach((c) => {
    if (!c.hl) return;
    const vs = rows.map((r) => r[c.key]).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (vs.length) max[c.key] = Math.max(...vs);
  });
  return max;
}
