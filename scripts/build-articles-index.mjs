// content/articles の記事一覧（slug・frontmatter・本文）を lib/articles.generated.json に書き出す。
// Cloudflare Workers 上の ISR 再生成（トップ・RSS など）ではファイルを読めないため、
// 記事一覧はビルド時にこの JSON をバンドルして使う。npm run build の前（prebuild）に自動で走る。
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const dir = path.join(process.cwd(), 'content/articles');
const out = path.join(process.cwd(), 'lib/articles.generated.json');

const articles = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
  .sort()
  .map((f) => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
    return { slug: f.replace(/\.(md|mdx)$/, ''), frontmatter: data, content };
  });

fs.writeFileSync(out, JSON.stringify(articles, null, 2) + '\n');
console.log(`articles index: ${articles.length} 件 → ${path.relative(process.cwd(), out)}`);
