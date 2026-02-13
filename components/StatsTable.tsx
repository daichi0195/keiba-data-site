'use client';

import { useRef } from 'react';
import styles from './StatsTable.module.css';

interface StatsData {
  races: number;
  wins: number;
  places_2: number;
  places_3: number;
  win_rate: number;
  quinella_rate: number;
  place_rate: number;
  win_payback: number;
  place_payback: number;
  avg_popularity?: number;
  avg_rank?: number;
  median_popularity?: number;
  median_rank?: number;
}

interface StatsTableProps {
  data: StatsData;
}

export default function StatsTable({ data }: StatsTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!data) {
    return <div style={{ color: 'red', padding: '1rem' }}>Error: StatsTable data is undefined</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableScroll} ref={scrollRef}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>出走数</th>
              <th>1着</th>
              <th>2着</th>
              <th>3着</th>
              <th>勝率</th>
              <th>連対率</th>
              <th>複勝率</th>
              <th>単勝回収率</th>
              <th>複勝回収率</th>
              <th>平均人気</th>
              <th>平均着順</th>
              <th>人気中央値</th>
              <th>着順中央値</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{data.races.toLocaleString()}</td>
              <td>{data.wins}</td>
              <td>{data.places_2}</td>
              <td>{data.places_3}</td>
              <td>{data.win_rate}%</td>
              <td>{data.quinella_rate}%</td>
              <td>{data.place_rate}%</td>
              <td>{data.win_payback}%</td>
              <td>{data.place_payback}%</td>
              <td>{data.avg_popularity != null ? data.avg_popularity.toFixed(1) : '-'}</td>
              <td>{data.avg_rank != null ? data.avg_rank.toFixed(1) : '-'}</td>
              <td>{data.median_popularity != null ? data.median_popularity.toFixed(1) : '-'}</td>
              <td>{data.median_rank != null ? data.median_rank.toFixed(1) : '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
