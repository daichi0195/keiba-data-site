'use client';

import { useEffect, useRef, useState } from 'react';
import t from './trainer.module.css';

interface YearlyData {
  year: number;
  wins: number;
  ranking: number;
}

// トンマナの色（docs/redesign/tonmana.md 7. グラフ）
const COLOR_BAR = '#1DB854'; // --data-4
const COLOR_LINE = '#222222'; // 折れ線は棒と色・形を変える
const COLOR_GRID = '#E9E9E9';
const COLOR_AXIS = '#6A6A6A';
const COLOR_INK = '#222222';
const FONT = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", system-ui, sans-serif';

/**
 * 年度別の勝利数（縦棒）とリーディング順位（折れ線）のグラフ。
 * components/JockeyLeadingChart と同じ描画内容で、色と動き（画面に入ったら1回だけ）を新デザインに合わせたもの。
 */
export default function TrainerLeadingChart({ data, label }: { data: YearlyData[]; label: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(1);
  const [width, setWidth] = useState(0);

  // 幅が変わったら描き直す（初回の描画時にまだ幅が決まっていない場合にも対応）
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    if (typeof ResizeObserver === 'undefined') {
      addEventListener('resize', update);
      return () => removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 画面に20%入ったときに1回だけ再生（reduced-motion では完成状態のまま）
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
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
        const step = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          setProgress(1 - Math.pow(1 - p, 3));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
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

    const padding = { top: 36, right: 32, bottom: 48, left: 0 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    // 順位の範囲は1位〜50位に固定（50位を超える場合は50位として描く）
    const minRanking = 1;
    const maxRanking = 50;

    // 勝利数の軸をキリの良い数値に調整（JockeyLeadingChart と同じ刻み）
    const maxWins = Math.max(...data.map((d) => d.wins), 0);
    const m = maxWins * 1.15;
    const steps = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150];
    const maxWinsRounded = steps.find((v) => m <= v) ?? Math.ceil(m / 50) * 50;

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // グリッド線と右軸（勝利数）
    const gridLines = 4;
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
      ctx.fillStyle = COLOR_AXIS;
      ctx.font = `12px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(Math.round(maxWinsRounded * (1 - i / gridLines))), rect.width - 4, y);
    }

    const slot = chartWidth / data.length;

    // X軸：年度と勝利数（棒の数値ラベル）
    data.forEach((item, index) => {
      const x = padding.left + slot * index + slot / 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = COLOR_AXIS;
      ctx.font = `12px ${FONT}`;
      ctx.fillText(`${item.year}年`, x, rect.height - 26);
      ctx.fillStyle = COLOR_INK;
      ctx.font = `600 13px ${FONT}`;
      ctx.fillText(`${item.wins}勝`, x, rect.height - 8);
    });

    // 縦棒（勝利数）
    const barProgress = Math.min(progress * 1.5, 1);
    data.forEach((item, index) => {
      const h = (item.wins / maxWinsRounded) * chartHeight * barProgress;
      const w = Math.min(slot * 0.5, 56);
      const x = padding.left + slot * index + (slot - w) / 2;
      const y = padding.top + chartHeight - h;
      ctx.fillStyle = COLOR_BAR;
      ctx.beginPath();
      const r = Math.min(6, h / 2, w / 2);
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
    });

    // 折れ線（リーディング順位）。データがある年（ranking > 0）だけ
    const points = data
      .map((item, index) => ({ ...item, index }))
      .filter((item) => item.ranking > 0)
      .map((item) => {
        const capped = Math.min(item.ranking, maxRanking);
        return {
          ...item,
          x: padding.left + slot * item.index + slot / 2,
          y: padding.top + chartHeight * ((capped - minRanking) / (maxRanking - minRanking)),
        };
      });
    if (points.length === 0) return;

    const total = points.length * progress;
    const visible = Math.floor(total);
    const partial = total - visible;

    ctx.strokeStyle = COLOR_LINE;
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

    // 点と順位ラベル
    for (let i = 0; i <= visible && i < points.length; i++) {
      const p = points[i];
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLOR_LINE;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const text = p.ranking > 50 ? '50位未満' : `${p.ranking}位`;
      ctx.font = `700 12px ${FONT}`;
      ctx.textAlign = 'center';
      const tw = ctx.measureText(text).width;
      const bw = tw + 12;
      const bh = 20;
      const bx = p.x - bw / 2;
      const by = p.y - 30;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = COLOR_LINE;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      ctx.fillStyle = COLOR_INK;
      ctx.textBaseline = 'middle';
      ctx.fillText(text, p.x, by + bh / 2);
      ctx.textBaseline = 'alphabetic';
    }
  }, [data, progress, width]);

  return (
    <div ref={wrapRef}>
      <div className={t.legend}>
        <span>
          <i className={t.legendBar} />
          勝利数
        </span>
        <span>
          <i className={t.legendLine} />
          リーディング順位
        </span>
      </div>
      <div className={t.chartWrap}>
        <canvas ref={canvasRef} className={t.chart} role="img" aria-label={label} />
      </div>
    </div>
  );
}
