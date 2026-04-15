'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './HomeAIPredictions.module.css';

interface RaceSummary {
  slug: string;
  date: string;
  dateLabel: string;
  venueLabel: string;
  raceNumber: number;
  raceName: string;
  surface: string;
  distance: number;
}

function getToday(): string {
  // TODO: UI確認用に日付を固定中。確認後に元に戻す。
  return '2026-04-13';
  // const now = new Date();
  // now.setHours(now.getHours() + 9); // JST
  // return now.toISOString().slice(0, 10);
}

function shortenSurface(surface: string): string {
  if (surface === 'ダート') return 'ダ';
  return surface;
}

export default function HomeAIPredictions() {
  const [races, setRaces] = useState<RaceSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const url = `/api/predictions?t=${Date.now()}`;
    fetch(url, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RaceSummary[]) => {
        const today = getToday();
        setRaces(data.filter((r) => r.date === today));
      })
      .catch(() => setRaces([]))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;
  if (races.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.headerRow}>
          <h2 className={`section-title is-visible ${styles.title}`}>AI勝率予測<span className={styles.titleNote}>（対象レースの約10分前に公開予定）</span></h2>
          <Link href="/ai" className={styles.moreLinkPc}>
            もっとみる
          </Link>
        </div>
        <div className={styles.raceGrid}>
          {races.map((race) => (
            <Link
              key={race.slug}
              href={`/ai/races/${race.slug}`}
              className={styles.raceCard}
            >
              <div className={styles.raceDate}>{race.dateLabel}</div>
              <div className={styles.raceName}>{race.raceName}</div>
              <div className={styles.raceMetaRow}>
                <span className={styles.raceVenueChip}>
                  {race.venueLabel}
                  {race.raceNumber}R
                </span>
                <span className={styles.raceMeta}>
                  {shortenSurface(race.surface)}
                  {race.distance}m
                </span>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/ai" className={styles.moreLinkSp}>
          もっとみる
        </Link>
      </div>
    </section>
  );
}
