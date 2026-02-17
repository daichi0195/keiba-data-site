'use client';

import Link from 'next/link';
import styles from './LeadingChart.module.css';

interface LeadingItem {
  rank: number;
  id: number;
  name: string;
  wins: number;
}

interface LeadingChartProps {
  data: LeadingItem[];
  linkPrefix: string;
  isVisible: boolean;
  title?: string;
  note?: string;
  maxNameLength?: number;
  nameWidth?: number;
}

export default function LeadingChart({
  data,
  linkPrefix,
  isVisible,
  title,
  note = '2026年/勝ち数順',
  maxNameLength,
  nameWidth,
}: LeadingChartProps) {
  const maxWins = Math.max(...data.map((item) => item.wins));

  const formatName = (name: string) => {
    if (maxNameLength && name.length > maxNameLength) {
      return name.slice(0, maxNameLength) + '…';
    }
    return name;
  };

  return (
    <div className={styles.container}>
      {title && <div className={styles.title}>{title}</div>}
      {data.map((item) => (
        <div key={item.rank} className={styles.row}>
          <div
            className={`${styles.rankBadge} ${
              item.rank === 1 ? styles.rank1 :
              item.rank === 2 ? styles.rank2 :
              item.rank === 3 ? styles.rank3 :
              styles.rankDefault
            }`}
          >
            {item.rank}
          </div>

          <Link href={`${linkPrefix}${item.id}`} className={styles.name} style={nameWidth ? { minWidth: nameWidth, width: nameWidth } : undefined}>
            {formatName(item.name)}
          </Link>

          <div className={styles.barTrack}>
            <div
              className={styles.bar}
              style={{ width: isVisible ? `${(item.wins / maxWins) * 100}%` : '0%' }}
            />
          </div>

          <span className={styles.winsLabel}>{item.wins}勝</span>
        </div>
      ))}
    </div>
  );
}
