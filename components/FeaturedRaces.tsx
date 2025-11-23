'use client';

import { useEffect, useRef } from 'react';
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
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => {
      cardRefs.current.forEach((card) => {
        if (card) observer.unobserve(card);
      });
    };
  }, []);

  return (
    <div className={styles.raceGrid}>
      {mockRaces.map((race, index) => (
        <div
          key={race.id}
          ref={(el) => {
            cardRefs.current[index] = el;
          }}
          className={`${styles.raceCard} fade-in-card fade-in-stagger-${index + 1}`}
          data-grade={race.grade}
        >
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
  );
}
