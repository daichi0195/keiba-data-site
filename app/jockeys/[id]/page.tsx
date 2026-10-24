import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import TableOfContents from '@/components/TableOfContents';
import { getJockeyDataFromGCS } from '@/lib/getJockeyDataFromGCS';
import { ALL_JOCKEYS } from '@/lib/jockeys';
import { ALL_TRAINERS } from '@/lib/trainers';
import pageStyles from '@/app/static-page.module.css';
import DataSourceNote from '@/components/DataSourceNote';
import { resolveCourseUrl, courseLabel } from '@/lib/courseLinks';
import { jaDateToIso, periodFromDataPeriod, buildWebPageJsonLd } from '@/lib/dataDate';
import { MIN_RACES_FOR_MENTION, hasEnoughRaces, THIN_PAGE_ROBOTS } from '@/lib/dataPageRules';
import ThinDataNotice from '@/components/ThinDataNotice';
import { buildJockeySummaryBlocks } from '@/lib/jockeySummaryBlocks';
import AIBanner from '@/components/AIBanner';
import s from '@/components/course/course.module.css';
import CourseSectionNav from '@/components/course/CourseSectionNav';
import CourseFaq from '@/components/course/CourseFaq';
import RankingTable, { type RankingRow } from '@/components/course/RankingTable';
import { ConditionCard, Meter, RichText, StatsTable, type ConditionRow, type NameLink } from '@/components/course/CourseParts';
import j from '@/components/datapage/jockey/jockey.module.css';
import JockeyLeadingCard from '@/components/datapage/jockey/JockeyLeadingCard';
import {
  CourseGroupsCard,
  SummaryConditionCard,
  type CourseGroup,
  type LinkStatRow,
} from '@/components/datapage/jockey/JockeyParts';
import HighlightCoursesCard, { MIN_RACES_FOR_HIGHLIGHT, type HighlightCourseRow } from '@/components/datapage/shared/HighlightCoursesCard';
import VerdictRow, { VerdictRows } from '@/components/datapage/shared/VerdictRow';
import CriteriaDetails, {
  SURFACE_CRITERIA, DISTANCE_CRITERIA, RUNNING_STYLE_CRITERIA, DISTANCE_DEFINITION, RUNNING_STYLE_DEFINITION,
} from '@/components/datapage/shared/CriteriaDetails';
import { jockeyDescription } from '@/lib/metaDescriptions';
import { ALL_SIRES } from '@/lib/sires';
import InfoTiles from '@/components/datapage/shared/InfoTiles';
import ListTable from '@/components/datapage/shared/ListTable';
import sh from '@/components/datapage/shared/shared.module.css';
import { ageAt, buildGradedAnswer, buildPersonLead, gradedTotals, jaDate, shortDate, thisYearOf, type GradedWin, type PersonProfile } from '@/lib/entityExtras';

// ISR: 週1回（604800秒）再生成
export const revalidate = 604800;

// generateStaticParams: 全騎手ページを事前生成
export async function generateStaticParams() {
  return ALL_JOCKEYS.map((jockey) => ({
    id: String(jockey.id),
  }));
}

// 定義済みID以外のURLは404を返す（ソフト404の防止）
export const dynamicParams = false;

// 騎手データ型定義
// 各成績行に付く任意の項目（平均人気・中央値など。年度別は回収率が無い場合がある）
type StatExtras = {
  avg_popularity?: number;
  avg_rank?: number;
  median_popularity?: number;
  median_rank?: number;
  win_payback?: number;
  place_payback?: number;
};

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
  yearly_leading: Array<StatExtras & {
    year: number;
    wins: number;
    ranking: number;
  }>;
  yearly_stats: Array<StatExtras & {
    year: number;
    races: number;
    wins: number;
    places_2: number;
    places_3: number;
    win_rate: number;
    place_rate: number;
    quinella_rate: number;
  }>;
  distance_stats: Array<StatExtras & {
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
  surface_stats: Array<StatExtras & {
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
    fav1: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; } & StatExtras;
    fav2: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; } & StatExtras;
    fav3: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; } & StatExtras;
    fav4: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; } & StatExtras;
    fav5: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; } & StatExtras;
    fav6to9: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; } & StatExtras;
    fav10plus: { races: number; wins: number; places_2: number; places_3: number; win_rate: number; quinella_rate: number; place_rate: number; win_payback: number; place_payback: number; } & StatExtras;
  };
  running_style_stats: Array<StatExtras & {
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
  gate_stats: Array<StatExtras & {
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
  course_stats: Array<StatExtras & {
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
  trainer_stats: Array<StatExtras & {
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
  track_condition_stats: Array<StatExtras & {
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
  class_stats: Array<StatExtras & {
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
  owner_stats: Array<StatExtras & {
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
  gender_stats: Array<StatExtras & {
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
  racecourse_stats: Array<StatExtras & {
    name: string;
    racecourse_ja?: string;
    racecourse_en?: string;
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
    distance_trend_position?: number;
    surface_trend_position?: number;
  };
  running_style_trends?: Array<StatExtras & {
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

  // 検索語「〇〇騎手 傾向」「〇〇 騎手 データ」「〇〇 特徴」に合わせて前半に置く
  const title = `${jockey.name}騎手の傾向・データ｜特徴・得意コース・距離と回収率【毎週更新】`;
  // 検索結果で他の騎手と見分けられるよう、所属・デビュー年と固有の数値を入れる
  const description = jockeyDescription(jockey);
  const url = `https://www.keibadata.com/jockeys/${id}`;

  return {
    title,
    description,
    // 対象レース数が少ないページは傾向判定を出さず、インデックスもさせない（コースページと同じ方針）
    ...(hasEnoughRaces(jockey.total_races) ? {} : { robots: THIN_PAGE_ROBOTS }),
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

    const shortMile = mergeTwoDistances(short, mile, '短〜マ');
    const middleLong = mergeTwoDistances(middle, long, '中〜長');

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

  // コース別成績：実在するコースページだけにリンクする（データの variant は「外」や空のこともあるため共通処理で解決）
  const courseTableData = jockey.course_stats
    .filter((stat) => stat.surface_en !== 'obstacle')
    .map((stat) => ({
      ...stat,
      link: resolveCourseUrl(stat),
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
  // ===== データQ&A 回答生成 =====
  const formatCourseName = (c: { racecourse: string; surface_en: string; distance: number; variant?: string }) => {
    const rc = c.racecourse.replace('競馬場', '');
    const surf = c.surface_en === 'turf' ? '芝' : c.surface_en === 'dirt' ? 'ダート' : '障害';
    const variant = c.variant === 'inner' || c.variant === '内' ? '内回り' : c.variant === 'outer' || c.variant === '外' ? '外回り' : '';
    return `${rc}${surf}${c.distance}m${variant}`;
  };
  const faqStyleFullName = (style: string) => {
    const map: Record<string, string> = { escape: '逃げ', lead: '先行', pursue: '差し', close: '追い込み' };
    return map[style] || style;
  };
  const stripBoldFaq = (text: string) => text.replace(/\*\*([^*]+)\*\*/g, '$1');

  // 得意な競馬場 / 苦手な競馬場
  const racecourseQualified = (jockey.racecourse_stats ?? [])
    .filter(r => r.name !== '中央' && r.name !== 'ローカル' && r.races >= 20);
  const goodRacecourseAnswer = (() => {
    if (racecourseQualified.length === 0) return '対象となる競馬場が存在しません。\n※直近3年間で20走以上を対象としています。';
    const rcName = (r: { name: string }) => r.name.endsWith('競馬場') ? r.name : `${r.name}競馬場`;
    const byWin = [...racecourseQualified].sort((a, b) => b.win_rate - a.win_rate).slice(0, 3)
      .map(r => `${rcName(r)}（**${r.win_rate.toFixed(1)}%**）`).join('、');
    const byPlace = [...racecourseQualified].sort((a, b) => b.place_rate - a.place_rate).slice(0, 3)
      .map(r => `${rcName(r)}（**${r.place_rate.toFixed(1)}%**）`).join('、');
    return [
      byWin ? `勝率が高い競馬場TOP3は${byWin}です。` : '',
      byPlace ? `複勝率が高い競馬場TOP3は${byPlace}です。` : '',
      '※直近3年間で20走以上を対象としています。',
    ].filter(Boolean).join('\n');
  })();
  const badRacecourseAnswer = (() => {
    if (racecourseQualified.length === 0) return '対象となる競馬場が存在しません。\n※直近3年間で20走以上を対象としています。';
    const rcName = (r: { name: string }) => r.name.endsWith('競馬場') ? r.name : `${r.name}競馬場`;
    const byWin = [...racecourseQualified].sort((a, b) => a.win_rate - b.win_rate).slice(0, 3)
      .map(r => `${rcName(r)}（**${r.win_rate.toFixed(1)}%**）`).join('、');
    const byPlace = [...racecourseQualified].sort((a, b) => a.place_rate - b.place_rate).slice(0, 3)
      .map(r => `${rcName(r)}（**${r.place_rate.toFixed(1)}%**）`).join('、');
    return [
      byWin ? `勝率が低い競馬場TOP3は${byWin}です。` : '',
      byPlace ? `複勝率が低い競馬場TOP3は${byPlace}です。` : '',
      '※直近3年間で20走以上を対象としています。',
    ].filter(Boolean).join('\n');
  })();

  // 得意なコース / 苦手なコース
  const courseQualified = (jockey.course_stats ?? []).filter(c => c.races >= 10);
  const goodCourseAnswer = (() => {
    if (courseQualified.length === 0) return '対象となるコースが存在しません。\n※直近3年間で10走以上を対象としています。';
    const byWin = [...courseQualified].sort((a, b) => b.win_rate - a.win_rate).slice(0, 3)
      .map(c => `${formatCourseName(c)}（**${c.win_rate.toFixed(1)}%**）`).join('、');
    const byPlace = [...courseQualified].sort((a, b) => b.place_rate - a.place_rate).slice(0, 3)
      .map(c => `${formatCourseName(c)}（**${c.place_rate.toFixed(1)}%**）`).join('、');
    return [
      byWin ? `勝率が高いコースTOP3は${byWin}です。` : '',
      byPlace ? `複勝率が高いコースTOP3は${byPlace}です。` : '',
      '※直近3年間で10走以上を対象としています。',
    ].filter(Boolean).join('\n');
  })();
  const badCourseAnswer = (() => {
    if (courseQualified.length === 0) return '対象となるコースが存在しません。\n※直近3年間で10走以上を対象としています。';
    const byWin = [...courseQualified].sort((a, b) => a.win_rate - b.win_rate).slice(0, 3)
      .map(c => `${formatCourseName(c)}（**${c.win_rate.toFixed(1)}%**）`).join('、');
    const byPlace = [...courseQualified].sort((a, b) => a.place_rate - b.place_rate).slice(0, 3)
      .map(c => `${formatCourseName(c)}（**${c.place_rate.toFixed(1)}%**）`).join('、');
    return [
      byWin ? `勝率が低いコースTOP3は${byWin}です。` : '',
      byPlace ? `複勝率が低いコースTOP3は${byPlace}です。` : '',
      '※直近3年間で10走以上を対象としています。',
    ].filter(Boolean).join('\n');
  })();

  // 芝とダートどちらが得意？
  const turfStat = jockey.surface_stats.find(s => s.surface === '芝');
  const dirtStat = jockey.surface_stats.find(s => s.surface === 'ダート');
  const surfaceFaqAnswer = (() => {
    if (!turfStat && !dirtStat) return '対象となるデータが存在しません。';
    if (!turfStat) return `ダートの成績のみあります。ダートの複勝率は**${dirtStat!.place_rate.toFixed(1)}%**です。`;
    if (!dirtStat) return `芝の成績のみあります。芝の複勝率は**${turfStat.place_rate.toFixed(1)}%**です。`;
    const diff = turfStat.place_rate - dirtStat.place_rate;
    const detail = `芝の複勝率は**${turfStat.place_rate.toFixed(1)}%**、ダートは**${dirtStat.place_rate.toFixed(1)}%**です。`;
    if (diff >= 5) return `芝の方が得意な傾向があります。\n${detail}`;
    if (diff >= 3) return `やや芝の方が得意な傾向があります。\n${detail}`;
    if (diff <= -5) return `ダートの方が得意な傾向があります。\n${detail}`;
    if (diff <= -3) return `ややダートの方が得意な傾向があります。\n${detail}`;
    return `芝とダートで差はありません。\n${detail}`;
  })();

  // 得意な距離は？
  const distanceCategoryFullName = (cat: string) =>
    cat === '短〜マ' ? '短距離〜マイル' : cat === '中〜長' ? '中距離〜長距離' : cat;
  const distanceFaqAnswer = (() => {
    const groups = mergedDistanceStats as any[];
    if (groups.length === 0) return '対象となるデータが存在しません。';
    const best = [...groups].sort((a, b) => b.place_rate - a.place_rate)[0];
    const other = groups.find(g => g.category !== best.category);
    const diff = other ? best.place_rate - other.place_rate : 0;
    const detail = groups.map(g => `${distanceCategoryFullName(g.category)}の複勝率は**${g.place_rate.toFixed(1)}%**`).join('、');
    const conclusion = diff >= 5
      ? `${distanceCategoryFullName(best.category)}が得意な傾向があります。`
      : diff >= 3
      ? `やや${distanceCategoryFullName(best.category)}が得意な傾向があります。`
      : '距離帯で差はありません。';
    return [conclusion, `${detail}です。`].join('\n');
  })();

  // 得意な脚質は？
  const runningStyleCategoryFullName = (label: string) =>
    label === '逃・先' ? '逃げ・先行' : label === '差・追' ? '差し・追込' : label;
  const runningStyleFaqAnswer = (() => {
    const groups = mergedRunningStyleStats as any[];
    if (groups.length === 0) return '対象となるデータが存在しません。';
    const best = [...groups].sort((a, b) => b.place_rate - a.place_rate)[0];
    const other = groups.find(g => g.style_label !== best.style_label);
    const diff = other ? best.place_rate - other.place_rate : 0;
    const detail = groups.map(g => `${runningStyleCategoryFullName(g.style_label)}の複勝率は**${g.place_rate.toFixed(1)}%**`).join('、');
    const conclusion = diff >= 5
      ? `${runningStyleCategoryFullName(best.style_label)}が得意な傾向があります。`
      : diff >= 3
      ? `やや${runningStyleCategoryFullName(best.style_label)}が得意な傾向があります。`
      : '脚質で差はありません。';
    return [conclusion, `${detail}です。`].join('\n');
  })();

  // 人気時の信頼度は？
  const popularityFaqAnswer = (() => {
    const f1 = jockey.popularity_stats?.fav1;
    if (!f1 || f1.races === 0) return '対象となるデータが存在しません。';
    const chars = jockey.characteristics;
    const allAvg = chars?.all_fav1_place_rate;
    const diff = allAvg != null ? f1.place_rate - allAvg : null;
    const compText = diff != null
      ? diff >= 3
        ? `複勝率は全騎手平均（**${allAvg!.toFixed(1)}%**）と比べると高く、馬券の軸として信頼しやすい傾向にあります。`
        : diff <= -3
        ? `複勝率は全騎手平均（**${allAvg!.toFixed(1)}%**）と比べると低く、人気馬でも取りこぼしが多い傾向にあります。`
        : `複勝率は全騎手平均（**${allAvg!.toFixed(1)}%**）とほぼ同水準です。`
      : '';
    return [
      `1番人気時の勝率は**${f1.win_rate.toFixed(1)}%**、複勝率は**${f1.place_rate.toFixed(1)}%**です。`,
      compText,
    ].filter(Boolean).join('\n');
  })();

  // 検索意図に合わせた追加項目（gcs/v2/generate_extras.py）：基本情報・重賞勝ち・種牡馬別
  const jockeyProfile: PersonProfile = (jockey as any).profile ?? {};
  const gradedWins: GradedWin[] = (jockey as any).graded_wins ?? [];
  const jockeyGraded = gradedTotals(jockey.class_stats as any);
  const jockeyThisYear = thisYearOf(jockey.yearly_leading as any);
  const asOfDate = new Date(jaDateToIso(jockey.last_updated) ?? Date.now());
  const jockeyAge = ageAt(jockeyProfile.birth_date, asOfDate);
  const sireIdByName = new Map(ALL_SIRES.map((x) => [x.name, x.id]));
  const sireRows: RankingRow[] = ((jockey as any).sire_stats ?? []).map((st: any) => ({
    ...st,
    link: sireIdByName.has(st.name) ? `/sires/${sireIdByName.get(st.name)}` : undefined,
  }));
  const gradedAnswer = buildGradedAnswer(`${jockey.name}騎手`, jockeyGraded, gradedWins);
  const topSires = sireRows.filter((r: any) => (r.races ?? 0) >= 20).sort((a: any, b: any) => b.place_rate - a.place_rate).slice(0, 3);
  const sireAnswer = topSires.length > 0
    ? `${jockey.name}騎手が20回以上騎乗した種牡馬の産駒で複勝率が高いのは、${topSires.map((r: any) => `${r.name}（**${r.place_rate.toFixed(1)}%**・${r.races}戦）`).join('、')}です。\n勝利数では${sireRows[0]?.name}産駒の${sireRows[0]?.wins}勝が最多です。`
    : null;
  const profileTiles = [
    { label: '所属', value: (jockey as any).affiliation ?? jockeyProfile.region ?? '' },
    { label: '生年月日', value: jaDate(jockeyProfile.birth_date) ?? '', sub: jockeyAge !== null ? `${jockeyAge}歳` : undefined },
    { label: 'デビュー', value: jockey.debut_year ? `${jockey.debut_year}年` : '', sub: jockey.debut_year ? `${asOfDate.getFullYear() - Number(jockey.debut_year) + 1}年目` : undefined },
    ...(jockeyThisYear ? [{ label: `${jockeyThisYear.year}年の勝利数`, value: `${jockeyThisYear.wins}勝`, sub: jockeyThisYear.ranking > 0 ? `リーディング${jockeyThisYear.ranking}位` : undefined }] : []),
    { label: '勝率・複勝率', value: `${Number(jockey.total_stats?.win_rate ?? 0).toFixed(1)}%・${Number(jockey.total_stats?.place_rate ?? 0).toFixed(1)}%`, sub: '直近3年間' },
    { label: '重賞勝ち（平地）', value: `${jockeyGraded.wins}勝`, sub: `直近3年間・G1 ${jockeyGraded.g1}勝` },
  ];

  // FAQ構造化データ
  const faqJockeyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { question: `${jockey.name}騎手の得意な競馬場は？`, answer: goodRacecourseAnswer },
      { question: `${jockey.name}騎手の得意なコースは？`, answer: goodCourseAnswer },
      { question: `${jockey.name}騎手は芝とダートどちらが得意？`, answer: surfaceFaqAnswer },
      { question: `${jockey.name}騎手の得意な距離は？`, answer: distanceFaqAnswer },
      { question: `${jockey.name}騎手の得意な脚質は？`, answer: runningStyleFaqAnswer },
      { question: `${jockey.name}騎手の人気時の信頼度は？`, answer: popularityFaqAnswer },
      { question: `${jockey.name}騎手の重賞成績は？`, answer: gradedAnswer },
      ...(sireAnswer ? [{ question: `${jockey.name}騎手と相性の良い種牡馬は？`, answer: sireAnswer }] : []),
      { question: `${jockey.name}騎手の苦手な競馬場は？`, answer: badRacecourseAnswer },
      { question: `${jockey.name}騎手の苦手なコースは？`, answer: badCourseAnswer },
    ].map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: stripBoldFaq(answer) },
    })),
  };

  const navigationItems = [
    { id: 'profile-section', label: '基本情報' },
    { id: 'summary-section', label: 'データ概要' },
    { id: 'leading', label: '年度別' },
    ...(gradedWins.length > 0 ? [{ id: 'graded-wins-section', label: '重賞勝ち' }] : []),
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
    ...(sireRows.length > 0 ? [{ id: 'sire-stats', label: '種牡馬別' }] : []),
    { id: 'owner-stats', label: '馬主別' },
    { id: 'faq-section', label: 'データQ&A' },
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

  // 構造化データ - WebPage（データ更新日を dateModified で明示）
  const webPageJsonLd = buildWebPageJsonLd({
    url: `https://www.keibadata.com/jockeys/${id}`,
    name: `${jockey.name}騎手の成績データ`,
    description: `${jockey.name}騎手の直近3年間の成績を、コース・距離・馬場・脚質・人気別などで集計したデータページ`,
    dateModified: jaDateToIso(jockey.last_updated),
  });


  // ===== 表示用データ（docs/redesign のデザイン） =====
  const periodText = periodFromDataPeriod(jockey.data_period) ?? '直近3年間';
  const chars = jockey.characteristics;
  const toNum = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

  // 判定の文言（5段階）
  const reliabilityLabels = ['低い', 'やや低い', '標準', 'やや高い', '高い'];
  // 芝・ダートは3ページ共通の向き（左＝芝が得意／右＝ダートが得意）に揃える。
  // 騎手データの surface_trend_position は 1＝ダートが得意 なので、表示用に反転する（6 - 値）
  const surfaceLabels = ['芝が得意', 'やや芝が得意', '差分なし', 'ややダートが得意', 'ダートが得意'];
  const surfacePos = 6 - surfaceTrendPosition;
  const styleLabels = ['逃げ・先行が得意', 'やや逃げ・先行が得意', '差分なし', 'やや差し・追込が得意', '差し・追込が得意'];
  const distanceLabels = ['短距離が得意', 'やや短距離が得意', '差分なし', 'やや長距離が得意', '長距離が得意'];
  const labelOf = (labels: string[], v: number) => labels[v - 1] ?? '';
  const reliabilityValue = chars.volatility;
  // 対象レース数が少ないページは傾向判定を出さない（コースページと同じ方針）
  const enoughRaces = hasEnoughRaces(jockey.total_races);

  // 年度別（グラフは古い順、表は新しい順＝現行どおり）
  const leadingData = [currentYear - 2, currentYear - 1, currentYear].map((year) => {
    const existing = jockey.yearly_leading.find((stat) => stat.year === year);
    return existing || { year, wins: 0, ranking: 0 };
  });
  const leadingSummary = leadingData
    .map((d) => `${d.year}年 ${d.wins}勝${d.ranking > 0 ? `・リーディング${d.ranking > 50 ? '50位未満' : `${d.ranking}位`}` : ''}`)
    .join('、');
  const yearlyRows: ConditionRow[] = yearlyStatsData.map((y) => ({ ...y, label: `${y.year}年` }));

  // 条件別の行
  const classOrder = ['G1', 'G2', 'G3', 'オープン', '3勝', '2勝', '1勝', '未勝利', '新馬'];
  const classRows: ConditionRow[] = classOrder.map((name) => ({
    ...(classStatsData.find((c) => c.class_name === name) ?? { races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, quinella_rate: 0, place_rate: 0, win_payback: 0, place_payback: 0 }),
    label: name,
  }));

  const popularityBands: [keyof JockeyData['popularity_stats'], string][] = [
    ['fav1', '1番人気'], ['fav2', '2番人気'], ['fav3', '3番人気'], ['fav4', '4番人気'],
    ['fav5', '5番人気'], ['fav6to9', '6〜9番人気'], ['fav10plus', '10番人気〜'],
  ];
  const popularityRows: ConditionRow[] = popularityBands.map(([key, label]) => ({
    ...(jockey.popularity_stats?.[key] ?? { races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, quinella_rate: 0, place_rate: 0, win_payback: 0, place_payback: 0 }),
    label,
  }));

  const styleRows: ConditionRow[] = runningStyleStatsData.map((r) => ({ ...r, label: r.style_label }));

  // 枠番の色（背景はデータの色、文字色は背景に合わせる）
  const gateHex = ['#FFFFFF', '#222222', '#C62927', '#2573CD', '#E4CA3C', '#58AF4A', '#FAA727', '#DC6179'];
  const gateFg: Record<number, string> = { 1: '#222222', 5: '#222222', 7: '#222222' };
  const gateRows: ConditionRow[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
    const g = jockey.gate_stats.find((x) => Number(x.gate) === n);
    const base = g ?? { races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, quinella_rate: 0, place_rate: 0, win_payback: 0, place_payback: 0 };
    return {
      ...base,
      label: `${n}枠`,
      gate: { number: n, bg: (g?.color && g.color.startsWith('#') ? g.color : gateHex[n - 1]), fg: gateFg[n] ?? '#FFFFFF' },
    };
  });

  const distanceRows: ConditionRow[] = distanceStatsData.map((r) => ({ ...r, label: r.name }));
  const genderRows: ConditionRow[] = genderStatsData.map((r) => ({ ...r, label: r.name }));
  const surfaceRows: ConditionRow[] = surfaceStatsData.map((r) => ({ ...r, label: r.name }));
  const trackRows: ConditionRow[] = trackConditionStatsData.map((r) => ({ ...r, label: r.name }));

  // 競馬場別（中央・ローカルは集計行として表の下に置き、最大値の判定から外す＝現行どおり）
  const racecourseRows: LinkStatRow[] = individualRacecourses.map((r) => ({ ...r, label: r.name }));
  const racecourseSummaryRows: LinkStatRow[] = [centralData, localData]
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => ({ ...r, label: r.name }));

  // コース別（競馬場ごと、コース名から競馬場名と空白を除く＝現行どおり）
  const courseGroups: CourseGroup[] = coursesByRacecourse.map((g) => ({
    key: g.racecourse_en,
    title: g.racecourse_ja,
    rows: g.courses.map((c) => ({ ...c, label: courseLabel(c), href: c.link })),
  }));

  // 注目ポイント（出走10回以上のコースを複勝率で評価。現行の JockeyTrainerHighlights と同じ）
  const highlightSorted = courseTableData.filter((c) => c.races >= MIN_RACES_FOR_HIGHLIGHT).sort((a, b) => b.place_rate - a.place_rate);
  const toHighlightRow = (c: (typeof courseTableData)[number]): HighlightCourseRow => {
    const name = courseLabel(c, { withRacecourse: true, shortDirt: true });
    return { ...c, label: name, shortName: name, link: c.link };
  };
  const highlightTop = highlightSorted.slice(0, 5).map(toHighlightRow);
  const highlightBottom = highlightSorted.slice(-5).reverse().map(toHighlightRow);

  // 調教師・馬主のランキング
  const trainerRows: RankingRow[] = jockey.trainer_stats.map((stat) => {
    const trainer = ALL_TRAINERS.find((t) => t.name === stat.name);
    return { ...stat, link: trainer ? `/trainers/${trainer.id}` : undefined };
  });
  const ownerRows: RankingRow[] = jockey.owner_stats.map((stat) => ({ ...stat }));

  // データ概要（見出し付きブロック。コース名・調教師名は詳細ページへリンク）
  const summaryBlocks = buildJockeySummaryBlocks(jockey as any);
  if (enoughRaces) {
    summaryBlocks.unshift({
      key: 'lead',
      text: buildPersonLead({
        kind: '騎手',
        name: jockey.name,
        region: (jockey as any).affiliation,
        debutYear: jockey.debut_year,
        traits: [
          reliabilityValue !== 3 ? `人気時の信頼度が${labelOf(reliabilityLabels, reliabilityValue)}` : '',
          labelOf(surfaceLabels, surfacePos),
          labelOf(styleLabels, runningStyleTrendPosition),
          labelOf(distanceLabels, distanceTrendPosition),
        ].filter((t) => t && !/差分なし|互角|標準/.test(t)),
        graded: jockeyGraded,
        recentWin: gradedWins[0] ?? null,
      }),
    });
  }
  const courseNameLinks: NameLink[] = courseTableData.filter((c) => c.link).map((c) => ({ name: c.name, href: c.link as string }));
  const trainerNameLinks: NameLink[] = trainerRows.filter((t) => t.link).map((t) => ({ name: `${t.name}調教師`, href: t.link as string }));
  const summaryLinks: Partial<Record<string, NameLink[]>> = {
    racecourse: courseNameLinks,
    trainer: trainerNameLinks,
  };


  // 特徴の根拠の数値
  const surfacePair: [string, string][] = [...jockey.surface_stats]
    .sort((a, b) => (a.surface === '芝' ? -1 : b.surface === '芝' ? 1 : 0))
    .map((st) => [`${st.surface} 複勝率`, `${toNum(st.place_rate).toFixed(1)}%`]);
  const stylePair: [string, string][] = (mergedRunningStyleStats as any[]).map((st) => [
    `${runningStyleCategoryFullName(st.style_label)} 複勝率`,
    `${toNum(st.place_rate).toFixed(1)}%`,
  ]);
  const distancePair: [string, string][] = (mergedDistanceStats as any[]).map((st) => [
    `${distanceCategoryFullName(st.category)} 複勝率`,
    `${toNum(st.place_rate).toFixed(1)}%`,
  ]);
  const reliabilityPair: [string, string][] = [
    ['1番人気の複勝率', chars.fav1_place_rate > 0 ? `${chars.fav1_place_rate.toFixed(1)}%` : 'データなし'],
    ['全騎手の平均', chars.all_fav1_place_rate > 0 ? `${chars.all_fav1_place_rate.toFixed(1)}%` : 'データなし'],
    ['複勝率ランキング', chars.fav1_ranking > 0 && chars.total_jockeys > 0 ? `${chars.fav1_ranking}位/${chars.total_jockeys}人` : 'データなし'],
    ...(typeof chars.fav1_races === 'number' ? [['1番人気の騎乗数', `${chars.fav1_races.toLocaleString('ja-JP')}回`] as [string, string]] : []),
  ];

  // ページ内ナビ（チップの表示名は短く、id は目次と共通）
  const chipLabels: Record<string, string> = {
    'profile-section': '基本情報', 'graded-wins-section': '重賞勝ち', 'sire-stats': '種牡馬',
    'summary-section': '概要', leading: '年度別', characteristics: '特徴', 'highlights-section': '注目',
    'class-stats': 'クラス別', 'popularity-stats': '人気別', 'running-style-stats': '脚質別', 'gate-stats': '枠順別',
    'distance-stats': '距離別', 'gender-stats': '性別', 'surface-stats': '芝・ダート', 'track-condition-stats': '馬場状態',
    'racecourse-stats': '競馬場別', 'course-stats': 'コース別', 'trainer-stats': '調教師', 'owner-stats': '馬主', 'faq-section': 'Q&A',
  };
  // 対象レース数が少ないページは「特徴」「注目ポイント」「データQ&A」を出さないので、ナビ・目次からも外す
  const thinHiddenIds = new Set(['characteristics', 'highlights-section', 'faq-section']);
  const tocItems = navigationItems.filter((item) => enoughRaces || !thinHiddenIds.has(item.id));
  const chipItems = tocItems.map((item) => ({ id: item.id, label: chipLabels[item.id] ?? item.label }));

  const runningStyleDefinition = (
    <details className={s.more}>
      <summary>脚質の定義</summary>
      <ul className={s.def}>
        <li><b>逃げ</b>コーナーのいずれかが1位通過</li>
        <li><b>先行</b>最終コーナーで第1集団</li>
        <li><b>差し</b>最終コーナーで第2集団かつ上がりが3位以内</li>
        <li><b>追込</b>最終コーナーで第3集団かつ上がりが3位以内</li>
      </ul>
      <p className={s.note} style={{ marginBottom: 12 }}>出走頭数を3で割ったものを第1集団〜第3集団とし、上記に該当しない場合は集計から除外しています。</p>
    </details>
  );
  const distanceDefinition = (
    <details className={s.more}>
      <summary>距離の定義</summary>
      <ul className={s.def}>
        <li><b>短距離</b>〜1400m</li>
        <li><b>マイル</b>1401m〜1800m</li>
        <li><b>中距離</b>1801m〜2100m</li>
        <li><b>長距離</b>2101m〜</li>
      </ul>
      <p className={s.note} style={{ marginBottom: 12 }}>集計に使っている区分です。</p>
    </details>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      {/* 構造化データの埋め込み */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {enoughRaces && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJockeyJsonLd) }}
        />
      )}
      <div className={s.canvas}>
      <div className={pageStyles.staticPageContainer}>
        <div className={pageStyles.staticPageColumns3}>
          {/* 左サイドバー */}
          <aside className={pageStyles.staticPageLeftSidebar}>
            <AIBanner />
          </aside>

          <article>
            {/* パンくずリスト */}
            <nav className={s.crumb} aria-label="パンくず">
              <Link href="/">HOME</Link>
              <span aria-hidden="true">/</span>
              <Link href="/jockeys">騎手一覧</Link>
              <span aria-hidden="true">/</span>
              <span>{jockey.name}</span>
            </nav>

            {/* 冒頭 */}
            <div className={s.hero}>
              {(jockey.affiliation || jockey.debut_year) && (
                <div className={s.badges}>
                  {jockey.affiliation && <span className={s.badge}>{jockey.affiliation}所属</span>}
                  {jockey.debut_year && <span className={s.badge}>{jockey.debut_year}年デビュー</span>}
                </div>
              )}
              <h1 className={s.title}>{jockey.name}騎手の傾向・成績データ</h1>
              <p className={s.lead}>
                {jockey.name}騎手の成績・データをまとめたページです。独自のデータベースで直近3年間・{jockey.total_races.toLocaleString()}レースのデータを集計し、毎週更新しています。
              </p>
              <div className={s.meta}>
                <span>集計 <b>{periodText}</b></span>
                <span>対象 <b>{jockey.total_races.toLocaleString()}レース</b></span>
                <span>更新 <b><time dateTime={jaDateToIso(jockey.last_updated)}>{jockey.last_updated}</time></b></span>
              </div>
            </div>

            {/* 対象レース数が少ない場合の注意 */}
            {!enoughRaces && (
              <ThinDataNotice totalRaces={jockey.total_races} hiddenItems="「騎手の傾向」「騎手の特徴」「注目ポイント」「データQ&A」" />
            )}

            {/* 結論カード */}
            {enoughRaces && (
              <div className={`${s.card} ${s.verdict}`}>
                <div className={s.vHead}>
                  <h2>{jockey.name}騎手の傾向</h2>
                  <span className={s.note}>{jockey.total_races.toLocaleString()}レース</span>
                </div>
                <VerdictRows>
                  <VerdictRow label="信頼度" value={reliabilityValue} result={labelOf(reliabilityLabels, reliabilityValue)} href="#characteristics" />
                  <VerdictRow label="芝・ダート" value={surfacePos} result={labelOf(surfaceLabels, surfacePos)} href="#characteristics" />
                  <VerdictRow label="脚質" value={runningStyleTrendPosition} result={labelOf(styleLabels, runningStyleTrendPosition)} href="#characteristics" />
                  <VerdictRow label="距離" value={distanceTrendPosition} result={labelOf(distanceLabels, distanceTrendPosition)} href="#characteristics" />
                </VerdictRows>
              </div>
            )}

            <CourseSectionNav items={chipItems} />

            {/* 基本情報 */}
            <section id="profile-section" className={s.section} aria-label="基本情報">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手の基本情報</h2></div>
              <InfoTiles items={profileTiles} />
            </section>

            {/* データ概要（固有解説文） */}
            <section id="summary-section" className={s.section} aria-label="データの概要">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手のデータ概要</h2></div>
              <div className={`${s.card} ${s.article}`}>
                {summaryBlocks.map((block, i) => (
                  <div key={`${block.key}-${i}`} className={s.blk}>
                    {block.title && <h3>{block.title}</h3>}
                    <p><RichText text={block.text} links={summaryLinks[block.key] ?? []} /></p>
                  </div>
                ))}
              </div>
            </section>


            {/* 年度別成績 */}
            <section id="leading" className={s.section} aria-label="年度別成績">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 年度別成績</h2><p>勝利数とリーディング順位（直近3年）</p></div>
              <div className={s.card}>
                <JockeyLeadingCard data={leadingData} summary={leadingSummary} />
                <StatsTable rows={yearlyRows} keyLabel="年度" />
              </div>
            </section>

            {/* 重賞勝ち（直近3年間・新しい順） */}
            {gradedWins.length > 0 && (
              <section id="graded-wins-section" className={s.section} aria-label="重賞勝ち">
                <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手の重賞勝ち</h2><p>直近3年間・平地・新しい順（G1 {jockeyGraded.g1}勝・G2 {jockeyGraded.g2}勝・G3 {jockeyGraded.g3}勝）</p></div>
                <ListTable
                  note={gradedWins.length >= 30 ? '最大30件まで表示' : undefined}
                  columns={[{ label: 'レース' }, { label: '日付' }, { label: '馬名' }, { label: 'コース' }, { label: '人気', numeric: true }]}
                  rows={gradedWins.map((w) => ({
                    key: `${w.date}-${w.race_name}`,
                    cells: [
                      <><span className={sh.grade}>{w.grade}</span>{w.race_name}</>,
                      shortDate(w.date),
                      w.horse_name,
                      `${w.venue}${w.surface === 'ダート' ? 'ダ' : w.surface}${w.distance}m`,
                      w.popularity ? `${w.popularity}` : '—',
                    ],
                  }))}
                />
              </section>
            )}

            {/* 騎手の特徴 */}
            {enoughRaces && (
              <section id="characteristics" className={s.section} aria-label="騎手特徴">
                <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手の特徴</h2><p>判定と、その根拠になった数字</p></div>
                <div className={s.card}>
                  <Meter
                    label="人気時の信頼度"
                    result={labelOf(reliabilityLabels, reliabilityValue)}
                    value={reliabilityValue}
                    scale={['低い', '標準', '高い']}
                    pair={reliabilityPair}
                  />
                  <Meter
                    label="得意なコース傾向"
                    result={labelOf(surfaceLabels, surfacePos)}
                    value={surfacePos}
                    scale={['芝が得意', '差分なし', 'ダートが得意']}
                    pair={surfacePair}
                  />
                  <Meter
                    label="得意な脚質傾向"
                    result={labelOf(styleLabels, runningStyleTrendPosition)}
                    value={runningStyleTrendPosition}
                    scale={['逃げ・先行が得意', '差分なし', '差し・追込が得意']}
                    pair={stylePair}
                  />
                  <Meter
                    label="得意な距離傾向"
                    result={labelOf(distanceLabels, distanceTrendPosition)}
                    value={distanceTrendPosition}
                    scale={['短距離が得意', '差分なし', '長距離が得意']}
                    pair={distancePair}
                  />
                  <CriteriaDetails
                    items={[
                      {
                        title: '人気時の信頼度',
                        lead: '1番人気に支持されたときの複勝率が高いほど、信頼度が高いことを示します。直近3年間のレースデータを使用し、1番人気での騎乗が10回以上の騎手のみを対象にしています。',
                      },
                      SURFACE_CRITERIA,
                      RUNNING_STYLE_CRITERIA,
                      DISTANCE_CRITERIA,
                      DISTANCE_DEFINITION,
                      RUNNING_STYLE_DEFINITION,
                    ]}
                  />
                </div>
                <p className={s.note}>※複勝率ランキングは1番人気が10走以上の騎手を対象</p>
              </section>
            )}

            {/* 注目ポイント */}
            {enoughRaces && (
              <section id="highlights-section" className={s.section} aria-label="注目ポイント">
                <div className={s.sh}>
                  <h2 className={s.h2}>{jockey.name}騎手の注目ポイント</h2>
                  <p>成績が目立つコース。コース名をタップすると詳細へ</p>
                </div>
                {highlightTop.length > 0 || highlightBottom.length > 0 ? (
                  <>
                    <div className={s.legend}>
                      <span><i style={{ borderColor: '#5FC28A' }} />得意</span>
                      <span><i style={{ borderColor: '#D98A9E' }} />苦手</span>
                    </div>
                    <HighlightCoursesCard top={highlightTop} bottom={highlightBottom} />
                  </>
                ) : (
                  <div className={s.card}><p className={s.note}>出走回数{MIN_RACES_FOR_HIGHLIGHT}回以上のコースがありません。</p></div>
                )}
                <p className={s.note}>※出走回数{MIN_RACES_FOR_HIGHLIGHT}回以上のコースを対象に、複勝率で評価しています</p>
              </section>
            )}

            {/* 条件別 */}
            <section id="class-stats" className={s.section} aria-label="クラス別データ">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 クラス別データ</h2></div>
              <ConditionCard rows={classRows} keyLabel="クラス" />
            </section>
            <section id="popularity-stats" className={s.section} aria-label="人気別データ">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 人気別データ</h2></div>
              <ConditionCard rows={popularityRows} keyLabel="人気" />
            </section>
            <section id="running-style-stats" className={s.section} aria-label="脚質別データ">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 脚質別データ</h2></div>
              <ConditionCard rows={styleRows} keyLabel="脚質" extra={runningStyleDefinition} />
            </section>
            <section id="gate-stats" className={s.section} aria-label="枠順別データ">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 枠順別データ</h2></div>
              <ConditionCard rows={gateRows} keyLabel="枠番" />
            </section>
            <section id="distance-stats" className={s.section} aria-label="距離別データ">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 距離別データ</h2></div>
              <ConditionCard rows={distanceRows} keyLabel="距離" extra={distanceDefinition} />
            </section>
            <section id="gender-stats" className={s.section} aria-label="性別データ">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 性別データ</h2></div>
              <ConditionCard rows={genderRows} keyLabel="性別" />
            </section>
            <section id="surface-stats" className={s.section} aria-label="コース区分別データ">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 コース区分別データ</h2></div>
              <ConditionCard rows={surfaceRows} keyLabel="区分" />
            </section>
            <section id="track-condition-stats" className={s.section} aria-label="馬場状態別データ">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 馬場状態別データ</h2><p>芝・ダート・障害 × 良・稍重・重・不良</p></div>
              <ConditionCard rows={trackRows} keyLabel="馬場" />
            </section>
            <section id="racecourse-stats" className={s.section} aria-label="競馬場別成績">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 競馬場別成績</h2></div>
              <SummaryConditionCard rows={racecourseRows} summaryRows={racecourseSummaryRows} keyLabel="競馬場" />
            </section>
            <section id="course-stats" className={s.section} aria-label="コース別成績">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 コース別成績</h2><p>競馬場をタップすると、コースごとの13項目を表示</p></div>
              <CourseGroupsCard groups={courseGroups} />
            </section>

            {/* 調教師・馬主（現行仕様：10件＋さらに表示で最大50件） */}
            <section id="trainer-stats" className={s.section} aria-label="調教師別データ">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 調教師別データ</h2></div>
              <RankingTable rows={trainerRows} nameLabel="調教師" note="※現役調教師のみ" />
            </section>
            {sireRows.length > 0 && (
              <section id="sire-stats" className={s.section} aria-label="種牡馬別データ">
                <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 種牡馬別データ</h2><p>騎乗馬の父（種牡馬）別・勝利数順</p></div>
                <RankingTable rows={sireRows} nameLabel="種牡馬" note="最大50件まで表示" />
              </section>
            )}
            <section id="owner-stats" className={s.section} aria-label="馬主別データ">
              <div className={s.sh}><h2 className={s.h2}>{jockey.name}騎手 馬主別データ</h2></div>
              <RankingTable rows={ownerRows} nameLabel="馬主" note="最大50件まで表示" />
            </section>

            {/* データQ&A */}
            {enoughRaces && (
            <section id="faq-section" className={s.section} aria-label="データQ&A">
              <div className={s.sh}><h2 className={s.h2}>データQ&amp;A</h2></div>
              <div className={s.card}>
                <CourseFaq items={[
                  { question: `${jockey.name}騎手の得意な競馬場は？`, answer: goodRacecourseAnswer },
                  { question: `${jockey.name}騎手の得意なコースは？`, answer: goodCourseAnswer },
                  { question: `${jockey.name}騎手は芝とダートどちらが得意？`, answer: surfaceFaqAnswer, boldFirstLine: true },
                  { question: `${jockey.name}騎手の得意な距離は？`, answer: distanceFaqAnswer, boldFirstLine: true },
                  { question: `${jockey.name}騎手の得意な脚質は？`, answer: runningStyleFaqAnswer, boldFirstLine: true },
                  { question: `${jockey.name}騎手の人気時の信頼度は？`, answer: popularityFaqAnswer },
                  { question: `${jockey.name}騎手の重賞成績は？`, answer: gradedAnswer },
                  ...(sireAnswer ? [{ question: `${jockey.name}騎手と相性の良い種牡馬は？`, answer: sireAnswer, links: topSires.filter((r: any) => r.link).map((r: any) => ({ text: r.name, href: r.link })) }] : []),
                  { question: `${jockey.name}騎手の苦手な競馬場は？`, answer: badRacecourseAnswer },
                  { question: `${jockey.name}騎手の苦手なコースは？`, answer: badCourseAnswer },
                ]} />
              </div>
            </section>
            )}

            {/* データの出典・集計方法 */}
            <div className={s.section}>
              <DataSourceNote periodText={periodFromDataPeriod(jockey.data_period)} lastUpdated={jockey.last_updated} className={s.about} />
            </div>
          </article>

          {/* PC用：右サイドバー目次 */}
          <TableOfContents items={tocItems} />
        </div>
      </div>
      </div>
    </>
  );
}
