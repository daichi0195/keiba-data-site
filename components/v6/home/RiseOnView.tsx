'use client';

import { useEffect, useRef, useState } from 'react';
import { cx } from './cx';

/**
 * AI予測のカードの並び（見本の .ai）。画面に入ったら、カードが左から順に浮き上がる（1回だけ）。
 * カードの順番は子の style の --i で渡す。動きを減らす設定では何もしない。
 */
export default function RiseOnView({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [anim, setAnim] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // 読み込んだ時点で画面に入っているものは動かさない（完成形が一瞬出てから0に戻るちらつきを防ぐ）
    const r0 = el.getBoundingClientRect();
    if (r0.top < innerHeight && r0.bottom > 0) return;
    setAnim(true);
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((en) => en.isIntersecting)) return;
        io.disconnect();
        setSeen(true);
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cx('ai', anim && 'anim', seen && 'in')}>
      {children}
    </div>
  );
}
