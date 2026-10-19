import Link from 'next/link';
import s from '@/components/course/course.module.css';
import l from './list.module.css';

export interface CourseChip {
  href: string;
  /** チップの表示（距離のみ。例「2000m(内)」） */
  label: string;
}

export interface SurfaceRow {
  surface: 'turf' | 'dirt' | 'steeplechase';
  courses: CourseChip[];
}

const SURFACE_LABEL = { turf: '芝', dirt: 'ダート', steeplechase: '障害' } as const;

/**
 * 馬場ごとの行（左に芝／ダート／障害のバッジ、右に距離チップを折り返し）
 * コースページの「同じ競馬場の他コース」と同じ見た目
 */
export default function CourseRows({ rows }: { rows: SurfaceRow[] }) {
  return (
    <>
      {rows
        .filter((row) => row.courses.length > 0)
        .map((row) => (
          <div key={row.surface} className={s.crow}>
            <span className={`${s.badge} ${row.surface === 'turf' ? s.badgeTurf : row.surface === 'dirt' ? s.badgeDirt : l.badgePlain}`}>
              {SURFACE_LABEL[row.surface]}
            </span>
            <div className={s.cchips}>
              {row.courses.map((c) => (
                <Link key={c.href} href={c.href} className={`${s.chip} ${l.nameChip}`}>
                  {/* リンク文言は現行どおり「芝1200m」。馬場名はバッジで見えているので読み上げ・検索用に残す */}
                  <span className="visually-hidden">{SURFACE_LABEL[row.surface]}</span>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
    </>
  );
}
