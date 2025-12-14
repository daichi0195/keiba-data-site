'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './YearlyTable.module.css';

type YearlyRow = {
  year: number;
  races: number;
  wins: number;
  places_2: number;
  places_3: number;
  win_rate: number;
  place_rate: number;
  quinella_rate: number;
};

type Props = {
  title: string;
  data: YearlyRow[];
};

export default function YearlyTable({ title, data }: Props) {
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

  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>

      <div className={styles.tableContainer}>
        <div className={styles.tableScroll} ref={scrollRef}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.yearCol}>
                  年度
                </th>
                <th className={styles.scrollCol}>勝率</th>
                <th className={styles.scrollCol}>連対率</th>
                <th className={styles.scrollCol}>複勝率</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={row.year}
                  className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
                >
                  <td className={styles.yearCol}>
                    <span className={styles.yearBadge}>
                      {row.year}年
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span>
                      {(row.win_rate ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span>
                      {(row.quinella_rate ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className={styles.scrollCol}>
                    <span>
                      {(row.place_rate ?? 0).toFixed(1)}%
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
