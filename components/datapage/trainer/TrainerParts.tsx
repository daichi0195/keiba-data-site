import Link from 'next/link';
import s from '@/components/course/course.module.css';
import t from './trainer.module.css';
import LinkStatsTable, { type LinkStatRow } from './LinkStatsTable';
import { MIN_RACES_FOR_MENTION } from '@/lib/dataPageRules';

// ------------------------------------------------------------
// 関連データ（現行 RelatedLinks と同じ選び方：リンク先があり20走以上の行を複勝率順に5件）
// ------------------------------------------------------------

export interface RelatedRow {
  name?: string;
  link?: string;
  races?: number;
  place_rate?: number;
}

export interface RelatedGroup {
  heading: string;
  rows: RelatedRow[];
  label?: (row: RelatedRow) => string;
}

function pickTop(rows: RelatedRow[], limit: number): RelatedRow[] {
  return rows
    .filter((r) => r.link && r.name && (r.races ?? 0) >= MIN_RACES_FOR_MENTION)
    .sort((a, b) => (b.place_rate ?? 0) - (a.place_rate ?? 0))
    .slice(0, limit);
}

/** 関連データの節（見出し＋カード）。リンク先が1件もなければ節ごと出さない */
export function RelatedSection({ title, groups, limit = 5 }: { title: string; groups: RelatedGroup[]; limit?: number }) {
  const picked = groups.map((g) => ({ ...g, top: pickTop(g.rows, limit) })).filter((g) => g.top.length > 0);
  if (picked.length === 0) return null;
  return (
    <nav className={s.section} aria-label={title}>
      <div className={s.sh}><h2 className={s.h2}>{title}</h2></div>
      <div className={`${s.card} ${s.article}`}>
        {picked.map((g) => (
          <div key={g.heading} className={s.blk}>
            <h3>{g.heading}</h3>
            <ul className={t.relList}>
              {g.top.map((r) => (
                <li key={r.link}>
                  <Link href={r.link!} className={s.textLink}>
                    {g.label ? g.label(r) : r.name}
                  </Link>
                  <span className={`${t.relRate} ${s.num}`}>複勝率{r.place_rate?.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

// ------------------------------------------------------------
// 注目ポイント（得意なコース TOP5 / 苦手なコース TOP5）
// ------------------------------------------------------------

export interface HighlightCourse extends LinkStatRow {
  shortName: string;
}

function CourseChips({ items, kind }: { items: HighlightCourse[]; kind: 'good' | 'bad' }) {
  if (items.length === 0) return <span className={s.none}>該当なし</span>;
  return (
    <div className={s.chips}>
      {items.map((c) =>
        c.link ? (
          <Link key={`${c.label}-${c.shortName}`} href={c.link} className={`${s.nm} ${s[kind]}`}>
            {c.shortName}
          </Link>
        ) : (
          <span key={`${c.label}-${c.shortName}`} className={`${s.nm} ${s[kind]}`}>
            {c.shortName}
          </span>
        )
      )}
    </div>
  );
}

export function HighlightCoursesCard({ top, bottom }: { top: HighlightCourse[]; bottom: HighlightCourse[] }) {
  return (
    <div className={`${s.card} ${t.pickWide}`}>
      <div className={s.grp}>
        <span className={s.gl}>得意なコース TOP5（複勝率が高い順）</span>
        <CourseChips items={top} kind="good" />
      </div>
      <div className={s.grp}>
        <span className={s.gl}>苦手なコース TOP5（複勝率が低い順）</span>
        <CourseChips items={bottom} kind="bad" />
      </div>
      <details className={s.more}>
        <summary>
          全項目を見る<small>13項目・横にスクロール</small>
        </summary>
        {top.length > 0 && (
          <>
            <h3 className={t.subH}>得意なコース TOP5</h3>
            <LinkStatsTable rows={top} keyLabel="コース" highlight={false} />
          </>
        )}
        {bottom.length > 0 && (
          <>
            <h3 className={t.subH}>苦手なコース TOP5</h3>
            <LinkStatsTable rows={bottom} keyLabel="コース" highlight={false} />
          </>
        )}
      </details>
    </div>
  );
}

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
