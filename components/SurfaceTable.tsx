'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './SurfaceTable.module.css';

type SurfaceRow = {
  name: string;
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
  data: SurfaceRow[];
};

export default function SurfaceTable({ title, data }: Props) {
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

  const isHighlight = (value: number, maxValue: number) => value === maxValue && value > 0;

  // 芝・ダート・障害のバッジスタイルを取得
  const getSurfaceBadgeStyle = (surface: string) => {
    if (surface === '芝') {
      return styles.turfBadge;
    } else if (surface === 'ダート') {
      return styles.dirtBadge;
    } else if (surface === '障害') {
      return styles.obstacleBadge;
    }
    return styles.surfaceBadge;
  };

  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>

      <div className={styles.tableContainer}>
        <div className={styles.tableScroll} ref={scrollRef}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.surfaceCol}>
                  コース区分
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
                  key={row.name}
                  className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
                >
                  <td className={styles.surfaceCol}>
                    <span className={getSurfaceBadgeStyle(row.name)}>
                      {row.name}
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span className={isHighlight(row.races ?? 0, maxRaces) ? styles.highlight : ''}>
                      {row.races ?? 0}
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span className={isHighlight(row.wins ?? 0, maxWins) ? styles.highlight : ''}>
                      {row.wins ?? 0}
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span className={isHighlight(row.places_2 ?? 0, maxPlaces2) ? styles.highlight : ''}>
                      {row.places_2 ?? 0}
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span className={isHighlight(row.places_3 ?? 0, maxPlaces3) ? styles.highlight : ''}>
                      {row.places_3 ?? 0}
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
    </div>
  );
}
