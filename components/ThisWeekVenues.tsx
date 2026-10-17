'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './ThisWeekVenues.module.css';

import type { Venue } from '@/lib/thisWeekVenues';

export default function ThisWeekVenues({ venues, noWrapper = false }: { venues: Venue[]; noWrapper?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string>(venues[0]?.id ?? '');

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
            '--tab-count': venues.length,
            '--active-index': venues.findIndex((v) => v.id === selectedVenueId),
          } as React.CSSProperties}
        >
          <span className={styles.venueTabIndicator} aria-hidden="true" />
          {venues.map((venue) => (
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
        {venues.filter((v) => v.id === selectedVenueId).map((venue) => (
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
