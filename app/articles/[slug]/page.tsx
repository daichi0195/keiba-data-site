import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import remarkEntityLinks from '@/lib/remarkEntityLinks';
import {
  getArticleBySlug,
  getAllArticleSlugs,
  getAdjacentArticles,
  extractHeadings,
  getPopularArticles,
} from '@/lib/articles';
import { getAuthorById, getAuthorByName } from '@/lib/authors';
import { articleMdxComponents } from '@/components/v6/article/mdx';
import { TocSide } from '@/components/v6/article/Toc';
import { Card, dateJa, toCard } from '@/components/v6/article/Cards';
import RiseGrid from '@/components/v6/article/RiseGrid';
import ArticleEffects from '@/components/v6/article/ArticleEffects';
import { XLogo, RssLogo } from '@/components/v6/article/icons';
import { cx } from '@/components/v6/article/cx';

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
    alternates: {
      canonical: `https://www.keibadata.com/articles/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: date,
      tags,
      images: thumbnail
        ? [
            {
              url: `https://www.keibadata.com${thumbnail}`,
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
      images: thumbnail ? [`https://www.keibadata.com${thumbnail}`] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const { title, description, date, category, author, thumbnail } = article.frontmatter;
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

  const formattedDate = dateJa(date);

  // 記事のフルURL（Xでシェアするときに使う）
  const articleUrl = `https://keibadata.com/articles/${slug}`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(articleUrl)}`;
  const share = (size: 'sm' | 'lg', label: string) => (
    <a className={cx('sh', size)} href={shareUrl} target="_blank" rel="noopener noreferrer" aria-label="Xでシェア">
      <XLogo />
      <span>{label}</span>
    </a>
  );

  // 見出し（H2・H3）を抽出：本文の中の目次と、PC の右の目次
  const headings = extractHeadings(article.content);
  const components = articleMdxComponents(headings);

  const navItem = (a: NonNullable<typeof prev>, label: string) => (
    <Link prefetch={false} className={cx('an-i')} href={`/articles/${a.slug}`}>
      <span className={cx('an-p')}>
        {a.frontmatter.thumbnail && <Image src={a.frontmatter.thumbnail} alt="" width={1200} height={630} sizes="160px" />}
      </span>
      <span className={cx('an-t')}>
        <small>{label}</small>
        <b>{a.frontmatter.title}</b>
      </span>
    </Link>
  );

  return (
    <>
      <main className={cx('root')}>
        <div className={cx('ar')}>
          <div className={cx('ar-in')}>
            <nav className={cx('bc')} aria-label="パンくず">
              <Link prefetch={false} href="/">HOME</Link>
              <i aria-hidden="true">/</i>
              <Link prefetch={false} href="/articles">コラム</Link>
              <i aria-hidden="true">/</i>
              <span>{title}</span>
            </nav>

            <div className={cx('ar-cols')}>
              <article className={cx('ar-main')}>
                <header className={cx('ar-hd')}>
                  <div className={cx('ar-ht')}>
                    <div>
                      {category && <p className={cx('ar-k')}>{category}</p>}
                      <h1 className={cx(/^[『「【（]/.test(title) && 'hang')}>{title}</h1>
                    </div>
                    <div className={cx('ar-meta')}>
                      <p className={cx('ar-by')}>
                        {authorImage && <Image src={authorImage} alt="" width={32} height={32} />}
                        <b>{authorName}</b>
                        <time dateTime={date}>{formattedDate}</time>
                      </p>
                      {share('sm', 'シェア')}
                    </div>
                  </div>
                  {thumbnail && (
                    <div className={cx('ar-hero')}>
                      <Image src={thumbnail} alt={title} width={1200} height={630} sizes="(max-width: 699px) 100vw, (max-width: 1099px) 300px, 360px" priority />
                    </div>
                  )}
                </header>

                <div className={cx('ar-sheet')}>
                  {/* 記事本文（最初のH2の前に目次、2つ目と4つ目のH2の前に記事内広告が入る） */}
                  <div className={cx('ar-body')}>
                    {article.isMDX ? (
                      <MDXRemote
                        source={article.content}
                        components={components}
                        options={{
                          mdxOptions: {
                            // 本文中の種牡馬・騎手・調教師名を各データページへリンクする
                            remarkPlugins: [remarkGfm, remarkEntityLinks],
                          },
                          blockJS: false,
                          blockDangerousJS: false,
                        }}
                      />
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
                    )}
                  </div>

                  <div className={cx('ar-share')}>
                    <p>この記事をシェア</p>
                    {share('lg', 'Xでシェア')}
                  </div>

                  {/* 執筆者 */}
                  <footer className={cx('au')}>
                    {authorImage && <Image src={authorImage} alt={authorName} width={72} height={72} />}
                    <div>
                      <p className={cx('au-k')}>この記事を書いた人</p>
                      <p className={cx('au-n')}>{authorName}</p>
                      {authorBio && <p className={cx('au-b')} dangerouslySetInnerHTML={{ __html: authorBio }} />}
                      {(authorTwitter || authorRss || authorAboutUrl) && (
                        <p className={cx('au-l')}>
                          {authorTwitter && (
                            <a className={cx('au-ic')} href={authorTwitter} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                              <XLogo />
                            </a>
                          )}
                          {authorRss && (
                            <a className={cx('au-ic')} href={authorRss} target="_blank" rel="noopener noreferrer" aria-label="RSS">
                              <RssLogo />
                            </a>
                          )}
                          {authorAboutUrl && (
                            <a className={cx('au-a')} href={authorAboutUrl}>
                              サイト情報・運営者情報
                            </a>
                          )}
                        </p>
                      )}
                    </div>
                  </footer>
                </div>

                {/* 前後の記事（前＝ひとつ古い記事、次＝ひとつ新しい記事） */}
                {(prev || next) && (
                  <nav className={cx('an', prev && next && 'two')} aria-label="前後の記事">
                    {prev && navItem(prev, '前の記事')}
                    {next && navItem(next, '次の記事')}
                  </nav>
                )}
              </article>

              <TocSide headings={headings} />
            </div>

            {/* 人気記事 */}
            {popularArticles.length > 0 && (
              <section className={cx('ar-pop')} aria-labelledby="pop-h">
                <h2 id="pop-h">人気記事</h2>
                <RiseGrid className="cl nodesc">
                  {popularArticles.map((a, i) => (
                    <Card key={a.slug} a={toCard(a)} withDesc={false} i={i} />
                  ))}
                </RiseGrid>
              </section>
            )}
          </div>
        </div>
        <ArticleEffects />
      </main>

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
    </>
  );
}
