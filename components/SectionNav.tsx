'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './SectionNav.module.css';

type Item = { id: string; label: string };

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
    name: '中山競馬場',
    nameEn: 'nakayama',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
    ],
  },
  {
    name: '東京競馬場',
    nameEn: 'tokyo',
    courses: [
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1600m', distance: 1600, surface: 'dirt' },
    ],
  },
  {
    name: '阪神競馬場',
    nameEn: 'hanshin',
    courses: [
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
    ],
  },
  {
    name: '京都競馬場',
    nameEn: 'kyoto',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
    ],
  },
];

export default function SectionNav({ items }: { items: Item[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedRacecourse, setExpandedRacecourse] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // ★ 交差判定（既存ロジックがある場合はそれを使用）
  useEffect(() => {
    const sections = items
      .map(i => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el);

    const io = new IntersectionObserver(
      (entries) => {
        // 一番 viewport 上部に近いものをactiveに
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));

        if (visible[0]) {
          const id = visible[0].target.id;
          setActiveId(id);
        }
      },
      {
        root: null,
        threshold: [0.1, 0.25, 0.5],
        rootMargin: '-20% 0px -60% 0px', // 上を優先（調整可）
      }
    );

    sections.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // クリック時に該当セクションへスムーズスクロール
    const y = el.getBoundingClientRect().top + window.scrollY - 80; // ヘッダーぶん調整
    window.scrollTo({ top: y, behavior: 'smooth' });
    // メニューを閉じる
    setIsMenuOpen(false);
  };

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
      {/* ハンバーガーメニューボタン */}
      <button
        className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        type="button"
        aria-label="メニューを開く"
      >
        {!isMenuOpen ? (
          <>
            <span></span>
            <span></span>
            <span></span>
          </>
        ) : (
          <span className={styles.closeIcon}>✕</span>
        )}
      </button>

      {/* モバイルメニュー */}
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
            </div>
          </div>
        </>
      )}
    </>
  );
}
