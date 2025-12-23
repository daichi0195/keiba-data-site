import { Metadata } from 'next';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import HeaderMenu from '@/components/HeaderMenu';
import BottomNav from '@/components/BottomNav';
import JockeyLeadingChart from '@/components/JockeyLeadingChart';
import YearlyTable from '@/components/YearlyTable';
import ClassTable from '@/components/ClassTable';
import PopularityTable from '@/components/PopularityTable';
import RunningStyleTable from '@/components/RunningStyleTable';
import GateTable from '@/components/GateTable';
import DistanceTable from '@/components/DistanceTable';
import SurfaceTable from '@/components/SurfaceTable';
import TrackConditionTable from '@/components/TrackConditionTable';
import RacecourseTable from '@/components/RacecourseTable';
import RacecourseCourseTable from '@/components/RacecourseCourseTable';
import GenderTable from '@/components/GenderTable';
import IntervalTable from '@/components/IntervalTable';
import BarChartAnimation from '@/components/BarChartAnimation';
import VolatilityExplanation from '@/components/VolatilityExplanation';
import GatePositionExplanation from '@/components/GatePositionExplanation';
import RunningStyleExplanation from '@/components/RunningStyleExplanation';
import DistanceTrendExplanation from '@/components/DistanceTrendExplanation';
import JockeyTrainerHighlights from '@/components/JockeyTrainerHighlights';
import { getSireDataFromGCS } from '@/lib/getSireDataFromGCS';
import { ALL_SIRES } from '@/lib/sires';

// ISR: 週1回（604800秒）再生成
export const revalidate = 604800;

// generateStaticParams: 全種牡馬ページを事前生成
export async function generateStaticParams() {
  return ALL_SIRES.map((sire) => ({
    id: String(sire.id),
  }));
}

// 種牡馬データ型定義
interface SireData {
  id: string;
  name: string;
  name_en: string;
  birth_year: number;
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
  trainer_stats: Array<{
    rank: number;
    name: string;
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
  jockey_stats: Array<{
    rank: number;
    name: string;
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
  track_condition_stats: Array<{
    surface: string;
    condition: string;
    condition_label: string;
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
  class_stats: Array<{
    rank: number;
    class_name: string;
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
  gender_stats: Array<{
    name: string;
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
  interval_stats: Array<{
    interval: string;
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
  racecourse_stats: Array<{
    name: string;
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
  characteristics: {
    volatility: number;
    fav1_place_rate: number;
    all_fav1_place_rate: number;
    fav1_races: number;
    fav1_ranking: number;
    total_sires: number;
    running_style_trend_position?: number;
  };
  running_style_trends?: Array<{
    style: string;
    style_label: string;
    place_rate: number;
  }>;
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  // GCSから種牡馬データを取得
  let sire: SireData;
  try {
    sire = await getSireDataFromGCS(id) as SireData;
  } catch (error) {
    return {
      title: '種牡馬データが見つかりません | 競馬データ.com',
    };
  }

  const title = `${sire.name}産駒の成績・データまとめ - 競馬データ.com`;
  const description = `${sire.name}産駒のコース別成績、得意条件などの詳細データを分析。通算${sire.total_stats.wins}勝、勝率${sire.total_stats.win_rate}%。`;
  const url = `https://www.keibadata.com/sires/${id}`;

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

export default async function SirePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // GCSから種牡馬データを取得
  let sire: SireData;
  try {
    sire = await getSireDataFromGCS(id) as SireData;
  } catch (error) {
    console.error('Failed to load sire data:', error);
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>種牡馬データの読み込みに失敗しました</h1>
        <Link href="/">トップページに戻る</Link>
      </div>
    );
  }

  // 現在の年度を取得
  const currentYear = new Date().getFullYear();

  // 年度別データを直近3年分に絞り込み、データがない年も必ず含める
  const yearlyStatsData = (() => {
    const years = [currentYear, currentYear - 1, currentYear - 2];
    return years.map(year => {
      const existingData = sire.yearly_stats.find(stat => stat.year === year);
      return existingData || {
        year,
        races: 0,
        wins: 0,
        places_2: 0,
        places_3: 0,
        win_rate: 0,
        place_rate: 0,
        quinella_rate: 0,
        win_payback: 0,
        place_payback: 0,
      };
    });
  })();

  // 距離別データをテーブル形式に変換（中長距離と長距離をマージ）
  const distanceStatsRaw = sire.distance_stats.reduce((acc, stat) => {
    // 中長距離を長距離にマージ
    const categoryName = stat.category === '中長距離' ? '長距離' : stat.category;

    const existing = acc.find(item => item.name === categoryName);
    if (existing) {
      // 既存のカテゴリに統合（合計を計算）
      existing.races += stat.races;
      existing.wins += stat.wins;
      existing.places_2 += stat.places_2;
      existing.places_3 += stat.places_3;
    } else {
      // 新しいカテゴリを追加
      acc.push({
        name: categoryName,
        races: stat.races,
        wins: stat.wins,
        places_2: stat.places_2,
        places_3: stat.places_3,
        win_rate: 0, // 後で再計算
        quinella_rate: 0,
        place_rate: 0,
        win_payback: stat.win_payback,
        place_payback: stat.place_payback,
      });
    }
    return acc;
  }, [] as Array<{
    name: string;
    races: number;
    wins: number;
    places_2: number;
    places_3: number;
    win_rate: number;
    quinella_rate: number;
    place_rate: number;
    win_payback: number;
    place_payback: number;
  }>);

  // 勝率・連対率・複勝率を再計算
  const distanceStatsData = distanceStatsRaw.map(stat => ({
    ...stat,
    win_rate: stat.races > 0 ? (stat.wins / stat.races) * 100 : 0,
    quinella_rate: stat.races > 0 ? ((stat.wins + stat.places_2) / stat.races) * 100 : 0,
    place_rate: stat.races > 0 ? ((stat.wins + stat.places_2 + stat.places_3) / stat.races) * 100 : 0,
  }));

  // 芝・ダート別データをテーブル形式に変換（順位なし）
  const surfaceStatsData = sire.surface_stats.map((stat) => ({
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

  // 芝・ダートの得意傾向を計算（複勝率の差から判定）
  const turfStat = sire.surface_stats.find(s => s.surface === '芝');
  const dirtStat = sire.surface_stats.find(s => s.surface === 'ダート');
  let surfaceTrendPosition = 3; // デフォルトは互角
  if (turfStat && dirtStat) {
    const diff = turfStat.place_rate - dirtStat.place_rate;
    if (diff >= 5) surfaceTrendPosition = 5; // 芝が得意
    else if (diff >= 2) surfaceTrendPosition = 4; // やや芝が得意
    else if (diff <= -5) surfaceTrendPosition = 1; // ダートが得意
    else if (diff <= -2) surfaceTrendPosition = 2; // ややダートが得意
    else surfaceTrendPosition = 3; // 互角
  }

  // 得意な脚質傾向を計算（逃げ・先行 vs 差し・追込の複勝率差から判定）
  const frontRunners = sire.running_style_stats.filter(s =>
    s.style === 'escape' || s.style === 'lead'
  );
  const closers = sire.running_style_stats.filter(s =>
    s.style === 'pursue' || s.style === 'close'
  );

  let runningStyleTrendPosition = 3; // デフォルトは互角
  if (frontRunners.length > 0 && closers.length > 0) {
    // 加重平均で複勝率を計算（出走数で重み付け）
    const frontTotalRaces = frontRunners.reduce((sum, s) => sum + s.races, 0);
    const frontWeightedPlaceRate = frontRunners.reduce((sum, s) =>
      sum + (s.place_rate * s.races), 0
    ) / frontTotalRaces;

    const closerTotalRaces = closers.reduce((sum, s) => sum + s.races, 0);
    const closerWeightedPlaceRate = closers.reduce((sum, s) =>
      sum + (s.place_rate * s.races), 0
    ) / closerTotalRaces;

    const diff = frontWeightedPlaceRate - closerWeightedPlaceRate;
    if (diff >= 5) runningStyleTrendPosition = 1; // 逃げ・先行が得意
    else if (diff >= 2) runningStyleTrendPosition = 2; // やや逃げ・先行が得意
    else if (diff <= -5) runningStyleTrendPosition = 5; // 差し・追込が得意
    else if (diff <= -2) runningStyleTrendPosition = 4; // やや差し・追込が得意
    else runningStyleTrendPosition = 3; // 互角
  }

  // 得意な距離傾向を計算（短距離・マイル vs 中距離・長距離の複勝率差から判定）
  const shortDistances = distanceStatsData.filter(d =>
    d.name === '短距離' || d.name === 'マイル'
  );
  const longDistances = distanceStatsData.filter(d =>
    d.name === '中距離' || d.name === '長距離'
  );

  let distanceTrendPosition = 3; // デフォルトは互角
  if (shortDistances.length > 0 && longDistances.length > 0) {
    // 加重平均で複勝率を計算（出走数で重み付け）
    const shortTotalRaces = shortDistances.reduce((sum, d) => sum + d.races, 0);
    const shortWeightedPlaceRate = shortDistances.reduce((sum, d) =>
      sum + (d.place_rate * d.races), 0
    ) / shortTotalRaces;

    const longTotalRaces = longDistances.reduce((sum, d) => sum + d.races, 0);
    const longWeightedPlaceRate = longDistances.reduce((sum, d) =>
      sum + (d.place_rate * d.races), 0
    ) / longTotalRaces;

    const diff = shortWeightedPlaceRate - longWeightedPlaceRate;
    if (diff >= 5) distanceTrendPosition = 1; // 短距離が得意
    else if (diff >= 2) distanceTrendPosition = 2; // やや短距離が得意
    else if (diff <= -5) distanceTrendPosition = 5; // 長距離が得意
    else if (diff <= -2) distanceTrendPosition = 4; // やや長距離が得意
    else distanceTrendPosition = 3; // 互角
  }

  // 馬場状態別データをテーブル形式に変換（順位なし）
  const trackConditionStatsData = sire.track_condition_stats.map((stat) => {
    // 馬場状態ラベルを短縮
    let shortLabel = stat.condition_label;
    if (shortLabel === '稍重') shortLabel = '稍';
    if (shortLabel === '不良') shortLabel = '不';

    return {
      name: `${stat.surface}・${shortLabel}`,
      surface: stat.surface,
      condition_label: shortLabel,
      races: stat.races,
      wins: stat.wins,
      places_2: stat.places_2,
      places_3: stat.places_3,
      win_rate: stat.win_rate,
      quinella_rate: stat.quinella_rate,
      place_rate: stat.place_rate,
      win_payback: stat.win_payback,
      place_payback: stat.place_payback,
    };
  });

  // クラス別データをテーブル形式に変換（順位なし）
  const classStatsData = sire.class_stats.map((stat) => ({
    name: stat.class_name,
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
  // 障害コースを除外
  const courseTableData = sire.course_stats
    .filter((stat) => stat.surface_en !== 'obstacle')
    .map((stat) => ({
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

  // 競馬場別サマリーデータを集計
  const racecourseSummaryData = racecourseOrder.map(racecourse => {
    const racecourseCourses = sire.course_stats.filter(c => c.racecourse_en === racecourse.en);

    if (racecourseCourses.length === 0) return null;

    const totalRaces = racecourseCourses.reduce((sum, c) => sum + c.races, 0);
    const totalWins = racecourseCourses.reduce((sum, c) => sum + c.wins, 0);
    const totalPlaces2 = racecourseCourses.reduce((sum, c) => sum + c.places_2, 0);
    const totalPlaces3 = racecourseCourses.reduce((sum, c) => sum + c.places_3, 0);

    const winRate = totalRaces > 0 ? (totalWins / totalRaces) * 100 : 0;
    const quinellaRate = totalRaces > 0 ? ((totalWins + totalPlaces2) / totalRaces) * 100 : 0;
    const placeRate = totalRaces > 0 ? ((totalWins + totalPlaces2 + totalPlaces3) / totalRaces) * 100 : 0;

    // 回収率は各コースの回収率を出走数で加重平均
    const winPayback = totalRaces > 0
      ? racecourseCourses.reduce((sum, c) => sum + (c.win_payback * c.races), 0) / totalRaces
      : 0;
    const placePayback = totalRaces > 0
      ? racecourseCourses.reduce((sum, c) => sum + (c.place_payback * c.races), 0) / totalRaces
      : 0;

    return {
      name: racecourse.ja.replace('競馬場', ''),
      races: totalRaces,
      wins: totalWins,
      places_2: totalPlaces2,
      places_3: totalPlaces3,
      win_rate: winRate,
      quinella_rate: quinellaRate,
      place_rate: placeRate,
      win_payback: winPayback,
      place_payback: placePayback,
    };
  }).filter(item => item !== null);

  // 中央・ローカルの集計行を追加（モックデータ）
  const centralData = {
    name: '中央',
    races: 1850,
    wins: 345,
    places_2: 290,
    places_3: 235,
    win_rate: 18.6,
    quinella_rate: 34.3,
    place_rate: 47.0,
    win_payback: 78.5,
    place_payback: 82.1,
  };

  const localData = {
    name: 'ローカル',
    races: 639,
    wins: 108,
    places_2: 92,
    places_3: 77,
    win_rate: 16.9,
    quinella_rate: 31.3,
    place_rate: 43.3,
    win_payback: 72.8,
    place_payback: 76.5,
  };

  // 競馬場データの最後に中央・ローカルを追加
  const racecourseSummaryDataWithTotals = [...racecourseSummaryData, centralData, localData];

  // ナビゲーションアイテム
  const navigationItems = [
    { id: 'leading', label: '年度別' },
    { id: 'characteristics', label: '特徴' },
    { id: 'highlights-section', label: '注目ポイント' },
    { id: 'class-stats', label: 'クラス別' },
    { id: 'popularity-stats', label: '人気別' },
    { id: 'running-style-stats', label: '脚質別' },
    { id: 'gate-stats', label: '枠順別' },
    { id: 'distance-stats', label: '距離別' },
    { id: 'gender-stats', label: '性別' },
    { id: 'interval-stats', label: 'レース間隔' },
    { id: 'surface-stats', label: '芝・ダート別' },
    { id: 'track-condition-stats', label: '馬場状態別' },
    { id: 'racecourse-stats', label: '競馬場別' },
    { id: 'course-stats', label: 'コース別' },
    { id: 'trainer-stats', label: '調教師別' },
    { id: 'jockey-stats', label: '騎手別' },
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
        name: '種牡馬一覧',
        item: `${baseUrl}/sires`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: sire.name,
        item: `${baseUrl}/sires/${id}`,
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
          {/* 種牡馬ヘッダー */}
          <div className="page-header">
            <h1>{sire.name}産駒の成績・データ</h1>

            {/* データ情報セクション */}
            <div className="course-meta-section">
              <div className="meta-item">
                <span className="meta-label">データ取得期間</span>
                <span>
                  直近3年間分
                  <span className="meta-sub-text">
                    {sire.data_period.match(/（[^）]+）/)?.[0] || sire.data_period}
                  </span>
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">対象レース数</span>
                <span>{sire.total_races.toLocaleString()}レース</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">最終更新日</span>
                <span>{sire.last_updated}</span>
              </div>
            </div>
          </div>

          {/* 年度別成績セクション */}
          <section id="leading" aria-label="年度別成績">
            <JockeyLeadingChart
              title={`${sire.name}産駒 年度別成績`}
              data={(() => {
                // チャート用: 2年前→1年前→今年の順（古い順）で、データがない年も含める
                const years = [currentYear - 2, currentYear - 1, currentYear];
                return years.map(year => {
                  const existingData = sire.yearly_leading.find(stat => stat.year === year);
                  return existingData || {
                    year,
                    wins: 0,
                    ranking: 0,
                  };
                });
              })()}
            >
              <YearlyTable
                data={yearlyStatsData}
              />
            </JockeyLeadingChart>
          </section>

          {/* 種牡馬特徴セクション */}
          <section id="characteristics" aria-label="種牡馬特徴">
            <BarChartAnimation>
              <div className="characteristics-box">
                <h2 className="section-title">{sire.name}産駒の特徴</h2>

                {/* 人気時の信頼度 */}
                <div className="gauge-item">
                  <div className="gauge-header">
                    <h3 className="gauge-label">人気時の信頼度</h3>
                    <VolatilityExplanation pageType="sire" />
                  </div>
                  <div className="gauge-track">
                    <div className="gauge-indicator" style={{ left: `${(sire.characteristics.volatility - 1) * 25}%` }}></div>
                    <div className="gauge-horse-icon" style={{ left: `${(sire.characteristics.volatility - 1) * 25}%` }}>🏇</div>
                  </div>
                  <div className="gauge-labels">
                    <span>低い</span>
                    <span>標準</span>
                    <span>高い</span>
                  </div>
                  <div className="gauge-result">
                    {sire.characteristics.volatility === 1 && '低い'}
                    {sire.characteristics.volatility === 2 && 'やや低い'}
                    {sire.characteristics.volatility === 3 && '標準'}
                    {sire.characteristics.volatility === 4 && 'やや高い'}
                    {sire.characteristics.volatility === 5 && '高い'}
                  </div>
                  <div className="gauge-ranking">
                    <div className="ranking-item">
                      <span className="ranking-label">1番人気時の複勝率ランキング</span>
                      <span className="ranking-value">
                        {sire.characteristics.fav1_ranking > 0 && sire.characteristics.total_sires > 0
                          ? `${sire.characteristics.fav1_ranking}位/${sire.characteristics.total_sires}頭`
                          : 'データなし'}
                      </span>
                    </div>
                    <div className="ranking-detail">
                      <div className="ranking-detail-title">1番人気時の複勝率</div>
                      <div className="detail-row">
                        <span className="detail-label">この種牡馬産駒の複勝率</span>
                        <span className="detail-value">
                          {sire.characteristics.fav1_place_rate > 0
                            ? `${sire.characteristics.fav1_place_rate.toFixed(1)}%`
                            : 'データなし'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">全種牡馬産駒の1番人気の複勝率</span>
                        <span className="detail-value">
                          {sire.characteristics.all_fav1_place_rate > 0
                            ? `${sire.characteristics.all_fav1_place_rate.toFixed(1)}%`
                            : 'データなし'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
                <p className="note-text">
                  ※複勝率ランキングは1番人気が10走以上の種牡馬を対象
                </p>

                {/* 区切り線 */}
                <div className="section-divider"></div>

                {/* 得意なコース傾向 */}
                <div className="gauge-item">
                  <div className="gauge-header">
                    <h3 className="gauge-label">得意なコース傾向</h3>
                    <GatePositionExplanation pageType="sire" />
                  </div>
                  <div className="gauge-track">
                    <div className="gauge-indicator" style={{ left: `${(surfaceTrendPosition - 1) * 25}%` }}></div>
                    <div className="gauge-horse-icon" style={{ left: `${(surfaceTrendPosition - 1) * 25}%` }}>🏇</div>
                  </div>
                  <div className="gauge-labels">
                    <span>ダートが得意</span>
                    <span>差分なし</span>
                    <span>芝が得意</span>
                  </div>
                  <div className="gauge-result">
                    {surfaceTrendPosition === 1 && 'ダートが得意'}
                    {surfaceTrendPosition === 2 && 'ややダートが得意'}
                    {surfaceTrendPosition === 3 && '差分なし'}
                    {surfaceTrendPosition === 4 && 'やや芝が得意'}
                    {surfaceTrendPosition === 5 && '芝が得意'}
                  </div>

                  {/* コース別複勝率グラフ */}
                  <div className="gate-place-rate-detail">
                    <div className="gate-detail-title">コース別複勝率</div>
                    <div className="gate-chart">
                      {sire.surface_stats
                        .sort((a, b) => {
                          // 芝を先に、ダートを後に
                          if (a.surface === '芝' && b.surface !== '芝') return -1;
                          if (a.surface !== '芝' && b.surface === '芝') return 1;
                          return 0;
                        })
                        .map((surface) => {
                          const isTurf = surface.surface === '芝';
                          const displayLabel = isTurf ? '芝' : 'ダ';
                          return (
                            <div key={surface.surface} className="gate-chart-item">
                              <div
                                className="gate-number-badge"
                                style={{
                                  background: isTurf ? '#e2f7eb' : '#fde9d7',
                                  border: isTurf ? '1px solid #bbe7d3' : '1px solid #ffd7ae',
                                  color: isTurf ? '#0c532a' : '#633d1e'
                                }}
                              >
                                {displayLabel}
                              </div>
                              <div className="gate-bar-container">
                                <div
                                  className="gate-bar"
                                  style={{
                                    width: `${surface.place_rate}%`
                                  }}
                                ></div>
                              </div>
                              <div className="gate-rate">{surface.place_rate}%</div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* 区切り線 */}
                <div className="section-divider"></div>

                {/* 得意な脚質傾向（2分化） */}
                <div className="gauge-item">
                  <div className="gauge-header">
                    <h3 className="gauge-label">得意な脚質傾向</h3>
                    <RunningStyleExplanation />
                  </div>
                  <div className="gauge-track">
                    <div className="gauge-indicator" style={{ left: `${(runningStyleTrendPosition - 1) * 25}%` }}></div>
                    <div className="gauge-horse-icon" style={{ left: `${(runningStyleTrendPosition - 1) * 25}%` }}>🏇</div>
                  </div>
                  <div className="gauge-labels">
                    <span>逃げ・先行が得意</span>
                    <span>差分なし</span>
                    <span>差し・追込が得意</span>
                  </div>
                  <div className="gauge-result">
                    {runningStyleTrendPosition === 1 && '逃げ・先行が得意'}
                    {runningStyleTrendPosition === 2 && 'やや逃げ・先行が得意'}
                    {runningStyleTrendPosition === 3 && '差分なし'}
                    {runningStyleTrendPosition === 4 && 'やや差し・追込が得意'}
                    {runningStyleTrendPosition === 5 && '差し・追込が得意'}
                  </div>

                    {/* 脚質別複勝率グラフ */}
                    <div className="running-style-place-rate-detail">
                      <div className="running-style-detail-title">脚質別複勝率</div>
                      <div className="running-style-chart">
                        {sire.running_style_stats.map((style) => {
                          // アイコンマッピング
                          const styleIcons: { [key: string]: string } = {
                            'escape': '逃',
                            'lead': '先',
                            'pursue': '差',
                            'close': '追'
                          };

                          return (
                            <div key={style.style} className="running-style-chart-item">
                              <div className="running-style-badge">
                                {styleIcons[style.style] || style.style_label}
                              </div>
                              <div className="running-style-bar-container">
                                <div
                                  className="running-style-bar"
                                  style={{
                                    width: `${style.place_rate ?? 0}%`
                                  }}
                                ></div>
                              </div>
                              <div className="running-style-rate">{(style.place_rate ?? 0).toFixed(1)}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                </div>

                {/* 区切り線 */}
                <div className="section-divider"></div>

                {/* 得意な距離傾向 */}
                <div className="gauge-item">
                  <div className="gauge-header">
                    <h3 className="gauge-label">得意な距離傾向</h3>
                    <DistanceTrendExplanation />
                  </div>
                  <div className="gauge-track">
                    <div className="gauge-indicator" style={{ left: `${(distanceTrendPosition - 1) * 25}%` }}></div>
                    <div className="gauge-horse-icon" style={{ left: `${(distanceTrendPosition - 1) * 25}%` }}>🏇</div>
                  </div>
                  <div className="gauge-labels">
                    <span>短距離が得意</span>
                    <span>差分なし</span>
                    <span>長距離が得意</span>
                  </div>
                  <div className="gauge-result">
                    {distanceTrendPosition === 1 && '短距離が得意'}
                    {distanceTrendPosition === 2 && 'やや短距離が得意'}
                    {distanceTrendPosition === 3 && '差分なし'}
                    {distanceTrendPosition === 4 && 'やや長距離が得意'}
                    {distanceTrendPosition === 5 && '長距離が得意'}
                  </div>

                    {/* 距離別複勝率グラフ */}
                    <div className="gate-place-rate-detail">
                      <div className="gate-detail-title">距離別複勝率</div>
                      <div className="gate-chart">
                        {distanceStatsData.map((distance) => (
                          <div key={distance.name} className="gate-chart-item">
                            <div
                              className="distance-badge"
                              style={{
                                background: '#f0f0f0',
                                border: '1px solid #ddd',
                                color: '#333'
                              }}
                            >
                              {distance.name}
                            </div>
                            <div className="gate-bar-container">
                              <div
                                className="gate-bar"
                                style={{
                                  width: `${distance.place_rate}%`
                                }}
                              ></div>
                            </div>
                            <div className="gate-rate">{distance.place_rate.toFixed(1)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                </div>

              </div>
            </BarChartAnimation>
          </section>

          {/* 注目ポイントセクション */}
          <JockeyTrainerHighlights
            course_stats={courseTableData}
          />

          {/* クラス別データセクション */}
          <section id="class-stats" aria-label="クラス別データ">
            <ClassTable
              title={`${sire.name}産駒 クラス別データ`}
              data={sire.class_stats}
            />
          </section>

          {/* 人気別データセクション */}
          <section id="popularity-stats" aria-label="人気別データ">
            <PopularityTable
              title={`${sire.name}産駒 人気別データ`}
              data={sire.popularity_stats}
            />
          </section>

          {/* 脚質別データセクション */}
          <section id="running-style-stats" aria-label="脚質別データ">
            <RunningStyleTable
              title={`${sire.name}産駒 脚質別データ`}
              data={sire.running_style_stats}
            />
          </section>

          {/* 枠順別データセクション */}
          <section id="gate-stats" aria-label="枠順別データ">
            <GateTable
              title={`${sire.name}産駒 枠順別データ`}
              data={sire.gate_stats}
            />
          </section>

          {/* 距離別データセクション */}
          <section id="distance-stats" aria-label="距離別データ">
            <DistanceTable
              title={`${sire.name}産駒 距離別データ`}
              data={sire.distance_stats}
            />
          </section>

          {/* 性別データセクション */}
          <section id="gender-stats" aria-label="性別データ">
            <GenderTable
              title={`${sire.name}産駒 性別データ`}
              data={sire.gender_stats}
            />
          </section>

          {/* レース間隔別データセクション */}
          <section id="interval-stats" aria-label="レース間隔別データ">
            <IntervalTable
              title={`${sire.name}産駒 レース間隔別データ`}
              data={sire.interval_stats}
            />
          </section>

          {/* 芝・ダート別データセクション */}
          <section id="surface-stats" aria-label="芝・ダート別データ">
            <SurfaceTable
              title={`${sire.name}産駒 芝・ダート別データ`}
              data={surfaceStatsData}
            />
          </section>

          {/* 馬場状態別データセクション */}
          <section id="track-condition-stats" aria-label="馬場状態別データ">
            <TrackConditionTable
              title={`${sire.name}産駒 馬場状態別データ`}
              data={trackConditionStatsData}
            />
          </section>

          {/* 競馬場別成績セクション */}
          <section id="racecourse-stats" aria-label="競馬場別成績">
            <RacecourseTable
              title={`${sire.name}産駒 競馬場別成績`}
              data={racecourseSummaryDataWithTotals}
            />
          </section>

          {/* コース別成績 */}
          <section id="course-stats" aria-label="コース別成績">
            <RacecourseCourseTable
              title={`${sire.name}産駒 コース別成績`}
              data={coursesByRacecourse}
            />
          </section>

          {/* 調教師別データセクション */}
          <section id="trainer-stats" aria-label="調教師別データ">
            <DataTable
              title={`${sire.name}産駒 調教師別データ`}
              data={sire.trainer_stats}
              initialShow={10}
              nameLabel="調教師"
              note="※現役調教師のみ"
            />
          </section>

          {/* 騎手別データセクション */}
          <section id="jockey-stats" aria-label="騎手別データ">
            <DataTable
              title={`${sire.name}産駒 騎手別データ`}
              data={sire.jockey_stats}
              initialShow={10}
              nameLabel="騎手"
            />
          </section>
        </article>
      </main>

      {/* パンくず（フッター） */}
      <nav aria-label="パンくずリスト" className="breadcrumb-footer">
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <li><Link href="/">ホーム</Link></li>
          <li aria-hidden="true">&gt;</li>
          <li><Link href="/sires">種牡馬一覧</Link></li>
          <li aria-hidden="true">&gt;</li>
          <li aria-current="page">{sire.name}</li>
        </ol>
      </nav>
    </>
  );
}
