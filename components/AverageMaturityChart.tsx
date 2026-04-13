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
  Filler,
  Title,
  type ChartConfiguration,
  type Plugin,
} from "chart.js";
import styles from "./AverageMaturityChart.module.css";

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler, Title);

const AVG_SCORES = [100, 106.3, 82.6, 65.3];
const LABELS = ["2〜3歳（基準）", "4歳", "5歳", "6歳以上"];
const LABELS_SP = ["2〜3歳", "4歳", "5歳", "6歳〜"];
const ANIM_DURATION = 1600;

interface Props {
  title?: string;
  scores?: number[];
  color?: string;
  label?: string;
  showAverage?: boolean;
  maxY?: number; // 未指定時はデータから自動計算
}

export default function AverageMaturityChart({
  title = "全種牡馬の平均値",
  scores = AVG_SCORES,
  color = "#52af77",
  label = "全体平均",
  showAverage = false,
  maxY,
}: Props) {
  // maxY未指定時は自動計算（データ最大値+20を20刻みに切り上げ）
  const effectiveMaxY = maxY ?? (() => {
    const allValues = [...scores, ...(showAverage ? AVG_SCORES : [])];
    const dataMax = Math.max(...allValues);
    return Math.ceil((dataMax + 10) / 20) * 20;
  })();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const isSP = window.innerWidth < 768;

    // チャート個別のプラグイン（グローバル登録しない）
    const revealPlugin: Plugin = {
      id: `reveal-${Math.random().toString(36).slice(2)}`,
      beforeDatasetsDraw(chart: Chart) {
        const { ctx, chartArea } = chart as any;
        if (!chartArea) return;
        const p = progressRef.current;
        const drawWidth = chartArea.left + (chartArea.right - chartArea.left) * p;
        ctx.save();
        ctx.beginPath();
        ctx.rect(chartArea.left - 30, chartArea.top - 30, drawWidth - chartArea.left + 60, chartArea.bottom - chartArea.top + 60);
        ctx.clip();
      },
      afterDatasetsDraw(chart: Chart) {
        const { ctx, scales } = chart as any;
        if (!chart.data.datasets.length) { ctx.restore(); return; }
        const p = progressRef.current;
        const fontSize = isSP ? 11 : 12;

        const dataset = chart.data.datasets[0];
        ctx.font = `bold ${fontSize}px 'Hiragino Kaku Gothic ProN', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "#334155";
        (dataset.data as number[]).forEach((value: number, i: number) => {
          const pointProgress = i / (LABELS.length - 1);
          if (pointProgress > p + 0.05) return;
          const x = scales.x.getPixelForValue(i);
          const y = scales.y.getPixelForValue(value);
          ctx.fillText(`${value}`, x, y - 12);
        });


        ctx.restore();
      },
    };

    const datasets: any[] = [
      {
        label,
        data: scores,
        borderColor: color,
        backgroundColor: `${color}14`,
        borderWidth: isSP ? 2.5 : 3,
        pointRadius: isSP ? 5 : 6,
        pointBackgroundColor: color,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ];

    if (showAverage) {
      datasets.push({
        label: "全体平均",
        data: AVG_SCORES,
        borderColor: "rgba(148,163,184,0.5)",
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderDash: [5, 4],
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      });
    }

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: isSP ? LABELS_SP : LABELS,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: isSP
            ? { left: 0, right: 4, top: 4 }
            : { left: 10, right: 20 },
        },
        animation: false,
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: {
            backgroundColor: "rgba(15,23,42,0.85)",
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            padding: 10,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}：${(ctx.parsed.y as number).toFixed(1)}`,
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: effectiveMaxY,
            title: {
              display: !isSP,
              text: "相対スコア（2〜3歳 = 100）",
              font: { size: 11 },
              color: "#64748b",
            },
            ticks: {
              callback: (v) => String(v),
              font: { size: isSP ? 10 : 11 },
              color: "#94a3b8",
              stepSize: 20,
            },
            grid: { color: "rgba(226,232,240,0.6)" },
            border: { display: false },
          },
          x: {
            title: {
              display: !isSP,
              text: "年齢",
              font: { size: 11 },
              color: "#64748b",
            },
            ticks: {
              font: { size: isSP ? 10 : 12 },
              color: "#475569",
            },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
      plugins: [revealPlugin],
    };

    chartRef.current = new Chart(canvasRef.current, config);
    progressRef.current = 0;
    chartRef.current.update("none");

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [title, scores, color, label, showAverage, effectiveMaxY]);

  useEffect(() => {
    if (!wrapperRef.current || hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && chartRef.current) {
          setHasAnimated(true);
          observer.disconnect();

          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const t = Math.min(elapsed / ANIM_DURATION, 1);
            progressRef.current = 1 - Math.pow(1 - t, 3);
            chartRef.current?.update("none");
            if (t < 1) {
              rafRef.current = requestAnimationFrame(animate);
            }
          };
          rafRef.current = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.header}>
        <p className={styles.chartTitle}>{title}</p>
        {showAverage && (
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDashed} />
              全体平均
            </span>
          </div>
        )}
      </div>
      <div className={styles.chartArea}>
        <div className={styles.canvasWrapper}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
