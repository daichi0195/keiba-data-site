'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './course.module.css';
import ScrollTable from './ScrollTable';
import { STAT_COLUMNS, formatStat, maxByColumn, type StatRowLike } from './statColumns';

export interface RankingRow extends StatRowLike {
  name: string;
  link?: string;
}

const INITIAL_ROWS = 10;

/**
 * 騎手・種牡馬・母父・調教師のランキング表（現行の DataTable と同じ仕様）
 * - 最初は10件、「さらに表示」で全件（最大50件）
 * - 横スクロールすると名前の列が先頭3文字分に縮む
 * - 順位1〜3位は色付き、各列の最大値はハイライト（全件の中で判定）
 */
export default function RankingTable({ rows, nameLabel, note }: { rows: RankingRow[]; nameLabel: string; note: string }) {
  const [open, setOpen] = useState(false);
  const rest = rows.length - INITIAL_ROWS;
  const max = maxByColumn(rows);

  return (
    <div className={`${styles.card} ${styles.rankCard} ${open ? styles.open : ''}`}>
      <ScrollTable>
        <table>
          <thead>
            <tr>
              <th className={styles.rn}>#</th>
              <th className={styles.rnm}>{nameLabel}</th>
              {STAT_COLUMNS.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.name}-${i}`} className={i >= INITIAL_ROWS ? styles.moreRow : undefined}>
                <td className={styles.rn}>
                  {i < 3 ? <span className={`${styles.rkb} ${styles[`rk${i + 1}`]}`}>{i + 1}</span> : i + 1}
                </td>
                <td className={styles.rnm}>
                  {row.link ? <Link href={row.link}>{row.name}</Link> : <span>{row.name}</span>}
                </td>
                {STAT_COLUMNS.map((c) => {
                  const v = row[c.key];
                  const text = formatStat(v, c.format);
                  const isMax = c.highlight && typeof v === 'number' && v > 0 && v === max[c.key];
                  return <td key={c.key}>{isMax ? <span className={styles.hlCell}>{text}</span> : text}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
      <div className={styles.rFoot}>
        <span className={styles.hint}>{note}</span>
        {rest > 0 && (
          <button type="button" className={styles.btn} onClick={() => setOpen((v) => !v)}>
            {open ? '10件までにする' : `さらに表示（残り${rest}件）`}
          </button>
        )}
      </div>
    </div>
  );
}
