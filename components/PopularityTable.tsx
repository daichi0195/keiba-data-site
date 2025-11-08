'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './PopularityTable.module.css';

type PopularityBand =
  | 'fav1'       // 1番人気
  | 'fav2'       // 2番人気
  | 'fav3'       // 3番人気
  | 'fav4'       // 4番人気
  | 'fav5'       // 5番人気
  | 'fav6to9'    // 6-9番人気
  | 'fav10plus'; // 10番人気以下

type MetricKey =
  | 'races'          // 出走数
  | 'wins'           // 1着
  | 'places_2'       // 2着
  | 'places_3'       // 3着
  | 'win_rate'       // 勝率(%)
  | 'quinella_rate'  // 連対率(%)
  | 'place_rate'     // 複勝率(%)
  | 'win_payback'    // 単勝回収率(%)
  | 'place_payback'; // 複勝回収率(%)

export type PopularityStats = Record<PopularityBand, Record<MetricKey, number>>;

const BAND_ROWS: { key: PopularityBand; label: string }[] = [
  { key: 'fav1', label: '1人気' },
  { key: 'fav2', label: '2人気' },
  { key: 'fav3', label: '3人気' },
  { key: 'fav4', label: '4人気' },
  { key: 'fav5', label: '5人気' },
  { key: 'fav6to9', label: '6-9人気' },
  { key: 'fav10plus', label: '10人気-' },
];

const METRIC_COLS: { key: MetricKey; label: string; suffix?: string }[] = [
  { key: 'win_rate', label: '勝率', suffix: '%' },
  { key: 'quinella_rate', label: '連対率', suffix: '%' },
  { key: 'place_rate', label: '複勝率', suffix: '%' },
  { key: 'win_payback', label: '単勝回収率', suffix: '%' },
  { key: 'place_payback', label: '複勝回収率', suffix: '%' },
];

export default function PopularityTable({
  title,
  data,
}: {
  title: string;
  data: PopularityStats;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const el = e.target as HTMLDivElement;
      setIsScrolled((el.scrollLeft ?? 0) > 5);
    };
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // 列（指標）ごとの最大値を算出 → 各行のセルで一致したものをハイライト
  const maxByMetric: Partial<Record<MetricKey, number>> = {};
  for (const m of METRIC_COLS) {
    maxByMetric[m.key] = Math.max(
      ...BAND_ROWS.map((b) => data?.[b.key]?.[m.key] ?? Number.NEGATIVE_INFINITY)
    );
  }

  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>

      <div className={styles.tableContainer}>
        <div className={styles.tableScroll} ref={scrollRef} data-scrolled={isScrolled}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.styleCol}>人気</th>
                {METRIC_COLS.map((col) => (
                  <th key={col.key} className={styles.scrollCol}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BAND_ROWS.map((band, idx) => (
                <tr key={band.key} className={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td className={styles.styleCol}>
                    <span className={styles.styleBadge}>{band.label}</span>
                  </td>
                  {METRIC_COLS.map((col) => {
                    const v = data?.[band.key]?.[col.key];
                    const disp = v === undefined || v === null ? '-' : `${v}${col.suffix ?? ''}`;
                    const isMax = typeof v === 'number' && v === maxByMetric[col.key];
                    return (
                      <td key={col.key} className={styles.scrollCol}>
                        <span className={isMax ? styles.highlight : ''}>{disp}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
