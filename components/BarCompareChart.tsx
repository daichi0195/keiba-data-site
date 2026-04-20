'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './BarCompareChart.module.css';

type Item = {
  label: string;
  value: number;
  count?: number;
  color?: string;
  highlight?: boolean;
};

type Props = {
  title?: string;
  items: Item[];
  unit?: string;
  max?: number;
  baseline?: { value: number; label?: string };
  decimals?: number;
};

const DEFAULT_COLOR = '#52af77';
const HIGHLIGHT_COLOR = '#f97316';

export default function BarCompareChart({
  title,
  items,
  unit = '',
  max,
  baseline,
  decimals = 1,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  const dataMax = Math.max(...items.map((i) => i.value), baseline?.value ?? 0);
  const effectiveMax = max ?? Math.ceil((dataMax * 1.1) / 10) * 10;

  useEffect(() => {
    if (!wrapperRef.current || animated) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [animated]);

  const baselinePct = baseline ? (baseline.value / effectiveMax) * 100 : null;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {title && <div className={styles.title}>{title}</div>}
      {baseline && (
        <div className={styles.baselineNote}>
          <span className={styles.baselineMarker} />
          {baseline.label ?? '全体平均'}（{baseline.value.toFixed(decimals)}{unit}）
        </div>
      )}
      <div className={styles.chart}>
        {items.map((item, idx) => {
          const widthPct = (item.value / effectiveMax) * 100;
          const color = item.color ?? (item.highlight ? HIGHLIGHT_COLOR : DEFAULT_COLOR);
          return (
            <div className={styles.row} key={`${item.label}-${idx}`}>
              <div className={styles.label}>
                <span className={styles.labelMain}>{item.label}</span>
                {item.count != null && (
                  <span className={styles.labelCount}>n={item.count.toLocaleString()}</span>
                )}
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.bar}
                  style={{
                    width: animated ? `${widthPct}%` : '0%',
                    backgroundColor: color,
                  }}
                />
                <span
                  className={styles.value}
                  style={{
                    left: animated ? `${widthPct}%` : '0%',
                    color,
                    transform: 'translate(8px, -50%)',
                  }}
                >
                  {item.value.toFixed(decimals)}
                  {unit}
                </span>
              </div>
            </div>
          );
        })}
        {baselinePct != null && (
          <div className={styles.baselineOverlay}>
            <div
              className={styles.baselineLine}
              style={{ left: `${baselinePct}%` }}
            />
          </div>
        )}
      </div>
      <div className={styles.scale}>
        <span>0{unit}</span>
        <span>
          {effectiveMax}
          {unit}
        </span>
      </div>
    </div>
  );
}
