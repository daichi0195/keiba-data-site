'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './RacecourseCourseTable.module.css';

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

export default function RacecourseCourseTable({ title, data }: Props) {
  const [isScrolled, setIsScrolled] = useState<Record<string, boolean>>({});
  const [expandedRacecourse, setExpandedRacecourse] = useState<Record<string, boolean>>({});
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleRacecourse = (racecourseEn: string) => {
    setExpandedRacecourse((prev) => ({
      ...prev,
      [racecourseEn]: !prev[racecourseEn],
    }));
  };

  const isHighlight = (value: number, maxValue: number) => value === maxValue && value > 0;

  // 各競馬場ごとの最大値を取得する関数
  const getMaxValues = (courses: CourseData[]) => {
    return {
      maxRaces: Math.max(...courses.map(c => c.races ?? 0)),
      maxWins: Math.max(...courses.map(c => c.wins ?? 0)),
      maxPlaces2: Math.max(...courses.map(c => c.places_2 ?? 0)),
      maxPlaces3: Math.max(...courses.map(c => c.places_3 ?? 0)),
      maxWinRate: Math.max(...courses.map(c => c.win_rate ?? 0)),
      maxPlaceRate: Math.max(...courses.map(c => c.place_rate ?? 0)),
      maxQuinellaRate: Math.max(...courses.map(c => c.quinella_rate ?? 0)),
      maxWinPayback: Math.max(...courses.map(c => c.win_payback ?? 0)),
      maxPlacePayback: Math.max(...courses.map(c => c.place_payback ?? 0)),
    };
  };

  // コース名から競馬場名を削除し、余白を完全に削除する関数
  const formatCourseName = (fullName: string, racecourseName: string) => {
    return fullName.replace(racecourseName, '').trim().replace(/\s+/g, '');
  };

  useEffect(() => {
    const handlers: Record<string, (e: Event) => void> = {};

    data.forEach((racecourse) => {
      const handleScroll = (e: Event) => {
        const target = e.target as HTMLDivElement;
        const scrollLeft = target.scrollLeft;
        setIsScrolled((prev) => ({
          ...prev,
          [racecourse.racecourse_en]: scrollLeft > 5,
        }));
      };

      handlers[racecourse.racecourse_en] = handleScroll;

      const scrollElement = scrollRefs.current[racecourse.racecourse_en];
      if (scrollElement) {
        scrollElement.addEventListener('scroll', handleScroll);
      }
    });

    return () => {
      data.forEach((racecourse) => {
        const scrollElement = scrollRefs.current[racecourse.racecourse_en];
        const handler = handlers[racecourse.racecourse_en];
        if (scrollElement && handler) {
          scrollElement.removeEventListener('scroll', handler);
        }
      });
    };
  }, [data]);

  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>

      {data.map((racecourse) => {
        // 各競馬場ごとの最大値を取得
        const maxValues = getMaxValues(racecourse.courses);

        return (
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
            </button>

            {expandedRacecourse[racecourse.racecourse_en] && (
              <div className={styles.accordionContent}>
                <div className="mobile-table-container">
                  <div
                    className="mobile-table-scroll"
                    ref={(el) => {
                      scrollRefs.current[racecourse.racecourse_en] = el;
                    }}
                  >
                    <table className="mobile-data-table no-rank-column racecourse-course-table">
                      <thead>
                        <tr>
                          <th className="mobile-sticky-col mobile-col-name mobile-col-name-first">
                            コース
                          </th>
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
                            <Link href={course.link} style={{ color: '#2563eb', textDecoration: 'underline' }}>
                              {formatCourseName(course.name, racecourse.racecourse_ja)}
                            </Link>
                          </td>
                          <td className="mobile-scroll-col">
                            <span className={isHighlight(course.races, maxValues.maxRaces) ? 'mobile-highlight' : ''}>
                              {course.races}
                            </span>
                          </td>
                          <td className="mobile-scroll-col mobile-col-wins">
                            <span className={isHighlight(course.wins, maxValues.maxWins) ? 'mobile-highlight' : ''}>
                              {course.wins}
                            </span>
                          </td>
                          <td className="mobile-scroll-col">
                            <span className={isHighlight(course.places_2, maxValues.maxPlaces2) ? 'mobile-highlight' : ''}>
                              {course.places_2}
                            </span>
                          </td>
                          <td className="mobile-scroll-col">
                            <span className={isHighlight(course.places_3, maxValues.maxPlaces3) ? 'mobile-highlight' : ''}>
                              {course.places_3}
                            </span>
                          </td>
                          <td className="mobile-scroll-col mobile-col-rate">
                            <span className={isHighlight(course.win_rate ?? 0, maxValues.maxWinRate) ? 'mobile-highlight' : ''}>
                              {(course.win_rate ?? 0).toFixed(1)}%
                            </span>
                          </td>
                          <td className="mobile-scroll-col mobile-col-rate">
                            <span className={isHighlight(course.quinella_rate ?? 0, maxValues.maxQuinellaRate) ? 'mobile-highlight' : ''}>
                              {(course.quinella_rate ?? 0).toFixed(1)}%
                            </span>
                          </td>
                          <td className="mobile-scroll-col mobile-col-rate">
                            <span className={isHighlight(course.place_rate ?? 0, maxValues.maxPlaceRate) ? 'mobile-highlight' : ''}>
                              {(course.place_rate ?? 0).toFixed(1)}%
                            </span>
                          </td>
                          <td className="mobile-scroll-col mobile-col-payback">
                            <span className={isHighlight(course.win_payback ?? 0, maxValues.maxWinPayback) ? 'mobile-highlight' : ''}>
                              {(course.win_payback ?? 0).toFixed(1)}%
                            </span>
                          </td>
                          <td className="mobile-scroll-col mobile-col-payback">
                            <span className={isHighlight(course.place_payback ?? 0, maxValues.maxPlacePayback) ? 'mobile-highlight' : ''}>
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
        );
      })}
    </div>
  );
}
