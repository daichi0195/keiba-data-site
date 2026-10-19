import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/articles';
import s from '@/components/course/course.module.css';
import styles from './PopularArticles.module.css';

interface PopularArticlesProps {
  articles: Article[];
}

export default function PopularArticles({ articles }: PopularArticlesProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className={s.section}>
      <div className={s.sh}>
        <h2 className={s.h2}>人気記事</h2>
      </div>
      <div className={s.card}>
        <div className={styles.articleList}>
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className={styles.articleItem}
            >
              <div className={styles.thumbnailWrapper}>
                {article.frontmatter.thumbnail && (
                  <Image
                    src={article.frontmatter.thumbnail}
                    alt={article.frontmatter.title}
                    fill
                    sizes="(max-width: 768px) 112px, 144px"
                    className={styles.thumbnail}
                  />
                )}
              </div>
              <div className={styles.articleInfo}>
                <h3 className={styles.articleTitle}>{article.frontmatter.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
