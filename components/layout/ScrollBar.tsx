'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';
import s from './ScrollBar.module.css';

/**
 * 横に送る枠の下に出す細いスクロールバー（今週の重賞のバナー、AI勝率予測のカード）。
 * iPhone などは標準のスクロールバーが出ないため、横に送れることが分かるよう自前で出す。はみ出しがない幅（PC の並び）では出さない。
 * 使い方：const { bar, update } = useScrollBar(ref); 枠に onScroll={update}、下に <ScrollBar bar={bar} />
 */
export function useScrollBar(ref: RefObject<HTMLElement | null>) {
  const [bar, setBar] = useState({ size: 100, pos: 0 });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const size = max > 1 ? (el.clientWidth / el.scrollWidth) * 100 : 100;
    setBar({ size, pos: max > 1 ? (el.scrollLeft / max) * (100 - size) : 0 });
  }, [ref]);
  useEffect(() => {
    update();
    addEventListener('resize', update);
    return () => removeEventListener('resize', update);
  }, [update]);
  return { bar, update };
}

export function ScrollBar({ bar }: { bar: { size: number; pos: number } }) {
  if (bar.size >= 100) return null;
  return (
    <div className={s.bar} aria-hidden="true">
      <i style={{ width: `${bar.size}%`, left: `${bar.pos}%` }} />
    </div>
  );
}
