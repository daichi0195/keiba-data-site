import s from '@/components/course/course.module.css';
import l from './list.module.css';
import LeadingBars from './LeadingBars';
import NameChips from './NameChips';
import type { KanaGroup } from './kana';
import type { LeadingData } from '@/lib/getLeadingData';

/**
 * トップ：騎手別・血統（種牡馬）別・調教師別データ
 * リーディング（横棒）のカードと、五十音順の全件一覧（行ごとに開閉）のカードを並べる
 */
export default function HomeLeadingSection({
  title,
  leadingTitle,
  leading,
  allTitle,
  allDescription,
  groups,
  hrefPrefix,
  unit,
}: {
  title: string;
  leadingTitle: string;
  leading: LeadingData[];
  allTitle: string;
  allDescription: string;
  groups: KanaGroup[];
  hrefPrefix: string;
  unit: string;
}) {
  return (
    <section className={s.section} aria-label={title}>
      <div className={s.sh}>
        <h2 className={s.h2}>{title}</h2>
      </div>
      <div className={l.cardStack}>
        {leading.length > 0 && (
          <div className={s.card}>
            <div className={l.lHead}>
              <h3>{leadingTitle}</h3>
              <span className={s.note}>勝ち数順</span>
            </div>
            <LeadingBars data={leading} linkPrefix={hrefPrefix} />
          </div>
        )}
        <div className={s.card}>
          <div className={l.lHead}>
            <h3>{allTitle}</h3>
          </div>
          <p className={l.desc}>{allDescription}</p>
          <div className={`${l.acc} ${l.accTwo}`}>
            {groups.map((group) => (
              <details key={group.slug}>
                <summary>
                  <span className={l.accName}>{group.kana}</span>
                  <span className={`${l.accMeta} ${l.count}`}>
                    {group.items.length}
                    {unit}
                  </span>
                </summary>
                <div className={l.accBody}>
                  <NameChips items={group.items} hrefPrefix={hrefPrefix} />
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
