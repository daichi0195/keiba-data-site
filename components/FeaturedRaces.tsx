'use client';

import Link from 'next/link';
import styles from './FeaturedRaces.module.css';

interface Race {
  id: string;
  name: string;
  date: string;
  venue: string;
  course: string;
  distance: string;
  grade: 'G1' | 'G2' | 'G3';
}

// モックデータ（後でAPIから取得）
const mockRaces: Race[] = [
  {
    id: '1',
    name: 'ジャパンカップ',
    date: '11月24日(日)',
    venue: '東京競馬場',
    course: '芝',
    distance: '2400m',
    grade: 'G1',
  },
  {
    id: '2',
    name: '京阪杯',
    date: '11月24日(日)',
    venue: '京都競馬場',
    course: '芝',
    distance: '1200m',
    grade: 'G3',
  },
  {
    id: '3',
    name: '京都2歳ステークス',
    date: '11月24日(日)',
    venue: '京都競馬場',
    course: '芝',
    distance: '1800m',
    grade: 'G3',
  },
];

export default function FeaturedRaces() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>今週開催の注目レース</h2>

      <div className={styles.raceGrid}>
        {mockRaces.map((race) => (
          <div key={race.id} className={styles.raceCard}>
            <div className={styles.gradeTag} data-grade={race.grade}>
              {race.grade}
            </div>

            <h3 className={styles.raceName}>{race.name}</h3>

            <Link href={`/races/${race.id}`} className={styles.detailLink}>
              データを見る
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
