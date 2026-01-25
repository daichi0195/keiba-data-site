'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './FeaturedVenues.module.css';

interface Course {
  distance: number;
  variant?: 'inner' | 'outer';
  label?: string;
}

interface Venue {
  id: string;
  name: string;
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
];

export default function ThisWeekVenues() {
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
    <section className="section">
      <div style={{ width: '100%', padding: '0 12px' }}>
        <h2 className="section-title">今週開催の競馬場</h2>

        <div className={styles.venueGrid}>
        {mockVenues.map((venue, index) => (
          <div
            key={venue.id}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            className={`${styles.venueCard} fade-in-card fade-in-stagger-${index + 1}`}
          >
            <h3 className={styles.venueName}>{venue.name}</h3>

            <div className={styles.courseList}>
              <div className={styles.surfaceGroup}>
                <div className={styles.distanceLinks}>
                  {(() => {
                    const items = [];
                    let i = 0;
                    while (i < venue.courses.turf.length) {
                      const current = venue.courses.turf[i];
                      const next = venue.courses.turf[i + 1];

                      if (
                        current.variant === 'inner' &&
                        next?.distance === current.distance &&
                        next?.variant === 'outer'
                      ) {
                        items.push(
                          <div key={`${current.distance}-pair`} className={styles.variantGroup}>
                            <Link
                              href={`/courses/${venue.id}/turf/${current.distance}-inner`}
                              className={`${styles.distanceLink} ${styles.turfLink}`}
                            >
                              {current.label}
                            </Link>
                            <Link
                              href={`/courses/${venue.id}/turf/${next.distance}-outer`}
                              className={`${styles.distanceLink} ${styles.turfLink}`}
                            >
                              {next.label}
                            </Link>
                          </div>
                        );
                        i += 2;
                      } else {
                        items.push(
                          <Link
                            key={`${current.distance}-${current.variant || i}`}
                            href={`/courses/${venue.id}/turf/${current.distance}`}
                            className={`${styles.distanceLink} ${styles.turfLink}`}
                          >
                            {current.label || `芝${current.distance}m`}
                          </Link>
                        );
                        i += 1;
                      }
                    }
                    return items;
                  })()}
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
