import Link from 'next/link';
import s from '@/components/course/course.module.css';
import r from './shared.module.css';
import LinkStatsTable, { type LinkStatRow } from './LinkStatsTable';

/** 注目ポイントの対象（出走数の下限）。騎手・種牡馬・調教師ページ共通 */
export const MIN_RACES_FOR_HIGHLIGHT = 10;

export interface HighlightCourseRow extends LinkStatRow {
  /** チップに出す短いコース名（例：京都芝1400m外） */
  shortName: string;
}

function CourseChips({ items, kind }: { items: HighlightCourseRow[]; kind: 'good' | 'bad' }) {
  if (items.length === 0) return <span className={s.none}>該当なし</span>;
  return (
    <div className={s.chips}>
      {items.map((c, i) =>
        c.link ? (
          <Link key={`${c.link}-${i}`} href={c.link} className={`${s.nm} ${s[kind]}`}>
            {c.shortName}
          </Link>
        ) : (
          <span key={`${c.shortName}-${i}`} className={`${s.nm} ${s[kind]}`}>
            {c.shortName}
          </span>
        )
      )}
    </div>
  );
}

/**
 * 注目ポイント：得意なコース TOP5／苦手なコース TOP5（騎手・種牡馬・調教師ページ共通）
 * 名前のチップ＋「得意なコースTOP5」「苦手なコースTOP5」の2つの開閉で13項目の表
 */
export default function HighlightCoursesCard({ top, bottom }: { top: HighlightCourseRow[]; bottom: HighlightCourseRow[] }) {
  return (
    <div className={`${s.card} ${r.pickCard}`}>
      <div className={s.grp}>
        <span className={s.gl}>得意なコース TOP5（{MIN_RACES_FOR_HIGHLIGHT}走以上・複勝率が高い順）</span>
        <CourseChips items={top} kind="good" />
      </div>
      <div className={s.grp}>
        <span className={s.gl}>苦手なコース TOP5（{MIN_RACES_FOR_HIGHLIGHT}走以上・複勝率が低い順）</span>
        <CourseChips items={bottom} kind="bad" />
      </div>
      <div>
        {top.length > 0 && (
          <details className={s.more}>
            <summary>
              得意なコース TOP5<small>13項目・横にスクロール</small>
            </summary>
            <LinkStatsTable rows={top} keyLabel="コース" highlight={false} />
          </details>
        )}
        {bottom.length > 0 && (
          <details className={s.more}>
            <summary>
              苦手なコース TOP5<small>13項目・横にスクロール</small>
            </summary>
            <LinkStatsTable rows={bottom} keyLabel="コース" highlight={false} />
          </details>
        )}
      </div>
    </div>
  );
}
