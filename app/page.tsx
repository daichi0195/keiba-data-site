import { Metadata } from 'next';
import RaceTabs from '@/components/RaceTabs';
import TableOfContents from '@/components/TableOfContents';
import ArticleCarousel from '@/components/ArticleCarousel';
import { getJockeyLeading, getTrainerLeading, getSireLeading } from '@/lib/getLeadingData';
import { getAllArticles } from '@/lib/articles';

// ISR: 1日1回（86400秒）再生成
export const revalidate = 86400;

export const metadata: Metadata = {
  title: '競馬データ.com - 予想に役立つ競馬データの分析サイト',
  description: '競馬データ.comは、競馬の予想に役立つあらゆるデータを網羅した競馬分析サイトです。コース別成績、騎手・調教師・種牡馬データ、人気・枠順・脚質傾向など、豊富な統計情報で競馬予想を徹底サポート。',
  openGraph: {
    title: '競馬データ.com - 予想に役立つ競馬データの分析サイト',
    description: '競馬データ.comは、競馬の予想に役立つあらゆるデータを網羅した競馬分析サイトです。コース別成績、騎手・調教師・種牡馬データ、人気・枠順・脚質傾向など、豊富な統計情報で競馬予想を徹底サポート。',
    url: 'https://www.keibadata.com',
    siteName: '競馬データ.com',
    locale: 'ja_JP',
    type: 'website',
  },
};

export default async function HomePage() {
  // サーバー側でリーディングデータと記事を読み込む
  const jockeyLeading = await getJockeyLeading();
  const trainerLeading = await getTrainerLeading();
  const sireLeading = await getSireLeading();
  const articles = getAllArticles();
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '競馬データ.com - 予想に役立つ競馬データの分析サイト',
    description: '競馬データ.comは、競馬の予想に役立つあらゆるデータを網羅した競馬分析サイトです。コース別成績、騎手・調教師・種牡馬データ、人気・枠順・脚質傾向など、豊富な統計情報で競馬予想を徹底サポート。',
    url: 'https://www.keibadata.com',
    publisher: {
      '@type': 'Organization',
      name: '競馬データ.com',
      logo: 'https://www.keibadata.com/logo.png',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main style={{ padding: 0 }}>
        <article style={{ backgroundColor: '#fbfcfd' }}>
          {/* 記事セクション */}
          <section className="section section-full-width">
            <ArticleCarousel articles={articles} />
          </section>

          <RaceTabs
            jockeyLeading={jockeyLeading}
            trainerLeading={trainerLeading}
            sireLeading={sireLeading}
          />
        </article>
        <TableOfContents />
      </main>
    </>
  );
}
