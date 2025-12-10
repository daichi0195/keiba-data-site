import { Metadata } from 'next';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import HeaderMenu from '@/components/HeaderMenu';
import BottomNav from '@/components/BottomNav';
import JockeyLeadingChart from '@/components/JockeyLeadingChart';
import PopularityTable from '@/components/PopularityTable';
import RunningStyleTable from '@/components/RunningStyleTable';
import GateTable from '@/components/GateTable';
import RacecourseCourseTable from '@/components/RacecourseCourseTable';

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
  yearly_stats: Array<{
    year: number;
    races: number;
    wins: number;
    places_2: number;
    places_3: number;
    win_rate: number;
    place_rate: number;
    quinella_rate: number;
  }>;
  distance_stats: Array<{
    category: string;
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
  surface_stats: Array<{
    surface: string;
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
  popularity_stats: {
    fav1: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; };
    fav2: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; };
    fav3: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; };
    fav4: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; };
    fav5: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; };
    fav6to9: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; };
    fav10plus: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; };
  };
  running_style_stats: Array<{
    style: string;
    style_label: string;
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
  gate_stats: Array<{
    gate: number;
    color: string;
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
    yearly_stats: [
      { year: 2025, races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, place_rate: 0, quinella_rate: 0 },
      { year: 2024, races: 863, wins: 155, places_2: 138, places_3: 115, win_rate: 18.0, place_rate: 47.3, quinella_rate: 34.2 },
      { year: 2023, races: 845, wins: 156, places_2: 129, places_3: 108, win_rate: 18.5, place_rate: 46.5, quinella_rate: 33.7 },
    ],
    distance_stats: [
      { category: '短距離', races: 145, wins: 28, places_2: 22, places_3: 18, win_rate: 19.3, place_rate: 46.9, quinella_rate: 34.5, win_payback: 98, place_payback: 95 },
      { category: 'マイル', races: 198, wins: 38, places_2: 31, places_3: 26, win_rate: 19.2, place_rate: 48.0, quinella_rate: 34.8, win_payback: 102, place_payback: 99 },
      { category: '中距離', races: 356, wins: 68, places_2: 59, places_3: 48, win_rate: 19.1, place_rate: 49.2, quinella_rate: 35.7, win_payback: 105, place_payback: 101 },
      { category: '中長距離', races: 289, wins: 54, places_2: 47, places_3: 39, win_rate: 18.7, place_rate: 48.4, quinella_rate: 35.0, win_payback: 107, place_payback: 103 },
      { category: '長距離', races: 267, wins: 51, places_2: 44, places_3: 36, win_rate: 19.1, place_rate: 49.1, quinella_rate: 35.8, win_payback: 106, place_payback: 102 },
    ],
    surface_stats: [
      { surface: '芝', races: 785, wins: 157, places_2: 131, places_3: 105, win_rate: 20.0, place_rate: 50.1, quinella_rate: 36.7, win_payback: 102, place_payback: 98 },
      { surface: 'ダート', races: 470, wins: 82, places_2: 72, places_3: 62, win_rate: 17.4, place_rate: 46.0, quinella_rate: 32.6, win_payback: 108, place_payback: 104 },
    ],
    popularity_stats: {
      fav1:      { races: 285, wins: 98, places_2: 72, places_3: 45, win_rate: 34.4, quinella_rate: 59.6, place_rate: 75.4, win_payback: 85,  place_payback: 91 },
      fav2:      { races: 278, wins: 71, places_2: 68, places_3: 53, win_rate: 25.5, quinella_rate: 50.0, place_rate: 69.1, win_payback: 92,  place_payback: 94 },
      fav3:      { races: 265, wins: 48, places_2: 55, places_3: 58, win_rate: 18.1, quinella_rate: 38.9, place_rate: 60.8, win_payback: 96,  place_payback: 98 },
      fav4:      { races: 242, wins: 35, places_2: 42, places_3: 48, win_rate: 14.5, quinella_rate: 31.8, place_rate: 51.7, win_payback: 98,  place_payback: 100 },
      fav5:      { races: 218, wins: 25, places_2: 32, places_3: 38, win_rate: 11.5, quinella_rate: 26.1, place_rate: 43.6, win_payback: 100, place_payback: 102 },
      fav6to9:   { races: 380, wins: 35, places_2: 48, places_3: 62, win_rate: 9.2,  quinella_rate: 21.8, place_rate: 38.2, win_payback: 104, place_payback: 106 },
      fav10plus: { races: 287, wins: 18, places_2: 28, places_3: 42, win_rate: 6.3,  quinella_rate: 16.0, place_rate: 30.7, win_payback: 110, place_payback: 112 },
    },
    running_style_stats: [
      { style: 'escape', style_label: '逃げ', races: 220, wins: 52, places_2: 45, places_3: 38, win_rate: 23.6, place_rate: 61.4, quinella_rate: 44.1, win_payback: 98, place_payback: 95 },
      { style: 'lead', style_label: '先行', races: 385, wins: 88, places_2: 78, places_3: 65, win_rate: 22.9, place_rate: 60.0, quinella_rate: 43.1, win_payback: 105, place_payback: 100 },
      { style: 'pursue', style_label: '差し', races: 342, wins: 68, places_2: 72, places_3: 61, win_rate: 19.9, place_rate: 58.8, quinella_rate: 40.9, win_payback: 92, place_payback: 94 },
      { style: 'close', style_label: '追込', races: 175, wins: 28, places_2: 32, places_3: 35, win_rate: 16.0, place_rate: 54.3, quinella_rate: 34.3, win_payback: 85, place_payback: 88 },
    ],
    gate_stats: [
      { gate: 1, color: '#FFFFFF', races: 155, wins: 32, places_2: 28, places_3: 24, win_rate: 20.6, place_rate: 54.2, quinella_rate: 38.7, win_payback: 98, place_payback: 95 },
      { gate: 2, color: '#222222', races: 158, wins: 35, places_2: 30, places_3: 26, win_rate: 22.2, place_rate: 57.6, quinella_rate: 41.1, win_payback: 102, place_payback: 98 },
      { gate: 3, color: '#C62927', races: 162, wins: 38, places_2: 32, places_3: 28, win_rate: 23.5, place_rate: 60.5, quinella_rate: 43.2, win_payback: 108, place_payback: 102 },
      { gate: 4, color: '#2573CD', races: 148, wins: 31, places_2: 29, places_3: 25, win_rate: 20.9, place_rate: 57.4, quinella_rate: 40.5, win_payback: 95, place_payback: 93 },
      { gate: 5, color: '#E4CA3C', races: 152, wins: 30, places_2: 28, places_3: 26, win_rate: 19.7, place_rate: 55.3, quinella_rate: 38.2, win_payback: 92, place_payback: 90 },
      { gate: 6, color: '#58AF4A', races: 145, wins: 28, places_2: 26, places_3: 24, win_rate: 19.3, place_rate: 53.8, quinella_rate: 37.2, win_payback: 88, place_payback: 86 },
      { gate: 7, color: '#FAA727', races: 138, wins: 25, places_2: 24, places_3: 22, win_rate: 18.1, place_rate: 51.4, quinella_rate: 35.5, win_payback: 85, place_payback: 83 },
      { gate: 8, color: '#DC6179', races: 142, wins: 23, places_2: 25, places_3: 23, win_rate: 16.2, place_rate: 50.0, quinella_rate: 33.8, win_payback: 82, place_payback: 80 },
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

  // 年度別データをテーブル形式に変換（順位なし）
  const yearlyStatsData = jockey.yearly_stats.map((stat) => ({
    name: `${stat.year}年`,
    races: stat.races,
    wins: stat.wins,
    places_2: stat.places_2,
    places_3: stat.places_3,
    win_rate: stat.win_rate,
    quinella_rate: stat.quinella_rate,
    place_rate: stat.place_rate,
    win_payback: 0, // 年度別では非表示
    place_payback: 0, // 年度別では非表示
  }));

  // 距離別データをテーブル形式に変換（順位なし）
  const distanceStatsData = jockey.distance_stats.map((stat) => ({
    name: stat.category,
    races: stat.races,
    wins: stat.wins,
    places_2: stat.places_2,
    places_3: stat.places_3,
    win_rate: stat.win_rate,
    quinella_rate: stat.quinella_rate,
    place_rate: stat.place_rate,
    win_payback: stat.win_payback,
    place_payback: stat.place_payback,
  }));

  // 芝・ダート別データをテーブル形式に変換（順位なし）
  const surfaceStatsData = jockey.surface_stats.map((stat) => ({
    name: stat.surface,
    races: stat.races,
    wins: stat.wins,
    places_2: stat.places_2,
    places_3: stat.places_3,
    win_rate: stat.win_rate,
    quinella_rate: stat.quinella_rate,
    place_rate: stat.place_rate,
    win_payback: stat.win_payback,
    place_payback: stat.place_payback,
  }));

  // DataTableコンポーネント用にデータ整形（linkプロパティを追加）
  const courseTableData = jockey.course_stats.map((stat) => ({
    ...stat,
    link: `/courses/${stat.racecourse_en}/${stat.surface_en}/${
      stat.variant ? `${stat.distance}-${stat.variant}` : stat.distance
    }`,
  }));

  // 競馬場別にグループ化（HeaderMenuの順序に合わせる）
  const racecourseOrder = [
    { ja: '札幌競馬場', en: 'sapporo' },
    { ja: '函館競馬場', en: 'hakodate' },
    { ja: '福島競馬場', en: 'fukushima' },
    { ja: '新潟競馬場', en: 'niigata' },
    { ja: '東京競馬場', en: 'tokyo' },
    { ja: '中山競馬場', en: 'nakayama' },
    { ja: '中京競馬場', en: 'chukyo' },
    { ja: '京都競馬場', en: 'kyoto' },
    { ja: '阪神競馬場', en: 'hanshin' },
    { ja: '小倉競馬場', en: 'kokura' },
  ];

  const coursesByRacecourse = racecourseOrder.map(racecourse => {
    const courses = courseTableData
      .filter(c => c.racecourse_en === racecourse.en)
      .sort((a, b) => {
        // 芝を先に、ダートを後に
        if (a.surface_en !== b.surface_en) {
          return a.surface_en === 'turf' ? -1 : 1;
        }
        // 同じ芝質内では距離順
        return a.distance - b.distance;
      });

    return {
      racecourse_ja: racecourse.ja,
      racecourse_en: racecourse.en,
      courses: courses,
    };
  }).filter(group => group.courses.length > 0); // コースがある競馬場のみ

  // ナビゲーションアイテム
  const navigationItems = [
    { id: 'leading', label: 'リーディング' },
    { id: 'yearly-stats', label: '年度別' },
    { id: 'popularity-stats', label: '人気別' },
    { id: 'running-style-stats', label: '脚質別' },
    { id: 'gate-stats', label: '枠順別' },
    { id: 'distance-stats', label: '距離別' },
    { id: 'surface-stats', label: '芝・ダート別' },
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

          {/* 年度別データセクション */}
          <section id="yearly-stats" aria-label="年度別データ">
            <DataTable
              title={`${jockey.name} 年度別データ`}
              data={yearlyStatsData}
              nameLabel="年度"
              disableHighlight={true}
              showRank={false}
            />
          </section>

          {/* 人気別データセクション */}
          <section id="popularity-stats" aria-label="人気別データ">
            <PopularityTable
              title={`${jockey.name} 人気別データ`}
              data={jockey.popularity_stats}
            />
          </section>

          {/* 脚質別データセクション */}
          <section id="running-style-stats" aria-label="脚質別データ">
            <RunningStyleTable
              title={`${jockey.name} 脚質別データ`}
              data={jockey.running_style_stats}
            />
          </section>

          {/* 枠順別データセクション */}
          <section id="gate-stats" aria-label="枠順別データ">
            <GateTable
              title={`${jockey.name} 枠順別データ`}
              data={jockey.gate_stats}
            />
          </section>

          {/* 距離別データセクション */}
          <section id="distance-stats" aria-label="距離別データ">
            <DataTable
              title={`${jockey.name} 距離別データ`}
              data={distanceStatsData}
              nameLabel="距離"
              showRank={false}
            />
          </section>

          {/* 芝・ダート別データセクション */}
          <section id="surface-stats" aria-label="芝・ダート別データ">
            <DataTable
              title={`${jockey.name} 芝・ダート別データ`}
              data={surfaceStatsData}
              nameLabel="芝質"
              showRank={false}
            />
          </section>

          {/* コース別成績 */}
          <section id="course-stats" aria-label="コース別成績">
            <RacecourseCourseTable
              title={`${jockey.name} コース別成績`}
              data={coursesByRacecourse}
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
