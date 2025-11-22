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
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
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

  const toggleRacecourse = (racecourseNameEn: string) => {
    setExpandedRacecourse((prev) => ({
      ...prev,
      [racecourseNameEn]: !prev[racecourseNameEn],
    }));
  };

  return (
    <section ref={sectionRef} className={`${styles.section} ${isVisible ? styles.visible : ''}`}>
      <h2 className={styles.sectionTitle}>競馬場別データ</h2>

      <div className={styles.accordionList}>
        {racecoursesData.map((racecourse) => (
          <div key={racecourse.nameEn} className={styles.accordionItem}>
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
                <div className={styles.surfaceGroup}>
                  <h4 className={styles.surfaceLabel}>芝</h4>
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
                                className={styles.courseLink}
                              >
                                {`${current.distance}m(内)`}
                              </Link>
                              <Link
                                href={getCourseUrl(next)}
                                className={styles.courseLink}
                              >
                                {`${next.distance}m(外)`}
                              </Link>
                            </li>
                          );
                          i += 2;
                        } else {
                          items.push(
                            <li key={`${racecourse.nameEn}-${current.racecourse}-${current.surface}-${current.distance}${current.variant || ''}`}>
                              <Link href={getCourseUrl(current)} className={styles.courseLink}>
                                {`${current.distance}m`}
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
                <div className={styles.surfaceGroup}>
                  <h4 className={styles.surfaceLabel}>ダート</h4>
                  <ul className={styles.courseList}>
                    {racecourse.courses
                      .filter((c) => c.surface === 'dirt')
                      .map((course) => (
                        <li key={`${racecourse.nameEn}-${course.racecourse}-${course.surface}-${course.distance}${course.variant || ''}`}>
                          <Link href={getCourseUrl(course)} className={styles.courseLink}>
                            {`${course.distance}m`}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
