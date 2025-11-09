'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './SectionNav.module.css';

interface Course {
  name: string;
  distance: number;
  surface: 'turf' | 'dirt';
  variant?: string;
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
      { name: '芝 1000m', distance: 1000, surface: 'turf' },
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1500m', distance: 1500, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: 'ダート 1000m', distance: 1000, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '函館競馬場',
    nameEn: 'hakodate',
    courses: [
      { name: '芝 1000m', distance: 1000, surface: 'turf' },
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: 'ダート 1000m', distance: 1000, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '福島競馬場',
    nameEn: 'fukushima',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: 'ダート 1150m', distance: 1150, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '中山競馬場',
    nameEn: 'nakayama',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2500m', distance: 2500, surface: 'turf' },
      { name: '芝 3600m', distance: 3600, surface: 'turf' },
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
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2300m', distance: 2300, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: '芝 2500m', distance: 2500, surface: 'turf' },
      { name: '芝 3400m', distance: 3400, surface: 'turf' },
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
      { name: '芝 1000m', distance: 1000, surface: 'turf' },
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m（内）', distance: 2000, surface: 'turf', variant: 'inner' },
      { name: '芝 2000m（外）', distance: 2000, surface: 'turf', variant: 'outer' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
    ],
  },
  {
    name: '中京競馬場',
    nameEn: 'chukyo',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
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
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m（内）', distance: 1400, surface: 'turf', variant: 'inner' },
      { name: '芝 1400m（外）', distance: 1400, surface: 'turf', variant: 'outer' },
      { name: '芝 1600m（内）', distance: 1600, surface: 'turf', variant: 'inner' },
      { name: '芝 1600m（外）', distance: 1600, surface: 'turf', variant: 'outer' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: '芝 3000m', distance: 3000, surface: 'turf' },
      { name: '芝 3200m', distance: 3200, surface: 'turf' },
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
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: '芝 3000m', distance: 3000, surface: 'turf' },
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
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1700m', distance: 1700, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: 'ダート 1000m', distance: 1000, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
];

export default function SectionNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedRacecourse, setExpandedRacecourse] = useState<Record<string, boolean>>({});

  const toggleRacecourse = (racecourseNameEn: string) => {
    setExpandedRacecourse((prev) => ({
      ...prev,
      [racecourseNameEn]: !prev[racecourseNameEn],
    }));
  };

  const getCourseUrl = (racecourse: Racecourse, course: Course): string => {
    const surfaceEn = course.surface === 'turf' ? 'turf' : 'dirt';
    if (course.variant) {
      return '#';
    }
    return `/courses/${racecourse.nameEn}/${surfaceEn}/${course.distance}`;
  };

  return (
    <>
      {/* ===== モバイル：ハンバーガーメニュー ===== */}
      <button
        className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        type="button"
        aria-label="メニューを開く"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {isMenuOpen && (
        <>
          <div
            className={styles.menuOverlay}
            onClick={() => setIsMenuOpen(false)}
          />
          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuContent}>
              <div className={styles.menuSectionTitle}>コース別データ</div>
              {racecoursesData.map((racecourse) => (
                <div key={racecourse.nameEn} className={styles.accordionItem}>
                  <button
                    className={styles.accordionTrigger}
                    onClick={() => toggleRacecourse(racecourse.nameEn)}
                  >
                    <span className={`${styles.accordionIcon} ${expandedRacecourse[racecourse.nameEn] ? styles.expanded : ''}`}>
                      {expandedRacecourse[racecourse.nameEn] ? '▼' : '▶'}
                    </span>
                    {racecourse.name}
                  </button>

                  {expandedRacecourse[racecourse.nameEn] && (
                    <div className={styles.accordionContent}>
                      {racecourse.courses.map((course) => (
                        <Link
                          key={`${racecourse.nameEn}-${course.name}`}
                          href={getCourseUrl(racecourse, course)}
                          className={`${styles.courseLink} ${course.surface === 'turf' ? styles.turf : styles.dirt}`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {course.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className={styles.menuSectionTitle}>騎手別データ</div>
              <div className={styles.comingSoonBox}>
                Coming Soon
              </div>

              <div className={styles.menuSectionTitle}>調教師別データ</div>
              <div className={styles.comingSoonBox}>
                Coming Soon
              </div>

              <div className={styles.menuSectionTitle}>血統別データ</div>
              <div className={styles.comingSoonBox}>
                Coming Soon
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
