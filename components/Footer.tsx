'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

interface Course {
  name: string;
  distance: number;
  surface: 'turf' | 'dirt';
  variant?: string; // For inner/outer variations
}

interface Racecourse {
  name: string;
  nameEn: string;
  courses: Course[];
}

const racecoursesData: Racecourse[] = [
  {
    name: '札幌競馬場',
    nameEn: 'sapporo',
    courses: [
      // Turf courses
      { name: '芝 1000m', distance: 1000, surface: 'turf' },
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1500m', distance: 1500, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      // Dirt courses
      { name: 'ダート 1000m', distance: 1000, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '函館競馬場',
    nameEn: 'hakodate',
    courses: [
      // Turf courses
      { name: '芝 1000m', distance: 1000, surface: 'turf' },
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      // Dirt courses
      { name: 'ダート 1000m', distance: 1000, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '福島競馬場',
    nameEn: 'fukushima',
    courses: [
      // Turf courses
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      // Dirt courses
      { name: 'ダート 1150m', distance: 1150, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '中山競馬場',
    nameEn: 'nakayama',
    courses: [
      // Turf courses
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2500m', distance: 2500, surface: 'turf' },
      { name: '芝 3600m', distance: 3600, surface: 'turf' },
      // Dirt courses
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
      { name: 'ダート 2500m', distance: 2500, surface: 'dirt' },
    ],
  },
  {
    name: '東京競馬場',
    nameEn: 'tokyo',
    courses: [
      // Turf courses
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2300m', distance: 2300, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: '芝 2500m', distance: 2500, surface: 'turf' },
      { name: '芝 3400m', distance: 3400, surface: 'turf' },
      // Dirt courses
      { name: 'ダート 1300m', distance: 1300, surface: 'dirt' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1600m', distance: 1600, surface: 'dirt' },
      { name: 'ダート 2100m', distance: 2100, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '新潟競馬場',
    nameEn: 'niigata',
    courses: [
      // Turf courses
      { name: '芝 1000m', distance: 1000, surface: 'turf' },
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m（内回り）', distance: 2000, surface: 'turf', variant: 'inner' },
      { name: '芝 2000m（外回り）', distance: 2000, surface: 'turf', variant: 'outer' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      // Dirt courses
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
    ],
  },
  {
    name: '中京競馬場',
    nameEn: 'chukyo',
    courses: [
      // Turf courses
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      // Dirt courses
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
      { name: 'ダート 1900m', distance: 1900, surface: 'dirt' },
    ],
  },
  {
    name: '京都競馬場',
    nameEn: 'kyoto',
    courses: [
      // Turf courses
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m（内回り）', distance: 1400, surface: 'turf', variant: 'inner' },
      { name: '芝 1400m（外回り）', distance: 1400, surface: 'turf', variant: 'outer' },
      { name: '芝 1600m（内回り）', distance: 1600, surface: 'turf', variant: 'inner' },
      { name: '芝 1600m（外回り）', distance: 1600, surface: 'turf', variant: 'outer' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: '芝 3000m', distance: 3000, surface: 'turf' },
      { name: '芝 3200m', distance: 3200, surface: 'turf' },
      // Dirt courses
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
      { name: 'ダート 1900m', distance: 1900, surface: 'dirt' },
    ],
  },
  {
    name: '阪神競馬場',
    nameEn: 'hanshin',
    courses: [
      // Turf courses
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: '芝 3000m', distance: 3000, surface: 'turf' },
      // Dirt courses
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
      { name: 'ダート 2000m', distance: 2000, surface: 'dirt' },
    ],
  },
  {
    name: '小倉競馬場',
    nameEn: 'kokura',
    courses: [
      // Turf courses
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1700m', distance: 1700, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      // Dirt courses
      { name: 'ダート 1000m', distance: 1000, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
];

interface ExpandedState {
  [key: string]: boolean;
}

export default function Footer() {
  const [expandedRacecourse, setExpandedRacecourse] = useState<ExpandedState>({});

  const toggleRacecourse = (racecourseNameEn: string) => {
    setExpandedRacecourse((prev) => ({
      ...prev,
      [racecourseNameEn]: !prev[racecourseNameEn],
    }));
  };

  const getCourseUrl = (racecourse: Racecourse, course: Course): string => {
    const surfaceEn = course.surface === 'turf' ? 'turf' : 'dirt';
    // For courses with variants, we don't create a URL (they're informational)
    if (course.variant) {
      return '#';
    }
    return `/courses/${racecourse.nameEn}/${surfaceEn}/${course.distance}`;
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
      <div className={styles.footerContent}>
        {/* Left Column - Racecourse Data */}
        <div className={styles.footerColumn}>
          <h3 className={styles.columnTitle}>コース別データ</h3>
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
                      <ul className={`${styles.courseList} ${styles.turfCourseList}`}>
                        {racecourse.courses
                          .filter((c) => c.surface === 'turf')
                          .map((course) => (
                            <li key={`${racecourse.nameEn}-${course.name}`}>
                              {course.variant ? (
                                <span className={styles.courseLink}>{course.name}</span>
                              ) : (
                                <Link href={getCourseUrl(racecourse, course)} className={styles.courseLink}>
                                  {course.name}
                                </Link>
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>

                    {/* Dirt courses */}
                    <div className={styles.surfaceGroup}>
                      <ul className={`${styles.courseList} ${styles.dirtCourseList}`}>
                        {racecourse.courses
                          .filter((c) => c.surface === 'dirt')
                          .map((course) => (
                            <li key={`${racecourse.nameEn}-${course.name}`}>
                              {course.variant ? (
                                <span className={styles.courseLink}>{course.name}</span>
                              ) : (
                                <Link href={getCourseUrl(racecourse, course)} className={styles.courseLink}>
                                  {course.name}
                                </Link>
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Center Column - Jockey & Trainer */}
        <div className={styles.footerColumn}>
          <h3 className={styles.columnTitle}>騎手・調教師</h3>
          <ul className={styles.linkList}>
            <li>
              <Link href="#" className={styles.footerLink}>
                騎手別成績
              </Link>
            </li>
            <li>
              <Link href="#" className={styles.footerLink}>
                調教師別成績
              </Link>
            </li>
            <li>
              <Link href="#" className={styles.footerLink}>
                ペアリング分析
              </Link>
            </li>
          </ul>
        </div>

        {/* Right Column - Content */}
        <div className={styles.footerColumn}>
          <h3 className={styles.columnTitle}>コンテンツ</h3>
          <ul className={styles.linkList}>
            <li>
              <Link href="#" className={styles.footerLink}>
                分析コラム
              </Link>
            </li>
            <li>
              <Link href="#" className={styles.footerLink}>
                最新記事
              </Link>
            </li>
            <li>
              <Link href="#" className={styles.footerLink}>
                特集
              </Link>
            </li>
          </ul>
        </div>
      </div>
      </div>

      {/* Footer Bottom */}
      <div className={styles.footerBottom}>
        <ul className={styles.footerBottomLinks}>
          <li>
            <Link href="#" className={styles.footerBottomLink}>
              利用規約
            </Link>
          </li>
          <li>
            <Link href="#" className={styles.footerBottomLink}>
              免責事項
            </Link>
          </li>
        </ul>
        <p className={styles.copyright}>© 2024 KEIBA DATA LAB. All rights reserved.</p>
      </div>
    </footer>
  );
}
