import Link from 'next/link';
import s from '@/components/course/course.module.css';
import r from './shared.module.css';
import { formatStat } from '@/components/course/statColumns';

export interface RelatedGroup {
  heading: string;
  items: { label: string; href: string; place_rate?: number }[];
}

/** 関連データ（複勝率上位の名前やコースへのリンク一覧）。全データページ共通 */
export default function RelatedLinksCard({ groups }: { groups: RelatedGroup[] }) {
  const visible = groups.filter((g) => g.items.length > 0);
  if (visible.length === 0) return null;
  return (
    <div className={`${s.card} ${s.article}`}>
      {visible.map((g) => (
        <div key={g.heading} className={s.blk}>
          <h3>{g.heading}</h3>
          <ul className={r.relList}>
            {g.items.map((it) => (
              <li key={it.href}>
                <Link href={it.href} className={s.textLink}>
                  {it.label}
                </Link>
                {typeof it.place_rate === 'number' && (
                  <span className={r.relRate}>複勝率{formatStat(it.place_rate, 'pct')}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
