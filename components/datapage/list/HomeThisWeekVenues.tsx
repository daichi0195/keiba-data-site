import s from '@/components/course/course.module.css';
import l from './list.module.css';
import CourseRows, { type SurfaceRow } from './CourseRows';
import type { Venue, VenueCourse } from '@/lib/thisWeekVenues';

// 距離チップの表示（馬場名はバッジで示すので除く）
const chipLabel = (c: VenueCourse) => `${c.distance}m${c.variant ? `(${c.variant === 'inner' ? '内' : '外'})` : ''}`;

/**
 * トップ：今週開催の競馬場
 * 現行は競馬場をタブで切り替えていたが、中身を切り替えないルールに合わせて全競馬場を縦に並べる。
 * リンク先は現行と同じ。
 */
export default function HomeThisWeekVenues({ venues }: { venues: Venue[] }) {
  if (venues.length === 0) return null;

  return (
    <section className={s.section} aria-label="今週開催の競馬場">
      <div className={s.sh}>
        <h2 className={s.h2}>今週開催の競馬場</h2>
      </div>
      <div className={s.card}>
        {venues.map((venue) => {
          const rows: SurfaceRow[] = [
            {
              surface: 'turf',
              courses: venue.courses.turf.map((c) => ({
                href: `/courses/${venue.id}/turf/${c.distance}${c.variant ? `-${c.variant}` : ''}`,
                label: chipLabel(c),
              })),
            },
            {
              surface: 'dirt',
              courses: venue.courses.dirt.map((c) => ({ href: `/courses/${venue.id}/dirt/${c.distance}`, label: chipLabel(c) })),
            },
            {
              surface: 'steeplechase',
              courses: (venue.courses.steeplechase ?? []).map((c) => ({
                href: `/courses/${venue.id}/steeplechase/${c.distance}`,
                label: chipLabel(c),
              })),
            },
          ];
          return (
            <div key={venue.id} className={l.venueBlock}>
              <h3>{venue.name}</h3>
              <CourseRows rows={rows} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
