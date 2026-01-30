'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './AllVenues.module.css';
import { getCoursesByRacecourse, getCourseUrl, getCourseDisplayName } from '@/lib/courses';

const racecoursesData = getCoursesByRacecourse().map(group => ({
  name: group.racecourse_ja,
  nameEn: group.racecourse,
  courses: group.courses
}));

interface ExpandedState {
  [key: string]: boolean;
}

export default function AllVenues() {
  const [expandedRacecourse, setExpandedRacecourse] = useState<ExpandedState>({});
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const toggleRacecourse = (racecourseNameEn: string) => {
    setExpandedRacecourse((prev) => ({
      ...prev,
      [racecourseNameEn]: !prev[racecourseNameEn],
    }));
  };

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

    if (titleRef.current) observer.observe(titleRef.current);
    itemRefs.current.forEach((item) => {
      if (item) observer.observe(item);
    });

    return () => {
      if (titleRef.current) observer.unobserve(titleRef.current);
      itemRefs.current.forEach((item) => {
        if (item) observer.unobserve(item);
      });
    };
  }, []);

  return (
    <section className="section">
      <h2 ref={titleRef} className="section-title">競馬場別データ</h2>

      <div className={styles.accordionList}>
        {racecoursesData.map((racecourse, index) => (
          <div
            key={racecourse.nameEn}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={`${styles.accordionItem} fade-in-card fade-in-stagger-${(index % 10) + 1}`}
          >
            <button
              className={styles.accordionTrigger}
              onClick={() => toggleRacecourse(racecourse.nameEn)}
            >
              <span className={styles.accordionIcon}>
                {expandedRacecourse[racecourse.nameEn] ? '▼' : '▶'}
              </span>
              {racecourse.name}
            </button>

            {expandedRacecourse[racecourse.nameEn] && (
              <div className={styles.accordionContent}>
                {/* Turf courses */}
                <div className={`${styles.surfaceGroup} ${styles.turfGroup}`}>
                  <ul className={styles.courseList}>
                    {(() => {
                      const turfCourses = racecourse.courses.filter((c) => c.surface === 'turf');
                      const items = [];
                      let i = 0;
                      while (i < turfCourses.length) {
                        const current = turfCourses[i];
                        const next = turfCourses[i + 1];

                        // 内外のペアをチェック
                        if (
                          current.variant === 'inner' &&
                          next?.distance === current.distance &&
                          next?.variant === 'outer'
                        ) {
                          items.push(
                            <li key={`${current.distance}-pair`} className={styles.variantGroup}>
                              <Link
                                href={getCourseUrl(current)}
                                className={`${styles.courseLink} ${styles.turfLink}`}
                              >
                                {`芝${current.distance}m(内)`}
                              </Link>
                              <Link
                                href={getCourseUrl(next)}
                                className={`${styles.courseLink} ${styles.turfLink}`}
                              >
                                {`芝${next.distance}m(外)`}
                              </Link>
                            </li>
                          );
                          i += 2;
                        } else {
                          items.push(
                            <li key={`${racecourse.nameEn}-${current.racecourse}-${current.surface}-${current.distance}${current.variant || ''}`}>
                              <Link href={getCourseUrl(current)} className={`${styles.courseLink} ${styles.turfLink}`}>
                                {`芝${current.distance}m`}
                              </Link>
                            </li>
                          );
                          i += 1;
                        }
                      }
                      return items;
                    })()}
                  </ul>
                </div>

                {/* Dirt courses */}
                <div className={`${styles.surfaceGroup} ${styles.dirtGroup}`}>
                  <ul className={styles.courseList}>
                    {racecourse.courses
                      .filter((c) => c.surface === 'dirt')
                      .map((course) => (
                        <li key={`${racecourse.nameEn}-${course.racecourse}-${course.surface}-${course.distance}${course.variant || ''}`}>
                          <Link href={getCourseUrl(course)} className={`${styles.courseLink} ${styles.dirtLink}`}>
                            {`ダート${course.distance}m`}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Steeplechase courses */}
                {racecourse.courses.some((c) => c.surface === 'steeplechase') && (
                  <div className={`${styles.surfaceGroup} ${styles.steeplechaseGroup}`}>
                    <ul className={styles.courseList}>
                      {racecourse.courses
                        .filter((c) => c.surface === 'steeplechase')
                        .map((course) => (
                          <li key={`${racecourse.nameEn}-${course.racecourse}-${course.surface}-${course.distance}${course.variant || ''}`}>
                            <Link href={getCourseUrl(course)} className={`${styles.courseLink} ${styles.steeplechaseLink}`}>
                              {`障害${course.distance}m`}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
