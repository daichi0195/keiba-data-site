import { Metadata } from 'next';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import HeaderMenu from '@/components/HeaderMenu';
import BottomNav from '@/components/BottomNav';
import JockeyLeadingChart from '@/components/JockeyLeadingChart';

// ISR: 週1回（604800秒）再生成
export const revalidate = 604800;

// 騎手データ型定義
interface JockeyData {
  id: string;
  name: string;
  kana: string;
  affiliation: string;
  debut_year: number;
  total_stats: {
    races: number;
    wins: number;
    places_2: number;
    places_3: number;
    win_rate: number;
    place_rate: number;
    quinella_rate: number;
  };
  data_period: string;
  last_updated: string;
  total_races: number;
  yearly_leading: Array<{
    year: number;
    wins: number;
    ranking: number;
  }>;
  course_stats: Array<{
    rank: number;
    name: string;
    racecourse: string;
    racecourse_en: string;
    surface: string;
    surface_en: string;
    distance: number;
    variant?: string;
    races: number;
    wins: number;
    places_2: number;
    places_3: number;
    win_rate: number;
    place_rate: number;
    quinella_rate: number;
    win_payback: number;
    place_payback: number;
  }>;
}

// 武豊のモックデータ
const mockJockeyData: Record<string, JockeyData> = {
  '666': {
    id: '666',
    name: '武豊',
    kana: 'タケユタカ',
    affiliation: '栗東',
    debut_year: 1987,
    data_period: '直近3年間分（2022年1月1日〜2024年12月31日）',
    last_updated: '2025年1月1日',
    total_races: 2489,
    total_stats: {
      races: 2489,
      wins: 453,
      places_2: 382,
      places_3: 312,
      win_rate: 18.2,
      place_rate: 46.1,
      quinella_rate: 33.5,
    },
    yearly_leading: [
      { year: 2022, wins: 142, ranking: 3 },
      { year: 2023, wins: 156, ranking: 2 },
      { year: 2024, wins: 155, ranking: 2 },
    ],
    course_stats: [
      {
        rank: 1,
        name: '中山競馬場 ダート 1800m',
        racecourse: '中山競馬場',
        racecourse_en: 'nakayama',
        surface: 'ダート',
        surface_en: 'dirt',
        distance: 1800,
        races: 75,
        wins: 23,
        places_2: 18,
        places_3: 12,
        win_rate: 30.7,
        place_rate: 70.7,
        quinella_rate: 54.7,
        win_payback: 115,
        place_payback: 108,
      },
      {
        rank: 2,
        name: '東京競馬場 芝 2400m',
        racecourse: '東京競馬場',
        racecourse_en: 'tokyo',
        surface: '芝',
        surface_en: 'turf',
        distance: 2400,
        races: 89,
        wins: 21,
        places_2: 18,
        places_3: 14,
        win_rate: 23.6,
        place_rate: 59.6,
        quinella_rate: 43.8,
        win_payback: 108,
        place_payback: 104,
      },
      {
        rank: 3,
        name: '阪神競馬場 芝 1600m',
        racecourse: '阪神競馬場',
        racecourse_en: 'hanshin',
        surface: '芝',
        surface_en: 'turf',
        distance: 1600,
        races: 121,
        wins: 27,
        places_2: 22,
        places_3: 18,
        win_rate: 22.3,
        place_rate: 55.4,
        quinella_rate: 40.5,
        win_payback: 105,
        place_payback: 101,
      },
      {
        rank: 4,
        name: '京都競馬場 芝 2000m',
        racecourse: '京都競馬場',
        racecourse_en: 'kyoto',
        surface: '芝',
        surface_en: 'turf',
        distance: 2000,
        races: 98,
        wins: 22,
        places_2: 19,
        places_3: 15,
        win_rate: 22.4,
        place_rate: 57.1,
        quinella_rate: 41.8,
        win_payback: 106,
        place_payback: 102,
      },
      {
        rank: 5,
        name: '中山競馬場 芝 2000m',
        racecourse: '中山競馬場',
        racecourse_en: 'nakayama',
        surface: '芝',
        surface_en: 'turf',
        distance: 2000,
        races: 92,
        wins: 20,
        places_2: 16,
        places_3: 13,
        win_rate: 21.7,
        place_rate: 53.3,
        quinella_rate: 39.1,
        win_payback: 102,
        place_payback: 98,
      },
      {
        rank: 6,
        name: '阪神競馬場 ダート 1400m',
        racecourse: '阪神競馬場',
        racecourse_en: 'hanshin',
        surface: 'ダート',
        surface_en: 'dirt',
        distance: 1400,
        races: 68,
        wins: 18,
        places_2: 14,
        places_3: 11,
        win_rate: 26.5,
        place_rate: 63.2,
        quinella_rate: 47.1,
        win_payback: 110,
        place_payback: 105,
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const jockey = mockJockeyData[id];

  if (!jockey) {
    return {
      title: '騎手データが見つかりません | KEIBA DATA LAB',
    };
  }

  const title = `${jockey.name} | 騎手データ | KEIBA DATA LAB`;
  const description = `${jockey.name}騎手のコース別成績、得意条件などの詳細データを分析。通算${jockey.total_stats.wins}勝、勝率${jockey.total_stats.win_rate}%。`;
  const url = `https://www.keibadata.com/jockeys/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: '競馬データ.com',
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function JockeyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jockey = mockJockeyData[id];

  if (!jockey) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>騎手データが見つかりません</h1>
        <Link href="/">トップページに戻る</Link>
      </div>
    );
  }

  // 通算成績をテーブル形式に変換
  const totalStatsData = [
    {
      rank: 1,
      name: '通算成績',
      races: jockey.total_stats.races,
      wins: jockey.total_stats.wins,
      places_2: jockey.total_stats.places_2,
      places_3: jockey.total_stats.places_3,
      win_rate: jockey.total_stats.win_rate,
      quinella_rate: jockey.total_stats.quinella_rate,
      place_rate: jockey.total_stats.place_rate,
      win_payback: 0, // 通算成績では非表示
      place_payback: 0, // 通算成績では非表示
    }
  ];

  // DataTableコンポーネント用にデータ整形（linkプロパティを追加）
  const courseTableData = jockey.course_stats.map((stat) => ({
    ...stat,
    link: `/courses/${stat.racecourse_en}/${stat.surface_en}/${
      stat.variant ? `${stat.distance}-${stat.variant}` : stat.distance
    }`,
  }));

  // ナビゲーションアイテム
  const navigationItems = [
    { id: 'leading', label: 'リーディング' },
    { id: 'total-stats', label: '通算成績' },
    { id: 'course-stats', label: 'コース別' },
  ];

  // 構造化データ - BreadcrumbList
  const baseUrl = 'https://www.keibadata.com';
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'ホーム',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '騎手一覧',
        item: `${baseUrl}/jockeys`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: jockey.name,
        item: `${baseUrl}/jockeys/${id}`,
      },
    ],
  };

  return (
    <>
      {/* 構造化データの埋め込み */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HeaderMenu />
      <BottomNav items={navigationItems} />
      <main>
        <article>
          {/* 騎手ヘッダー */}
          <div className="course-header">
            <h1>{jockey.name}</h1>

            {/* データ情報セクション */}
            <div className="course-meta-section">
              <div className="meta-item">
                <span className="meta-label">データ取得期間</span>
                <span>
                  直近3年間分
                  <span className="meta-sub-text">
                    {jockey.data_period.match(/（[^）]+）/)?.[0] || jockey.data_period}
                  </span>
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">対象レース数</span>
                <span>{jockey.total_races}レース</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">最終更新日</span>
                <span>{jockey.last_updated}</span>
              </div>
            </div>
          </div>

          {/* 騎手リーディングセクション */}
          <section id="leading" aria-label="騎手リーディング">
            <JockeyLeadingChart
              title={`${jockey.name} 騎手リーディング`}
              data={jockey.yearly_leading}
            />
          </section>

          {/* 通算成績セクション */}
          <section id="total-stats" aria-label="通算成績">
            <DataTable
              title={`${jockey.name} 通算成績`}
              data={totalStatsData}
              nameLabel="期間"
            />
          </section>

          {/* コース別成績 */}
          <section id="course-stats" aria-label="コース別成績">
            <DataTable
              title={`${jockey.name} コース別成績`}
              data={courseTableData}
              initialShow={10}
              nameLabel="コース"
              note="最大50件まで表示"
            />
          </section>
        </article>
      </main>

      {/* パンくず（フッター） */}
      <nav aria-label="パンくずリスト" className="breadcrumb-footer">
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <li><Link href="/">ホーム</Link></li>
          <li aria-hidden="true">&gt;</li>
          <li><Link href="/jockeys">騎手一覧</Link></li>
          <li aria-hidden="true">&gt;</li>
          <li aria-current="page">{jockey.name}</li>
        </ol>
      </nav>
    </>
  );
}
