// コースページの表で使う13項目と、表示・ハイライトの共通処理

export type StatKey =
  | 'races' | 'wins' | 'places_2' | 'places_3'
  | 'win_rate' | 'quinella_rate' | 'place_rate' | 'win_payback' | 'place_payback'
  | 'avg_popularity' | 'avg_rank' | 'median_popularity' | 'median_rank';

export type StatRowLike = Partial<Record<StatKey, number>> & Record<string, unknown>;

type Format = 'int' | 'pct' | 'dec';

// highlight: 現行仕様どおり、出走数〜複勝回収率の9列だけ最大値をハイライトする
export const STAT_COLUMNS: { key: StatKey; label: string; format: Format; highlight: boolean }[] = [
  { key: 'races', label: '出走数', format: 'int', highlight: true },
  { key: 'wins', label: '1着', format: 'int', highlight: true },
  { key: 'places_2', label: '2着', format: 'int', highlight: true },
  { key: 'places_3', label: '3着', format: 'int', highlight: true },
  { key: 'win_rate', label: '勝率', format: 'pct', highlight: true },
  { key: 'quinella_rate', label: '連対率', format: 'pct', highlight: true },
  { key: 'place_rate', label: '複勝率', format: 'pct', highlight: true },
  { key: 'win_payback', label: '単勝回収率', format: 'pct', highlight: true },
  { key: 'place_payback', label: '複勝回収率', format: 'pct', highlight: true },
  { key: 'avg_popularity', label: '平均人気', format: 'dec', highlight: false },
  { key: 'avg_rank', label: '平均着順', format: 'dec', highlight: false },
  { key: 'median_popularity', label: '人気中央値', format: 'int', highlight: false },
  { key: 'median_rank', label: '着順中央値', format: 'int', highlight: false },
];

export function formatStat(v: unknown, format: Format): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '-';
  if (format === 'pct') return `${v.toFixed(1)}%`;
  if (format === 'dec') return v.toFixed(1);
  return Math.round(v).toLocaleString('ja-JP');
}

// 列ごとの最大値（全行の中で判定）
export function maxByColumn(rows: StatRowLike[]): Partial<Record<StatKey, number>> {
  const max: Partial<Record<StatKey, number>> = {};
  STAT_COLUMNS.forEach((c) => {
    if (!c.highlight) return;
    const values = rows.map((r) => r[c.key]).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (values.length) max[c.key] = Math.max(...values);
  });
  return max;
}
