'use client';

import { createElement, useEffect, useRef, useState } from 'react';
import s from './ai.module.css';

/**
 * 画面に入ったら1回だけ動かす（見本 js/ai.js・top.js）。初期表示（サーバーの HTML）は完成形のまま：.anim と .in を付け（棒が伸びる・カードが浮く・印が出る）、
 * 中の [data-to]（data-dp＝小数の桁）を 0 から数え上げる。動きを減らす設定では何もしない（初めから完成形）。
 * 予測の表のように aria-hidden="true" の親（PredictionGate で隠している間）の中にあるときは、見えるようになってから動かす。
 */
export default function Reveal({
  as = 'div',
  className,
  children,
  ...rest
}: { as?: string; className?: string; children: React.ReactNode } & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<'' | 'wait' | 'in'>('');

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const gate = el.parentElement?.closest('[aria-hidden]') ?? null;
    const hidden = () => gate?.getAttribute('aria-hidden') === 'true';
    // 読み込んだ時点で見えている要素は動かさない（完成形を一瞬見せてから0に戻す、のちらつきを出さない）。
    // 動かすのは、まだ画面の外にある要素と、PredictionGate で隠している間の表だけ
    const r = el.getBoundingClientRect();
    if (!hidden() && r.bottom > 0 && r.top < innerHeight) return;
    setState('wait');
    let seen = false;
    let done = false;
    const start = () => {
      if (done || !seen || hidden()) return;
      done = true;
      setState('in');
      el.querySelectorAll<HTMLElement>('[data-to]').forEach((b, k) => count(b, k * 30));
    };
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          seen = true;
          io.disconnect();
          start();
        }
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    const mo = gate ? new MutationObserver(start) : null;
    if (gate && mo) mo.observe(gate, { attributes: true, attributeFilter: ['aria-hidden'] });
    return () => {
      io.disconnect();
      mo?.disconnect();
    };
  }, []);

  const cls = [className, state ? s.anim : '', state === 'in' ? s.in : ''].filter(Boolean).join(' ');
  return createElement(as, { ref, className: cls, ...rest }, children);
}

function count(b: HTMLElement, delay: number) {
  const to = parseFloat(b.dataset.to || '0');
  const dp = Number(b.dataset.dp || 0);
  const t0 = performance.now() + delay;
  const fmt = (v: number) => (dp ? v.toFixed(dp) : Math.round(v).toLocaleString('ja-JP'));
  b.textContent = fmt(0);
  const tick = (now: number) => {
    const p = Math.min(1, Math.max(0, (now - t0) / 650));
    const e = 1 - Math.pow(1 - p, 3);
    b.textContent = fmt(to * e);
    if (p < 1) requestAnimationFrame(tick);
    else b.textContent = fmt(to);
  };
  requestAnimationFrame(tick);
}
