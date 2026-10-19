'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import s from '@/components/course/course.module.css';
import h from './home.module.css';
import type { Article } from '@/lib/articles';

type SortOrder = 'newest' | 'popular';

/**
 * トップ：コラム一覧（現行の ArticleList と同じ並び替え：新着順／人気順）
 * ArticleList は /articles でも使っているため、トップ用に別部品にしている
 */
export default function HomeColumnList({ articles: rawArticles }: { articles: Article[] }) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  // 外部リンク（AIバナーなど）を除く
  const articles = rawArticles
    .filter((a) => !a.frontmatter.link)
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
      }
      return (a.frontmatter.priority ?? 999) - (b.frontmatter.priority ?? 999);
    });

  return (
    <div className={s.card}>
      <div className={h.sortChips} role="group" aria-label="並び替え">
        {([['newest', '新着順'], ['popular', '人気順']] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`${s.chip} ${sortOrder === key ? s.chipOn : ''}`}
            aria-pressed={sortOrder === key}
            onClick={() => setSortOrder(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={h.colList} style={{ marginTop: 16 }}>
        {articles.length === 0 ? (
          <p className={h.empty}>まだ記事がありません</p>
        ) : (
          articles.map((article) => (
            <Link key={article.slug} href={`/articles/${article.slug}`} className={h.colItem}>
              <div className={h.colThumb}>
                {article.frontmatter.thumbnail && (
                  <Image
                    src={article.frontmatter.thumbnail}
                    alt={article.frontmatter.title}
                    fill
                    sizes="(max-width: 768px) 112px, 176px"
                  />
                )}
              </div>
              <div className={h.colInfo}>
                <p className={h.colTitle}>{article.frontmatter.title}</p>
                {article.frontmatter.description && <p className={h.colDesc}>{article.frontmatter.description}</p>}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
