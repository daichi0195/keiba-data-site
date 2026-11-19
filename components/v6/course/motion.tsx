'use client';

import { useEffect, useRef, useState } from 'react';
import s from './course.module.css';

/*
 * 動き（見本 course.js）：画面に入ったら1回だけ、つまみが滑る・棒が伸びる・数値が数え上がる。
 * サーバー描画の時点では完成した状態で出し、JS が動いたらページの根元に .anim を付けて待機状態にしてから再生する。
 * prefers-reduced-motion のときと IntersectionObserver が無いときは動かさない。
 */

const canAnimate = () =>
  typeof window !== 'undefined' && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches;

/** ページの根元（[data-course-page]）に .anim を付ける。描画するものは無い */
export function CourseMotion() {
  useEffect(() => {
    if (!canAnimate()) return;
    const root = document.querySelector('[data-course-page]');
    root?.classList.add(s.anim);
  }, []);
  return null;
}

/** 要素が画面に入ったら true（1回だけ） */
export function useSeen<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !canAnimate()) return;
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((en) => {
          if (!en.isIntersecting) return;
          io.disconnect();
          setSeen(true);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

// 数値は最終値の85%から短く数え上げる（途中にもっともらしい別の数字を見せない）
function countUp(el: HTMLElement, k: number) {
  const to = parseFloat(el.dataset.count ?? '');
  if (!Number.isFinite(to)) return;
  const dec = Number(el.dataset.dec) || 0;
  const suf = el.dataset.suf ?? '';
  const f = (v: number) => (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('ja-JP')) + suf;
  const from = to * 0.85;
  const t0 = performance.now() + 250 + k * 60;
  el.textContent = f(from);
  const tick = (now: number) => {
    const p = Math.min(1, Math.max(0, (now - t0) / 450));
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = f(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** 画面に入ったら .in を付ける箱（コースの特徴のメーター）。中の [data-count] を数え上げる */
export function Reveal({ className, style, children }: { className: string; style?: React.CSSProperties; children: React.ReactNode }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  useEffect(() => {
    if (!seen || !ref.current) return;
    ref.current.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
  }, [seen, ref]);
  return (
    <div ref={ref} className={`${className}${seen ? ` ${s.in}` : ''}`} style={style}>
      {children}
    </div>
  );
}
