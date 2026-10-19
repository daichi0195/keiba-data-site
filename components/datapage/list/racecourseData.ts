/**
 * 競馬場ごとのコース一覧（芝・ダート・障害の行）を組み立てる
 */
import { ALL_COURSES, getCoursesByRacecourse, getCourseUrl, getCourseDisplayName } from '@/lib/courses';

type Course = (typeof ALL_COURSES)[number];
import type { SurfaceRow } from './CourseRows';

export interface RacecourseRows {
  id: string;
  name: string;
  counts: { turf: number; dirt: number; steeplechase: number };
  rows: SurfaceRow[];
}

export const RACECOURSE_ROWS: RacecourseRows[] = getCoursesByRacecourse().map((group) => {
  const bySurface = (surface: SurfaceRow['surface']) =>
    group.courses
      .filter((c: Course) => c.surface === surface)
      .map((c: Course) => ({ href: getCourseUrl(c), label: getCourseDisplayName(c).replace(c.surface_ja, '') }));
  const turf = bySurface('turf');
  const dirt = bySurface('dirt');
  const steeplechase = bySurface('steeplechase');
  return {
    id: group.racecourse,
    name: group.racecourse_ja,
    counts: { turf: turf.length, dirt: dirt.length, steeplechase: steeplechase.length },
    rows: [
      { surface: 'turf', courses: turf },
      { surface: 'dirt', courses: dirt },
      { surface: 'steeplechase', courses: steeplechase },
    ],
  };
});
