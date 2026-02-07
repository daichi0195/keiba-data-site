'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './CourseHighlightsTable.module.css';

type CourseData = {
  rank: number;
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
  avg_popularity?: number;
  avg_rank?: number;
  median_popularity?: number;
  median_rank?: number;
  link?: string;
};

type Props = {
  title: string;
  data: CourseData[];
  note?: string;
};

export default function CourseHighlightsTable({ title, data, note }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // スクロール検知
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

  // 数値を3桁カンマ区切りでフォーマット
  const formatNumber = (num: number) => {
    return num.toLocaleString('ja-JP');
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className={styles.tableContainer}>
      {title && <h3 className={styles.tableTitle}>{title}</h3>}

      <div className={styles.tableScroll} ref={scrollRef}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.courseCol}>コース</th>
              <th className={styles.scrollCol}>出走数</th>
              <th className={styles.scrollCol}>1着</th>
              <th className={styles.scrollCol}>2着</th>
              <th className={styles.scrollCol}>3着</th>
              <th className={styles.scrollCol}>勝率</th>
              <th className={styles.scrollCol}>連対率</th>
              <th className={styles.scrollCol}>複勝率</th>
              <th className={styles.scrollCol}>単勝回収率</th>
              <th className={styles.scrollCol}>複勝回収率</th>
              <th className={styles.scrollCol} style={{ width: '80px', minWidth: '80px' }}>平均人気</th>
              <th className={styles.scrollCol} style={{ width: '80px', minWidth: '80px' }}>平均着順</th>
              <th className={styles.scrollCol} style={{ width: '80px', minWidth: '80px' }}>人気中央値</th>
              <th className={styles.scrollCol} style={{ width: '80px', minWidth: '80px' }}>着順中央値</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td className={styles.courseCol} suppressHydrationWarning>
                  {row.link ? (
                    <Link href={row.link} className={styles.courseLink} suppressHydrationWarning>
                      {row.name}
                    </Link>
                  ) : (
                    <span suppressHydrationWarning>{row.name}</span>
                  )}
                </td>
                <td className={styles.scrollCol}>{formatNumber(row.races)}</td>
                <td className={styles.scrollCol}>{row.wins}</td>
                <td className={styles.scrollCol}>{row.places_2}</td>
                <td className={styles.scrollCol}>{row.places_3}</td>
                <td className={styles.scrollCol}>{row.win_rate.toFixed(1)}%</td>
                <td className={styles.scrollCol}>{row.quinella_rate.toFixed(1)}%</td>
                <td className={styles.scrollCol}>{row.place_rate.toFixed(1)}%</td>
                <td className={styles.scrollCol}>{row.win_payback.toFixed(1)}%</td>
                <td className={styles.scrollCol}>{row.place_payback.toFixed(1)}%</td>
                <td className={styles.scrollCol} style={{ width: '80px', minWidth: '80px' }}>
                  <span>{row.avg_popularity != null ? row.avg_popularity.toFixed(1) : '-'}</span>
                </td>
                <td className={styles.scrollCol} style={{ width: '80px', minWidth: '80px' }}>
                  <span>{row.avg_rank != null ? row.avg_rank.toFixed(1) : '-'}</span>
                </td>
                <td className={styles.scrollCol} style={{ width: '80px', minWidth: '80px' }}>
                  <span>{row.median_popularity != null ? Math.round(row.median_popularity) : '-'}</span>
                </td>
                <td className={styles.scrollCol} style={{ width: '80px', minWidth: '80px' }}>
                  <span>{row.median_rank != null ? Math.round(row.median_rank) : '-'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {note && <p className={styles.noteText}>{note}</p>}
    </div>
  );
}
