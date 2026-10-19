import s from '@/components/course/course.module.css';
import t from './trainer.module.css';
import LinkStatsTable, { type LinkStatRow } from '@/components/datapage/shared/LinkStatsTable';

// 関連データ・注目ポイントは3ページ共通の部品（components/datapage/shared/RelatedLinksCard・HighlightCoursesCard）を使う

// ------------------------------------------------------------
// コース別成績（競馬場ごとに開閉。最大値は競馬場ごとに判定＝現行仕様）
// ------------------------------------------------------------

export interface CourseGroup {
  racecourse_ja: string;
  racecourse_en: string;
  rows: LinkStatRow[];
}

export function CourseGroupsCard({ groups }: { groups: CourseGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className={s.card}>
        <p className={s.note}>該当データがありません。</p>
      </div>
    );
  }
  return (
    <div className={`${s.card} ${t.groups}`}>
      {groups.map((g) => (
        <details key={g.racecourse_en} className={t.group}>
          <summary>
            <span>{g.racecourse_ja}</span>
            <small className={s.num}>{g.rows.length}コース</small>
          </summary>
          <LinkStatsTable rows={g.rows} keyLabel="コース" />
        </details>
      ))}
    </div>
  );
}
