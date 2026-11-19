'use client';

import { useEffect, useRef } from 'react';
import s from './ai.module.css';

type Link = { slug: string; label: React.ReactNode; aria: string; on: boolean };

/**
 * 同じ日のレース：競馬場の切替と、同じ競馬場のレース番号（見本 js/ai.js）。
 * 狭い幅でレース番号が横にはみ出すときは、選択中を中央に寄せ、左端がチップの途中で切れない位置にそろえる。
 * レース個別ページはオファーウォールの対象で、読み込み時にしか表示されないため通常の a で遷移させる
 */
export default function RaceSwitch({ label, venues, races }: { label: string; venues: Link[]; races: Link[] }) {
  const rs = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = rs.current;
    const on = box?.querySelector<HTMLElement>(`.${s.on}`);
    if (!box || !on) return;
    if (on.offsetLeft - box.offsetLeft + on.offsetWidth <= box.clientWidth) return;
    box.scrollLeft = on.offsetLeft - box.offsetLeft - (box.clientWidth - on.offsetWidth) / 2;
    const x = box.scrollLeft;
    let snap = 0;
    Array.from(box.children).forEach((k) => {
      const l = (k as HTMLElement).offsetLeft - box.offsetLeft;
      if (l <= x + 1) snap = l;
    });
    if (box.scrollLeft < box.scrollWidth - box.clientWidth - 1) box.scrollLeft = snap;
  }, []);
  return (
    <nav className={s['p-rs']} aria-label={label}>
      <div className={s['p-rs-v']}>
        {venues.map((v) => (
          <a key={v.slug} href={`/ai/races/${v.slug}`} className={v.on ? s.on : undefined} aria-current={v.on ? 'true' : undefined} aria-label={v.aria}>
            {v.label}
          </a>
        ))}
      </div>
      <div className={s['p-rs-r']} ref={rs}>
        {races.map((r) => (
          <a key={r.slug} href={`/ai/races/${r.slug}`} className={r.on ? s.on : undefined} aria-current={r.on ? 'page' : undefined} aria-label={r.aria}>
            {r.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
