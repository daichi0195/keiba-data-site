'use client';

import { useEffect, useRef } from 'react';
import styles from './course.module.css';

/**
 * 子要素のグラフ（横棒・メーター）を、画面に20%入ったときに1回だけ動かす。
 * サーバー描画の時点では完成状態のまま表示し、JS が動いたときだけ
 * 画面外の要素を待機状態（pending）にしてから再生する。
 */
export default function AnimateOnView({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    const play = () => {
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove(styles.pending)));
    };
    el.classList.add(styles.pending);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            play();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
