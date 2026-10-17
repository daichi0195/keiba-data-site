import { getAllArticles } from '@/lib/articles';

const BASE_URL = 'https://www.keibadata.com';

// 1日1回再生成
export const revalidate = 86400;

const escapeXml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export async function GET() {
  const articles = getAllArticles().filter((a) => !a.frontmatter.link);

  const items = articles
    .map((a) => {
      const url = `${BASE_URL}/articles/${a.slug}`;
      const pubDate = a.frontmatter.date ? new Date(a.frontmatter.date).toUTCString() : new Date().toUTCString();
      return `    <item>
      <title>${escapeXml(a.frontmatter.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(a.frontmatter.description ?? '')}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>競馬データ.com コラム</title>
    <link>${BASE_URL}/articles</link>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>競馬データ.comのデータ分析コラムの更新情報です。</description>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
