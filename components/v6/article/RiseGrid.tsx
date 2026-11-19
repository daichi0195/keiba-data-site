'use client';

import { useEffect, useRef, useState } from 'react';
import { cx } from './cx';

/**
 * 絵の並び（見本の .cl）。画面に入ったら、カードが順に浮き上がる（1回だけ）。
 * 並び替えたときは動かさない（done）。動きを減らす設定では何もしない。
 */
export function useRise<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [anim, setAnim] = useState(false);
  const [seen, setSeen] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setAnim(true);
    let t = 0;
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((en) => en.isIntersecting)) return;
        io.disconnect();
        setSeen(true);
        t = window.setTimeout(() => setDone(true), 1200);
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);
  return { ref, cls: [anim && 'anim', seen && 'in', done && 'done'], finish: () => { setSeen(true); setDone(true); } };
}

export default function RiseGrid({ className, children }: { className: string; children: React.ReactNode }) {
  const { ref, cls } = useRise<HTMLDivElement>();
  return (
    <div ref={ref} className={cx(className, ...cls)}>
      {children}
    </div>
  );
}
