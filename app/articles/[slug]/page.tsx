import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import {
  getArticleBySlug,
  getAllArticleSlugs,
  getRelatedArticles,
  extractHeadings,
} from '@/lib/articles';
import FixedShareButton from '@/components/FixedShareButton';
import TableOfContents from '@/components/TableOfContents';
import MobileTableOfContents from '@/components/MobileTableOfContents';
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

// 最初のH2かどうかを追跡する変数（各レンダリングでリセット）
let isFirstH2 = true;

// MDX内で使えるコンポーネントを生成する関数
const createComponents = (headings: Array<{ level: number; text: string; id: string }>) => {
  // 各レンダリングでリセット
  isFirstH2 = true;

  return {
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
};

// MDXのオプション設定（GitHub Flavored Markdown対応）
const options = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
  },
};

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

  // 見出しを抽出（SP用目次）
  const headings = extractHeadings(article.content);

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
                <time className={styles.articleDate}>{formattedDate}</time>
              </div>

              {/* 記事本文（最初のH2の前に目次が挿入される） */}
              <div className={styles.content}>
                {article.isMDX ? (
                  <MDXRemote
                    source={article.content}
                    components={createComponents(headings)}
                    options={options}
                  />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
                )}
              </div>

              {/* 記事フッター */}
              <footer className={styles.footer}>
                <p className={styles.author}>執筆者：{author}</p>
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

      {/* SP専用固定シェアボタン */}
      <FixedShareButton title={title} url={articleUrl} />
    </>
  );
}
