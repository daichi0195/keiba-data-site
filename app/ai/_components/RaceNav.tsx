import a from './ai.module.css';

interface RaceLinkEntry {
  slug: string;
  venueLabel: string;
  raceNumber: number;
  raceName: string;
}

/**
 * 前の予測・次の予測（2枚の白カードを横に並べる）
 * レース個別ページはオファーウォール（AdSense）の対象で、ページの読み込み時にしか表示されないため
 * Next.js の Link ではなく通常の a で遷移させる
 */
export default function RaceNav({
  basePath,
  prevRace,
  nextRace,
}: {
  basePath: string;
  prevRace: RaceLinkEntry | null;
  nextRace: RaceLinkEntry | null;
}) {
  if (!prevRace && !nextRace) return null;
  return (
    <nav className={a.raceNav} aria-label="前後の予測">
      {prevRace ? (
        <a href={`${basePath}/${prevRace.slug}`} className={`${a.raceNavLink} ${a.raceNavPrev}`}>
          <span className={a.raceNavLabel}>前の予測</span>
          <span className={a.raceNavTitle}>
            {prevRace.venueLabel}
            {prevRace.raceNumber}R {prevRace.raceName}
          </span>
        </a>
      ) : (
        <span aria-hidden="true" />
      )}
      {nextRace ? (
        <a href={`${basePath}/${nextRace.slug}`} className={`${a.raceNavLink} ${a.raceNavNext}`}>
          <span className={a.raceNavLabel}>次の予測</span>
          <span className={a.raceNavTitle}>
            {nextRace.venueLabel}
            {nextRace.raceNumber}R {nextRace.raceName}
          </span>
        </a>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
