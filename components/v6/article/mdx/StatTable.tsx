'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cx } from '../cx';

/** 13項目の成績（記事の MDX に書かれた値をそのまま使う） */
export type Stat = {
  races: number;
  wins: number;
  places_2: number;
  places_3: number;
  win_rate: number;
  quinella_rate: number;
  place_rate: number;
  win_payback: number;
  place_payback: number;
  avg_popularity?: number | null;
  avg_rank?: number | null;
  median_popularity?: number | null;
  median_rank?: number | null;
};

/** 1列目（名前・枠・体重帯など）の描き方 */
export type Key =
  | { kind: 'text'; text: string; link?: string }
  | { kind: 'gate'; gate: number }
  | { kind: 'grade'; text: string };

export type StatRow = Stat & { key?: Key };

type Col = { k: keyof Stat; label: [string, string?]; f: 'int' | 'pct' | 'dec' | 'round'; hl: boolean };

// 見本（コース詳細の表）と同じ並び・書式。最大値の札は回数・率・回収率の9項目だけ（平均・中央値は付けない）
const COLS: Col[] = [
  { k: 'races', label: ['出走数'], f: 'int', hl: true },
  { k: 'wins', label: ['1着'], f: 'int', hl: true },
  { k: 'places_2', label: ['2着'], f: 'int', hl: true },
  { k: 'places_3', label: ['3着'], f: 'int', hl: true },
  { k: 'win_rate', label: ['勝率'], f: 'pct', hl: true },
  { k: 'quinella_rate', label: ['連対率'], f: 'pct', hl: true },
  { k: 'place_rate', label: ['複勝率'], f: 'pct', hl: true },
  { k: 'win_payback', label: ['単勝', '回収率'], f: 'pct', hl: true },
  { k: 'place_payback', label: ['複勝', '回収率'], f: 'pct', hl: true },
  { k: 'avg_popularity', label: ['平均', '人気'], f: 'dec', hl: false },
  { k: 'avg_rank', label: ['平均', '着順'], f: 'dec', hl: false },
  { k: 'median_popularity', label: ['人気', '中央値'], f: 'round', hl: false },
  { k: 'median_rank', label: ['着順', '中央値'], f: 'round', hl: false },
];

const fmt = (v: unknown, f: Col['f']) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '-';
  if (f === 'pct') return `${v.toFixed(1)}%`;
  if (f === 'dec') return v.toFixed(1);
  if (f === 'round') return String(Math.round(v));
  return v.toLocaleString('ja-JP');
};

// 枠番の色（コース詳細と同じ）
const GATE_BG: Record<number, string> = { 1: '#FFFFFF', 2: '#222222', 3: '#C62927', 4: '#2573CD', 5: '#E4CA3C', 6: '#58AF4A', 7: '#FAA727', 8: '#DC6179' };
const GATE_FG: Record<number, string> = { 1: '#222222', 5: '#222222', 7: '#222222' };

function KeyCell({ k }: { k: Key }) {
  if (k.kind === 'gate') {
    return (
      <span className={cx('gt', k.gate === 1 && 'w')} style={{ background: GATE_BG[k.gate], color: GATE_FG[k.gate] || '#FFFFFF' }} aria-label={`${k.gate}枠`}>
        {k.gate}
      </span>
    );
  }
  if (k.kind === 'grade' && /^G[123]$/.test(k.text)) return <span className={cx('gr', k.text.toLowerCase())}>{k.text}</span>;
  if (k.kind === 'text' && k.link) return <Link prefetch={false} href={k.link} title={k.text}>{k.text}</Link>;
  return <span title={k.text}>{k.text}</span>;
}

/**
 * 記事の中の13項目の表（見本のコース詳細の表と同じ見た目）。
 * - 1列目を固定。横に送ると名前が3文字分に縮み、右に続きがあるあいだは右端に影
 * - 各列の最大値に淡い緑の札（disableHighlight で消す）
 * - initialShow 件より多いときは「さらに表示」（現行と同じく全件まで開く）
 */
export default function StatTable({
  title,
  keyLabel,
  rows,
  rank = false,
  initialShow,
  note,
  disableHighlight = false,
}: {
  title?: string;
  keyLabel?: string;
  rows: StatRow[];
  rank?: boolean;
  initialShow?: number;
  note?: string;
  disableHighlight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [more, setMore] = useState(false);
  const box = useRef<HTMLElement>(null);
  const sc = useRef<HTMLDivElement>(null);

  const hasKey = rows.some((r) => r.key);
  const limit = initialShow && rows.length > initialShow ? initialShow : rows.length;
  const rest = rows.length - limit;

  // 横に送ったら名前の列を縮める・右端に影
  useEffect(() => {
    const el = sc.current;
    if (!el) return;
    const edge = () => {
      setNarrow(el.scrollLeft > 8);
      setMore(el.clientWidth > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    edge();
    el.addEventListener('scroll', edge, { passive: true });
    addEventListener('resize', edge);
    return () => {
      el.removeEventListener('scroll', edge);
      removeEventListener('resize', edge);
    };
  }, [open]);

  if (rows.length === 0) return null;

  const max = Object.fromEntries(
    COLS.filter((c) => c.hl).map((c) => [c.k, Math.max(...rows.map((r) => (typeof r[c.k] === 'number' ? (r[c.k] as number) : 0)))])
  ) as Record<string, number>;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    // 閉じたときに表の先頭が画面の上へ出ていたら、表の頭まで戻す
    if (!next && box.current && box.current.getBoundingClientRect().top < 0) {
      box.current.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return (
    <figure ref={box} className={cx('sw', open && 'open')} style={{ scrollMarginTop: 'calc(var(--hdr-h) + 12px)' }}>
      {title && <figcaption className={cx('sw-h')}>{title}</figcaption>}
      <div className={cx('tbw', more && 'more')}>
        <div ref={sc} className={cx('tsc', narrow && 'narrow')}>
          <table className={cx('st', !hasKey && 'nokey')}>
            {title && <caption className={cx('vh')}>{title}</caption>}
            <thead>
              <tr>
                {hasKey && (
                  <th scope="col" className={cx('k')}>
                    {rank && <span className={cx('rno')}>順位</span>}
                    <span className={cx('nm')}>{keyLabel}</span>
                  </th>
                )}
                {COLS.map((c) => (
                  <th scope="col" key={c.k}>
                    {c.label[0]}
                    {c.label[1] && (
                      <>
                        <br />
                        {c.label[1]}
                      </>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={cx(i >= limit && 'mr', i === limit - 1 && rest > 0 && 'lv')}>
                  {hasKey && (
                    <th scope="row" className={cx('k')}>
                      {rank && <span className={cx('rno', 'num', i < 3 && `t3 m${i + 1}`)}>{i + 1}</span>}
                      {r.key && (r.key.kind === 'text' ? <span className={cx('nm')}><KeyCell k={r.key} /></span> : <KeyCell k={r.key} />)}
                    </th>
                  )}
                  {COLS.map((c) => {
                    const v = r[c.k];
                    const t = fmt(v, c.f);
                    const on = !disableHighlight && c.hl && typeof v === 'number' && v > 0 && v === max[c.k];
                    return <td key={c.k}>{on ? <span className={cx('hl')}>{t}</span> : t}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {note && <p className={cx('sw-n')}>{note}</p>}
      {rest > 0 && (
        <div className={cx('sw-f')}>
          <button type="button" className={cx('sw-m')} aria-expanded={open} onClick={toggle}>
            {open ? `${limit}件までにする` : `さらに表示（残り${rest}件）`}
          </button>
        </div>
      )}
    </figure>
  );
}
