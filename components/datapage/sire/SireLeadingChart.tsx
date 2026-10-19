'use client';

import { useEffect, useRef, useState } from 'react';
import x from './sire.module.css';

interface YearlyLeading {
  year: number;
  wins: number;
  ranking: number;
}

// トンマナの色（docs/redesign/tonmana.md 7. グラフ）
const BAR = '#1DB854';
const INK = '#222222';
const SUB = '#6A6A6A';
const GRID = '#E9E9E9';
const FONT = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", system-ui, sans-serif';
const MAX_RANKING = 50;

// 勝利数の軸の上限をキリの良い数にする（現行のグラフと同じ考え方）
function niceMax(v: number): number {
  const m = v * 1.15;
  const steps = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150];
  return steps.find((s) => m <= s) ?? Math.ceil(m / 50) * 50;
}

/**
 * 年度別の勝利数（棒）とリーディング順位（折れ線）。
 * 画面に20%入ったら1回だけ描画アニメーション。prefers-reduced-motion では完成状態で表示。
 */
export default function SireLeadingChart({ data }: { data: YearlyLeading[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(1);
  const [width, setWidth] = useState(0);

  // 幅の変化に追従
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => setWidth(box.getBoundingClientRect().width);
    update();
    if (!('ResizeObserver' in window)) return;
    const ro = new ResizeObserver(update);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  // 画面に入ったら1回だけ再生
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;
    setProgress(0);
    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const duration = 900;
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          setProgress(1 - Math.pow(1 - t, 3));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.2 }
    );
    observer.observe(box);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box || width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = box.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const pad = { top: 30, right: 34, bottom: 46, left: 34 };
    const cw = rect.width - pad.left - pad.right;
    const ch = rect.height - pad.top - pad.bottom;
    const maxWins = niceMax(Math.max(0, ...data.map((d) => d.wins)));
    const slot = cw / Math.max(data.length, 1);

    // グリッドと右軸（勝利数）
    const lines = 4;
    ctx.lineWidth = 1;
    ctx.strokeStyle = GRID;
    ctx.font = `12px ${FONT}`;
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= lines; i++) {
      const y = pad.top + (ch / lines) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cw, y);
      ctx.stroke();
      ctx.fillStyle = SUB;
      ctx.textAlign = 'left';
      ctx.fillText(String(Math.round(maxWins * (1 - i / lines))), pad.left + cw + 6, y);
    }
    // 左軸（リーディング順位。上が1位、下が50位）
    ctx.textAlign = 'right';
    ctx.fillText('1位', pad.left - 6, pad.top);
    ctx.fillText(`${MAX_RANKING}位`, pad.left - 6, pad.top + ch);

    // 棒（勝利数）と X 軸ラベル
    const barP = Math.min(progress * 1.4, 1);
    data.forEach((d, i) => {
      const cx = pad.left + slot * i + slot / 2;
      const bw = Math.min(slot * 0.5, 56);
      const h = (d.wins / maxWins) * ch * barP;
      ctx.fillStyle = BAR;
      const r = Math.min(4, h / 2, bw / 2);
      const x0 = cx - bw / 2;
      const y0 = pad.top + ch - h;
      ctx.beginPath();
      ctx.moveTo(x0, pad.top + ch);
      ctx.lineTo(x0, y0 + r);
      ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
      ctx.lineTo(x0 + bw - r, y0);
      ctx.quadraticCurveTo(x0 + bw, y0, x0 + bw, y0 + r);
      ctx.lineTo(x0 + bw, pad.top + ch);
      ctx.closePath();
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = SUB;
      ctx.font = `12px ${FONT}`;
      ctx.fillText(`${d.year}年`, cx, pad.top + ch + 18);
      ctx.fillStyle = INK;
      ctx.font = `600 13px ${FONT}`;
      ctx.fillText(`${d.wins}勝`, cx, pad.top + ch + 36);
    });

    // 折れ線（リーディング順位）。データのある年だけ結ぶ
    const pts = data
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => d.ranking > 0)
      .map(({ d, i }) => {
        const rank = Math.min(d.ranking, MAX_RANKING);
        return {
          x: pad.left + slot * i + slot / 2,
          y: pad.top + ch * ((rank - 1) / (MAX_RANKING - 1)),
          label: d.ranking > MAX_RANKING ? '50位未満' : `${d.ranking}位`,
        };
      });
    if (pts.length > 0) {
      const shown = progress * (pts.length - 1);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < pts.length; k++) {
        if (k <= shown) {
          ctx.lineTo(pts[k].x, pts[k].y);
        } else if (k - 1 < shown) {
          const t = shown - (k - 1);
          ctx.lineTo(pts[k - 1].x + (pts[k].x - pts[k - 1].x) * t, pts[k - 1].y + (pts[k].y - pts[k - 1].y) * t);
        }
      }
      if (pts.length > 1) ctx.stroke();

      pts.forEach((p, k) => {
        if (k > Math.floor(shown + 1e-6) && progress < 1) return;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 順位ラベル（白地の上に黒文字）
        ctx.font = `700 12px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const tw = ctx.measureText(p.label).width;
        const ly = Math.max(p.y - 18, 10);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(p.x - tw / 2 - 4, ly - 9, tw + 8, 18);
        ctx.fillStyle = INK;
        ctx.fillText(p.label, p.x, ly);
      });
    }
  }, [data, progress, width]);

  // Canvas の代わりに読める要約文
  const summary = data
    .map((d) => `${d.year}年 ${d.wins}勝${d.ranking > 0 ? `（${d.ranking > MAX_RANKING ? '50位未満' : `${d.ranking}位`}）` : ''}`)
    .join('、');

  return (
    <>
      <div className={x.chartLegend}>
        <span><i className={x.legendBar} aria-hidden="true" />勝利数（右軸）</span>
        <span><i className={x.legendLine} aria-hidden="true" />リーディング順位（左軸）</span>
      </div>
      <div ref={boxRef} className={x.chartBox}>
        <canvas ref={canvasRef} role="img" aria-label={`年度別の勝利数とリーディング順位：${summary}`} />
      </div>
    </>
  );
}
