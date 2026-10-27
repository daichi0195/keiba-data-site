'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ALL_COURSES, getCourseUrl, getCourseDisplayName } from '@/lib/courses';
import AIBanner from './AIBanner';
import styles from './CourseSidebar.module.css';

interface CourseSidebarProps {
  racecourse: string;   // 英語名（例: 'nakayama'）
  racecourseJa: string; // 短縮日本語名（例: '中山'）
}

type CourseItem = (typeof ALL_COURSES)[number];

const sortCourses = (a: CourseItem, b: CourseItem) => {
  if (a.distance !== b.distance) return a.distance - b.distance;
  const aVariant = 'variant' in a ? a.variant : undefined;
  const bVariant = 'variant' in b ? b.variant : undefined;
  const order = { inner: 1, outer: 2 };
  return (order[aVariant as keyof typeof order] || 0) - (order[bVariant as keyof typeof order] || 0);
};

export default function CourseSidebar({ racecourse, racecourseJa }: CourseSidebarProps) {
  // 表示中のコースを選択色で示す（URL末尾のスラッシュは無視）
  const pathname = (usePathname() || '').replace(/\/$/, '');
  const linkProps = (href: string, extra: string) => {
    const current = pathname === href;
    return {
      href,
      className: `${styles.courseBtn} ${extra} ${current ? styles.courseBtnCurrent : ''}`,
      'aria-current': current ? ('page' as const) : undefined,
    };
  };
  const turfCourses = ALL_COURSES
    .filter(c => c.racecourse === racecourse && c.surface === 'turf')
    .sort(sortCourses);
  const dirtCourses = ALL_COURSES
    .filter(c => c.racecourse === racecourse && c.surface === 'dirt')
    .sort(sortCourses);
  const steeplechaseCourses = ALL_COURSES
    .filter(c => c.racecourse === racecourse && c.surface === 'steeplechase')
    .sort(sortCourses);

  return (
    <div className={styles.sidebar}>
      {/* 他のコース一覧 */}
      <div className={styles.coursesSection}>
        <h2 className={styles.sectionTitle}>{racecourseJa}競馬場のコース一覧</h2>

        {turfCourses.length > 0 && (
          <div className={styles.surfaceGroup}>
            <span className={`${styles.surfaceLabel} ${styles.surfaceLabelTurf}`}>芝</span>
            <div className={styles.grid}>
              {turfCourses.map(course => (
                <Link
                  key={`turf-${course.distance}-${('variant' in course ? course.variant : undefined) || 'default'}`}
                  {...linkProps(getCourseUrl(course), styles.courseBtnTurf)}
                >
                  {getCourseDisplayName(course)}
                </Link>
              ))}
            </div>
          </div>
        )}

        {dirtCourses.length > 0 && (
          <div className={styles.surfaceGroup}>
            <span className={`${styles.surfaceLabel} ${styles.surfaceLabelDirt}`}>ダート</span>
            <div className={styles.grid}>
              {dirtCourses.map(course => (
                <Link
                  key={`dirt-${course.distance}-${('variant' in course ? course.variant : undefined) || 'default'}`}
                  {...linkProps(getCourseUrl(course), styles.courseBtnDirt)}
                >
                  {getCourseDisplayName(course)}
                </Link>
              ))}
            </div>
          </div>
        )}

        {steeplechaseCourses.length > 0 && (
          <div className={styles.surfaceGroup}>
            <span className={`${styles.surfaceLabel} ${styles.surfaceLabelSteeplechase}`}>障害</span>
            <div className={styles.grid}>
              {steeplechaseCourses.map(course => (
                <Link
                  key={`steeplechase-${course.distance}-${('variant' in course ? course.variant : undefined) || 'default'}`}
                  {...linkProps(getCourseUrl(course), styles.courseBtnSteeplechase)}
                >
                  {getCourseDisplayName(course)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ブックマーク訴求 */}
      <AIBanner bookmarkOnly />
    </div>
  );
}
