import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import {
  getArticleBySlug,
  getAllArticleSlugs,
  getAdjacentArticles,
  extractHeadings,
  getPopularArticles,
} from '@/lib/articles';
import { getAuthorById, getAuthorByName } from '@/lib/authors';
import FixedShareButton from '@/components/FixedShareButton';
import TableOfContents from '@/components/TableOfContents';
import MobileTableOfContents from '@/components/MobileTableOfContents';
import PopularArticles from '@/components/PopularArticles';
import DataTable from '@/components/DataTable';
import GateTable from '@/components/GateTable';
import HorseWeightTable from '@/components/HorseWeightTable';
import RunningStyleTable from '@/components/RunningStyleTable';
import PopularityTable from '@/components/PopularityTable';
import StatsTable from '@/components/StatsTable';
import ClassTable from '@/components/ClassTable';
import ComparisonTable from '@/components/ComparisonTable';
import GenderTable from '@/components/GenderTable';
import PreviousFinishTable from '@/components/PreviousFinishTable';
import styles from './page.module.css';

// 見出しのIDを生成する関数
function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s-]/g, '')
    .replace(/\s+/g, '-');
}

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

  const { title, description, date, tags, thumbnail } = article.frontmatter;

  return {
    title: `${title} | 競馬データ.com`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: date,
      tags,
      images: thumbnail
        ? [
            {
              url: `https://keibadata.com${thumbnail}`,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: thumbnail ? [`https://keibadata.com${thumbnail}`] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const { title, description, date, category, tags, author, thumbnail } =
    article.frontmatter;
  const { prev, next } = getAdjacentArticles(slug);

  // 人気記事を取得（最大10件）
  const popularArticles = getPopularArticles(10);

  // 執筆者情報を取得（IDまたは名前から検索）
  const authorData = getAuthorById(author) || getAuthorByName(author);
  const authorName = authorData?.name || author;
  const authorImage = authorData?.image;
  const authorBio = authorData?.bio;
  const authorTwitter = authorData?.twitter;
  const authorRss = authorData?.rss;
  const authorAboutUrl = authorData?.aboutUrl;

  // 日付をフォーマット
  const formattedDate = new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 記事のフルURLを生成
  const articleUrl = `https://keibadata.com/articles/${slug}`;

  // 見出しを抽出（SP用目次）
  const headings = extractHeadings(article.content);

  // 最初のH2かどうかを追跡する変数
  let isFirstH2 = true;

  const components = {
    DataTable,
    GateTable,
    HorseWeightTable,
    RunningStyleTable,
    PopularityTable,
    StatsTable,
    ClassTable,
    ComparisonTable,
    GenderTable,
    PreviousFinishTable,
    // 見出しにIDを付与し、最初のH2の前に目次を挿入
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = String(children);
      const id = generateId(text);
      const showToc = isFirstH2;
      isFirstH2 = false;

      return (
        <>
          {showToc && <MobileTableOfContents headings={headings} initialShow={5} />}
          <h2 id={id} {...props}>{children}</h2>
        </>
      );
    },
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = String(children);
      const id = generateId(text);
      return <h3 id={id} {...props}>{children}</h3>;
    },
  };

  return (
    <>
      <div className={styles.articleMain}>
        <div className={styles.container}>
          <div className={styles.mainContent}>
            {/* パンくずリスト */}
            <nav className={styles.breadcrumb}>
              <Link href="/">HOME</Link>
              <span> &gt; </span>
              <Link href="/articles">記事一覧</Link>
              <span> &gt; </span>
              <span>{title}</span>
            </nav>

            <article className={styles.article}>
              {/* 記事タイトルと日付 */}
              <div className={styles.articleHeader}>
                <h1 className={styles.articleTitle}>{title}</h1>

                {/* サムネイル画像 */}
                {thumbnail && (
                  <div className={styles.thumbnailWrapper}>
                    <Image
                      src={thumbnail}
                      alt={title}
                      width={1200}
                      height={630}
                      className={styles.thumbnail}
                      priority={true}
                    />
                  </div>
                )}

                <time className={styles.articleDate}>{formattedDate}</time>
              </div>

              {/* 記事本文（最初のH2の前に目次が挿入される） */}
              <div className={styles.content}>
                {article.isMDX ? (
                  <MDXRemote
                    source={article.content}
                    components={components}
                    options={{
                      mdxOptions: {
                        remarkPlugins: [remarkGfm],
                      },
                      blockJS: false,
                      blockDangerousJS: false,
                    }}
                  />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
                )}
              </div>

              {/* 記事フッター - 執筆者情報 */}
              <footer className={styles.footer}>
                <div className={styles.authorCard}>
                  {authorImage && (
                    <div className={styles.authorImageWrapper}>
                      <Image
                        src={authorImage}
                        alt={authorName}
                        width={120}
                        height={120}
                        className={styles.authorImage}
                        priority={false}
                      />
                    </div>
                  )}
                  <div className={styles.authorInfo}>
                    <p className={styles.authorName}>{authorName}</p>
                    {authorBio && (
                      <p
                        className={styles.authorBio}
                        dangerouslySetInnerHTML={{ __html: authorBio }}
                      />
                    )}
                    {(authorTwitter || authorRss || authorAboutUrl) && (
                      <div className={styles.socialLinks}>
                        <div className={styles.socialIcons}>
                          {authorTwitter && (
                            <a
                              href={authorTwitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.socialIcon}
                              aria-label="X (Twitter)"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                            </a>
                          )}
                          {authorRss && (
                            <a
                              href={authorRss}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.socialIcon}
                              aria-label="RSS"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z" />
                              </svg>
                            </a>
                          )}
                        </div>
                        {authorAboutUrl && (
                          <a
                            href={authorAboutUrl}
                            className={styles.aboutLink}
                          >
                            サイト情報・運営者情報
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </footer>
            </article>

            {/* 前後の記事ナビゲーション */}
            {(prev || next) && (
              <nav className={styles.articleNav}>
                {prev && (
                  <>
                    <div className={styles.articleNavItem}>
                      <Link
                        href={`/articles/${prev.slug}`}
                        className={`${styles.articleNavLink} ${styles.articleNavPrev}`}
                      >
                        <span className={styles.articleNavLabel}>前の記事</span>
                        <span className={styles.articleNavTitle}>{prev.frontmatter.title}</span>
                      </Link>
                    </div>
                    {next && <div className={styles.articleNavDivider}></div>}
                  </>
                )}
                {next && (
                  <div className={styles.articleNavItem}>
                    <Link
                      href={`/articles/${next.slug}`}
                      className={`${styles.articleNavLink} ${styles.articleNavNext}`}
                    >
                      <span className={styles.articleNavLabel}>次の記事</span>
                      <span className={styles.articleNavTitle}>{next.frontmatter.title}</span>
                    </Link>
                  </div>
                )}
              </nav>
            )}

            {/* 人気記事 */}
            <PopularArticles articles={popularArticles} />
          </div>

          {/* 右サイドバー：目次・広告エリア */}
          <aside className={styles.sidebar}>
            <TableOfContents />
          </aside>
        </div>
      </div>

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
              '@type': 'Person',
              name: authorName,
              ...(authorImage && { image: authorImage }),
              ...(authorBio && { description: authorBio }),
            },
            publisher: {
              '@type': 'Organization',
              name: '競馬データ.com',
            },
          }),
        }}
      />

      {/* SP専用固定シェアボタン */}
      <FixedShareButton title={title} url={articleUrl} />
    </>
  );
}
