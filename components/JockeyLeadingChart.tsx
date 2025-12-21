'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './JockeyLeadingChart.module.css';

interface YearlyData {
  year: number;
  wins: number;
  ranking: number;
}

interface JockeyLeadingChartProps {
  title: string;
  data: YearlyData[];
  children?: React.ReactNode;
}

export default function JockeyLeadingChart({ title, data, children }: JockeyLeadingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // アニメーション開始
    const startTime = Date.now();
    const duration = 2500; // 2.5秒（折れ線を遅く）

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // イージング関数（easeOutCubic）
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimationProgress(eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas のサイズを設定
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // グラフの設定
    const padding = { top: 35, right: 35, bottom: 30, left: 0 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    // データの最大値・最小値を取得
    const maxWins = Math.max(...data.map(d => d.wins));
    // 順位の範囲を1位〜50位に固定（50位を超える場合は50位として扱う）
    const minRanking = 1;
    const maxRanking = 50;

    // 勝利数の軸をキリの良い数値に調整
    const maxWinsRounded = Math.ceil(maxWins / 50) * 50;

    // クリア
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // グリッド線を描画（3〜4本程度）
    const gridLines = 4;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      // 右軸のラベル（勝利数）
      const winsValue = Math.round(maxWinsRounded * (1 - i / gridLines));
      ctx.fillStyle = '#999';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(winsValue.toString(), rect.width - 5, y);
    }

    // X軸のラベル（年度）
    const barWidth = chartWidth / data.length;
    data.forEach((item, index) => {
      const x = padding.left + barWidth * index + barWidth / 2;
      ctx.fillStyle = '#666';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.year.toString() + '年', x, rect.height - 20);
    });

    // 縦棒グラフ（勝利数）- 下から上にアニメーション（早め）
    const barProgress = Math.min(animationProgress * 1.5, 1);
    data.forEach((item, index) => {
      const barHeight = (item.wins / maxWinsRounded) * chartHeight;
      const animatedBarHeight = barHeight * barProgress;
      const x = padding.left + barWidth * index + barWidth * 0.2;
      const y = padding.top + chartHeight - animatedBarHeight;
      const width = barWidth * 0.6;

      // gate-barと同じ配色（#1db854）
      ctx.fillStyle = '#1db854';
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x, y, width, animatedBarHeight);
      ctx.globalAlpha = 1.0;
    });

    // 折れ線グラフ（リーディング順位）- 左から右にアニメーション
    // データがある年のみを対象にする（ranking > 0）
    const validData = data.map((item, index) => ({ ...item, originalIndex: index }))
                           .filter(item => item.ranking > 0);

    if (validData.length > 0) {
      const visiblePoints = Math.floor(validData.length * animationProgress);
      const partialProgress = (validData.length * animationProgress) - visiblePoints;

      if (visiblePoints > 0 || partialProgress > 0) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();

        let hasMovedTo = false;
        for (let i = 0; i <= Math.min(visiblePoints, validData.length - 1); i++) {
          const item = validData[i];
          const index = item.originalIndex;
          const x = padding.left + barWidth * index + barWidth / 2;
          // ranking が50を超える場合は50として扱う
          const cappedRanking = Math.min(item.ranking, maxRanking);
          // 上が1位、下が50位になるように正規化
          const normalizedRanking = (cappedRanking - minRanking) / (maxRanking - minRanking);
          const y = padding.top + chartHeight * normalizedRanking;

          if (!hasMovedTo) {
            ctx.moveTo(x, y);
            hasMovedTo = true;
          } else {
            ctx.lineTo(x, y);
          }
        }

        // 部分的に表示される線
        if (visiblePoints < validData.length - 1 && partialProgress > 0) {
          const currentItem = validData[visiblePoints];
          const nextItem = validData[visiblePoints + 1];

          const x1 = padding.left + barWidth * currentItem.originalIndex + barWidth / 2;
          const cappedRanking1 = Math.min(currentItem.ranking, maxRanking);
          const normalizedRanking1 = (cappedRanking1 - minRanking) / (maxRanking - minRanking);
          const y1 = padding.top + chartHeight * normalizedRanking1;

          const x2 = padding.left + barWidth * nextItem.originalIndex + barWidth / 2;
          const cappedRanking2 = Math.min(nextItem.ranking, maxRanking);
          const normalizedRanking2 = (cappedRanking2 - minRanking) / (maxRanking - minRanking);
          const y2 = padding.top + chartHeight * normalizedRanking2;

          const partialX = x1 + (x2 - x1) * partialProgress;
          const partialY = y1 + (y2 - y1) * partialProgress;

          ctx.lineTo(partialX, partialY);
        }

        ctx.stroke();
      }

      // 折れ線のポイント - データがある年のみ表示
      const displayPoints = Math.floor(validData.length * animationProgress);
      for (let i = 0; i <= displayPoints && i < validData.length; i++) {
        const item = validData[i];
        const index = item.originalIndex;
        const x = padding.left + barWidth * index + barWidth / 2;
        const cappedRanking = Math.min(item.ranking, maxRanking);
        const normalizedRanking = (cappedRanking - minRanking) / (maxRanking - minRanking);
        const y = padding.top + chartHeight * normalizedRanking;

        // 外側の円
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 順位のラベル - 背景付きで視認性向上
        // 50位を超える場合は「50位未満」と表示
        const labelText = item.ranking > 50 ? '50位未満' : item.ranking.toString() + '位';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        const textMetrics = ctx.measureText(labelText);
        const textWidth = textMetrics.width;
        const paddingX = 6;
        const paddingY = 4;
        const boxHeight = 20;
        const boxY = y - 28;

        // 背景の四角
        ctx.fillStyle = '#fff';
        ctx.fillRect(
          x - textWidth / 2 - paddingX,
          boxY,
          textWidth + paddingX * 2,
          boxHeight
        );

        // 枠線
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x - textWidth / 2 - paddingX,
          boxY,
          textWidth + paddingX * 2,
          boxHeight
        );

        // テキスト（ボックスの中央に配置）
        ctx.fillStyle = '#f59e0b';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, x, boxY + boxHeight / 2);
        ctx.textBaseline = 'alphabetic';
      }
    }

  }, [data, animationProgress]);

  return (
    <div className={styles.container}>
      <h2 className="section-title">{title}</h2>

      {/* 凡例 */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendBar}></div>
          <span>勝利数</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendLine}></div>
          <span>リーディング順位</span>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
        />
      </div>

      {children}
    </div>
  );
}
