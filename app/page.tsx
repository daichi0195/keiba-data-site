import { Metadata } from 'next';
import RaceTabs from '@/components/RaceTabs';

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

export default function HomePage() {
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
      <div style={{ backgroundColor: '#fbfcfd' }}>
        <RaceTabs />
      </div>
    </>
  );
}
