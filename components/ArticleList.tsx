'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/articles';
import styles from './ArticleList.module.css';

type SortOrder = 'newest' | 'popular';

interface ArticleListProps {
  articles: Article[];
}

export default function ArticleList({ articles: allArticles }: ArticleListProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // ソート処理
  const articles = [...allArticles].sort((a, b) => {
    if (sortOrder === 'newest') {
      // 新着順: 日付の新しい順
      return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
    } else {
      // 人気順: priorityの小さい順（未指定は999として扱う）
      const priorityA = a.frontmatter.priority ?? 999;
      const priorityB = b.frontmatter.priority ?? 999;
      return priorityA - priorityB;
    }
  });

  return (
    <>
      {/* 並び替えボタン */}
      <div className={styles.sortButtons}>
        <button
          className={`${styles.sortButton} ${sortOrder === 'newest' ? styles.active : ''}`}
          onClick={() => setSortOrder('newest')}
        >
          新着順
        </button>
        <button
          className={`${styles.sortButton} ${sortOrder === 'popular' ? styles.active : ''}`}
          onClick={() => setSortOrder('popular')}
        >
          人気順
        </button>
      </div>

      {/* コラム一覧 */}
      <div className={styles.articleList}>
        {articles.length === 0 ? (
          <p className={styles.emptyMessage}>まだ記事がありません</p>
        ) : (
          articles.map((article) => (
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
                    fill
                    sizes="(max-width: 768px) 75px, 160px"
                    className={styles.thumbnail}
                  />
                </div>
              )}
              <div className={styles.articleInfo}>
                <p className={styles.articleTitle}>
                  {article.frontmatter.title}
                </p>
                {article.frontmatter.description && (
                  <p className={styles.articleDescription}>
                    {article.frontmatter.description}
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
