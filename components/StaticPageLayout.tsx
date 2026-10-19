import { Fragment } from 'react';
import Link from 'next/link';
import TableOfContents from '@/components/TableOfContents';
import AIBanner from '@/components/AIBanner';
import styles from '@/app/static-page.module.css';
import s from '@/components/course/course.module.css';
import st from '@/components/datapage/static/static.module.css';

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
  /**
   * 指定すると新デザイン（docs/redesign/tonmana.md）で描画する。
   * キャンバス上にパンくず → h1 → リードを置き、本文は StaticSection の白カードで並べる。
   * 未指定のページ（AI・コラムなど）は従来の見た目のまま。
   */
  title?: string;
  lead?: React.ReactNode;
}

export default function StaticPageLayout({ pageName, children, noToc, noLeftSidebar, breadcrumbs, bookmarkOnly, title, lead }: Props) {
  if (title) {
    const crumbs: BreadcrumbItem[] = breadcrumbs ?? [{ label: pageName }];
    return (
      <div className={s.canvas}>
        <div className={styles.staticPageContainer}>
          <div className={noLeftSidebar ? styles.staticPageColumns : styles.staticPageColumns3}>
            {!noLeftSidebar && (
              <aside className={styles.staticPageLeftSidebar}>
                <AIBanner />
              </aside>
            )}

            {/* article にすることでTOCの自動検出（h2）が機能する */}
            <article>
              <nav className={s.crumb} aria-label="パンくず">
                <Link href="/">HOME</Link>
                {crumbs.map((item, i) => (
                  <Fragment key={i}>
                    <span aria-hidden="true">/</span>
                    {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
                  </Fragment>
                ))}
              </nav>

              <div className={s.hero}>
                <h1 className={s.title}>{title}</h1>
                {lead && <p className={`${s.lead} ${st.lead}`}>{lead}</p>}
              </div>

              {children}
            </article>

            <TableOfContents hideToc={noToc} bookmarkOnly={bookmarkOnly} />
          </div>
        </div>
      </div>
    );
  }

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

/** 固定ページの1セクション：キャンバス上の見出し（h2）＋白カードの本文 */
export function StaticSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className={s.section}>
      {title && (
        <div className={s.sh}>
          <h2 className={s.h2}>{title}</h2>
        </div>
      )}
      <div className={`${s.card} ${st.prose}`}>{children}</div>
    </section>
  );
}

/** 本文中のリンクに付けるクラス（#2563EB＋下線） */
export const staticLink = st.link;
