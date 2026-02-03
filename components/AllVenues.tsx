'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './AllVenues.module.css';
import { getCoursesByRacecourse, getCourseUrl } from '@/lib/courses';

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
  const sectionRef = useRef<HTMLElement>(null);

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
    <section ref={sectionRef} className="section fade-in-card">
      <h2 className="section-title is-visible">
        競馬場別データ
      </h2>

      <div className={styles.accordionList}>
        {racecoursesData.map((racecourse, index) => {
          const turfCourses = racecourse.courses.filter((c) => c.surface === 'turf');
          const dirtCourses = racecourse.courses.filter((c) => c.surface === 'dirt');
          const steeplechaseCourses = racecourse.courses.filter((c) => c.surface === 'steeplechase');

          return (
            <div
              key={racecourse.nameEn}
              className={styles.accordionItem}
            >
              <button
                className={`${styles.accordionTrigger} ${expandedRacecourse[racecourse.nameEn] ? styles.expanded : ''}`}
                onClick={() => toggleRacecourse(racecourse.nameEn)}
              >
                <span className={styles.accordionIcon}>
                  {expandedRacecourse[racecourse.nameEn] ? '▼' : '▶'}
                </span>
                <h3 className={styles.venueName}>{racecourse.name}</h3>
              </button>

              <div className={`${styles.accordionContent} ${expandedRacecourse[racecourse.nameEn] ? '' : styles.hidden}`}>
                {turfCourses.length > 0 && (
                  <div className={styles.surfaceGroup}>
                    <div className={styles.accordionDistanceLinks}>
                      {turfCourses.map((course, idx) => (
                        <Link
                          key={`${course.racecourse}-${course.surface}-${course.distance}-${course.variant || idx}`}
                          href={getCourseUrl(course)}
                          className={`${styles.avCourseCard} ${styles.avTurfCard}`}
                        >
                          {course.variant
                            ? `芝${course.distance}m(${course.variant === 'inner' ? '内' : '外'})`
                            : `芝${course.distance}m`
                          }
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {dirtCourses.length > 0 && (
                  <div className={styles.surfaceGroup}>
                    <div className={styles.accordionDistanceLinks}>
                      {dirtCourses.map((course, idx) => (
                        <Link
                          key={`${course.racecourse}-${course.surface}-${course.distance}-${course.variant || idx}`}
                          href={getCourseUrl(course)}
                          className={`${styles.avCourseCard} ${styles.avDirtCard}`}
                        >
                          {`ダート${course.distance}m`}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {steeplechaseCourses.length > 0 && (
                  <div className={styles.surfaceGroup}>
                    <div className={styles.accordionDistanceLinks}>
                      {steeplechaseCourses.map((course, idx) => (
                        <Link
                          key={`${course.racecourse}-${course.surface}-${course.distance}-${course.variant || idx}`}
                          href={getCourseUrl(course)}
                          className={`${styles.avCourseCard} ${styles.avSteeplechaseCard}`}
                        >
                          {`障害${course.distance}m`}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
