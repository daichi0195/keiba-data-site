import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import BottomNav from '@/components/BottomNav';
import TableOfContents from '@/components/TableOfContents';
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
import CourseStatsTable from '@/components/CourseStatsTable';
import GenderTable from '@/components/GenderTable';
import BarChartAnimation from '@/components/BarChartAnimation';
import VolatilityExplanation from '@/components/VolatilityExplanation';
import GatePositionExplanation from '@/components/GatePositionExplanation';
import RunningStyleExplanation from '@/components/RunningStyleExplanation';
import RunningStyleDefinition from '@/components/RunningStyleDefinition';
import DistanceTrendExplanation from '@/components/DistanceTrendExplanation';
import DistanceDefinition from '@/components/DistanceDefinition';
import JockeyTrainerHighlights from '@/components/JockeyTrainerHighlights';
import { getJockeyDataFromGCS } from '@/lib/getJockeyDataFromGCS';
import { ALL_JOCKEYS } from '@/lib/jockeys';
import { ALL_TRAINERS } from '@/lib/trainers';

// ISR: 週1回（604800秒）再生成
export const revalidate = 604800;

// generateStaticParams: 全騎手ページを事前生成
export async function generateStaticParams() {
  return ALL_JOCKEYS.map((jockey) => ({
    id: String(jockey.id),
  }));
}

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
  owner_stats: Array<{
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
  characteristics: {
    volatility: number;
    fav1_place_rate: number;
    all_fav1_place_rate: number;
    fav1_races: number;
    fav1_ranking: number;
    total_jockeys: number;
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

  // GCSから騎手データを取得
  let jockey: JockeyData;
  try {
    jockey = await getJockeyDataFromGCS(id) as JockeyData;
  } catch (error) {
    return {
      title: '騎手データが見つかりません | 競馬データ.com',
    };
  }

  const title = `${jockey.name}騎手の成績・特徴まとめ｜得意な条件がまるわかり！`;
  const description = `${jockey.name}騎手の成績や特徴を徹底分析！得意なコースや得意な距離など、豊富な統計データで予想をサポート。`;
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

  // GCSから騎手データを取得
  let jockey: JockeyData;
  try {
    jockey = await getJockeyDataFromGCS(id) as JockeyData;

    // 必須フィールドの存在チェック
    // popularity_statsはオブジェクト、他は配列
    if (!jockey ||
        !Array.isArray(jockey.yearly_stats) ||
        !Array.isArray(jockey.distance_stats) ||
        !Array.isArray(jockey.surface_stats) ||
        !Array.isArray(jockey.track_condition_stats) ||
        !Array.isArray(jockey.class_stats) ||
        !Array.isArray(jockey.running_style_stats) ||
        !Array.isArray(jockey.gate_stats) ||
        !jockey.popularity_stats || typeof jockey.popularity_stats !== 'object' ||
        !Array.isArray(jockey.gender_stats) ||
        !Array.isArray(jockey.course_stats) ||
        !Array.isArray(jockey.racecourse_stats)) {
      console.error(`Incomplete data for jockey ${id}`);
      notFound();
    }
  } catch (error) {
    console.error(`Failed to load jockey data for ${id}:`, error);
    notFound();
  }

  // 現在の年度を取得
  const currentYear = new Date().getFullYear();

  // 年度別データを直近3年分に絞り込み、データがない年も必ず含める
  const yearlyStatsData = (() => {
    const years = [currentYear, currentYear - 1, currentYear - 2];
    return years.map(year => {
      const existingData = jockey.yearly_stats.find(stat => stat.year === year);
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

  // 距離別データをテーブル形式に変換（GCSデータをそのまま使用）
  const allDistanceCategories = ['短距離', 'マイル', '中距離', '長距離'];
  const distanceStatsData = allDistanceCategories.map(category => {
    const existingData = jockey.distance_stats.find(stat => stat.category === category);
    if (existingData) {
      return {
        name: existingData.category,
        category: existingData.category,
        races: existingData.races,
        wins: existingData.wins,
        places_2: existingData.places_2,
        places_3: existingData.places_3,
        win_rate: existingData.win_rate,
        quinella_rate: existingData.quinella_rate,
        place_rate: existingData.place_rate,
        win_payback: existingData.win_payback,
        place_payback: existingData.place_payback,
        avg_popularity: existingData.avg_popularity,
        avg_rank: existingData.avg_rank,
        median_popularity: existingData.median_popularity,
        median_rank: existingData.median_rank,
      };
    } else {
      // データがない場合は0で埋める
      return {
        name: category,
        category: category,
        races: 0,
        wins: 0,
        places_2: 0,
        places_3: 0,
        win_rate: 0,
        quinella_rate: 0,
        place_rate: 0,
        win_payback: 0,
        place_payback: 0,
        avg_popularity: undefined,
        avg_rank: undefined,
        median_popularity: undefined,
        median_rank: undefined,
      };
    }
  });

  // 距離別データを2グループに統合（短・マ と 中・長）
  const mergedDistanceStats = (() => {
    const short = jockey.distance_stats.find(s => s.category === '短距離');
    const mile = jockey.distance_stats.find(s => s.category === 'マイル');
    const middle = jockey.distance_stats.find(s => s.category === '中距離');
    const long = jockey.distance_stats.find(s => s.category === '長距離');

    const mergeTwoDistances = (dist1: any, dist2: any, label: string) => {
      if (!dist1 && !dist2) return null;
      if (!dist1) return { ...dist2, category: label, name: label };
      if (!dist2) return { ...dist1, category: label, name: label };

      const totalRaces = dist1.races + dist2.races;
      const totalWins = dist1.wins + dist2.wins;
      const totalPlaces2 = dist1.places_2 + dist2.places_2;
      const totalPlaces3 = dist1.places_3 + dist2.places_3;

      return {
        category: label,
        name: label,
        races: totalRaces,
        wins: totalWins,
        places_2: totalPlaces2,
        places_3: totalPlaces3,
        win_rate: totalRaces > 0 ? (totalWins / totalRaces) * 100 : 0,
        quinella_rate: totalRaces > 0 ? ((totalWins + totalPlaces2) / totalRaces) * 100 : 0,
        place_rate: totalRaces > 0 ? ((totalWins + totalPlaces2 + totalPlaces3) / totalRaces) * 100 : 0,
        win_payback: totalRaces > 0 ? ((dist1.win_payback * dist1.races) + (dist2.win_payback * dist2.races)) / totalRaces : 0,
        place_payback: totalRaces > 0 ? ((dist1.place_payback * dist1.races) + (dist2.place_payback * dist2.races)) / totalRaces : 0,
      };
    };

    const shortMile = mergeTwoDistances(short, mile, '短・マ');
    const middleLong = mergeTwoDistances(middle, long, '中・長');

    return [shortMile, middleLong].filter(Boolean);
  })();

  // 芝・ダート・障害別データをテーブル形式に変換（全カテゴリを表示）
  const allSurfaces = ['芝', 'ダート', '障害'];
  const surfaceStatsData = allSurfaces.map(surface => {
    const existingData = jockey.surface_stats.find(stat => stat.surface === surface);
    if (existingData) {
      return {
        name: existingData.surface,
        races: existingData.races,
        wins: existingData.wins,
        places_2: existingData.places_2,
        places_3: existingData.places_3,
        win_rate: existingData.win_rate,
        quinella_rate: existingData.quinella_rate,
        place_rate: existingData.place_rate,
        win_payback: existingData.win_payback,
        place_payback: existingData.place_payback,
        avg_popularity: existingData.avg_popularity,
        avg_rank: existingData.avg_rank,
        median_popularity: existingData.median_popularity,
        median_rank: existingData.median_rank,
      };
    } else {
      return {
        name: surface,
        races: 0,
        wins: 0,
        places_2: 0,
        places_3: 0,
        win_rate: 0,
        quinella_rate: 0,
        place_rate: 0,
        win_payback: 0,
        place_payback: 0,
        avg_popularity: undefined,
        avg_rank: undefined,
        median_popularity: undefined,
        median_rank: undefined,
      };
    }
  });

  // GCSから計算済みの傾向データを取得
  const surfaceTrendPosition = jockey.characteristics?.surface_trend_position ?? 3;
  const runningStyleTrendPosition = jockey.characteristics?.running_style_trend_position ?? 3;
  const distanceTrendPosition = jockey.characteristics?.distance_trend_position ?? 3;

  // DataTableコンポーネント用にデータ整形（linkプロパティを追加）
  // 障害コースを除外
  const courseTableData = jockey.course_stats
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

  // 競馬場別サマリーデータをracecourse_statsから取得し、順番を整理（全競馬場を表示）
  // GCSから取得したデータには既に「中央」「ローカル」の集計行が含まれている
  const individualRacecourses = racecourseOrder
    .map(racecourseItem => {
      // name フィールド(日本語)または racecourse_en フィールドで検索
      // GCSデータの name には「競馬場」が付いていないため、削除して比較
      const racecourseNameWithoutSuffix = racecourseItem.ja.replace('競馬場', '');
      const racecourse = jockey.racecourse_stats?.find(r =>
        r.racecourse_en === racecourseItem.en || r.name === racecourseNameWithoutSuffix
      );
      if (!racecourse) {
        // データがない場合は0で埋める
        return {
          name: racecourseNameWithoutSuffix,
          racecourse_ja: racecourseNameWithoutSuffix,
          racecourse_en: racecourseItem.en,
          races: 0,
          wins: 0,
          places_2: 0,
          places_3: 0,
          win_rate: 0,
          quinella_rate: 0,
          place_rate: 0,
          win_payback: 0,
          place_payback: 0,
          avg_popularity: undefined,
          avg_rank: undefined,
          median_popularity: undefined,
          median_rank: undefined,
        };
      }
      return {
        name: racecourseNameWithoutSuffix,
        racecourse_ja: racecourseNameWithoutSuffix,
        racecourse_en: racecourseItem.en,
        races: racecourse.races,
        wins: racecourse.wins,
        places_2: racecourse.places_2,
        places_3: racecourse.places_3,
        win_rate: racecourse.win_rate,
        quinella_rate: racecourse.quinella_rate,
        place_rate: racecourse.place_rate,
        win_payback: racecourse.win_payback,
        place_payback: racecourse.place_payback,
        avg_popularity: racecourse.avg_popularity,
        avg_rank: racecourse.avg_rank,
        median_popularity: racecourse.median_popularity,
        median_rank: racecourse.median_rank,
      };
    });

  // GCSから取得した「中央」「ローカル」の集計行を取得
  const centralData = jockey.racecourse_stats?.find(r => r.name === '中央');
  const localData = jockey.racecourse_stats?.find(r => r.name === 'ローカル');

  // 競馬場データの最後に中央・ローカルを追加
  const racecourseSummaryDataWithTotals = [
    ...individualRacecourses,
    ...(centralData ? [centralData] : []),
    ...(localData ? [localData] : [])
  ];

  // 性別データ（全性別を表示）
  const allGenders = ['牡馬', '牝馬', 'セン馬'];
  const genderStatsData = allGenders.map(gender => {
    const existingData = jockey.gender_stats.find(stat => stat.name === gender);
    if (existingData) {
      return existingData;
    } else {
      return {
        name: gender,
        races: 0,
        wins: 0,
        places_2: 0,
        places_3: 0,
        win_rate: 0,
        quinella_rate: 0,
        place_rate: 0,
        win_payback: 0,
        place_payback: 0,
        avg_popularity: undefined,
        avg_rank: undefined,
        median_popularity: undefined,
        median_rank: undefined,
      };
    }
  });

  // 馬場状態別データ（全カテゴリを表示）
  const trackConditionSurfaces = ['芝', 'ダート', '障害'];
  const trackConditions = [
    { condition: 'good', condition_label: '良', short_label: '良' },
    { condition: 'yielding', condition_label: '稍重', short_label: '稍' },
    { condition: 'soft', condition_label: '重', short_label: '重' },
    { condition: 'heavy', condition_label: '不良', short_label: '不' }
  ];

  const trackConditionStatsData = trackConditionSurfaces.flatMap(surface => {
    return trackConditions.map(({ condition, condition_label, short_label }) => {
      // surfaceの短縮形でマッチング（ダート→ダ、障害→障）
      const surfaceForMatch = surface === 'ダート' ? 'ダ' : (surface === '障害' ? '障' : surface);
      const existingData = jockey.track_condition_stats.find(
        stat => stat.surface === surfaceForMatch && stat.condition === short_label
      );

      const shortSurface = surface === 'ダート' ? 'ダ' : (surface === '障害' ? '障' : surface);

      if (existingData) {
        return {
          name: `${shortSurface}・${short_label}`,
          surface: shortSurface,
          condition: existingData.condition,
          condition_label: short_label,
          races: existingData.races,
          wins: existingData.wins,
          places_2: existingData.places_2,
          places_3: existingData.places_3,
          win_rate: existingData.win_rate,
          quinella_rate: existingData.quinella_rate,
          place_rate: existingData.place_rate,
          win_payback: existingData.win_payback,
          place_payback: existingData.place_payback,
          avg_popularity: existingData.avg_popularity,
          avg_rank: existingData.avg_rank,
          median_popularity: existingData.median_popularity,
          median_rank: existingData.median_rank,
        };
      } else {
        return {
          name: `${shortSurface}・${short_label}`,
          surface: shortSurface,
          condition: condition,
          condition_label: short_label,
          races: 0,
          wins: 0,
          places_2: 0,
          places_3: 0,
          win_rate: 0,
          quinella_rate: 0,
          place_rate: 0,
          win_payback: 0,
          place_payback: 0,
          avg_popularity: undefined,
          avg_rank: undefined,
          median_popularity: undefined,
          median_rank: undefined,
        };
      }
    });
  });

  // クラス別データ（全クラスを表示）
  const allClasses = ['新馬', '未勝利', '1勝', '2勝', '3勝', 'オープン', 'G3', 'G2', 'G1'];
  const classStatsData = allClasses.map(className => {
    const existingData = jockey.class_stats.find(stat => stat.class_name === className);
    if (existingData) {
      return existingData;
    } else {
      return {
        rank: 0,
        class_name: className,
        races: 0,
        wins: 0,
        places_2: 0,
        places_3: 0,
        win_rate: 0,
        quinella_rate: 0,
        place_rate: 0,
        win_payback: 0,
        place_payback: 0,
      };
    }
  });

  // 脚質別データ（全脚質を表示）
  const allRunningStyles = [
    { style: 'escape', style_label: '逃げ' },
    { style: 'lead', style_label: '先行' },
    { style: 'pursue', style_label: '差し' },
    { style: 'close', style_label: '追込' }
  ];
  const runningStyleStatsData = allRunningStyles.map(({ style, style_label }) => {
    const existingData = jockey.running_style_stats.find(stat => stat.style === style);
    if (existingData) {
      return existingData;
    } else {
      return {
        style: style,
        style_label: style_label,
        races: 0,
        wins: 0,
        places_2: 0,
        places_3: 0,
        win_rate: 0,
        quinella_rate: 0,
        place_rate: 0,
        win_payback: 0,
        place_payback: 0,
        avg_popularity: undefined,
        avg_rank: undefined,
        median_popularity: undefined,
        median_rank: undefined,
      };
    }
  });

  // 脚質別データを2グループに統合（逃・先 と 差・追）
  const mergedRunningStyleStats = (() => {
    const escape = jockey.running_style_stats.find(s => s.style === 'escape');
    const lead = jockey.running_style_stats.find(s => s.style === 'lead');
    const pursue = jockey.running_style_stats.find(s => s.style === 'pursue');
    const close = jockey.running_style_stats.find(s => s.style === 'close');

    const mergeTwoStyles = (style1: any, style2: any, label: string, styleKey: string) => {
      if (!style1 && !style2) return null;
      if (!style1) return { ...style2, style_label: label, style: styleKey };
      if (!style2) return { ...style1, style_label: label, style: styleKey };

      const totalRaces = style1.races + style2.races;
      const totalWins = style1.wins + style2.wins;
      const totalPlaces2 = style1.places_2 + style2.places_2;
      const totalPlaces3 = style1.places_3 + style2.places_3;

      return {
        style: styleKey,
        style_label: label,
        races: totalRaces,
        wins: totalWins,
        places_2: totalPlaces2,
        places_3: totalPlaces3,
        win_rate: totalRaces > 0 ? (totalWins / totalRaces) * 100 : 0,
        quinella_rate: totalRaces > 0 ? ((totalWins + totalPlaces2) / totalRaces) * 100 : 0,
        place_rate: totalRaces > 0 ? ((totalWins + totalPlaces2 + totalPlaces3) / totalRaces) * 100 : 0,
        win_payback: totalRaces > 0 ? ((style1.win_payback * style1.races) + (style2.win_payback * style2.races)) / totalRaces : 0,
        place_payback: totalRaces > 0 ? ((style1.place_payback * style1.races) + (style2.place_payback * style2.races)) / totalRaces : 0,
      };
    };

    const frontRunners = mergeTwoStyles(escape, lead, '逃・先', 'front');
    const closers = mergeTwoStyles(pursue, close, '差・追', 'closer');

    return [frontRunners, closers].filter(Boolean);
  })();

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
    { id: 'surface-stats', label: 'コース区分別' },
    { id: 'track-condition-stats', label: '馬場状態別' },
    { id: 'racecourse-stats', label: '競馬場別' },
    { id: 'course-stats', label: 'コース別' },
    { id: 'trainer-stats', label: '調教師別' },
    { id: 'owner-stats', label: '馬主別' },
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
      <BottomNav items={navigationItems} />
      <main>
        <div>
          {/* パンくずリスト */}
          <nav className="breadcrumb">
            <Link href="/">HOME</Link>
            <span> &gt; </span>
            <Link href="/jockeys">騎手一覧</Link>
            <span> &gt; </span>
            <span>{jockey.name}</span>
          </nav>

          {/* 騎手ヘッダー */}
          <div className="page-header">
            <h1>{jockey.name}騎手の成績・データ</h1>

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
                <span>{jockey.total_races.toLocaleString()}レース</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">最終更新日</span>
                <span>{jockey.last_updated}</span>
              </div>
            </div>
          </div>

          <article className="content-card">
          {/* 年度別成績セクション */}
          <section id="leading" aria-label="年度別成績">
            <JockeyLeadingChart
              title={`${jockey.name}騎手 年度別成績`}
              data={(() => {
                // チャート用: 2年前→1年前→今年の順（古い順）で、データがない年も含める
                const years = [currentYear - 2, currentYear - 1, currentYear];
                return years.map(year => {
                  const existingData = jockey.yearly_leading.find(stat => stat.year === year);
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

          {/* 騎手特徴セクション */}
          <section id="characteristics" aria-label="騎手特徴">
            <BarChartAnimation>
                <h2 className="section-title">{jockey.name}騎手の特徴</h2>

                {/* 人気時の信頼度 */}
                <div className="gauge-item">
                  <div className="gauge-header">
                    <h3 className="gauge-label">人気時の信頼度</h3>
                    <VolatilityExplanation pageType="jockey" />
                  </div>
                  <div className="gauge-track">
                    <div className="gauge-indicator" style={{ left: `${(jockey.characteristics.volatility - 1) * 25}%` }}></div>
                    <div className="gauge-horse-icon" style={{ left: `${(jockey.characteristics.volatility - 1) * 25}%` }}>🏇</div>
                  </div>
                  <div className="gauge-labels">
                    <span>低い</span>
                    <span>標準</span>
                    <span>高い</span>
                  </div>
                  <div className="gauge-result">
                    {jockey.characteristics.volatility === 1 && '低い'}
                    {jockey.characteristics.volatility === 2 && 'やや低い'}
                    {jockey.characteristics.volatility === 3 && '標準'}
                    {jockey.characteristics.volatility === 4 && 'やや高い'}
                    {jockey.characteristics.volatility === 5 && '高い'}
                  </div>
                  <div className="gauge-ranking">
                    <div className="ranking-item">
                      <span className="ranking-label">1番人気時の複勝率ランキング</span>
                      <span className="ranking-value">
                        {jockey.characteristics.fav1_ranking > 0 && jockey.characteristics.total_jockeys > 0
                          ? `${jockey.characteristics.fav1_ranking}位/${jockey.characteristics.total_jockeys}人`
                          : 'データなし'}
                      </span>
                    </div>
                    <div className="ranking-detail">
                      <div className="ranking-detail-title">1番人気時の複勝率</div>
                      <div className="detail-row">
                        <span className="detail-label">この騎手の複勝率</span>
                        <span className="detail-value">
                          {jockey.characteristics.fav1_place_rate > 0
                            ? `${jockey.characteristics.fav1_place_rate.toFixed(1)}%`
                            : 'データなし'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">全騎手の1番人気の複勝率</span>
                        <span className="detail-value">
                          {jockey.characteristics.all_fav1_place_rate > 0
                            ? `${jockey.characteristics.all_fav1_place_rate.toFixed(1)}%`
                            : 'データなし'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
                <p className="note-text">
                  ※複勝率ランキングは1番人気が10走以上の騎手を対象
                </p>

                {/* 区切り線 */}
                <div className="section-divider"></div>

                {/* 得意なコース傾向 */}
                <div className="gauge-item">
                  <div className="gauge-header">
                    <h3 className="gauge-label">得意なコース傾向</h3>
                    <GatePositionExplanation pageType="jockey" />
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
                      {jockey.surface_stats
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
                        {mergedRunningStyleStats.map((style) => {
                          return (
                            <div key={style.style} className="running-style-chart-item">
                              <div className="running-style-badge">
                                {style.style_label}
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
                      <RunningStyleDefinition />
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
                        {mergedDistanceStats.map((distance) => (
                          <div key={distance.category} className="gate-chart-item">
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
                      <DistanceDefinition />
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
              title={`${jockey.name}騎手 クラス別データ`}
              data={classStatsData}
            />
          </section>

          {/* 人気別データセクション */}
          <section id="popularity-stats" aria-label="人気別データ">
            <PopularityTable
              title={`${jockey.name}騎手 人気別データ`}
              data={jockey.popularity_stats}
            />
          </section>

          {/* 脚質別データセクション */}
          <section id="running-style-stats" aria-label="脚質別データ">
            <RunningStyleTable
              title={`${jockey.name}騎手 脚質別データ`}
              data={runningStyleStatsData}
            />
          </section>

          {/* 枠順別データセクション */}
          <section id="gate-stats" aria-label="枠順別データ">
            <GateTable
              title={`${jockey.name}騎手 枠順別データ`}
              data={jockey.gate_stats}
            />
          </section>

          {/* 距離別データセクション */}
          <section id="distance-stats" aria-label="距離別データ">
            <DistanceTable
              title={`${jockey.name}騎手 距離別データ`}
              data={distanceStatsData}
            />
          </section>

          {/* 性別データセクション */}
          <section id="gender-stats" aria-label="性別データ">
            <GenderTable
              title={`${jockey.name}騎手 性別データ`}
              data={genderStatsData}
            />
          </section>

          {/* コース区分別データセクション */}
          <section id="surface-stats" aria-label="コース区分別データ">
            <SurfaceTable
              title={`${jockey.name}騎手 コース区分別データ`}
              data={surfaceStatsData}
            />
          </section>

          {/* 馬場状態別データセクション */}
          <section id="track-condition-stats" aria-label="馬場状態別データ">
            <TrackConditionTable
              title={`${jockey.name}騎手 馬場状態別データ`}
              data={trackConditionStatsData}
            />
          </section>

          {/* 競馬場別成績セクション */}
          <section id="racecourse-stats" aria-label="競馬場別成績">
            <RacecourseTable
              title={`${jockey.name}騎手 競馬場別成績`}
              data={racecourseSummaryDataWithTotals}
            />
          </section>

          {/* コース別成績 */}
          <section id="course-stats" aria-label="コース別成績">
            <CourseStatsTable
              title={`${jockey.name}騎手 コース別成績`}
              data={coursesByRacecourse}
            />
          </section>

          {/* 調教師別データセクション */}
          <section id="trainer-stats" aria-label="調教師別データ">
            <DataTable
              title={`${jockey.name}騎手 調教師別データ`}
              data={jockey.trainer_stats.map(stat => {
                const trainer = ALL_TRAINERS.find(t => t.name === stat.name);
                return {
                  ...stat,
                  link: trainer ? `/trainers/${trainer.id}` : undefined
                };
              })}
              initialShow={10}
              nameLabel="調教師"
              note="※現役調教師のみ"
            />
          </section>

          {/* 馬主別データセクション */}
          <section id="owner-stats" aria-label="馬主別データ">
            <DataTable
              title={`${jockey.name}騎手 馬主別データ`}
              data={jockey.owner_stats}
              initialShow={10}
              nameLabel="馬主"
            />
          </section>
        </article>
        </div>
        {/* PC用：右サイドバー目次 */}
        <TableOfContents items={navigationItems} />
      </main>
    </>
  );
}
