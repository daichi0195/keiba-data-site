import s from '@/components/course/course.module.css';
import l from './list.module.css';
import CourseRows from './CourseRows';
import { RACECOURSE_ROWS } from './racecourseData';

/**
 * トップ：コース別データ（全10競馬場）
 * 現行と同じく競馬場ごとに開閉。閉じていてもリンクは HTML に含まれる（details 要素）
 */
export default function HomeAllVenues() {
  return (
    <section className={s.section} aria-label="コース別データ">
      <div className={s.sh}>
        <h2 className={s.h2}>コース別データ</h2>
      </div>
      <div className={`${s.card} ${l.acc} ${l.accTwo}`}>
        {RACECOURSE_ROWS.map((rc) => (
          <details key={rc.id}>
            <summary>
              <h3 className={l.accName}>{rc.name}</h3>
              <span className={l.accMeta}>
                {rc.counts.turf > 0 && <span className={`${s.badge} ${s.badgeTurf}`}>芝 {rc.counts.turf}</span>}
                {rc.counts.dirt > 0 && <span className={`${s.badge} ${s.badgeDirt}`}>ダ {rc.counts.dirt}</span>}
                {rc.counts.steeplechase > 0 && <span className={`${s.badge} ${l.badgePlain}`}>障 {rc.counts.steeplechase}</span>}
              </span>
            </summary>
            <div className={l.accBody}>
              <CourseRows rows={rc.rows} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
