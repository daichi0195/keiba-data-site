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
  const maxWinRate = Math.max(...data.map(d => d.win_rate));
  const maxPlaceRate = Math.max(...data.map(d => d.place_rate));
  const maxQuinellaRate = Math.max(...data.map(d => d.quinella_rate));
  const maxWinPayback = Math.max(...data.map(d => d.win_payback));
  const maxPlacePayback = Math.max(...data.map(d => d.place_payback));
  
  const isHighlight = (value: number, maxValue: number) => value === maxValue;

  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>
      
      <div className={styles.tableContainer}>
        <div className={styles.tableScroll} ref={scrollRef}>
          <table className={styles.table} style={{ width: '360px', minWidth: '360px', maxWidth: '360px', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className={styles.styleCol} style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>
                  脚質
                </th>
                <th className={styles.scrollCol} style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>勝率</th>
                <th className={styles.scrollCol} style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>連対率</th>
                <th className={styles.scrollCol} style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>複勝率</th>
                <th className={styles.scrollCol} style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>単勝回収率</th>
                <th className={styles.scrollCol} style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>複勝回収率</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={row.style}
                  className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
                >
                  <td className={styles.styleCol} style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>
                    <span className={styles.styleBadge}>
                      {row.style_label}
                    </span>
                  </td>
                  <td className={styles.scrollCol} style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>
                    <span className={isHighlight(row.win_rate, maxWinRate) ? styles.highlight : ''}>
                      {row.win_rate}%
                    </span>
                  </td>
                  <td className={styles.scrollCol} style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>
                    <span className={isHighlight(row.quinella_rate, maxQuinellaRate) ? styles.highlight : ''}>
                      {row.quinella_rate}%
                    </span>
                  </td>
                  <td className={styles.scrollCol} style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>
                    <span className={isHighlight(row.place_rate, maxPlaceRate) ? styles.highlight : ''}>
                      {row.place_rate}%
                    </span>
                  </td>
                  <td className={styles.scrollCol} style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>
                    <span className={isHighlight(row.win_payback, maxWinPayback) ? styles.highlight : ''}>
                      {row.win_payback}%
                    </span>
                  </td>
                  <td className={styles.scrollCol} style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>
                    <span className={isHighlight(row.place_payback, maxPlacePayback) ? styles.highlight : ''}>
                      {row.place_payback}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}