'use client';

import { useState } from 'react';
import s from '@/components/course/course.module.css';
import r from './shared.module.css';
import ScrollTable from '@/components/course/ScrollTable';

export interface ListColumn {
  label: string;
  /** 数値の列（右揃え・等幅数字）。それ以外は左揃え */
  numeric?: boolean;
}

export interface ListRow {
  key: string;
  /** 列の順に描画済みのセル（サーバー側で組み立てて渡す） */
  cells: React.ReactNode[];
}

const INITIAL_ROWS = 5;

/**
 * 重賞勝ち・代表産駒・管理馬などの一覧表（表の共通仕様：1列目固定・横罫線のみ）
 * 最初は5件、「さらに表示」で全件
 */
export default function ListTable({ columns, rows, note }: { columns: ListColumn[]; rows: ListRow[]; note?: string }) {
  const [open, setOpen] = useState(false);
  const rest = rows.length - INITIAL_ROWS;
  const cellClass = (ci: number) => (ci === 0 ? s.key : columns[ci]?.numeric ? undefined : r.txt);
  return (
    <div className={`${s.card} ${s.rankCard} ${open ? s.open : ''}`}>
      <ScrollTable>
        <table className={r.listTable}>
          <thead>
            <tr>
              {columns.map((c, ci) => (
                <th key={c.label} className={cellClass(ci)}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.key} className={i >= INITIAL_ROWS ? s.moreRow : undefined}>
                {row.cells.map((cell, ci) => (
                  <td key={ci} className={cellClass(ci)}>
                    {ci === 0 ? <span className={`${s.keyIn} ${s.keyInWide}`}>{cell}</span> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
      {(note || rest > 0) && (
        <div className={s.rFoot}>
          <span className={s.hint}>{note}</span>
          {rest > 0 && (
            <button type="button" className={s.btn} onClick={() => setOpen((v) => !v)}>
              {open ? `${INITIAL_ROWS}件までにする` : `さらに表示（残り${rest}件）`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
