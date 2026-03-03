import Link from 'next/link';
import TableOfContents from '@/components/TableOfContents';
import styles from '@/app/static-page.module.css';

interface Props {
  pageName: string;
  children: React.ReactNode;
  noToc?: boolean;
}

export default function StaticPageLayout({ pageName, children, noToc }: Props) {
  return (
    <div className={styles.staticPageContainer}>
      {/* パンくずリスト */}
      <nav className={styles.staticPageBreadcrumb}>
        <Link href="/">HOME</Link>
        <span> &gt; </span>
        <span>{pageName}</span>
      </nav>

      {/* 2カラムレイアウト */}
      <div className={styles.staticPageColumns}>
        {/* メインコンテンツ（article にすることでTOCの自動検出が機能する） */}
        <article className={styles.staticPageMain}>
          {children}
        </article>

        {/* サイドバー: バナー+目次（TableOfContentsが両方を管理） */}
        <TableOfContents hideToc={noToc} />
      </div>
    </div>
  );
}
