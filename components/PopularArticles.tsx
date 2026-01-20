import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/articles';
import styles from './PopularArticles.module.css';

interface PopularArticlesProps {
  articles: Article[];
}

export default function PopularArticles({ articles }: PopularArticlesProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className={styles.popularSection}>
      <h2 className={styles.title}>人気記事</h2>
      <div className={styles.articleList}>
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className={styles.articleItem}
          >
            {article.frontmatter.thumbnail && (
              <div className={styles.thumbnailWrapper}>
                <Image
                  src={article.frontmatter.thumbnail}
                  alt={article.frontmatter.title}
                  width={90}
                  height={60}
                  className={styles.thumbnail}
                />
              </div>
            )}
            <div className={styles.articleInfo}>
              <h3 className={styles.articleTitle}>{article.frontmatter.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
