import { Metadata } from 'next';
import Link from 'next/link';
import { getAllArticles } from '@/lib/articles';
import ArticleList from '@/components/ArticleList';
import TableOfContents from '@/components/TableOfContents';
import styles from '@/app/static-page.module.css';
import s from '@/components/course/course.module.css';

export const metadata: Metadata = {
  title: 'コラム | 競馬データ.com',
  description:
    'データを活用した分析記事や一口馬主のコラムなどを掲載しています。',
};

export default function ArticlesPage() {
  // 本文は一覧では使わない。クライアントコンポーネントに渡すと HTML に丸ごと埋め込まれるため空にする
  const articles = getAllArticles()
    .filter((a) => !a.frontmatter.link)
    .map((article) => ({ ...article, content: '' }));

  return (
    <div className={s.canvas}>
      <div className={styles.staticPageContainer}>
        <div className={styles.staticPageColumns}>
          {/* メインコンテンツ（article にすることでTOCの自動検出が機能する） */}
          <article>
            <nav className={s.crumb} aria-label="パンくず">
              <Link href="/">HOME</Link>
              <span aria-hidden="true">/</span>
              <span>コラム</span>
            </nav>

            <div className={s.hero}>
              <h1 className={s.title}>コラム</h1>
              <p className={s.lead}>
                データを活用した分析記事や一口馬主のコラムなどを掲載しています。
              </p>
            </div>

            <div className={s.card}>
              <ArticleList articles={articles} />
            </div>
          </article>

          {/* 右サイドバー（目次は出さず、AIバナーのみ） */}
          <TableOfContents hideToc />
        </div>
      </div>
    </div>
  );
}
