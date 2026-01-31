'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag } from '@fortawesome/free-solid-svg-icons';
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
            if (titleRef.current) {
              titleRef.current.classList.add('is-visible');
            }
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
      <h2 ref={titleRef} className="section-title">
        <FontAwesomeIcon icon={faFlag} style={{ marginRight: '8px' }} />
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
                <span className={styles.venueName}>{racecourse.name}</span>
              </button>

              {expandedRacecourse[racecourse.nameEn] && (
                <div className={styles.accordionContent}>
                  {/* Turf courses */}
                  {turfCourses.length > 0 && (
                    <div className={styles.surfaceGroup}>
                      <div className={styles.distanceLinks}>
                        {turfCourses.map((course, idx) => (
                          <Link
                            key={`${course.racecourse}-${course.surface}-${course.distance}-${course.variant || idx}`}
                            href={getCourseUrl(course)}
                            className={`${styles.distanceLink} ${styles.turfLink}`}
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

                  {/* Dirt courses */}
                  {dirtCourses.length > 0 && (
                    <div className={styles.surfaceGroup}>
                      <div className={styles.distanceLinks}>
                        {dirtCourses.map((course, idx) => (
                          <Link
                            key={`${course.racecourse}-${course.surface}-${course.distance}-${course.variant || idx}`}
                            href={getCourseUrl(course)}
                            className={`${styles.distanceLink} ${styles.dirtLink}`}
                          >
                            {`ダート${course.distance}m`}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Steeplechase courses */}
                  {steeplechaseCourses.length > 0 && (
                    <div className={styles.surfaceGroup}>
                      <div className={styles.distanceLinks}>
                        {steeplechaseCourses.map((course, idx) => (
                          <Link
                            key={`${course.racecourse}-${course.surface}-${course.distance}-${course.variant || idx}`}
                            href={getCourseUrl(course)}
                            className={`${styles.distanceLink} ${styles.steeplechaseLink}`}
                          >
                            {`障害${course.distance}m`}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
