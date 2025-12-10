'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './RacecourseCourseAccordion.module.css';

type CourseData = {
  rank: number;
  name: string;
  racecourse: string;
  racecourse_en: string;
  surface: string;
  surface_en: string;
  distance: number;
  variant?: string;
  races: number;
  wins: number;
  places_2: number;
  places_3: number;
  win_rate: number;
  place_rate: number;
  quinella_rate: number;
  win_payback: number;
  place_payback: number;
  link: string;
};

type RacecourseGroup = {
  racecourse_ja: string;
  racecourse_en: string;
  courses: CourseData[];
};

type Props = {
  title: string;
  data: RacecourseGroup[];
};

export default function RacecourseCourseAccordion({ title, data }: Props) {
  const [expandedRacecourse, setExpandedRacecourse] = useState<Record<string, boolean>>({});

  const toggleRacecourse = (racecourseEn: string) => {
    setExpandedRacecourse((prev) => ({
      ...prev,
      [racecourseEn]: !prev[racecourseEn],
    }));
  };

  // 各列の最大値を取得（全コース対象）
  const allCourses = data.flatMap(group => group.courses);
  const maxRaces = Math.max(...allCourses.map(c => c.races ?? 0));
  const maxWins = Math.max(...allCourses.map(c => c.wins ?? 0));
  const maxPlaces2 = Math.max(...allCourses.map(c => c.places_2 ?? 0));
  const maxPlaces3 = Math.max(...allCourses.map(c => c.places_3 ?? 0));
  const maxWinRate = Math.max(...allCourses.map(c => c.win_rate ?? 0));
  const maxPlaceRate = Math.max(...allCourses.map(c => c.place_rate ?? 0));
  const maxQuinellaRate = Math.max(...allCourses.map(c => c.quinella_rate ?? 0));
  const maxWinPayback = Math.max(...allCourses.map(c => c.win_payback ?? 0));
  const maxPlacePayback = Math.max(...allCourses.map(c => c.place_payback ?? 0));

  const isHighlight = (value: number, maxValue: number) => value === maxValue;

  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>

      <div className={styles.accordionContainer}>
        {data.map((racecourse) => (
          <div key={racecourse.racecourse_en} className={styles.accordionItem}>
            <button
              className={styles.accordionHeader}
              onClick={() => toggleRacecourse(racecourse.racecourse_en)}
              type="button"
              aria-expanded={expandedRacecourse[racecourse.racecourse_en]}
            >
              <span className={styles.accordionIcon}>
                {expandedRacecourse[racecourse.racecourse_en] ? '▼' : '▶'}
              </span>
              <span className={styles.racecourseName}>{racecourse.racecourse_ja}</span>
              <span className={styles.courseCount}>（{racecourse.courses.length}コース）</span>
            </button>

            {expandedRacecourse[racecourse.racecourse_en] && (
              <div className={styles.accordionContent}>
                <div className="mobile-table-container">
                  <div className="mobile-table-scroll">
                    <table className={`mobile-data-table ${styles.courseTable}`}>
                      <thead>
                        <tr>
                          <th className="mobile-sticky-col mobile-col-name mobile-col-name-first">コース</th>
                          <th className="mobile-scroll-col">出走数</th>
                          <th className="mobile-scroll-col">1着</th>
                          <th className="mobile-scroll-col">2着</th>
                          <th className="mobile-scroll-col">3着</th>
                          <th className="mobile-scroll-col mobile-col-rate">勝率</th>
                          <th className="mobile-scroll-col mobile-col-rate">連対率</th>
                          <th className="mobile-scroll-col mobile-col-rate">複勝率</th>
                          <th className="mobile-scroll-col mobile-col-payback">単勝回収率</th>
                          <th className="mobile-scroll-col mobile-col-payback">複勝回収率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {racecourse.courses.map((course, index) => (
                          <tr
                            key={course.link}
                            className={index % 2 === 0 ? 'mobile-row-even' : 'mobile-row-odd'}
                          >
                            <td className="mobile-sticky-col mobile-col-name mobile-sticky-body mobile-name-cell mobile-col-name-first">
                              <Link href={course.link} className={styles.courseLink}>
                                {course.name}
                              </Link>
                            </td>
                            <td className="mobile-scroll-col">
                              <span className={isHighlight(course.races, maxRaces) ? 'mobile-highlight' : ''}>
                                {course.races}
                              </span>
                            </td>
                            <td className="mobile-scroll-col mobile-col-wins">
                              <span className={isHighlight(course.wins, maxWins) ? 'mobile-highlight' : ''}>
                                {course.wins}
                              </span>
                            </td>
                            <td className="mobile-scroll-col">
                              <span className={isHighlight(course.places_2, maxPlaces2) ? 'mobile-highlight' : ''}>
                                {course.places_2}
                              </span>
                            </td>
                            <td className="mobile-scroll-col">
                              <span className={isHighlight(course.places_3, maxPlaces3) ? 'mobile-highlight' : ''}>
                                {course.places_3}
                              </span>
                            </td>
                            <td className="mobile-scroll-col mobile-col-rate">
                              <span className={isHighlight(course.win_rate ?? 0, maxWinRate) ? 'mobile-highlight' : ''}>
                                {(course.win_rate ?? 0).toFixed(1)}%
                              </span>
                            </td>
                            <td className="mobile-scroll-col mobile-col-rate">
                              <span className={isHighlight(course.quinella_rate ?? 0, maxQuinellaRate) ? 'mobile-highlight' : ''}>
                                {(course.quinella_rate ?? 0).toFixed(1)}%
                              </span>
                            </td>
                            <td className="mobile-scroll-col mobile-col-rate">
                              <span className={isHighlight(course.place_rate ?? 0, maxPlaceRate) ? 'mobile-highlight' : ''}>
                                {(course.place_rate ?? 0).toFixed(1)}%
                              </span>
                            </td>
                            <td className="mobile-scroll-col mobile-col-payback">
                              <span className={isHighlight(course.win_payback ?? 0, maxWinPayback) ? 'mobile-highlight' : ''}>
                                {(course.win_payback ?? 0).toFixed(1)}%
                              </span>
                            </td>
                            <td className="mobile-scroll-col mobile-col-payback">
                              <span className={isHighlight(course.place_payback ?? 0, maxPlacePayback) ? 'mobile-highlight' : ''}>
                                {(course.place_payback ?? 0).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
