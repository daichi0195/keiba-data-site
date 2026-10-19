import s from '@/components/course/course.module.css';
import l from './list.module.css';
import LeadingBars from './LeadingBars';
import NameChips from './NameChips';
import ListPageLayout from './ListPageLayout';
import type { KanaGroup } from './kana';
import type { LeadingData } from '@/lib/getLeadingData';
import { getDataUpdatedAt, formatJaDate, toIsoDate } from '@/lib/dataDate';

/**
 * 騎手・種牡馬・調教師の一覧ページ本体
 * リーディング（任意）→ 五十音順の名前一覧（行ごとにセクション）
 */
export default function NameIndexPage({
  crumb,
  title,
  lead,
  unit,
  groups,
  hrefPrefix,
  leading,
}: {
  crumb: string;
  title: string;
  lead: string;
  /** 件数の単位（名・頭） */
  unit: string;
  groups: KanaGroup[];
  hrefPrefix: string;
  leading?: { title: string; data: LeadingData[] };
}) {
  const total = groups.reduce((sum, g) => sum + g.items.length, 0);
  const updatedAt = getDataUpdatedAt();
  const hasLeading = !!leading && leading.data.length > 0;
  // リーディングは当年の成績（データ更新日の年）
  const leadingYear = updatedAt ? toIsoDate(updatedAt).slice(0, 4) : '';

  const navItems = [
    ...(hasLeading ? [{ id: 'leading-section', label: 'リーディング' }] : []),
    ...groups.map((g) => ({ id: g.slug, label: g.kana })),
  ];
  const tocItems = [
    ...(hasLeading ? [{ id: 'leading-section', label: leading!.title }] : []),
    ...groups.map((g) => ({ id: g.slug, label: g.kana })),
  ];

  return (
    <ListPageLayout
      crumb={crumb}
      title={title}
      lead={lead}
      meta={[
        { label: '掲載', value: `${total.toLocaleString()}${unit}` },
        ...(updatedAt ? [{ label: '更新', value: <time dateTime={toIsoDate(updatedAt)}>{formatJaDate(updatedAt)}</time> }] : []),
      ]}
      navItems={navItems}
      tocItems={tocItems}
    >
      {hasLeading && (
        <section id="leading-section" className={s.section} aria-label={leading!.title}>
          <div className={s.sh}>
            <h2 className={s.h2}>{leading!.title}</h2>
            <p>{leadingYear ? `${leadingYear}年・` : ''}勝ち数の上位{leading!.data.length}{unit}。名前をタップすると詳細へ</p>
          </div>
          <div className={s.card}>
            <LeadingBars data={leading!.data} linkPrefix={hrefPrefix} />
          </div>
        </section>
      )}

      {groups.map((group) => (
        <section key={group.slug} id={group.slug} className={s.section} aria-label={group.kana}>
          <div className={l.shRow}>
            <h2 className={s.h2}>{group.kana}</h2>
            <span className={l.count}>{group.items.length}{unit}</span>
          </div>
          <div className={s.card}>
            <NameChips items={group.items} hrefPrefix={hrefPrefix} />
          </div>
        </section>
      ))}
    </ListPageLayout>
  );
}
