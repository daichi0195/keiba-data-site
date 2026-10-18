import Link from 'next/link';
import styles from './RelatedLinks.module.css';
import { MIN_RACES_FOR_MENTION } from '@/lib/dataPageRules';

export interface RelatedLinkRow {
  name?: string;
  link?: string;
  races?: number;
  place_rate?: number;
}

export interface RelatedLinkGroup {
  heading: string;
  rows: RelatedLinkRow[];
  /** リンクの表示名（省略時は name） */
  label?: (row: RelatedLinkRow) => string;
}

/**
 * 複勝率の高い順に、リンク先のある行を上位 limit 件選ぶ
 * 出走数が少ない行は偶然の影響が大きいため MIN_RACES_FOR_MENTION 走以上に限る
 */
function pickTop(rows: RelatedLinkRow[], limit: number): RelatedLinkRow[] {
  return rows
    .filter((r) => r.link && r.name && (r.races ?? 0) >= MIN_RACES_FOR_MENTION)
    .sort((a, b) => (b.place_rate ?? 0) - (a.place_rate ?? 0))
    .slice(0, limit);
}

/**
 * データ概要の直後に置く関連ページへのリンク（サーバーコンポーネント）
 * 詳細ページ同士（騎手→コース、コース→騎手・種牡馬など）を直接つなぎ、回遊とクロールを助ける
 */
export default function RelatedLinks({ title, groups, limit = 5 }: { title: string; groups: RelatedLinkGroup[]; limit?: number }) {
  const picked = groups
    .map((g) => ({ ...g, top: pickTop(g.rows, limit) }))
    .filter((g) => g.top.length > 0);
  if (picked.length === 0) return null;

  return (
    <nav className={styles.related} aria-label={title}>
      <h2 className={styles.title}>{title}</h2>
      {picked.map((g) => (
        <div key={g.heading} className={styles.group}>
          <h3 className={styles.heading}>{g.heading}</h3>
          <ul className={styles.list}>
            {g.top.map((r) => (
              <li key={r.link}>
                <Link href={r.link!} className={styles.chip}>
                  {g.label ? g.label(r) : r.name}
                  <span className={styles.rate}>複勝率{r.place_rate?.toFixed(1)}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
