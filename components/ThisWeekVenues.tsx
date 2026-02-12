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
      raceNumber: 5,
      raceName: 'サラ系3歳未勝利',
      startTime: '15:20',
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
      raceNumber: 3,
      raceName: '3歳以上1勝クラス',
      startTime: '14:35',
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
      raceNumber: 7,
      raceName: '3歳未勝利',
      startTime: '16:10',
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

        {/* 次のレースカード */}
        <div className={styles.nextRaceGrid}>
          {mockVenues.map((venue) => (
            venue.nextRace && (
              <div key={`next-race-${venue.id}`} className={styles.nextRaceCard}>
                <h3 className={styles.nextRaceLabel}>次のレース</h3>
                <div className={styles.racecourse}>{venue.nextRace.racecourse} {venue.nextRace.raceNumber}R</div>
                <div className={styles.raceInfo}>{venue.nextRace.raceName}</div>
                <div className={styles.raceTime}>{venue.nextRace.startTime} 発走</div>
              </div>
            )
          ))}
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
