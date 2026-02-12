'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './ThisWeekVenues.module.css';

interface Course {
  distance: number;
  variant?: 'inner' | 'outer';
  label?: string;
}

interface NextRace {
  racecourse: string;
  raceNumber: number;
  raceName: string;
  startTime: string;
  surface: 'turf' | 'dirt' | 'steeplechase';
  distance: number;
}

interface Venue {
  id: string;
  name: string;
  nextRace?: NextRace;
  courses: {
    turf: Course[];
    dirt: Course[];
    steeplechase?: Course[];
  };
}

// モックデータ（後でAPIから取得）
const mockVenues: Venue[] = [
  {
    id: 'tokyo',
    name: '東京競馬場',
    nextRace: {
      racecourse: '東京',
      raceNumber: 1,
      raceName: '3歳未勝利',
      startTime: '10:05',
      surface: 'dirt',
      distance: 1400,
    },
    courses: {
      turf: [
        { distance: 1400 },
        { distance: 1600 },
        { distance: 1800 },
        { distance: 2000 },
        { distance: 2400 },
      ],
      dirt: [
        { distance: 1300 },
        { distance: 1400 },
        { distance: 1600 },
        { distance: 2100 },
      ],
      steeplechase: [
        { distance: 3000 },
        { distance: 3100 },
        { distance: 3110 },
      ],
    },
  },
  {
    id: 'kyoto',
    name: '京都競馬場',
    nextRace: {
      racecourse: '京都',
      raceNumber: 1,
      raceName: '3歳未勝利',
      startTime: '09:50',
      surface: 'dirt',
      distance: 1800,
    },
    courses: {
      turf: [
        { distance: 1200 },
        { distance: 1400, variant: 'inner', label: '1400m(内)' },
        { distance: 1400, variant: 'outer', label: '1400m(外)' },
        { distance: 1600, variant: 'inner', label: '1600m(内)' },
        { distance: 1600, variant: 'outer', label: '1600m(外)' },
        { distance: 1800 },
        { distance: 2000 },
        { distance: 2200 },
        { distance: 2400 },
        { distance: 3000 },
      ],
      dirt: [
        { distance: 1200 },
        { distance: 1400 },
        { distance: 1800 },
        { distance: 1900 },
      ],
      steeplechase: [
        { distance: 2910 },
        { distance: 3170 },
        { distance: 3930 },
      ],
    },
  },
  {
    id: 'kokura',
    name: '小倉競馬場',
    nextRace: {
      racecourse: '小倉',
      raceNumber: 1,
      raceName: '3歳未勝利',
      startTime: '09:45',
      surface: 'dirt',
      distance: 1700,
    },
    courses: {
      turf: [
        { distance: 1200 },
        { distance: 1800 },
        { distance: 2000 },
        { distance: 2600 },
      ],
      dirt: [
        { distance: 1000 },
        { distance: 1700 },
        { distance: 2400 },
      ],
      steeplechase: [
        { distance: 2860 },
        { distance: 3390 },
      ],
    },
  },
];

// コース区分の略称を取得
const getSurfaceLabel = (surface: 'turf' | 'dirt' | 'steeplechase'): string => {
  switch (surface) {
    case 'turf':
      return '芝';
    case 'dirt':
      return 'ダ';
    case 'steeplechase':
      return '障';
  }
};

// コース区分のフルネームを取得
const getSurfaceFullLabel = (surface: 'turf' | 'dirt' | 'steeplechase'): string => {
  switch (surface) {
    case 'turf':
      return '芝';
    case 'dirt':
      return 'ダート';
    case 'steeplechase':
      return '障害';
  }
};

// 時刻を「X時X分発走」形式に変換
const formatStartTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  return `${hours}時${minutes}分発走`;
};

// レース名を略称化
const formatRaceName = (name: string): string => {
  return name
    .replace(/クラス/g, 'C')
    .replace(/ステークス/g, 'S');
};

export default function ThisWeekVenues() {
  const sectionRef = useRef<HTMLElement>(null);

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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="section section-this-week-venues fade-in-card">
      <div style={{ width: '100%' }}>
        <h2 className="section-title is-visible">
          今週開催の競馬場
        </h2>

        {/* 次のレースセクション */}
        <div className={styles.nextRaceSection}>
          <h3 className={styles.nextRaceTitle}>次のレース</h3>
          <div className={styles.upcomingRaceGrid}>
            {mockVenues
              .filter((venue) => venue.nextRace)
              .sort((a, b) => {
                if (!a.nextRace || !b.nextRace) return 0;
                return a.nextRace.startTime.localeCompare(b.nextRace.startTime);
              })
              .map((venue) => (
              venue.nextRace && (
                <div key={`next-race-${venue.id}`} className={styles.upcomingRaceItem}>
                  <Link
                    href={`/courses/${venue.id}/${venue.nextRace.surface}/${venue.nextRace.distance}`}
                    className={styles.upcomingRaceCard}
                  >
                    <div className={styles.raceCourseName}>{venue.nextRace.racecourse} {venue.nextRace.raceNumber}R</div>
                    <div className={styles.raceDetails}>{formatRaceName(venue.nextRace.raceName)}</div>
                    <div
                      className={`${styles.raceCourseInfo} ${
                        venue.nextRace.surface === 'turf' ? styles.turfBadge :
                        venue.nextRace.surface === 'dirt' ? styles.dirtBadge :
                        styles.steeplechaseBadge
                      }`}
                    >
                      <span className={styles.surfaceLabelShort}>
                        {getSurfaceLabel(venue.nextRace.surface)}{venue.nextRace.distance}m
                      </span>
                      <span className={styles.surfaceLabelFull}>
                        {getSurfaceFullLabel(venue.nextRace.surface)}{venue.nextRace.distance}m
                      </span>
                    </div>
                    <div className={styles.raceStartTime}>{formatStartTime(venue.nextRace.startTime)}</div>
                  </Link>
                </div>
              )
            ))}
          </div>
        </div>

        <div className={styles.venueGrid}>
        {mockVenues.map((venue, index) => (
          <div
            key={venue.id}
            className={styles.venueCard}
          >
            <h3 className={styles.venueName}>{venue.name}</h3>

            <div className={styles.courseList}>
              <div className={styles.surfaceGroup}>
                <div className={styles.distanceLinks}>
                  {venue.courses.turf.map((course, idx) => (
                    <Link
                      key={`${course.distance}-${course.variant || idx}`}
                      href={`/courses/${venue.id}/turf/${course.distance}${course.variant ? `-${course.variant}` : ''}`}
                      className={`${styles.distanceLink} ${styles.turfLink}`}
                    >
                      {course.label || `芝${course.distance}m`}
                    </Link>
                  ))}
                </div>
              </div>

              <div className={styles.surfaceGroup}>
                <div className={styles.distanceLinks}>
                  {venue.courses.dirt.map((course, idx) => (
                    <Link
                      key={`${course.distance}-${course.variant || idx}`}
                      href={`/courses/${venue.id}/dirt/${course.distance}`}
                      className={`${styles.distanceLink} ${styles.dirtLink}`}
                    >
                      {course.label || `ダート${course.distance}m`}
                    </Link>
                  ))}
                </div>
              </div>

              {venue.courses.steeplechase && venue.courses.steeplechase.length > 0 && (
                <div className={styles.surfaceGroup}>
                  <div className={styles.distanceLinks}>
                    {venue.courses.steeplechase.map((course, idx) => (
                      <Link
                        key={`${course.distance}-${course.variant || idx}`}
                        href={`/courses/${venue.id}/steeplechase/${course.distance}`}
                        className={`${styles.distanceLink} ${styles.steeplechaseLink}`}
                      >
                        {course.label || `障害${course.distance}m`}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
