'use client';

import { useEffect, useRef } from 'react';
import {
  Chart,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartConfiguration,
} from 'chart.js';

Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend);

type SeasonData = {
  label: string;
  male: number;
  female?: number;
};

type Props = {
  title?: string;
  data: SeasonData[];
  yMax?: number;
  unit?: string;
  label1?: string;
  label2?: string;
  color1?: string;
  color2?: string;
  highlightLabel?: string;
};

const MALE_BG     = 'rgba(59, 130, 246, 0.75)';
const MALE_BORDER = 'rgba(37, 99, 235, 1)';
const FEM_BG      = 'rgba(236, 72, 153, 0.75)';
const FEM_BORDER  = 'rgba(219, 39, 119, 1)';

const HIGHLIGHT_BG     = 'rgba(251, 146, 60, 0.85)';
const HIGHLIGHT_BORDER = 'rgba(251, 146, 60, 0.85)';
const GRAY_BG          = 'rgba(156, 163, 175, 0.75)';
const GRAY_BORDER      = 'rgba(156, 163, 175, 0.75)';

export default function SeasonDualChart({
  title, data, yMax = 30, unit = '%',
  label1 = '牡馬', label2 = '牝馬',
  color1, color2, highlightLabel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const dataLabelPlugin = {
      id: 'customDataLabels',
      afterDatasetsDraw(chart: Chart) {
        const { ctx } = chart;
        chart.data.datasets.forEach((dataset, i) => {
          const meta = chart.getDatasetMeta(i);
          if (meta.hidden) return;
          meta.data.forEach((bar, j) => {
            const value = dataset.data[j] as number;
            ctx.save();
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`${value.toFixed(1)}${unit}`, bar.x, bar.y - 3);
            ctx.restore();
          });
        });
      },
    };

    const isSingle = data.every((d) => d.female == null);

    const perBarBg = highlightLabel
      ? data.map((d) => d.label === highlightLabel ? HIGHLIGHT_BG : GRAY_BG)
      : null;
    const perBarBorder = highlightLabel
      ? data.map((d) => d.label === highlightLabel ? HIGHLIGHT_BORDER : GRAY_BORDER)
      : null;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: label1,
            data: data.map((d) => d.male),
            backgroundColor: (perBarBg ?? color1 ?? MALE_BG) as string,
            borderColor: (perBarBorder ?? color1 ?? MALE_BORDER) as string,
            borderWidth: 1.5,
          },
          ...(!isSingle ? [{
            label: label2,
            data: data.map((d) => d.female as number),
            backgroundColor: color2 ?? FEM_BG,
            borderColor: color2 ?? FEM_BORDER,
            borderWidth: 1.5,
          }] : []),
        ],
      },
      plugins: [dataLabelPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 600, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 12 }, padding: 16 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(1)}${unit}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 13 } },
          },
          y: {
            min: 0,
            max: yMax,
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { callback: (v) => `${v}${unit}` },
          },
        },
      },
    };

    chartRef.current = new Chart(canvasRef.current, config);
    return () => chartRef.current?.destroy();
  }, [data, yMax, unit, label1, label2, color1, color2, highlightLabel]);

  return (
    <div style={{ margin: '1.5rem 0' }}>
      {title && (
        <div style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '0.75rem', color: '#2d3748' }}>
          {title}
        </div>
      )}
      <canvas ref={canvasRef} />
    </div>
  );
}
