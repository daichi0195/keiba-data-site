import Link from 'next/link';
import AIBanner from '@/components/AIBanner';
import TableOfContents from '@/components/TableOfContents';
import CourseSectionNav from '@/components/course/CourseSectionNav';
import pageStyles from '@/app/static-page.module.css';
import s from '@/components/course/course.module.css';

type NavItem = { id: string; label: string };

/**
 * 一覧ページ（/courses, /jockeys, /sires, /trainers）の共通レイアウト
 * コース詳細ページと同じ見た目：#F7F7F7 のキャンバス、PCは左にAIバナー・右に目次。
 * 冒頭はパンくず → h1 → リード → メタ情報 → ページ内ナビ（チップ）
 */
export default function ListPageLayout({
  crumb,
  title,
  lead,
  meta,
  navItems,
  tocItems,
  children,
}: {
  crumb: string;
  title: string;
  lead: React.ReactNode;
  meta?: { label: string; value: React.ReactNode }[];
  /** ページ内ナビ（チップの表示名） */
  navItems: NavItem[];
  /** PCの目次（省略時はチップと同じ） */
  tocItems?: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className={s.canvas}>
      <div className={pageStyles.staticPageContainer}>
        <div className={pageStyles.staticPageColumns3}>
          <aside className={pageStyles.staticPageLeftSidebar}>
            <AIBanner />
          </aside>

          <article>
            <nav className={s.crumb} aria-label="パンくず">
              <Link href="/">HOME</Link>
              <span aria-hidden="true">/</span>
              <span>{crumb}</span>
            </nav>

            <div className={s.hero}>
              <h1 className={s.title}>{title}</h1>
              <p className={s.lead}>{lead}</p>
              {meta && meta.length > 0 && (
                <div className={s.meta}>
                  {meta.map((m) => (
                    <span key={m.label}>
                      {m.label} <b>{m.value}</b>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <CourseSectionNav items={navItems} />

            {children}
          </article>

          {/* PC用：右サイドバー目次 */}
          <TableOfContents items={tocItems ?? navItems} />
        </div>
      </div>
    </div>
  );
}
