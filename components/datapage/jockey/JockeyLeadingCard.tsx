'use client';

import { useEffect, useRef, useState } from 'react';
import j from './jockey.module.css';

interface YearlyData {
  year: number;
  wins: number;
  ranking: number;
}

// トンマナの色（docs/redesign/tonmana.md）
const COLOR = {
  bar: '#1DB854', // --data-4
  line: '#222222', // --ink
  grid: '#E9E9E9',
  axis: '#6A6A6A',
  ink: '#222222',
  surface: '#FFFFFF',
};

// 勝利数の軸の上限をキリの良い数値にする（現行の JockeyLeadingChart と同じ刻み）
function roundAxis(maxWins: number): number {
  const v = maxWins * 1.15;
  const steps = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150];
  const hit = steps.find((x) => v <= x);
  return hit ?? Math.ceil(v / 50) * 50;
}

/**
 * 年度別の勝利数（縦棒）とリーディング順位（折れ線）のグラフ。
 * 描画内容は現行の JockeyLeadingChart と同じで、色・線幅をトンマナに合わせている。
 * 画面に20%入ったら1回だけ再生し、prefers-reduced-motion では完成状態を表示する。
 */
export default function JockeyLeadingCard({ data, summary }: { data: YearlyData[]; summary: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(1);
  const [width, setWidth] = useState(0);

  // 再生のタイミング
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;
    setProgress(0);
    let raf = 0;
    const play = () => {
      const start = performance.now();
      const duration = 1200;
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        setProgress(1 - Math.pow(1 - t, 3));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          play();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // 幅が変わったら描き直す
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const font = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
    const padding = { top: 36, right: 32, bottom: 48, left: 0 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;
    const maxWinsRounded = roundAxis(Math.max(0, ...data.map((d) => d.wins)));
    // 順位は1位〜50位で固定（50位を超える場合は50位の位置）
    const minRanking = 1;
    const maxRanking = 50;

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = COLOR.surface;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // グリッド線と右軸（勝利数）
    // 目盛りが整数になる本数を選ぶ
    const gridLines = [4, 5, 3].find((n) => maxWinsRounded % n === 0) ?? 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.strokeStyle = COLOR.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
      ctx.fillStyle = COLOR.axis;
      ctx.font = `12px ${font}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.round(maxWinsRounded * (1 - i / gridLines))), rect.width - 2, y);
    }

    const slot = chartWidth / data.length;

    // X軸：年度と勝利数（棒の数値ラベル）
    data.forEach((item, index) => {
      const x = padding.left + slot * index + slot / 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = COLOR.axis;
      ctx.font = `12px ${font}`;
      ctx.fillText(`${item.year}年`, x, rect.height - 26);
      ctx.fillStyle = COLOR.ink;
      ctx.font = `600 13px ${font}`;
      ctx.fillText(`${item.wins}勝`, x, rect.height - 8);
    });

    // 縦棒（勝利数）
    const barProgress = Math.min(progress * 1.5, 1);
    data.forEach((item, index) => {
      const h = (item.wins / maxWinsRounded) * chartHeight * barProgress;
      const w = Math.min(slot * 0.5, 56);
      const x = padding.left + slot * index + (slot - w) / 2;
      const y = padding.top + chartHeight - h;
      ctx.fillStyle = COLOR.bar;
      ctx.beginPath();
      const r = Math.min(4, h);
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
    });

    // 折れ線（リーディング順位）：データがある年のみ
    const points = data
      .map((item, index) => ({ ...item, index }))
      .filter((item) => item.ranking > 0)
      .map((item) => {
        const x = padding.left + slot * item.index + slot / 2;
        const ranking = Math.min(item.ranking, maxRanking);
        const y = padding.top + chartHeight * ((ranking - minRanking) / (maxRanking - minRanking));
        return { ...item, x, y };
      });

    if (points.length > 0) {
      const visible = Math.floor(points.length * progress);
      const partial = points.length * progress - visible;
      ctx.strokeStyle = COLOR.line;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= Math.min(visible, points.length - 1); i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      if (visible < points.length - 1 && partial > 0) {
        const a = points[visible];
        const b = points[visible + 1];
        ctx.lineTo(a.x + (b.x - a.x) * partial, a.y + (b.y - a.y) * partial);
      }
      ctx.stroke();

      for (let i = 0; i <= visible && i < points.length; i++) {
        const p = points[i];
        // マーカー（白抜きの丸）
        ctx.fillStyle = COLOR.surface;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLOR.line;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 順位のラベル（白地＋黒文字。50位を超える場合は「50位未満」）
        const label = p.ranking > 50 ? '50位未満' : `${p.ranking}位`;
        ctx.font = `700 12px ${font}`;
        ctx.textAlign = 'center';
        const tw = ctx.measureText(label).width;
        const bw = tw + 12;
        const bh = 20;
        const by = p.y - 30;
        ctx.fillStyle = COLOR.surface;
        ctx.strokeStyle = COLOR.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') ctx.roundRect(p.x - bw / 2, by, bw, bh, 4);
        else ctx.rect(p.x - bw / 2, by, bw, bh);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = COLOR.ink;
        ctx.textBaseline = 'middle';
        ctx.fillText(label, p.x, by + bh / 2 + 0.5);
        ctx.textBaseline = 'alphabetic';
      }
    }
  }, [data, progress, width]);

  return (
    <>
      <div className={j.legend}>
        <span>
          <i className={j.lgBar} aria-hidden="true" />
          勝利数
        </span>
        <span>
          <i className={j.lgLine} aria-hidden="true" />
          リーディング順位
        </span>
      </div>
      <div ref={wrapRef} className={j.chartWrap}>
        <canvas ref={canvasRef} className={j.chart} role="img" aria-label={summary} />
      </div>
    </>
  );
}
