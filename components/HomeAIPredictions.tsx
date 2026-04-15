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

function shortenSurface(surface: string): string {
  if (surface === 'ダート') return 'ダ';
  return surface;
}

export default function HomeAIPredictions({ races }: { races: RaceSummary[] }) {
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
