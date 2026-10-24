import { Metadata } from 'next';
import Link from 'next/link';
import ArticleCarousel from '@/components/ArticleCarousel';
import AIBanner from '@/components/AIBanner';
import HomeAIPredictions from '@/components/datapage/list/HomeAIPredictions';
import HomeThisWeekVenues from '@/components/datapage/list/HomeThisWeekVenues';
import HomeAllVenues from '@/components/datapage/list/HomeAllVenues';
import HomeLeadingSection from '@/components/datapage/list/HomeLeadingSection';
import HomeColumnList from '@/components/datapage/list/HomeColumnList';
import { JOCKEY_GROUPS, SIRE_GROUPS, TRAINER_GROUPS } from '@/components/datapage/list/kana';
import { getJockeyLeading, getTrainerLeading, getSireLeading } from '@/lib/getLeadingData';
import { getAllArticles } from '@/lib/articles';
import { getThisWeekVenues } from '@/lib/thisWeekVenues';
import s from '@/components/course/course.module.css';
import h from '@/components/datapage/list/home.module.css';

// AI予測（index.json）を反映するため60秒ごとに再生成。no-store だと毎リクエスト SSR になり表示が遅くなる
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.keibadata.com',
  },
  title: '競馬データ.com｜コース・騎手・血統の競馬データ分析【毎週更新】',
  description: '競馬データ.comは、競馬の予想に役立つあらゆるデータを網羅した競馬分析サイトです。コース別成績、騎手・調教師・種牡馬データ、人気・枠順・脚質傾向など、豊富な統計情報で競馬予想を徹底サポート。',
  openGraph: {
    title: '競馬データ.com｜コース・騎手・血統の競馬データ分析【毎週更新】',
    description: '競馬データ.comは、競馬の予想に役立つあらゆるデータを網羅した競馬分析サイトです。コース別成績、騎手・調教師・種牡馬データ、人気・枠順・脚質傾向など、豊富な統計情報で競馬予想を徹底サポート。',
    url: 'https://www.keibadata.com',
    siteName: '競馬データ.com',
    locale: 'ja_JP',
    type: 'website',
  },
};

async function fetchPredictions() {
  try {
    const url = `https://storage.googleapis.com/umadata/predictions/index.json?t=${Date.now()}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(0, 10);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  // サーバー側でリーディングデータ・記事・予測を読み込む
  const [jockeyLeading, trainerLeading, sireLeading, predictions, thisWeekVenues] = await Promise.all([
    getJockeyLeading(),
    getTrainerLeading(),
    getSireLeading(),
    fetchPredictions(),
    getThisWeekVenues(),
  ]);
  // 本文はトップでは使わない。クライアントコンポーネントに渡すと HTML に丸ごと埋め込まれるため空にする
  const articles = getAllArticles().map((article) => ({ ...article, content: '' }));
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '競馬データ.com｜コース・騎手・血統の競馬データ分析【毎週更新】',
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
      <div className={s.canvas}>
        <main className={h.main}>
          <h1 className="visually-hidden">競馬データ.com｜コース・騎手・血統の競馬データ分析</h1>
          {/* 記事カルーセル - 全幅 */}
          <section className={h.carousel} aria-label="おすすめ記事">
            <ArticleCarousel articles={articles} />
          </section>

          <div className={h.wrap}>
            {/* AI予測セクション */}
            <HomeAIPredictions races={predictions} />

            {/* 2カラムレイアウト部分（PC：右にAIバナー） */}
            <div className={h.columns}>
              <div>
                <HomeThisWeekVenues venues={thisWeekVenues} />

                <HomeAllVenues />

                <HomeLeadingSection
                  title="騎手別データ"
                  leadingTitle="騎手リーディング（勝ち数順）"
                  leading={jockeyLeading}
                  allTitle="全騎手データ"
                  allDescription="過去3年間に30レース以上出走している現役中央騎手のデータを集計しています。"
                  groups={JOCKEY_GROUPS}
                  hrefPrefix="/jockeys/"
                  unit="名"
                />

                <HomeLeadingSection
                  title="血統（種牡馬）別データ"
                  leadingTitle="種牡馬リーディング（勝ち数順）"
                  leading={sireLeading}
                  allTitle="全血統（種牡馬）データ"
                  allDescription="過去3年間に産駒が50レース以上出走し、かつ産駒が10頭以上いる種牡馬のデータを集計しています。"
                  groups={SIRE_GROUPS}
                  hrefPrefix="/sires/"
                  unit="頭"
                />

                <HomeLeadingSection
                  title="調教師別データ"
                  leadingTitle="調教師リーディング（勝ち数順）"
                  leading={trainerLeading}
                  allTitle="全調教師データ"
                  allDescription="過去3年間に30レース以上出走している現役中央調教師のデータを集計しています。"
                  groups={TRAINER_GROUPS}
                  hrefPrefix="/trainers/"
                  unit="名"
                />

                {/* コラム */}
                <section className={s.section} aria-label="コラム">
                  <div className={s.sh}>
                    <h2 className={s.h2}>コラム</h2>
                  </div>
                  <HomeColumnList articles={articles} />
                  <Link href="/articles" className={h.moreBtn}>
                    もっとみる
                  </Link>
                </section>
              </div>

              {/* バナーエリア */}
              <aside className={h.aside}>
                <AIBanner />
              </aside>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
