'use client';

import { useEffect, useRef, useState } from 'react';
import s from './course.module.css';

/**
 * 表の横スクロール枠（見本 course.js の edge / stick）
 * - 横に送ったら .narrow（1列目の長い名前を先頭3文字分に縮める）
 * - 右にまだ続きがあるあいだは .more（右端に影）
 * - PC（1100px以上）では、表が画面の上へ流れても見出し行をヘッダーとチップの下に留める（thead に --ty を入れる）
 */
export default function TableScroll({ className, children }: { className?: string; children: React.ReactNode }) {
  const tbRef = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const tb = tbRef.current;
    if (!tb) return;
    const table = tb.querySelector('table');
    const edge = () => {
      setNarrow(tb.scrollLeft > 8);
      setMore(tb.scrollLeft + tb.clientWidth < tb.scrollWidth - 4);
    };

    let ty = 0;
    let ticking = false;
    const stick = () => {
      ticking = false;
      if (!table || !table.tHead) return;
      const hdr = document.querySelector('header');
      const chips = document.querySelector<HTMLElement>(`.${s.chips}`);
      const top = (hdr ? hdr.offsetHeight : 0) + (chips && getComputedStyle(chips).position === 'sticky' ? chips.offsetHeight : 0);
      let next = 0;
      // スマホ・タブレットでは留めない。隠れている行は高さ0なので、高さのある最後の行で止める位置を決める
      if (innerWidth >= 1100 && table.offsetParent) {
        const r = table.getBoundingClientRect();
        const hh = table.tHead.offsetHeight;
        let last = 0;
        for (let i = table.rows.length - 1; i > 0 && !last; i--) last = table.rows[i].offsetHeight;
        if (r.top < top && r.bottom > top) next = Math.min(top - r.top, r.height - hh - last);
      }
      next = Math.max(0, Math.round(next));
      if (next !== ty) {
        ty = next;
        table.tHead.style.setProperty('--ty', `${ty}px`);
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(stick);
      }
    };

    edge();
    tb.addEventListener('scroll', edge, { passive: true });
    addEventListener('scroll', onScroll, { passive: true });
    // 表が見えるようになった（開いた）・行が増えた・幅が変わったときに測り直す
    const ro = new ResizeObserver(() => {
      edge();
      onScroll();
    });
    ro.observe(tb);
    if (table) ro.observe(table);
    return () => {
      tb.removeEventListener('scroll', edge);
      removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={`${s.tbw}${className ? ` ${className}` : ''}${more ? ` ${s.more}` : ''}`}>
      <div ref={tbRef} className={`${s.tb}${narrow ? ` ${s.narrow}` : ''}`}>
        {children}
      </div>
    </div>
  );
}
