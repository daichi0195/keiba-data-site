import { Metadata } from 'next';
import ListPageLayout from '@/components/datapage/list/ListPageLayout';
import CourseRows from '@/components/datapage/list/CourseRows';
import { RACECOURSE_ROWS } from '@/components/datapage/list/racecourseData';
import s from '@/components/course/course.module.css';
import { getDataUpdatedAt, formatJaDate, toIsoDate } from '@/lib/dataDate';

export const metadata: Metadata = {
  title: 'コース別データ一覧｜全競馬場の傾向・特徴【毎週更新】',
  description: 'JRA全10競馬場のコース別に、枠順・脚質・血統・騎手の傾向を比較できるデータ一覧。直近3年のデータで毎週更新。',
  alternates: {
    canonical: 'https://www.keibadata.com/courses',
  },
};

export default function CoursesPage() {
  const updatedAt = getDataUpdatedAt();
  const totalCourses = RACECOURSE_ROWS.reduce(
    (sum, rc) => sum + rc.counts.turf + rc.counts.dirt + rc.counts.steeplechase,
    0
  );
  const navItems = RACECOURSE_ROWS.map((rc) => ({ id: `rc-${rc.id}`, label: rc.name.replace('競馬場', '') }));
  const tocItems = RACECOURSE_ROWS.map((rc) => ({ id: `rc-${rc.id}`, label: rc.name }));

  return (
    <ListPageLayout
      crumb="コースデータ一覧"
      title="コースデータ一覧"
      lead="直近3年間でレースが行われた全てのコースを対象としています。"
      meta={[
        { label: '掲載', value: `${RACECOURSE_ROWS.length}競馬場・${totalCourses}コース` },
        ...(updatedAt ? [{ label: '更新', value: <time dateTime={toIsoDate(updatedAt)}>{formatJaDate(updatedAt)}</time> }] : []),
      ]}
      navItems={navItems}
      tocItems={tocItems}
    >
      {RACECOURSE_ROWS.map((rc) => (
        <section key={rc.id} id={`rc-${rc.id}`} className={s.section} aria-label={rc.name}>
          <div className={s.sh}>
            <h2 className={s.h2}>{rc.name}</h2>
          </div>
          <div className={`${s.card} ${s.courses}`}>
            <CourseRows rows={rc.rows} />
          </div>
        </section>
      ))}
    </ListPageLayout>
  );
}
