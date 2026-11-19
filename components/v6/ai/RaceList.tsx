'use client';

import { useMemo, useRef, useState } from 'react';
import type { RaceSummary } from './data';
import { dateY, gradeOf, sfJa, sfKey, shortDate, shortName } from './format';
import s from './ai.module.css';

/** 現行と同じページ番号の並べ方（7ページ以下は全部、それ以上は前後1つと両端） */
function pageNumbers(cur: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const a: (number | '…')[] = [1];
  if (cur > 3) a.push('…');
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) a.push(i);
  if (cur < total - 2) a.push('…');
  a.push(total);
  return a;
}

type Col = { key: string; label: string };

/**
 * 予測一覧の本体（見本 pages/ai-races.mjs・js/ai.js）。開催日・競馬場で絞り込む。
 * HTML は1種類：日付ごとの板に「レース番号（行）×競馬場（列）」の格子を置き、各レースに格子の位置を持たせる。
 * 700px以上は格子（全件）、700px未満は格子を解いて1件＝1行（index.json の順、20件ずつのページ送り）。
 * PC（1280px以上）で競馬場を選んだときだけ「レース番号×開催日」の板を足す（押した後にだけ描くので、最初の HTML には無い）。
 */
export default function RaceList({
  races,
  venueOrder,
  perPage,
  initialPage,
  emptyText,
}: {
  races: RaceSummary[];
  venueOrder: string[];
  perPage: number;
  initialPage: number;
  emptyText: string;
}) {
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [page, setPage] = useState(initialPage);
  const sec = useRef<HTMLElement>(null);

  const dates = useMemo(() => [...new Set(races.map((r) => r.date))], [races]);
  const venues = useMemo(() => venueOrder.filter((v) => races.some((r) => r.venueLabel === v)), [races, venueOrder]);

  const hit = races.filter((r) => (!date || r.date === date) && (!venue || r.venueLabel === venue));
  // スマホの1件1行：20件ずつ
  const total = Math.max(1, Math.ceil(hit.length / perPage));
  const cur = Math.min(page, total);
  const show = new Set(hit.slice((cur - 1) * perPage, cur * perPage).map((r) => r.slug));

  const count = (f: 'date' | 'venue', v: string) =>
    races.filter((r) => (f === 'date' ? (!v || r.date === v) && (!venue || r.venueLabel === venue) : (!v || r.venueLabel === v) && (!date || r.date === date))).length;

  const pick = (f: 'date' | 'venue', v: string, el: HTMLElement) => {
    if (f === 'date') setDate(v);
    else setVenue(v);
    setPage(1);
    // 選んだチップが端で切れないよう中央へ送る
    const box = el.parentElement!;
    box.scrollTo({ left: el.offsetLeft - box.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const go = (e: React.MouseEvent, p: number) => {
    e.preventDefault();
    setPage(p);
    const el = sec.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + scrollY - 64;
    if (scrollY > top) scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  /** 1枚の板：行＝レース番号（大きい順）、列＝cols。rs は index.json の順のまま（スマホの1件1行の順） */
  const board = (kind: 'date' | 'venue', key: string, title: string, rs: RaceSummary[], cols: Col[], colOf: (r: RaceSummary) => string) => {
    const nums = [...new Set(rs.map((r) => r.raceNumber))].sort((a, b) => b - a);
    const onPage = rs.filter((r) => show.has(r.slug));
    const firstOnPage = onPage[0];
    const cells: React.ReactNode[] = [
      <span key="h" className={`${s['mx-hd']} ${s.f}${cols.length === 0 ? ` ${s.l}` : ''}`} style={{ gridRow: 1, gridColumn: 1 }}>
        R
      </span>,
      ...cols.map((c, i) => (
        <span key={`h-${c.key}`} className={`${s['mx-hd']}${i === cols.length - 1 ? ` ${s.l}` : ''}`} style={{ gridRow: 1, gridColumn: i + 2 }}>
          {c.label}
        </span>
      )),
      ...nums.map((n, i) => (
        <span key={`r-${n}`} className={`${s['mx-r']}${i === 0 ? ` ${s.top}` : ''}`} style={{ gridRow: i + 2, gridColumn: 1 }}>
          <b className={s.num}>{n}</b>R
        </span>
      )),
    ];
    // レース（DOM は index.json の順）
    rs.forEach((r) => {
      const row = nums.indexOf(r.raceNumber);
      const col = cols.findIndex((c) => c.key === colOf(r));
      const g = gradeOf(r.raceName);
      const cls = [s['mx-c'], row === 0 ? s.top : '', show.has(r.slug) ? '' : s.off, r === firstOnPage ? s.first : ''].filter(Boolean).join(' ');
      cells.push(
        <div key={r.slug} className={cls} style={{ gridRow: row + 2, gridColumn: col + 2 }}>
          <span className={s['mx-v']}>
            {r.venueLabel}
            <b className={s.num}>{r.raceNumber}</b>R
          </span>
          <span className={s['mx-t']}>
            <a className={s['mx-n']} href={`/ai/races/${r.slug}`}>
              {g && <i className={`${s.gr} ${s[g.toLowerCase()]}`}>{g}</i>}
              {shortName(r.raceName)}
            </a>
          </span>
          <span className={s['mx-m']}>
            <i className={`${s.sf} ${s.sm} ${s[sfKey(r.surface)]} ${s['p-sfs']}`}>
              <span className={s.l}>{sfJa(r.surface)}</span>
              <span className={s.s}>{sfJa(r.surface).charAt(0)}</span>
            </i>
            <span className={s.num}>{r.distance}m</span>
          </span>
        </div>,
      );
    });
    // 予測の無いマス（PC の格子だけ）
    nums.forEach((n, i) =>
      cols.forEach((c, j) => {
        if (!rs.some((r) => r.raceNumber === n && colOf(r) === c.key))
          cells.push(
            <span key={`n-${n}-${c.key}`} className={`${s['mx-c']} ${s.none}${i === 0 ? ` ${s.top}` : ''}`} style={{ gridRow: i + 2, gridColumn: j + 2 }}>
              <span aria-label="予測なし">—</span>
            </span>,
          );
      }),
    );
    return (
      <section key={`${kind}-${key}`} className={`${s.mx}${onPage.length ? '' : ` ${s.off}`}`} data-kind={kind}>
        <h2 className={s['mx-h']}>
          {title}
          {/* 前のページから続く日付には（続き）を付ける（スマホの1件1行だけ） */}
          <i>{firstOnPage && firstOnPage !== rs[0] ? '（続き）' : ''}</i>
          <span>
            <b className={s.num}>{rs.length}</b>レース
          </span>
        </h2>
        <div className={`${s['mx-g']}${cols.length === 1 ? ` ${s.one}` : ''}`} style={{ '--n': cols.length } as React.CSSProperties}>
          {cells}
        </div>
      </section>
    );
  };

  // 日付ごとの板（列＝その日の競馬場。競馬場を選んだらその1列）
  const byDate = dates
    .filter((d) => !date || d === date)
    .map((d) => {
      const rs = hit.filter((r) => r.date === d);
      if (!rs.length) return null;
      const cols = venues.filter((v) => rs.some((r) => r.venueLabel === v)).map((v) => ({ key: v, label: v }));
      return board('date', d, dateY(d), rs, cols, (r) => r.venueLabel);
    });
  // 競馬場を選んだとき（PC 1280px以上）：「レース番号×開催日」の板
  const byVenue = venue
    ? (() => {
        const rs = hit;
        if (!rs.length) return null;
        const cols = dates.filter((d) => rs.some((r) => r.date === d)).map((d) => ({ key: d, label: shortDate(d) }));
        return board('venue', venue, venue, rs, cols, (r) => r.date);
      })()
    : null;

  const chip = (f: 'date' | 'venue', v: string, label: string) => (
    <button key={v || 'all'} type="button" aria-pressed={(f === 'date' ? date : venue) === v} onClick={(e) => pick(f, v, e.currentTarget)}>
      {label}
      <span className={s.num}>{count(f, v)}</span>
    </button>
  );

  return (
    <section ref={sec} className={s['p-sec']} aria-label="予測一覧">
      {races.length > 0 && (
        <div className={s['p-w']}>
          <div className={`${s['p-pn']} ${s['p-flt']}`}>
            <div className={s['p-flt-r']}>
              <span className={s['p-flt-k']} id="f-date">開催日</span>
              <div className={s['p-flt-c']} role="group" aria-labelledby="f-date">
                {chip('date', '', 'すべて')}
                {dates.map((d) => chip('date', d, shortDate(d)))}
              </div>
            </div>
            <div className={s['p-flt-r']}>
              <span className={s['p-flt-k']} id="f-venue">競馬場</span>
              <div className={s['p-flt-c']} role="group" aria-labelledby="f-venue">
                {chip('venue', '', 'すべて')}
                {venues.map((v) => chip('venue', v, v))}
              </div>
            </div>
          </div>
        </div>
      )}
      {hit.length > 0 ? (
        <div className={s['p-w']}>
          <div className={`${s.lx}${venue ? ` ${s.byv}` : ''}`}>
            {byDate}
            {byVenue}
          </div>
        </div>
      ) : (
        <p className={s['p-ls-0']}>{emptyText}</p>
      )}
      {total > 1 && (
        <nav className={s['p-pg']} aria-label="ページ送り">
          {cur > 1 ? (
            <a href={cur === 2 ? '/ai/races' : `/ai/races?page=${cur - 1}`} className={s.pe} onClick={(e) => go(e, cur - 1)}>
              前へ
            </a>
          ) : (
            <span className={s.off} aria-disabled="true">前へ</span>
          )}
          {pageNumbers(cur, total).map((p, i) =>
            p === '…' ? (
              <span key={`g${i}`} className={s.gap}>…</span>
            ) : (
              <a
                key={p}
                href={p === 1 ? '/ai/races' : `/ai/races?page=${p}`}
                className={p === cur ? s.on : undefined}
                aria-current={p === cur ? 'page' : undefined}
                onClick={(e) => go(e, p)}
              >
                {p}
              </a>
            ),
          )}
          {cur < total ? (
            <a href={`/ai/races?page=${cur + 1}`} className={s.pe} onClick={(e) => go(e, cur + 1)}>
              次へ
            </a>
          ) : (
            <span className={s.off} aria-disabled="true">次へ</span>
          )}
        </nav>
      )}
    </section>
  );
}
