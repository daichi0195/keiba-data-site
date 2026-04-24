'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './ThisWeekVenues.module.css';

interface Course {
  distance: number;
  variant?: 'inner' | 'outer';
  label?: string;
}

interface Venue {
  id: string;
  name: string;
  shortName: string;
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
    shortName: '東京',
    courses: {
      turf: [
        { distance: 1400 },
        { distance: 1600 },
        { distance: 1800 },
        { distance: 2000 },
        { distance: 2300 },
        { distance: 2400 },
        { distance: 2500 },
        { distance: 3400 },
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
    shortName: '京都',
    courses: {
      turf: [
        { distance: 1200 },
        { distance: 1400, variant: 'inner', label: '芝1400m(内)' },
        { distance: 1400, variant: 'outer', label: '芝1400m(外)' },
        { distance: 1600, variant: 'inner', label: '芝1600m(内)' },
        { distance: 1600, variant: 'outer', label: '芝1600m(外)' },
        { distance: 1800 },
        { distance: 2000 },
        { distance: 2200 },
        { distance: 2400 },
        { distance: 3000 },
        { distance: 3200 },
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
    id: 'fukushima',
    name: '福島競馬場',
    shortName: '福島',
    courses: {
      turf: [
        { distance: 1200 },
        { distance: 1800 },
        { distance: 2000 },
        { distance: 2600 },
      ],
      dirt: [
        { distance: 1150 },
        { distance: 1700 },
        { distance: 2400 },
      ],
      steeplechase: [
        { distance: 2750 },
        { distance: 2770 },
        { distance: 3380 },
      ],
    },
  },
];

export default function ThisWeekVenues({ noWrapper = false }: { noWrapper?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('tokyo');

  // Intersection Observer（アニメーション用）
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

  const inner = (
    <div style={{ width: '100%' }}>
        {!noWrapper && <h2 className={`section-title is-visible ${styles.mainTitle}`}>今週開催の競馬場</h2>}

        {/* 競馬場タブ */}
        <div
          className={styles.venueTabs}
          style={{
            '--tab-count': mockVenues.length,
            '--active-index': mockVenues.findIndex((v) => v.id === selectedVenueId),
          } as React.CSSProperties}
        >
          <span className={styles.venueTabIndicator} aria-hidden="true" />
          {mockVenues.map((venue) => (
            <button
              key={venue.id}
              className={`${styles.venueTab} ${selectedVenueId === venue.id ? styles.venueTabActive : ''}`}
              onClick={() => setSelectedVenueId(venue.id)}
            >
              <span className={styles.tabLabelFull}>{venue.name}</span>
              <span className={styles.tabLabelShort}>{venue.shortName}</span>
            </button>
          ))}
        </div>

        {/* 選択された競馬場のコース一覧 */}
        {mockVenues.filter((v) => v.id === selectedVenueId).map((venue) => (
          <div key={venue.id} className={styles.venueContent}>
            <div className={styles.courseList}>
              <div className={`${styles.surfaceGroup} ${styles.surfaceGroupTurf}`}>
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

              <div className={`${styles.surfaceGroup} ${styles.surfaceGroupDirt}`}>
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
                <div className={`${styles.surfaceGroup} ${styles.surfaceGroupSteeplechase}`}>
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
  );

  return noWrapper ? inner : (
    <section ref={sectionRef} className="section section-this-week-venues">
      {inner}
    </section>
  );
}
