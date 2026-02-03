import Link from 'next/link';
import styles from './CoursesList.module.css';
import listStyles from './shared-list.module.css';
import { getCoursesByRacecourse, getCourseUrl } from '@/lib/courses';

const racecoursesData = getCoursesByRacecourse().map(group => ({
  name: group.racecourse_ja,
  nameEn: group.racecourse,
  courses: group.courses
}));

export default function CoursesList() {
  return (
    <div className={listStyles.groupList}>
      {racecoursesData.map((racecourse) => {
        const turfCourses = racecourse.courses.filter((c) => c.surface === 'turf');
        const dirtCourses = racecourse.courses.filter((c) => c.surface === 'dirt');
        const steeplechaseCourses = racecourse.courses.filter((c) => c.surface === 'steeplechase');

        return (
          <div key={racecourse.nameEn} className={listStyles.groupSection}>
            <h2 className={listStyles.groupTitle}>{racecourse.name}</h2>

            <div className={styles.surfaceGroups}>
              {turfCourses.length > 0 && (
                <div className={listStyles.dataCardGrid}>
                  {turfCourses.map((course, idx) => (
                    <Link
                      key={`${course.racecourse}-${course.surface}-${course.distance}-${course.variant || idx}`}
                      href={getCourseUrl(course)}
                      className={`${styles.courseLink} ${styles.turfLink}`}
                    >
                      {course.variant
                        ? `芝${course.distance}m(${course.variant === 'inner' ? '内' : '外'})`
                        : `芝${course.distance}m`
                      }
                    </Link>
                  ))}
                </div>
              )}

              {dirtCourses.length > 0 && (
                <div className={listStyles.dataCardGrid}>
                  {dirtCourses.map((course, idx) => (
                    <Link
                      key={`${course.racecourse}-${course.surface}-${course.distance}-${course.variant || idx}`}
                      href={getCourseUrl(course)}
                      className={`${styles.courseLink} ${styles.dirtLink}`}
                    >
                      {`ダート${course.distance}m`}
                    </Link>
                  ))}
                </div>
              )}

              {steeplechaseCourses.length > 0 && (
                <div className={listStyles.dataCardGrid}>
                  {steeplechaseCourses.map((course, idx) => (
                    <Link
                      key={`${course.racecourse}-${course.surface}-${course.distance}-${course.variant || idx}`}
                      href={getCourseUrl(course)}
                      className={`${styles.courseLink} ${styles.steeplechaseLink}`}
                    >
                      {`障害${course.distance}m`}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
