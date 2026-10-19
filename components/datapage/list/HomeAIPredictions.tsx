import Link from 'next/link';
import s from '@/components/course/course.module.css';
import h from './home.module.css';

export interface RaceSummary {
  slug: string;
  date: string;
  dateLabel: string;
  venueLabel: string;
  raceNumber: number;
  raceName: string;
  surface: string;
  distance: number;
}

/** トップ：AI勝率予測（現行と同じ最大10レースを横スワイプで並べる） */
export default function HomeAIPredictions({ races }: { races: RaceSummary[] }) {
  if (races.length === 0) return null;

  return (
    <section className={s.section} aria-label="AI勝率予測">
      <div className={h.shRow}>
        <h2 className={s.h2}>
          AI勝率予測<span className={h.titleNote}>（対象レースの約10分前に公開予定）</span>
        </h2>
        <Link href="/ai" className={`${h.moreText} ${h.moreTextPc}`}>
          もっとみる
        </Link>
      </div>
      <div className={h.raceRail}>
        {races.map((race) => {
          const surfaceClass = race.surface === '芝' ? s.badgeTurf : (race.surface === 'ダート' || race.surface === 'ダ') ? s.badgeDirt : h.badgeSub;
          return (
            <Link key={race.slug} href={`/ai/races/${race.slug}`} className={h.raceCard}>
              <span className={h.raceDate}>{race.dateLabel}</span>
              <span className={h.raceName}>{race.raceName}</span>
              <span className={h.raceMeta}>
                <span className={`${s.badge} ${h.badgeSub}`}>
                  {race.venueLabel}
                  {race.raceNumber}R
                </span>
                <span className={`${s.badge} ${surfaceClass}`}>
                  {race.surface === 'ダート' ? 'ダ' : race.surface}
                  {race.distance}m
                </span>
              </span>
            </Link>
          );
        })}
      </div>
      <Link href="/ai" className={`${h.moreBtn} ${h.raceMoreSp}`}>
        もっとみる
      </Link>
    </section>
  );
}
