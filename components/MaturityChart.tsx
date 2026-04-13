"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart,
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Tooltip,
  type ChartConfiguration,
} from "chart.js";
import styles from "./MaturityChart.module.css";

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip);

// ----------------------------------------------------------------
// 型定義
// ----------------------------------------------------------------
type Tier = "top" | "mid" | "bottom";

export interface SireData {
  sire: string;
  base: number;
  scores: [100, number, number, number];
  tier: Tier;
}

interface MaturityChartProps {
  data: SireData[];
  featured?: string[];
}

// ----------------------------------------------------------------
// 定数
// ----------------------------------------------------------------
const TIER_COLORS: Record<Tier, string> = {
  top:    "#3B82F6",
  mid:    "#94a3b8",
  bottom: "#f97316",
};

const TIER_LABEL: Record<Tier, string> = {
  top:    "晩成型",
  mid:    "標準型",
  bottom: "早熟型",
};

const TIER_ORDER: Tier[] = ["top", "mid", "bottom"];

const AVG_SCORES = [100, 106.3, 82.6, 65.3];

const ALPHA_STEPS = [1, 0.85, 0.7, 0.55, 0.45, 0.38, 0.32, 0.28, 0.24, 0.22, 0.2, 0.18, 0.16, 0.15, 0.14];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}


// ----------------------------------------------------------------
// コンポーネント本体
// ----------------------------------------------------------------
export default function MaturityChart({ data, featured = [] }: MaturityChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  // featuredで指定された種牡馬を除外
  const featuredSet = new Set(featured);
  const filteredData = featured.length > 0 ? data.filter((d) => !featuredSet.has(d.sire)) : data;

  const [activeTier, setActiveTier] = useState<Tier | "all">("all");
  const [activeSet, setActiveSet] = useState<Set<string>>(new Set(filteredData.map((d) => d.sire)));

  const tierIndex = new Map<string, number>();
  const tierCount: Record<Tier, number> = { top: 0, mid: 0, bottom: 0 };
  filteredData.forEach((d) => {
    tierIndex.set(d.sire, tierCount[d.tier]);
    tierCount[d.tier]++;
  });

  function getSireColor(d: SireData): string {
    const base = hexToRgb(TIER_COLORS[d.tier]);
    const idx = tierIndex.get(d.sire) ?? 0;
    const alpha = ALPHA_STEPS[idx % ALPHA_STEPS.length];
    return `rgba(${base.r},${base.g},${base.b},${alpha})`;
  }

  function buildDatasets() {
    const sireDatasets = filteredData
      .filter((d) => activeSet.has(d.sire))
      .map((d) => {
        const color = getSireColor(d);
        return {
          label: d.sire,
          data: d.scores,
          borderColor: color,
          backgroundColor: "transparent",
          borderWidth: activeSet.size <= 6 ? 2.5 : 1.8,
          pointRadius: activeSet.size <= 6 ? 5 : 3,
          pointBackgroundColor: color,
          tension: 0.3,
        };
      });

    // 全体平均の点線
    sireDatasets.push({
      label: "全体平均",
      data: AVG_SCORES,
      borderColor: "rgba(148,163,184,0.5)",
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderDash: [5, 4],
      pointRadius: 0,
      tension: 0.3,
    } as any);

    return sireDatasets;
  }

  useEffect(() => {
    if (!canvasRef.current) return;

    const isSP = window.innerWidth < 768;

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: isSP ? ["2〜3歳", "4歳", "5歳", "6歳〜"] : ["2〜3歳（基準）", "4歳", "5歳", "6歳以上"],
        datasets: buildDatasets(),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15,23,42,0.85)",
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            padding: 10,
            callbacks: {
              label: (ctx) =>
                ` ${ctx.dataset.label}：${(ctx.parsed.y as number).toFixed(1)}`,
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 200,
            ticks: {
              callback: (v) => String(v),
              font: { size: isSP ? 10 : 11 },
              color: "#94a3b8",
            },
            grid: { color: "rgba(226,232,240,0.6)" },
            border: { display: false },
          },
          x: {
            ticks: { font: { size: isSP ? 10 : 12 }, color: "#475569" },
            grid: { display: false },
            border: { display: false },
          },
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
    chartRef.current.data.datasets = buildDatasets();
    chartRef.current.update("none");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSet]);

  function handleTier(tier: Tier | "all") {
    setActiveTier(tier);
    if (tier === "all") {
      setActiveSet(new Set(filteredData.map((d) => d.sire)));
    } else {
      setActiveSet(new Set(filteredData.filter((d) => d.tier === tier).map((d) => d.sire)));
    }
  }

  function toggleSire(sire: string) {
    setActiveTier("all");
    setActiveSet((prev) => {
      const next = new Set(prev);
      next.has(sire) ? next.delete(sire) : next.add(sire);
      return next;
    });
  }

  return (
    <div className={styles.wrapper}>

      {/* ---- ティアフィルター（PC: ボタン） ---- */}
      <div className={styles.header}>
        <div className={styles.tierFilters}>
          <button
            onClick={() => handleTier("all")}
            className={`${styles.tierBtn} ${activeTier === "all" ? styles.tierBtnActive : ""}`}
          >
            全種牡馬
          </button>
          {TIER_ORDER.map((tier) => (
            <button
              key={tier}
              onClick={() => handleTier(tier)}
              className={`${styles.tierBtn} ${activeTier === tier ? styles.tierBtnActive : ""}`}
              style={
                activeTier === tier
                  ? { borderColor: TIER_COLORS[tier], color: TIER_COLORS[tier], backgroundColor: `${TIER_COLORS[tier]}15` }
                  : undefined
              }
            >
              {TIER_LABEL[tier]}
            </button>
          ))}
        </div>
      </div>

      {/* ---- ティアフィルター（SP: プルダウン） ---- */}
      <div className={styles.filterSelect}>
        <select
          value={activeTier}
          onChange={(e) => handleTier(e.target.value as Tier | "all")}
          className={styles.select}
        >
          <option value="all">すべての種牡馬</option>
          {TIER_ORDER.map((tier) => (
            <option key={tier} value={tier}>{TIER_LABEL[tier]}</option>
          ))}
        </select>
      </div>

      {/* ---- 凡例 ---- */}
      <div className={styles.legend}>
        {TIER_ORDER.map((tier) => (
          <span key={tier} className={styles.legendItem}>
            <span className={styles.legendLine} style={{ backgroundColor: TIER_COLORS[tier] }} />
            {TIER_LABEL[tier]}
          </span>
        ))}
        <span className={styles.legendItem}>
          <span className={styles.legendDashed} />
          全体平均
        </span>
      </div>

      {/* ---- 種牡馬ボタン群 ---- */}
      <div className={styles.sireButtons}>
        {filteredData.map((d) => {
          const on = activeSet.has(d.sire);
          const color = TIER_COLORS[d.tier];
          return (
            <button
              key={`${d.sire}-${d.tier}`}
              onClick={() => toggleSire(d.sire)}
              className={styles.sireBtn}
              style={
                on
                  ? { borderColor: color, color: color, backgroundColor: `${color}15` }
                  : undefined
              }
            >
              {d.sire}
            </button>
          );
        })}
      </div>

      {/* ---- グラフ ---- */}
      <div className={styles.chartArea}>
        <div className={styles.canvasWrapper}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
