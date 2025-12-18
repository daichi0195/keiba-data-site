'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './RunningStyleTable.module.css';

type RunningStyleRow = {
  style: string;
  style_label: string;
  races: number;
  wins: number;
  places_2: number;
  places_3: number;
  win_rate: number;
  place_rate: number;
  quinella_rate: number;
  win_payback: number;
  place_payback: number;
};

type Props = {
  title: string;
  data: RunningStyleRow[];
};

export default function RunningStyleTable({ title, data }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      const scrollLeft = target.scrollLeft;
      setIsScrolled(scrollLeft > 5);
    };
    
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  // 各カラムの最大値を取得
  const maxRaces = Math.max(...data.map(d => d.races ?? 0));
  const maxWins = Math.max(...data.map(d => d.wins ?? 0));
  const maxPlaces2 = Math.max(...data.map(d => d.places_2 ?? 0));
  const maxPlaces3 = Math.max(...data.map(d => d.places_3 ?? 0));
  const maxWinRate = Math.max(...data.map(d => d.win_rate ?? 0));
  const maxPlaceRate = Math.max(...data.map(d => d.place_rate ?? 0));
  const maxQuinellaRate = Math.max(...data.map(d => d.quinella_rate ?? 0));
  const maxWinPayback = Math.max(...data.map(d => d.win_payback ?? 0));
  const maxPlacePayback = Math.max(...data.map(d => d.place_payback ?? 0));
  
  const isHighlight = (value: number, maxValue: number) => value === maxValue;

  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>
      
      <div className={styles.tableContainer}>
        <div className={styles.tableScroll} ref={scrollRef}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.styleCol}>
                  脚質
                </th>
                <th className={styles.scrollCol}>出走数</th>
                <th className={styles.scrollCol}>1着</th>
                <th className={styles.scrollCol}>2着</th>
                <th className={styles.scrollCol}>3着</th>
                <th className={styles.scrollCol}>勝率</th>
                <th className={styles.scrollCol}>連対率</th>
                <th className={styles.scrollCol}>複勝率</th>
                <th className={styles.scrollCol}>単勝回収率</th>
                <th className={styles.scrollCol}>複勝回収率</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={row.style}
                  className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
                >
                  <td className={styles.styleCol}>
                    <span className={styles.styleBadge}>
                      {row.style_label}
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span className={isHighlight(row.races ?? 0, maxRaces) ? styles.highlight : ''}>
                      {row.races}
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span className={isHighlight(row.wins ?? 0, maxWins) ? styles.highlight : ''}>
                      {row.wins}
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span className={isHighlight(row.places_2 ?? 0, maxPlaces2) ? styles.highlight : ''}>
                      {row.places_2}
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span className={isHighlight(row.places_3 ?? 0, maxPlaces3) ? styles.highlight : ''}>
                      {row.places_3}
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span className={isHighlight(row.win_rate ?? 0, maxWinRate) ? styles.highlight : ''}>
                      {(row.win_rate ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span className={isHighlight(row.quinella_rate ?? 0, maxQuinellaRate) ? styles.highlight : ''}>
                      {(row.quinella_rate ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span className={isHighlight(row.place_rate ?? 0, maxPlaceRate) ? styles.highlight : ''}>
                      {(row.place_rate ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span className={isHighlight(row.win_payback ?? 0, maxWinPayback) ? styles.highlight : ''}>
                      {(row.win_payback ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span className={isHighlight(row.place_payback ?? 0, maxPlacePayback) ? styles.highlight : ''}>
                      {(row.place_payback ?? 0).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.note}>
        <p className="note-text" style={{ fontWeight: '600', margin: '0 0 0.25rem 0' }}>脚質の定義</p>
        <p className="note-text" style={{ margin: '0.25rem 0' }}>逃げ：コーナーのいずれかが1位通過</p>
        <p className="note-text" style={{ margin: '0.25rem 0' }}>先行：最終コーナーで第1集団</p>
        <p className="note-text" style={{ margin: '0.25rem 0' }}>差し：最終コーナーで第2集団かつ上がりが5位以内</p>
        <p className="note-text" style={{ margin: '0.25rem 0' }}>追込：最終コーナーで第3集団かつ上がりが5位以内</p>
        <p className="note-text" style={{ margin: '0.5rem 0 0 0' }}>※出走頭数を3で割ったものを第1集団～第3集団とする<br />※上記に該当しない場合は集計から除外する</p>
      </div>
    </div>
  );
}