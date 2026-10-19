import Link from 'next/link';
import s from '@/components/course/course.module.css';
import t from './shared.module.css';
import { STAT_COLUMNS, formatStat, maxByColumn, type StatRowLike } from '@/components/course/statColumns';

export interface LinkStatRow extends StatRowLike {
  label: string;
  link?: string;
  /** 中央・ローカルなどの集計行（最大値の判定から除き、上に区切り線を引く） */
  summary?: boolean;
}

/**
 * 13項目の表（1列目固定）。騎手・種牡馬・調教師ページ共通。StatsTable に、1列目のリンクと集計行の扱いを足したもの。
 * 最大値ハイライトは現行仕様（出走数〜複勝回収率の9列・0は除外・同値はすべて）
 */
export default function LinkStatsTable({
  rows,
  keyLabel,
  highlight = true,
}: {
  rows: LinkStatRow[];
  keyLabel: string;
  highlight?: boolean;
}) {
  const max = maxByColumn(rows.filter((r) => !r.summary));
  return (
    <div className={s.tbl}>
      <table>
        <thead>
          <tr>
            <th className={s.key}>{keyLabel}</th>
            {STAT_COLUMNS.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const firstSummary = row.summary && !rows[i - 1]?.summary;
            return (
              <tr key={`${row.label}-${i}`} className={firstSummary ? t.sumFirst : undefined}>
                <td className={s.key}>
                  {row.link ? (
                    <Link href={row.link} className={s.textLink}>
                      {row.label}
                    </Link>
                  ) : row.summary ? (
                    <b className={t.sumLabel}>{row.label}</b>
                  ) : (
                    row.label
                  )}
                </td>
                {STAT_COLUMNS.map((c) => {
                  const v = row[c.key];
                  const text = formatStat(v, c.format);
                  const isMax = highlight && !row.summary && c.highlight && typeof v === 'number' && v > 0 && v === max[c.key];
                  return <td key={c.key}>{isMax ? <span className={s.hlCell}>{text}</span> : text}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
