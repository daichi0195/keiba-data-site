import { Metadata } from 'next';
import Link from 'next/link';
import { getAllArticles, getAllCategories } from '@/lib/articles';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: '記事一覧 | 競馬データ.com',
  description:
    '競馬データの分析記事、コース別攻略法、騎手・調教師・種牡馬に関する情報を掲載しています。',
};

export default function ArticlesPage() {
  const articles = getAllArticles();
  const categories = getAllCategories();

  return (
    <div className={styles.container}>
      {/* パンくずリスト */}
      <nav className={styles.breadcrumb}>
        <Link href="/">HOME</Link>
        <span> &gt; </span>
        <span>記事一覧</span>
      </nav>

      {/* ヘッダー */}
      <header className={styles.header}>
        <h1 className={styles.title}>記事一覧</h1>
        <p className={styles.description}>
          競馬データを活用した分析記事やコース攻略法などを掲載しています
        </p>
      </header>

      {/* カテゴリフィルター */}
      <div className={styles.categories}>
        <Link href="/articles" className={styles.categoryChip}>
          全て
        </Link>
        {categories.map((category) => (
          <Link
            key={category}
            href={`/articles?category=${encodeURIComponent(category)}`}
            className={styles.categoryChip}
          >
            {category}
          </Link>
        ))}
      </div>

      {/* 記事一覧 */}
      <div className={styles.articleGrid}>
        {articles.length === 0 ? (
          <p className={styles.emptyMessage}>まだ記事がありません</p>
        ) : (
          articles.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className={styles.articleCard}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardCategory}>
                  {article.frontmatter.category}
                </span>
                <time className={styles.cardDate}>
                  {new Date(article.frontmatter.date).toLocaleDateString(
                    'ja-JP',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </time>
              </div>
              <h2 className={styles.cardTitle}>{article.frontmatter.title}</h2>
              <p className={styles.cardDescription}>
                {article.frontmatter.description}
              </p>
              <div className={styles.cardTags}>
                {article.frontmatter.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className={styles.cardTag}>
                    #{tag}
                  </span>
                ))}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
