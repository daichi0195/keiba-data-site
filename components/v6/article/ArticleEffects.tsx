'use client';

// 記事本文のグラフ・表の動き（見本 js/article.js の後半）：画面に入ったら1回だけ、棒が伸びて数値が数え上がる。
// サーバーで描いた要素（data-reveal の付いた図）にクラスを足し、数値の文字を書き換えるだけ（要素は作り直さない）。
import { useEffect } from 'react';
import { s } from './cx';

export default function ArticleEffects() {
  useEffect(() => {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const figs = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    figs.forEach((f) => f.classList.add(s.anim));
    const raf: number[] = [];
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((en) => {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          en.target.classList.add(s.in);
          en.target.querySelectorAll<HTMLElement>('[data-to] > b').forEach((b) => {
            const to = parseFloat(b.parentElement?.dataset.to ?? '0');
            const fin = b.parentElement?.dataset.to ?? '';
            const dec = (fin.split('.')[1] ?? '').length;
            const t0 = performance.now() + 150;
            const step = (now: number) => {
              const p = Math.min(1, Math.max(0, (now - t0) / 700));
              const e = 1 - Math.pow(1 - p, 3);
              b.textContent = p < 1 ? (to * e).toFixed(dec) : fin;
              if (p < 1) raf.push(requestAnimationFrame(step));
            };
            raf.push(requestAnimationFrame(step));
          });
        });
      },
      { threshold: 0.3 }
    );
    figs.forEach((f) => io.observe(f));
    return () => {
      io.disconnect();
      raf.forEach(cancelAnimationFrame);
    };
  }, []);
  return null;
}
