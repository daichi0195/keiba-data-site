import Link from 'next/link';
import { ALL_COURSES, getCourseUrl, getCourseDisplayName } from '@/lib/courses';
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
      {/* ブックマーク登録バナー */}
      <div className={styles.bookmarkBanner}>
        <div className={styles.bookmarkIcon}>🔖</div>
        <div className={styles.bookmarkTitle}>毎週の予想に活用しよう！</div>
        <div className={styles.bookmarkCommand}>Ctrl+D / ⌘+D</div>
        <div className={styles.bookmarkSubtitle}>でブックマークに登録！</div>
      </div>

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
                  href={getCourseUrl(course)}
                  className={`${styles.courseBtn} ${styles.courseBtnTurf}`}
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
                  href={getCourseUrl(course)}
                  className={`${styles.courseBtn} ${styles.courseBtnDirt}`}
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
                  href={getCourseUrl(course)}
                  className={`${styles.courseBtn} ${styles.courseBtnSteeplechase}`}
                >
                  {getCourseDisplayName(course)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
