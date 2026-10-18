import { Metadata } from 'next';
import { getAllArticles } from '@/lib/articles';
import ArticleList from '@/components/ArticleList';
import StaticPageLayout from '@/components/StaticPageLayout';
import styles from '@/app/static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

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
    <StaticPageLayout pageName="コラム" noToc noLeftSidebar>
      <div className={styles.staticPageCard}>
        <div className={styles.staticPageHeader}>
          <h1 className={styles.staticPageTitle}>コラム</h1>
        </div>

        <p className={contentStyles.text}>
          データを活用した分析記事や一口馬主のコラムなどを掲載しています。
        </p>

        <ArticleList articles={articles} />
      </div>
    </StaticPageLayout>
  );
}
