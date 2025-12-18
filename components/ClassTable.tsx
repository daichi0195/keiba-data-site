'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ClassTable.module.css';

type ClassRow = {
  rank: number;
  class_name: string;
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
  data: ClassRow[];
};

export default function ClassTable({ title, data }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 全クラスを定義（表示順）
  const allClasses = ['G1', 'G2', 'G3', 'オープン', '3勝', '2勝', '1勝', '未勝利', '新馬'];

  // データを全クラスに揃える（データがないクラスは0で埋める）
  const completeData = allClasses.map((className, index) => {
    const existingData = data.find(d => d.class_name === className);
    if (existingData) {
      return existingData;
    }
    // データがない場合は0で埋める
    return {
      rank: index + 1,
      class_name: className,
      races: 0,
      wins: 0,
      places_2: 0,
      places_3: 0,
      win_rate: 0,
      place_rate: 0,
      quinella_rate: 0,
      win_payback: 0,
      place_payback: 0,
    };
  });

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
  const maxRaces = Math.max(...completeData.map(d => d.races ?? 0));
  const maxWins = Math.max(...completeData.map(d => d.wins ?? 0));
  const maxPlaces2 = Math.max(...completeData.map(d => d.places_2 ?? 0));
  const maxPlaces3 = Math.max(...completeData.map(d => d.places_3 ?? 0));
  const maxWinRate = Math.max(...completeData.map(d => d.win_rate ?? 0));
  const maxPlaceRate = Math.max(...completeData.map(d => d.place_rate ?? 0));
  const maxQuinellaRate = Math.max(...completeData.map(d => d.quinella_rate ?? 0));
  const maxWinPayback = Math.max(...completeData.map(d => d.win_payback ?? 0));
  const maxPlacePayback = Math.max(...completeData.map(d => d.place_payback ?? 0));

  const isHighlight = (value: number, maxValue: number) => value === maxValue;

  // グレードバッジのクラス名を取得
  const getGradeBadgeClass = (className: string) => {
    switch (className) {
      case 'G1':
        return styles.gradeBadgeG1;
      case 'G2':
        return styles.gradeBadgeG2;
      case 'G3':
        return styles.gradeBadgeG3;
      default:
        return null;
    }
  };

  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>

      <div className={styles.tableContainer}>
        <div className={styles.tableScroll} ref={scrollRef}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.classCol}>
                  クラス
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
              {completeData.map((row, index) => {
                const badgeClass = getGradeBadgeClass(row.class_name);
                const displayName = row.class_name.replace('クラス', '');

                return (
                  <tr
                    key={row.class_name}
                    className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
                  >
                    <td className={styles.classCol}>
                      {badgeClass ? (
                        <span className={badgeClass}>{row.class_name}</span>
                      ) : (
                        <span className={styles.classBadge}>{displayName}</span>
                      )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
