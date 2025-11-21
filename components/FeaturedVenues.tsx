'use client';

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
    },
  },
  {
    id: 'kyoto',
    name: '京都競馬場',
    courses: {
      turf: [
        { distance: 1200 },
        { distance: 1400 },
        { distance: 1600, variant: 'inner', label: '1600m(内)' },
        { distance: 1600, variant: 'outer', label: '1600m(外)' },
        { distance: 1800 },
        { distance: 2000, variant: 'inner', label: '2000m(内)' },
        { distance: 2000, variant: 'outer', label: '2000m(外)' },
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
    },
  },
];

export default function FeaturedVenues() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>今週開催の競馬場データ</h2>

      <div className={styles.venueGrid}>
        {mockVenues.map((venue) => (
          <div key={venue.id} className={styles.venueCard}>
            <h3 className={styles.venueName}>{venue.name}</h3>

            <div className={styles.courseList}>
              <div className={styles.surfaceGroup}>
                <span className={styles.surfaceLabel}>芝</span>
                <div className={styles.distanceLinks}>
                  {(() => {
                    const items = [];
                    let i = 0;
                    while (i < venue.courses.turf.length) {
                      const current = venue.courses.turf[i];
                      const next = venue.courses.turf[i + 1];

                      // 内外のペアをチェック
                      if (
                        current.variant === 'inner' &&
                        next?.distance === current.distance &&
                        next?.variant === 'outer'
                      ) {
                        items.push(
                          <div key={`${current.distance}-pair`} className={styles.variantGroup}>
                            <Link
                              href={`/courses/${venue.id}/turf/${current.distance}`}
                              className={styles.distanceLink}
                            >
                              {current.label}
                            </Link>
                            <Link
                              href={`/courses/${venue.id}/turf/${next.distance}`}
                              className={styles.distanceLink}
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
                            className={styles.distanceLink}
                          >
                            {current.label || `${current.distance}m`}
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
                <span className={styles.surfaceLabel}>ダート</span>
                <div className={styles.distanceLinks}>
                  {venue.courses.dirt.map((course, index) => (
                    <Link
                      key={`${course.distance}-${course.variant || index}`}
                      href={`/courses/${venue.id}/dirt/${course.distance}`}
                      className={styles.distanceLink}
                    >
                      {course.label || `${course.distance}m`}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
