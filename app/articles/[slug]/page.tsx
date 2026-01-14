import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getArticleBySlug,
  getAllArticleSlugs,
  getRelatedArticles,
} from '@/lib/articles';
import ShareButtons from '@/components/ShareButtons';
import styles from './page.module.css';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

// 静的パスを生成
export async function generateStaticParams() {
  const slugs = getAllArticleSlugs();
  return slugs.map((slug) => ({
    slug: slug,
  }));
}

// メタデータを生成
export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: '記事が見つかりません',
    };
  }

  const { title, description, date, tags } = article.frontmatter;

  return {
    title: `${title} | 競馬データ.com`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: date,
      tags,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const { title, description, date, category, tags, author } =
    article.frontmatter;
  const relatedArticles = getRelatedArticles(slug);

  // 日付をフォーマット
  const formattedDate = new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 記事のフルURLを生成
  const articleUrl = `https://keibadata.com/articles/${slug}`;

  return (
    <div className={styles.container}>
      {/* パンくずリスト */}
      <nav className={styles.breadcrumb}>
        <Link href="/">HOME</Link>
        <span> &gt; </span>
        <Link href="/articles">記事一覧</Link>
        <span> &gt; </span>
        <span>{title}</span>
      </nav>

      <article className={styles.article}>
        {/* 記事ヘッダー */}
        <header className={styles.header}>
          <div className={styles.meta}>
            <span className={styles.category}>{category}</span>
            <time className={styles.date}>{formattedDate}</time>
          </div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
          <div className={styles.tags}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        </header>

        {/* 記事本文 */}
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />

        {/* SNSシェアボタン */}
        <ShareButtons title={title} url={articleUrl} />

        {/* 記事フッター */}
        <footer className={styles.footer}>
          <p className={styles.author}>執筆者: {author}</p>
        </footer>
      </article>

      {/* 関連記事 */}
      {relatedArticles.length > 0 && (
        <aside className={styles.relatedArticles}>
          <h2 className={styles.relatedTitle}>関連記事</h2>
          <div className={styles.relatedGrid}>
            {relatedArticles.map((relatedArticle) => (
              <Link
                key={relatedArticle.slug}
                href={`/articles/${relatedArticle.slug}`}
                className={styles.relatedCard}
              >
                <div className={styles.relatedCategory}>
                  {relatedArticle.frontmatter.category}
                </div>
                <h3 className={styles.relatedCardTitle}>
                  {relatedArticle.frontmatter.title}
                </h3>
                <p className={styles.relatedCardDescription}>
                  {relatedArticle.frontmatter.description}
                </p>
                <time className={styles.relatedCardDate}>
                  {new Date(relatedArticle.frontmatter.date).toLocaleDateString(
                    'ja-JP'
                  )}
                </time>
              </Link>
            ))}
          </div>
        </aside>
      )}

      {/* 構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description: description,
            datePublished: date,
            author: {
              '@type': 'Organization',
              name: author,
            },
            publisher: {
              '@type': 'Organization',
              name: '競馬データ.com',
            },
          }),
        }}
      />
    </div>
  );
}
