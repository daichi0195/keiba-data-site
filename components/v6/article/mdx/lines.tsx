'use client';

// 記事の MDX で使う折れ線グラフ（現行 AverageMaturityChart・MaturityChart と同じ props・同じ数値）。
// 描画は現行と同じ chart.js。枠・題・凡例・絞り込みのチップは見本の棒グラフと同じ作りにした。
import { useEffect, useRef, useState } from 'react';
import {
  Chart,
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
  type ChartConfiguration,
  type ChartDataset,
  type Plugin,
} from 'chart.js';
import { cx } from '../cx';

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler);

const AVG_SCORES = [100, 105.5, 81.8, 64.3];
const LABELS = ['2〜3歳（基準）', '4歳', '5歳', '6歳以上'];
const LABELS_SP = ['2〜3歳', '4歳', '5歳', '6歳〜'];
const ANIM_DURATION = 1600;
const INK_SUB = '#5E5E5E';
const RULE = '#E3E6EA';
const AVG_LINE = '#858C96';
const FONT = '"Roboto","Helvetica Neue",Arial,"Hiragino Sans",sans-serif';
const TOOLTIP = {
  backgroundColor: 'rgba(38,41,45,.92)',
  titleFont: { size: 12 },
  bodyFont: { size: 12 },
  padding: 10,
};

const narrowScreen = () => window.innerWidth < 700;

/* ---------- 1頭（または全体平均）の推移 ---------- */
export function AverageMaturityChart({
  title = '全種牡馬の平均値',
  scores = AVG_SCORES,
  color = '#1AA84E',
  label = '全体平均',
  showAverage = false,
  maxY,
  alt,
}: {
  title?: string;
  scores?: number[];
  color?: string;
  label?: string;
  showAverage?: boolean;
  maxY?: number;
  alt?: string;
}) {
  // maxY 未指定時は自動計算（データ最大値+10 を20刻みに切り上げ）＝現行と同じ
  const top = maxY ?? Math.ceil((Math.max(...scores, ...(showAverage ? AVG_SCORES : [])) + 10) / 20) * 20;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const wrapRef = useRef<HTMLElement>(null);
  const progress = useRef(1);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const sp = narrowScreen();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window);
    progress.current = reduce ? 1 : 0;

    // 左から右へ線が伸びる（画面に入ったら1回だけ）
    const reveal: Plugin = {
      id: 'reveal',
      beforeDatasetsDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        const w = (chartArea.right - chartArea.left) * progress.current;
        ctx.save();
        ctx.beginPath();
        ctx.rect(chartArea.left - 30, chartArea.top - 30, w + 60, chartArea.bottom - chartArea.top + 60);
        ctx.clip();
      },
      afterDatasetsDraw(chart) {
        const { ctx, scales } = chart;
        const p = progress.current;
        ctx.font = `700 ${sp ? 11 : 12}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#222222';
        (chart.data.datasets[0].data as number[]).forEach((v, i) => {
          if (i / (LABELS.length - 1) > p + 0.05) return;
          ctx.fillText(String(v), scales.x.getPixelForValue(i), scales.y.getPixelForValue(v) - 12);
        });
        ctx.restore();
      },
    };

    const datasets: ChartDataset<'line'>[] = [
      {
        label,
        data: scores,
        borderColor: color,
        backgroundColor: `${color}14`,
        borderWidth: sp ? 2.5 : 3,
        pointRadius: sp ? 5 : 6,
        pointBackgroundColor: color,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ];
    if (showAverage) {
      datasets.push({ label: '全体平均', data: AVG_SCORES, borderColor: AVG_LINE, backgroundColor: 'transparent', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, tension: 0.3, fill: false });
    }

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: { labels: sp ? LABELS_SP : LABELS, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: sp ? { left: 0, right: 6, top: 6 } : { left: 4, right: 16, top: 6 } },
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { ...TOOLTIP, callbacks: { label: (c) => ` ${c.dataset.label}：${(c.parsed.y as number).toFixed(1)}` } },
        },
        scales: {
          y: {
            min: 0,
            max: top,
            title: { display: !sp, text: '相対スコア（2〜3歳 = 100）', font: { size: 11 }, color: INK_SUB },
            ticks: { callback: (v) => String(v), font: { size: sp ? 10 : 11, family: FONT }, color: INK_SUB, stepSize: 20 },
            grid: { color: RULE },
            border: { display: false },
          },
          x: {
            title: { display: !sp, text: '年齢', font: { size: 11 }, color: INK_SUB },
            ticks: { font: { size: sp ? 11 : 12, weight: 700 }, color: '#222222' },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
      plugins: [reveal],
    };
    const chart = new Chart(canvasRef.current, config);
    chartRef.current = chart;

    let io: IntersectionObserver | null = null;
    if (!reduce && wrapRef.current) {
      io = new IntersectionObserver(
        (es) => {
          if (!es[0].isIntersecting) return;
          io?.disconnect();
          const start = performance.now();
          const step = (now: number) => {
            const t = Math.min((now - start) / ANIM_DURATION, 1);
            progress.current = 1 - Math.pow(1 - t, 3);
            chart.update('none');
            if (t < 1) raf.current = requestAnimationFrame(step);
          };
          raf.current = requestAnimationFrame(step);
        },
        { threshold: 0.3 }
      );
      io.observe(wrapRef.current);
    }
    return () => {
      io?.disconnect();
      if (raf.current) cancelAnimationFrame(raf.current);
      chart.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, color, label, showAverage, top]);

  return (
    <figure className={cx('lc')} ref={wrapRef}>
      <figcaption>
        <b>{title}</b>
        <span className={cx('lc-lg')}>
          <span>
            <i style={{ color }} />
            {label}
          </span>
          {showAverage && (
            <span>
              <i className={cx('dash')} />
              全体平均
            </span>
          )}
        </span>
      </figcaption>
      <div className={cx('lc-cv')} role={alt ? 'img' : undefined} aria-label={alt}>
        <canvas ref={canvasRef} />
      </div>
    </figure>
  );
}

/* ---------- 種牡馬ごとの成長曲線（型で絞り込み・種牡馬ごとに表示を切り替え） ---------- */
type Tier = 'top' | 'mid' | 'bottom';
export interface SireData {
  sire: string;
  base: number;
  scores: [100, number, number, number];
  tier: Tier;
}

// 型の色：晩成＝青、標準＝灰、早熟＝橙（記事の早見表の色と同じ系統。灰は白い文字が読める濃さにした）
const TIER_COLORS: Record<Tier, string> = { top: '#3B82F6', mid: '#858C96', bottom: '#F97316' };
const TIER_LABEL: Record<Tier, string> = { top: '晩成型', mid: '標準型', bottom: '早熟型' };
const TIER_ORDER: Tier[] = ['top', 'mid', 'bottom'];
const ALPHA_STEPS = [1, 0.85, 0.7, 0.55, 0.45, 0.38, 0.32, 0.28, 0.24, 0.22, 0.2, 0.18, 0.16, 0.15, 0.14];

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');

export function MaturityChart({ data, featured = [] }: { data: SireData[]; featured?: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  // featured（本文で個別に取り上げた種牡馬）は除く＝現行と同じ
  const featuredSet = new Set(featured);
  const list = featured.length > 0 ? data.filter((d) => !featuredSet.has(d.sire)) : data;

  const [tier, setTier] = useState<Tier | 'all'>('all');
  const [active, setActive] = useState<Set<string>>(() => new Set(list.map((d) => d.sire)));

  const tierIndex = new Map<string, number>();
  const tierCount: Record<Tier, number> = { top: 0, mid: 0, bottom: 0 };
  list.forEach((d) => {
    tierIndex.set(d.sire, tierCount[d.tier]);
    tierCount[d.tier]++;
  });
  const lineColor = (d: SireData) => `rgba(${rgb(TIER_COLORS[d.tier])},${ALPHA_STEPS[(tierIndex.get(d.sire) ?? 0) % ALPHA_STEPS.length]})`;

  const datasets = (): ChartDataset<'line'>[] => {
    const few = active.size <= 6;
    const ds: ChartDataset<'line'>[] = list
      .filter((d) => active.has(d.sire))
      .map((d) => ({ label: d.sire, data: d.scores, borderColor: lineColor(d), backgroundColor: 'transparent', borderWidth: few ? 2.5 : 1.8, pointRadius: few ? 5 : 3, pointBackgroundColor: lineColor(d), tension: 0.3 }));
    ds.push({ label: '全体平均', data: AVG_SCORES, borderColor: AVG_LINE, backgroundColor: 'transparent', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, tension: 0.3 });
    return ds;
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const sp = narrowScreen();
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: { labels: sp ? LABELS_SP : LABELS, datasets: datasets() },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: { ...TOOLTIP, callbacks: { label: (c) => ` ${c.dataset.label}：${(c.parsed.y as number).toFixed(1)}` } },
        },
        scales: {
          y: { min: 0, max: 200, ticks: { callback: (v) => String(v), font: { size: sp ? 10 : 11, family: FONT }, color: INK_SUB }, grid: { color: RULE }, border: { display: false } },
          x: { ticks: { font: { size: sp ? 11 : 12, weight: 700 }, color: '#222222' }, grid: { display: false }, border: { display: false } },
        },
      },
    };
    chartRef.current = new Chart(canvasRef.current, config);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.data.datasets = datasets();
    chartRef.current.update('none');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const pickTier = (t: Tier | 'all') => {
    setTier(t);
    setActive(new Set((t === 'all' ? list : list.filter((d) => d.tier === t)).map((d) => d.sire)));
  };
  const toggle = (sire: string) => {
    setTier('all');
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(sire)) next.delete(sire);
      else next.add(sire);
      return next;
    });
  };

  return (
    <figure className={cx('lc', 'wide')}>
      <figcaption>
        <span className={cx('lc-lg')}>
          {TIER_ORDER.map((t) => (
            <span key={t}>
              <i style={{ color: TIER_COLORS[t] }} />
              {TIER_LABEL[t]}
            </span>
          ))}
          <span>
            <i className={cx('dash')} />
            全体平均
          </span>
        </span>
      </figcaption>
      <div className={cx('lc-f')} role="group" aria-label="型で絞り込む">
        <button type="button" aria-pressed={tier === 'all'} onClick={() => pickTier('all')}>
          全種牡馬
        </button>
        {TIER_ORDER.map((t) => (
          <button key={t} type="button" aria-pressed={tier === t} onClick={() => pickTier(t)}>
            {TIER_LABEL[t]}
          </button>
        ))}
      </div>
      <div className={cx('lc-s')} role="group" aria-label="表示する種牡馬">
        {list.map((d) => (
          <button
            key={`${d.sire}-${d.tier}`}
            type="button"
            aria-pressed={active.has(d.sire)}
            onClick={() => toggle(d.sire)}
            style={{ '--c': TIER_COLORS[d.tier] } as React.CSSProperties}
          >
            {d.sire}
          </button>
        ))}
      </div>
      <div className={cx('lc-cv')}>
        <canvas ref={canvasRef} />
      </div>
    </figure>
  );
}
