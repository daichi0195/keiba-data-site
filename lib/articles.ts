import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import gfm from 'remark-gfm';

const articlesDirectory = path.join(process.cwd(), 'content/articles');

export interface ArticleFrontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  author: string; // 執筆者IDまたは執筆者名
  thumbnail?: string; // サムネイル画像のパス（例: /images/articles/1.png）
  featured?: boolean; // 人気記事フラグ
  priority?: number; // 人気順の優先度（数字が小さいほど上位、未指定は999）
}

export interface Article {
  slug: string;
  frontmatter: ArticleFrontmatter;
  content: string;
}

export interface ArticleData extends Article {
  contentHtml: string;
  isMDX: boolean;
}

/**
 * 全ての記事のslugを取得（.mdと.mdxの両方）
 */
export function getAllArticleSlugs(): string[] {
  if (!fs.existsSync(articlesDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(articlesDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith('.md') || fileName.endsWith('.mdx'))
    .map((fileName) => fileName.replace(/\.(md|mdx)$/, ''));
}

/**
 * 記事ファイルの拡張子を取得
 */
export function getArticleExtension(slug: string): 'md' | 'mdx' | null {
  if (fs.existsSync(path.join(articlesDirectory, `${slug}.mdx`))) {
    return 'mdx';
  }
  if (fs.existsSync(path.join(articlesDirectory, `${slug}.md`))) {
    return 'md';
  }
  return null;
}

/**
 * 全ての記事データを取得（一覧表示用）
 */
export function getAllArticles(): Article[] {
  const slugs = getAllArticleSlugs();

  const articles = slugs.map((slug) => {
    const ext = getArticleExtension(slug);
    if (!ext) return null;

    const fullPath = path.join(articlesDirectory, `${slug}.${ext}`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      frontmatter: data as ArticleFrontmatter,
      content,
    };
  }).filter((article): article is Article => article !== null);

  // 日付の降順でソート（同じ日付の場合はスラッグの昇順）
  return articles.sort((a, b) => {
    if (a.frontmatter.date < b.frontmatter.date) {
      return 1;
    } else if (a.frontmatter.date > b.frontmatter.date) {
      return -1;
    } else {
      // 日付が同じ場合はスラッグで昇順ソート
      return a.slug.localeCompare(b.slug);
    }
  });
}

/**
 * 特定の記事データを取得（詳細ページ用）
 * MDXの場合はcontentHtmlは空文字列（動的インポートで処理）
 */
export async function getArticleBySlug(slug: string): Promise<ArticleData | null> {
  try {
    const ext = getArticleExtension(slug);
    if (!ext) {
      return null;
    }

    const fullPath = path.join(articlesDirectory, `${slug}.${ext}`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    let contentHtml = '';

    // Markdownの場合のみHTMLに変換
    if (ext === 'md') {
      const processedContent = await remark()
        .use(gfm) // GitHub Flavored Markdown対応
        .use(html, { sanitize: false }) // HTMLタグを許可
        .process(content);

      contentHtml = processedContent.toString();
    }

    return {
      slug,
      frontmatter: data as ArticleFrontmatter,
      content,
      contentHtml,
      isMDX: ext === 'mdx',
    };
  } catch (error) {
    console.error(`Error loading article: ${slug}`, error);
    return null;
  }
}

/**
 * カテゴリ別に記事を取得
 */
export function getArticlesByCategory(category: string): Article[] {
  const allArticles = getAllArticles();
  return allArticles.filter(
    (article) => article.frontmatter.category === category
  );
}

/**
 * タグ別に記事を取得
 */
export function getArticlesByTag(tag: string): Article[] {
  const allArticles = getAllArticles();
  return allArticles.filter((article) =>
    article.frontmatter.tags.includes(tag)
  );
}

/**
 * 関連記事を取得（同じカテゴリまたはタグを持つ記事）
 */
export function getRelatedArticles(
  currentSlug: string,
  maxResults: number = 3
): Article[] {
  const allArticles = getAllArticles();
  const currentArticle = allArticles.find(
    (article) => article.slug === currentSlug
  );

  if (!currentArticle) {
    return [];
  }

  const { category, tags } = currentArticle.frontmatter;

  // スコアリング: 同じカテゴリ=2点、同じタグ=1点/tag
  const scoredArticles = allArticles
    .filter((article) => article.slug !== currentSlug)
    .map((article) => {
      let score = 0;
      if (article.frontmatter.category === category) {
        score += 2;
      }
      const matchingTags = article.frontmatter.tags.filter((tag) =>
        tags.includes(tag)
      );
      score += matchingTags.length;
      return { article, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scoredArticles.slice(0, maxResults).map((item) => item.article);
}

/**
 * 全てのカテゴリを取得
 */
export function getAllCategories(): string[] {
  const allArticles = getAllArticles();
  const categories = allArticles.map((article) => article.frontmatter.category);
  return Array.from(new Set(categories));
}

/**
 * 全てのタグを取得
 */
export function getAllTags(): string[] {
  const allArticles = getAllArticles();
  const tags = allArticles.flatMap((article) => article.frontmatter.tags);
  return Array.from(new Set(tags));
}

/**
 * 前後の記事を取得
 */
export function getAdjacentArticles(currentSlug: string): {
  prev: Article | null;
  next: Article | null;
} {
  const allArticles = getAllArticles();
  const currentIndex = allArticles.findIndex((article) => article.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? allArticles[currentIndex - 1] : null,
    next: currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null,
  };
}

/**
 * 人気記事を取得（featured=trueの記事を優先、なければ最新記事）
 */
export function getPopularArticles(limit: number = 10, excludeSlug?: string): Article[] {
  const allArticles = getAllArticles();

  // 現在の記事を除外
  const filteredArticles = excludeSlug
    ? allArticles.filter((article) => article.slug !== excludeSlug)
    : allArticles;

  // featured=trueの記事のみを取得
  const featuredArticles = filteredArticles.filter(
    (article) => article.frontmatter.featured === true
  );

  // priorityでソート（数字が小さいほど上位、未指定は999として扱う）
  const sortedArticles = featuredArticles.sort((a, b) => {
    const priorityA = a.frontmatter.priority ?? 999;
    const priorityB = b.frontmatter.priority ?? 999;
    return priorityA - priorityB;
  });

  return sortedArticles.slice(0, limit);
}

/**
 * MDXコンテンツから見出し（H2, H3）を抽出
 */
export function extractHeadings(content: string): Array<{ level: number; text: string; id: string }> {
  const headings: Array<{ level: number; text: string; id: string }> = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // H2 (##) またはH3 (###) の見出しを検出
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h3Match) {
      const text = h3Match[1].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s-]/g, '')
        .replace(/\s+/g, '-');
      headings.push({ level: 3, text, id });
    } else if (h2Match) {
      const text = h2Match[1].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s-]/g, '')
        .replace(/\s+/g, '-');
      headings.push({ level: 2, text, id });
    }
  }

  return headings;
}
