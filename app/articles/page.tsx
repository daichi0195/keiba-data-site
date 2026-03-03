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
  const articles = getAllArticles();

  return (
    <StaticPageLayout pageName="コラム" noToc>
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
