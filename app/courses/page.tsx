import { Metadata } from 'next';
import { ALL_COURSES, getCourseUrl, getCoursesByRacecourse } from '@/lib/courses';
import { getThisWeekVenues } from '@/lib/thisWeekVenues';
import CourseIndex, { type Surface, type VenueData } from '@/components/v6/list/CourseIndex';
import { Hero, Tail } from '@/components/v6/list/parts';
import { ROOT } from '@/components/v6/list/cx';

export const metadata: Metadata = {
  title: 'コース別データ一覧｜全競馬場の傾向・特徴【毎週更新】',
  description: 'JRA全10競馬場のコース別に、枠順・脚質・血統・騎手の傾向を比較できるデータ一覧。直近3年のデータで毎週更新。',
  alternates: {
    canonical: 'https://www.keibadata.com/courses',
  },
};

type Course = (typeof ALL_COURSES)[number];
const SURFS: Surface[] = ['turf', 'dirt', 'steeplechase'];
const variantOf = (c: Course) => (c as { variant?: 'inner' | 'outer' }).variant;

export default async function CoursesPage() {
  const week = new Set((await getThisWeekVenues()).map((v) => v.id));
  // 北から南の10競馬場。馬場（芝→ダート→障害）ごとに、距離→内外の順（見本 lib.mjs の of()）
  const venues: VenueData[] = getCoursesByRacecourse().map((g) => ({
    id: g.racecourse,
    name: g.racecourse_ja.replace('競馬場', ''),
    week: week.has(g.racecourse),
    rows: SURFS.map((sf) => ({
      sf,
      cells: (g.courses as readonly Course[])
        .filter((c) => c.surface === sf)
        .sort((a, b) => a.distance - b.distance || (variantOf(a) || '').localeCompare(variantOf(b) || ''))
        .map((c) => ({ href: getCourseUrl(c), d: c.distance, v: variantOf(c) === 'inner' ? '内' : variantOf(c) === 'outer' ? '外' : '' })),
    })).filter((r) => r.cells.length > 0),
  }));
  const total = venues.reduce((s, v) => s + v.rows.reduce((t, r) => t + r.cells.length, 0), 0);

  return (
    <main className={ROOT}>
      <Hero title="コースデータ一覧" lead="直近3年間でレースが行われた全てのコースを対象としています。" count={`${venues.length}競馬場・${total}コース`} />
      <CourseIndex venues={venues}>
        <Tail current="course" />
      </CourseIndex>
    </main>
  );
}
