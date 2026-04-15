import Link from 'next/link';
import TableOfContents from '@/components/TableOfContents';
import AIBanner from '@/components/AIBanner';
import styles from '@/app/static-page.module.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  pageName: string;
  children: React.ReactNode;
  noToc?: boolean;
  noLeftSidebar?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  bookmarkOnly?: boolean;
}

export default function StaticPageLayout({ pageName, children, noToc, noLeftSidebar, breadcrumbs, bookmarkOnly }: Props) {
  return (
    <div className={styles.staticPageContainer}>
      {/* パンくずリスト */}
      <nav className={styles.staticPageBreadcrumb}>
        <Link href="/">HOME</Link>
        {breadcrumbs ? (
          breadcrumbs.map((item, i) => (
            <span key={i}>
              <span> &gt; </span>
              {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
            </span>
          ))
        ) : (
          <>
            <span> &gt; </span>
            <span>{pageName}</span>
          </>
        )}
      </nav>

      <div className={noLeftSidebar ? styles.staticPageColumns : styles.staticPageColumns3}>
        {/* 左サイドバー */}
        {!noLeftSidebar && (
          <aside className={styles.staticPageLeftSidebar}>
            <AIBanner />
          </aside>
        )}

        {/* メインコンテンツ（article にすることでTOCの自動検出が機能する） */}
        <article className={styles.staticPageMain}>
          {children}
        </article>

        {/* 右サイドバー: 目次 */}
        <TableOfContents hideToc={noToc} bookmarkOnly={bookmarkOnly} />
      </div>
    </div>
  );
}
