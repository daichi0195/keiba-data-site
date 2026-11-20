import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getJockeyDataFromGCS } from '@/lib/getJockeyDataFromGCS';
import { ALL_JOCKEYS } from '@/lib/jockeys';
import { ALL_TRAINERS } from '@/lib/trainers';
import { ALL_SIRES } from '@/lib/sires';
import { resolveCourseUrl, courseLabel } from '@/lib/courseLinks';
import { jaDateToIso, periodFromDataPeriod, buildWebPageJsonLd } from '@/lib/dataDate';
import { MIN_RACES_FOR_TRENDS, hasEnoughRaces, THIN_PAGE_ROBOTS } from '@/lib/dataPageRules';
import { buildJockeySummaryBlocks } from '@/lib/jockeySummaryBlocks';
import { jockeyDescription } from '@/lib/metaDescriptions';
import {
  ageAt, buildAimAnswer, buildG1Answer, buildGradedAnswer, buildJockeyLead, buildLocalAnswer, buildLongshotAnswer, buildRideChangeAnswer, buildWetAnswer,
  formatTitles, gradedTotals, jaDate, pickAim, thisYearOf,
  type AimRow, type G1Win, type GradedWin, type JockeyTrend, type JockeyTrends, type PersonProfile, type RideChangeRow,
} from '@/lib/entityExtras';
import {
  About, Ad, Head, BestNote, Cnt, CourseAcc, DefLink, Faq, GTag, GradedWins, H, Highlights, Hero, Hno, HorseList, InfoTable, MaybeLink, Meters, Nb, PageNav,
  Pn, Sec, SfTag, Stats, Subs, Summary, ThinNote, Titles, EntityRoot, gateRows as toGateRows, sfKey,
  type MeterItem,
  type CourseRow, type NameLink,
} from '@/components/v6/entity/parts';
import { YearCharts } from '@/components/v6/entity/charts';
import { R, ZERO, type Row } from '@/components/v6/entity/format';
import type { StatsProps } from '@/components/v6/entity/Stats';
import { cx } from '@/components/v6/entity/cx';

type RankingRow = { name: string; link?: string; [k: string]: any };

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

  // 検索語「〇〇騎手 傾向」「〇〇 騎手 特徴」「〇〇 騎手 データ」に合わせて前半に置く。AI 概要で必ず出る「乗り替わり」も入れる（docs/seo/jockey_serp_2026-11.md）
  const title = `${jockey.name}騎手の傾向・特徴・データ｜得意コース・距離・乗り替わりと回収率【毎週更新】`;
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

  // 道悪・人気薄・ローカル・乗り替わり（人気の偏りを補正した判定）、乗り替わり別・お手馬・G1（gcs/v2/generate_extras.py）
  const jt: JockeyTrends = (jockey as any).jockey_trends ?? {};
  const rideChange: RideChangeRow[] = (jockey as any).ride_change_stats ?? [];
  const notableHorses: any[] = (jockey as any).notable_horses ?? [];
  const g1Wins: G1Win[] = (jockey as any).g1_wins ?? [];
  const g1Since: string | undefined = (jockey as any).g1_wins_since;
  // 2列の並びを崩さないよう、判定は2つ1組で出す（道悪＋乗り替わり／人気薄＋ローカル）
  const trendPairs = ([['wet', 'change'], ['longshot', 'local']] as const).filter(([a, b]) => jt[a] && jt[b]);
  const shownTrends = trendPairs.flat() as (keyof JockeyTrends)[];
  const rideChangeAnswer = buildRideChangeAnswer(jockey.name, rideChange, shownTrends.includes('change') ? jt.change : null);
  const wetAnswer = shownTrends.includes('wet') ? buildWetAnswer(jockey.name, jt.wet) : null;
  const longshotAnswer = shownTrends.includes('longshot') ? buildLongshotAnswer(jockey.name, jt.longshot) : null;
  const localAnswer = shownTrends.includes('local') ? buildLocalAnswer(jockey.name, jt.local) : null;
  const g1Answer = buildG1Answer(jockey.name, g1Wins, g1Since);

  // 狙い目・消し条件：騎乗前に分かる条件から、複勝回収率が高い／低いもの
  const CLASS_LABEL: Record<string, string> = { 新馬: '新馬戦', 未勝利: '未勝利戦', '1勝': '1勝クラス', '2勝': '2勝クラス', '3勝': '3勝クラス' };
  const POP_LABEL: Record<string, string> = { fav1: '1番人気', fav2: '2番人気', fav3: '3番人気', fav4: '4番人気', fav5: '5番人気', fav6to9: '6〜9番人気', fav10plus: '10番人気以下' };
  const aimCands: AimRow[] = [
    ...(jockey.racecourse_stats ?? []).filter((r) => r.name !== '中央' && r.name !== 'ローカル').map((r) => ({ ...r, label: `${r.name.replace('競馬場', '')}競馬場` })),
    ...(jockey.course_stats ?? []).filter((c) => c.surface_en !== 'obstacle').map((c) => ({ ...c, label: formatCourseName(c) })),
    ...jockey.distance_stats.map((r) => ({ ...r, label: r.category })),
    ...jockey.class_stats.map((r) => ({ ...r, label: CLASS_LABEL[r.class_name] ?? r.class_name })),
    ...Object.entries(jockey.popularity_stats ?? {}).map(([k, r]: [string, any]) => ({ ...r, label: POP_LABEL[k] ?? k })),
    ...(jockey.gate_stats as any[]).map((r) => ({ ...r, label: `${r.gate}枠` })),
    ...jockey.track_condition_stats.filter((r) => r.surface !== '障').map((r) => ({ ...r, label: `${r.surface === 'ダ' ? 'ダート' : r.surface}・${r.condition === '稍' ? '稍重' : r.condition === '不' ? '不良' : r.condition}` })),
    ...jockey.gender_stats.map((r) => ({ ...r, label: r.name })),
    ...jockey.trainer_stats.map((r) => ({ ...r, label: `${r.name}厩舎` })),
    ...((jockey as any).sire_stats ?? []).map((r: any) => ({ ...r, label: `${r.name}産駒` })),
  ] as AimRow[];
  const AIM_MIN = 30;
  const aim = pickAim(aimCands, AIM_MIN);
  const aimAnswer = buildAimAnswer(jockey.name, aim, AIM_MIN);

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
      ...(rideChangeAnswer ? [{ question: `${jockey.name}騎手の乗り替わりの成績は？`, answer: rideChangeAnswer }] : []),
      ...(wetAnswer ? [{ question: `${jockey.name}騎手は道悪（重馬場）が得意？`, answer: wetAnswer }] : []),
      ...(longshotAnswer ? [{ question: `${jockey.name}騎手は人気薄でも走る？`, answer: longshotAnswer }] : []),
      ...(localAnswer ? [{ question: `${jockey.name}騎手は中央とローカルどちらが得意？`, answer: localAnswer }] : []),
      ...(aimAnswer ? [{ question: `${jockey.name}騎手の狙い目の条件は？`, answer: aimAnswer }] : []),
      { question: `${jockey.name}騎手の重賞成績は？`, answer: gradedAnswer },
      ...(g1Answer ? [{ question: `${jockey.name}騎手のG1の勝ち鞍は？`, answer: g1Answer }] : []),
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


  // ===== 表示（リデザイン v6。見本 docs/redesign/src/pages/jockey.mjs と同じ並び・同じ整形） =====
  const periodText = periodFromDataPeriod(jockey.data_period) ?? '直近3年間';
  const dateIso = jaDateToIso(jockey.last_updated);
  const chars = jockey.characteristics;
  // 対象レース数が少ないページは傾向判定・特徴・注目ポイント・データQ&Aを出さない（現行どおり）
  const enoughRaces = hasEnoughRaces(jockey.total_races);
  const WHO = `${jockey.name}騎手`;
  const t = jockey.total_stats;

  // 判定の文言（5段階）。芝・ダートは左＝芝が得意（騎手データの surface_trend_position は 1＝ダートが得意なので反転）
  const LBL = {
    rel: ['低い', 'やや低い', '標準', 'やや高い', '高い'],
    sf: ['芝が得意', 'やや芝が得意', '差分なし', 'ややダートが得意', 'ダートが得意'],
    st: ['逃げ・先行が得意', 'やや逃げ・先行が得意', '差分なし', 'やや差し・追込が得意', '差し・追込が得意'],
    ds: ['短距離が得意', 'やや短距離が得意', '差分なし', 'やや長距離が得意', '長距離が得意'],
  };
  const POS = { rel: chars?.volatility ?? 3, sf: 6 - surfaceTrendPosition, st: runningStyleTrendPosition, ds: distanceTrendPosition };
  const lbl = (k: keyof typeof LBL) => LBL[k][POS[k] - 1] ?? '';

  // データ概要（先頭に結論の1文。コース名・調教師名は詳細ページへリンク）
  const summaryBlocks = buildJockeySummaryBlocks(jockey as any);
  if (enoughRaces) {
    summaryBlocks.unshift({
      key: 'lead',
      text: buildJockeyLead({
        name: jockey.name,
        region: (jockey as any).affiliation,
        debutYear: jockey.debut_year,
        traits: [lbl('st'), POS.rel !== 3 ? `人気時の信頼度が${lbl('rel')}` : '', lbl('sf'), lbl('ds'), ...shownTrends.map((k) => jt[k]!.label)].filter((x) => x && !/差分なし|互角|標準/.test(x)),
        graded: jockeyGraded,
        recentWin: gradedWins[0] ?? null,
      }),
    });
  }
  const trainerIdByName = new Map(ALL_TRAINERS.map((x) => [x.name, x.id]));
  const trainerUrl = (name: string) => (trainerIdByName.has(name) ? `/trainers/${trainerIdByName.get(name)}` : undefined);
  const courseRows = jockey.course_stats.filter((c) => c.surface_en !== 'obstacle') as unknown as CourseRow[];
  const summaryLinks: Partial<Record<string, NameLink[]>> = {
    racecourse: courseRows.map((c) => ({ name: c.name, href: resolveCourseUrl(c) ?? '' })).filter((l) => l.href),
    trainer: jockey.trainer_stats.filter((x) => trainerUrl(x.name)).map((x) => ({ name: `${x.name}調教師`, href: trainerUrl(x.name) as string })),
  };

  // 冒頭・基本情報
  const YEAR = dateIso ? Number(dateIso.slice(0, 4)) : currentYear;
  const years = [YEAR - 2, YEAR - 1, YEAR];
  const kpi: [string, number, number, string][] = [
    ['出走数', t.races, 0, ''], ['1着', t.wins, 0, ''], ['勝率', t.win_rate, 1, '%'], ['連対率', t.quinella_rate, 1, '%'], ['複勝率', t.place_rate, 1, '%'],
  ];
  const lostCount = t.races - t.wins - t.places_2 - t.places_3;
  const tiles: [string, ReactNode, ReactNode?][] = [
    ['所属', (jockey as any).affiliation ?? jockeyProfile.region ?? '', ''],
    ['生年月日', jaDate(jockeyProfile.birth_date) ?? '', jockeyAge !== null ? `${jockeyAge}歳` : ''],
    ['デビュー', jockey.debut_year ? `${jockey.debut_year}年` : '', jockey.debut_year ? `${asOfDate.getFullYear() - Number(jockey.debut_year) + 1}年目` : ''],
    ...(jockeyThisYear
      ? [[`${jockeyThisYear.year}年の勝利数`, <><Cnt v={jockeyThisYear.wins} />勝</>, jockeyThisYear.ranking > 0 ? `リーディング${jockeyThisYear.ranking}位` : ''] as [string, ReactNode, ReactNode]]
      : []),
    ['着度数（直近3年間）', <span className={cx('num')}>{`${t.wins}-${t.places_2}-${t.places_3}-${lostCount}`}</span>, <><Nb>勝率{t.win_rate.toFixed(1)}%・</Nb><Nb>複勝率{t.place_rate.toFixed(1)}%</Nb></>],
    ['重賞勝ち（平地）', <><Cnt v={jockeyGraded.wins} />勝</>, `直近3年間・G1 ${jockeyGraded.g1}勝`],
    [`G1勝ち（${(g1Since ?? "2019").slice(0, 4)}年〜）`, <><Cnt v={g1Wins.length} />勝</>, g1Wins[0] ? `最近：${g1Wins[0].race_name}` : ''],
  ];

  // 道悪・乗り替わり・人気薄・ローカルの判定（人気の偏りを補正）
  const pct1 = (v: number | null | undefined) => (typeof v === 'number' ? `${v.toFixed(1)}%` : '—');
  // 判定の基準：乗った馬の単勝オッズから見込まれる複勝率（左の目盛り側 b → 右 a の順）
  const allFx = (tr: JockeyTrend, a: string, b?: string) => (
    <p className={cx('fx')}>
      <span>人気からの見込み{b ? ` ${b}` : ''} <b className={cx('num')}>{pct1(b ? tr.exp_b : tr.exp_a)}</b></span>
      {b ? <span>{a} <b className={cx('num')}>{pct1(tr.exp_a)}</b></span> : null}
    </p>
  );
  const TREND_VIEW: Record<keyof JockeyTrends, { verdict: string; meter: (tr: JockeyTrend) => MeterItem }> = {
    wet: {
      verdict: '道悪',
      meter: (tr) => ({ label: '道悪（稍重〜不良）', pos: tr.pos, result: tr.label, scale: ['苦手', '標準', '得意'], ev: [['良 複勝率', tr.rate_b ?? undefined], ['稍重〜不良 複勝率', tr.rate_a ?? undefined]], facts: allFx(tr, '稍重〜不良', '良') }),
    },
    change: {
      verdict: '乗り替わり',
      meter: (tr) => ({ label: '継続騎乗・乗り替わり', pos: tr.pos, result: tr.label, scale: ['継続騎乗が得意', '差分なし', '乗り替わりが得意'], ev: [['継続騎乗 複勝率', tr.rate_b ?? undefined], ['乗り替わり 複勝率', tr.rate_a ?? undefined]], facts: allFx(tr, '乗り替わり', '継続騎乗') }),
    },
    longshot: {
      verdict: '人気薄',
      meter: (tr) => ({
        label: '人気薄（6番人気以下）', pos: tr.pos, result: tr.label, scale: ['走らない', '標準', '走る'],
        ev: [['6番人気以下 複勝率', tr.rate_a ?? undefined], ['人気からの見込み', tr.exp_a ?? undefined, true]],
        facts: <p className={cx('fx')}><span>複勝回収率 <b className={cx('num')}>{pct1(tr.payback)}</b></span><span>騎乗数 <b className={cx('num')}>{tr.races_a.toLocaleString('ja-JP')}回</b></span></p>,
      }),
    },
    local: {
      verdict: 'ローカル',
      meter: (tr) => ({ label: '中央4場・ローカル', pos: tr.pos, result: tr.label, scale: ['中央4場が得意', '差分なし', 'ローカルが得意'], ev: [['中央4場 複勝率', tr.rate_b ?? undefined], ['ローカル 複勝率', tr.rate_a ?? undefined]], facts: allFx(tr, 'ローカル', '中央4場') }),
    },
  };

  // 年度別（図は古い順、表は新しい順）
  const leadYears = years.map((y) => jockey.yearly_leading.find((x) => x.year === y) ?? { year: y, wins: 0, ranking: 0 });
  const ystat = years.map((y) => ({ ...ZERO, ...(jockey.yearly_stats.find((x) => x.year === y) ?? {}), year: y }));

  // 特徴の根拠
  const mergeRate = (a: any, b: any) => {
    const x = a ?? ZERO, y = b ?? ZERO;
    const r = x.races + y.races;
    return r ? ((x.wins + y.wins + x.places_2 + y.places_2 + x.places_3 + y.places_3) / r) * 100 : 0;
  };
  const dOf = (k: string) => jockey.distance_stats.find((x) => x.category === k);
  const sOf = (k: string) => jockey.running_style_stats.find((x) => x.style === k);
  const sfSorted = [...jockey.surface_stats].sort((a, b) => (a.surface === '芝' ? -1 : b.surface === '芝' ? 1 : 0));

  // 条件別の行（並び・件数は現行どおり）
  const classRows = ['G1', 'G2', 'G3', 'オープン', '3勝', '2勝', '1勝', '未勝利', '新馬'].map((n) =>
    R(jockey.class_stats.find((x) => x.class_name === n), /^G\d$/.test(n) ? <GTag g={n} /> : n, n));
  const popRows = ([['fav1', '1番人気'], ['fav2', '2番人気'], ['fav3', '3番人気'], ['fav4', '4番人気'], ['fav5', '5番人気'], ['fav6to9', '6〜9番人気'], ['fav10plus', '10番人気〜']] as const).map(([k, l]) =>
    R(jockey.popularity_stats?.[k], l));
  const rideRows = rideChange.length ? ['継続騎乗', '乗り替わり（初騎乗）', '乗り替わり（再騎乗）', '初出走'].map((n) => R(rideChange.find((x) => x.category === n) as any, n, n)) : [];
  const styleRows = ([['escape', '逃げ'], ['lead', '先行'], ['pursue', '差し'], ['close', '追込']] as const).map(([k, l]) => R(sOf(k), l));
  const gRows = toGateRows(jockey.gate_stats);
  const distRows = ['短距離', 'マイル', '中距離', '長距離'].map((n) => R(dOf(n), n));
  const genderRows = ['牡馬', '牝馬', 'セン馬'].map((n) => R(jockey.gender_stats.find((x) => x.name === n), n));
  const surfRows = ['芝', 'ダート', '障害'].map((n) => R(jockey.surface_stats.find((x) => x.surface === n), <SfTag sf={sfKey(n)} />, n));
  const trackRows = ['芝', 'ダ', '障'].flatMap((sf) =>
    ['良', '稍', '重', '不'].map((cd) =>
      R(jockey.track_condition_stats.find((x) => x.surface === sf && x.condition === cd), <><SfTag sf={sfKey(sf)} /><span className={cx('tc')}>{cd}</span></>, `${sf}・${cd}`)));
  const RCJ: [string, string][] = [['札幌', 'sapporo'], ['函館', 'hakodate'], ['福島', 'fukushima'], ['新潟', 'niigata'], ['東京', 'tokyo'], ['中山', 'nakayama'], ['中京', 'chukyo'], ['京都', 'kyoto'], ['阪神', 'hanshin'], ['小倉', 'kokura']];
  const rcRows = RCJ.map(([ja, en]) => R(jockey.racecourse_stats.find((x) => x.racecourse_en === en || x.name === ja), ja));
  const rcSum = ['中央', 'ローカル']
    .map((n) => jockey.racecourse_stats.find((x) => x.name === n))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => R(r, <b>{r.name}</b>, r.name));

  // 調教師・種牡馬・馬主（10件＋さらに表示で最大50件）
  const nameRow = (r: { name: string; [k: string]: any }, href: string | undefined, i: number): Row => ({ ...R(r, <MaybeLink href={href}>{r.name}</MaybeLink>, r.name), rowKey: `${r.name}-${i}` });
  const trainerList = jockey.trainer_stats.map((x, i) => nameRow(x, trainerUrl(x.name), i));
  const sireList = sireRows.map((x, i) => nameRow(x, x.link, i));
  const ownerList = jockey.owner_stats.map((x, i) => nameRow(x, undefined, i));

  // 節：条件別（補足文「出走30以上で…」は板の外、見出しの下）とランキング
  const cond = (id: string, title: string, rows: Row[], opt: Partial<StatsProps> & { keyLabel: string }, sub = '', note = true) => (
    <Sec id={id} head={<H w={WHO} title={title} sub={sub || note ? <Subs sub={sub} note={note ? <BestNote rows={rows} /> : null} /> : undefined} />}>
      <Pn><Stats rows={rows} {...opt} /></Pn>
    </Sec>
  );
  const rankSec = (id: string, title: string, rows: Row[], keyLabel: string, hint: string, sub = '') => (
    <Sec id={id} head={<H w={WHO} title={title} sub={sub ? <Subs sub={sub} /> : undefined} />}>
      <Pn><Stats rows={rows} keyLabel={keyLabel} rank initial={10} bar="wins" barLabel={'勝利数\n（横棒）'} hint={hint} shrink /></Pn>
    </Sec>
  );

  // ページ内の移動（対象レース数が少ないページは「特徴」「注目」「Q&A」を外す）
  const thinHidden = new Set(['characteristics', 'highlights-section', 'aim-section', 'faq-section']);
  const navItems = [
    ['profile-section', '基本情報'], ['summary-section', '概要'], ['leading', '年度別'], ...(gradedWins.length ? [['graded-wins-section', '重賞勝ち']] : []),
    ...(notableHorses.length ? [['horses-section', 'お手馬']] : []),
    ['characteristics', '特徴'], ['highlights-section', '注目'], ...(aim.hi.length ? [['aim-section', '狙い目']] : []), ['class-stats', 'クラス別'], ['popularity-stats', '人気別'],
    ...(rideChange.length ? [['ride-change-stats', '乗り替わり']] : []), ['running-style-stats', '脚質別'],
    ['gate-stats', '枠順別'], ['distance-stats', '距離別'], ['gender-stats', '性別'], ['surface-stats', '芝・ダート'], ['track-condition-stats', '馬場状態'],
    ['racecourse-stats', '競馬場別'], ['course-stats', 'コース別'], ['trainer-stats', '調教師'], ...(sireRows.length ? [['sire-stats', '種牡馬']] : []),
    ['owner-stats', '馬主'], ['faq-section', 'Q&A'],
  ].filter(([id]) => enoughRaces || !thinHidden.has(id)).map(([id, label]) => ({ id, label }));

  const affiliation = (jockey as any).affiliation as string | undefined;
  const faqItems = [
    { q: `${jockey.name}騎手の得意な競馬場は？`, a: goodRacecourseAnswer },
    { q: `${jockey.name}騎手の得意なコースは？`, a: goodCourseAnswer },
    { q: `${jockey.name}騎手は芝とダートどちらが得意？`, a: surfaceFaqAnswer, lead: true },
    { q: `${jockey.name}騎手の得意な距離は？`, a: distanceFaqAnswer, lead: true },
    { q: `${jockey.name}騎手の得意な脚質は？`, a: runningStyleFaqAnswer, lead: true },
    { q: `${jockey.name}騎手の人気時の信頼度は？`, a: popularityFaqAnswer },
    ...(rideChangeAnswer ? [{ q: `${jockey.name}騎手の乗り替わりの成績は？`, a: rideChangeAnswer, lead: true }] : []),
    ...(wetAnswer ? [{ q: `${jockey.name}騎手は道悪（重馬場）が得意？`, a: wetAnswer, lead: true }] : []),
    ...(longshotAnswer ? [{ q: `${jockey.name}騎手は人気薄でも走る？`, a: longshotAnswer, lead: true }] : []),
    ...(localAnswer ? [{ q: `${jockey.name}騎手は中央とローカルどちらが得意？`, a: localAnswer, lead: true }] : []),
    ...(aimAnswer ? [{ q: `${jockey.name}騎手の狙い目の条件は？`, a: aimAnswer }] : []),
    { q: `${jockey.name}騎手の重賞成績は？`, a: gradedAnswer },
    ...(g1Answer ? [{ q: `${jockey.name}騎手のG1の勝ち鞍は？`, a: g1Answer }] : []),
    ...(sireAnswer ? [{ q: `${jockey.name}騎手と相性の良い種牡馬は？`, a: sireAnswer, links: topSires.filter((r: any) => r.link).map((r: any) => ({ name: r.name, href: r.link })) }] : []),
    { q: `${jockey.name}騎手の苦手な競馬場は？`, a: badRacecourseAnswer },
    { q: `${jockey.name}騎手の苦手なコースは？`, a: badCourseAnswer },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {enoughRaces && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJockeyJsonLd) }} />}
      <EntityRoot>
        <PageNav items={navItems} />
        <Hero
          crumb={{ label: '騎手一覧', href: '/jockeys' }}
          name={jockey.name}
          h1={WHO}
          h1s="の傾向・成績データ"
          lead={`${WHO}${affiliation || jockey.debut_year ? `（${[affiliation ? `${affiliation}所属` : '', jockey.debut_year ? `${jockey.debut_year}年デビュー` : ''].filter(Boolean).join('・')}）` : ''}の成績・データをまとめたページです。独自のデータベースで直近3年間・${jockey.total_races.toLocaleString('ja-JP')}レースのデータを集計し、毎週更新しています。`}
          kpi={kpi}
          kpiTable
          races={jockey.total_races}
          period={periodText}
          updated={jockey.last_updated}
          iso={dateIso}
          verdictTitle={`${WHO}の傾向`}
          verdict={enoughRaces ? [
            { label: '信頼度', pos: POS.rel, text: lbl('rel') },
            { label: '芝・ダート', pos: POS.sf, text: lbl('sf') },
            { label: '脚質', pos: POS.st, text: lbl('st') },
            { label: '距離', pos: POS.ds, text: lbl('ds') },
            ...shownTrends.map((k) => ({ label: TREND_VIEW[k].verdict, pos: jt[k]!.pos, text: jt[k]!.label })),
          ] : null}
        />
        {!enoughRaces && <ThinNote totalRaces={jockey.total_races} minRaces={MIN_RACES_FOR_TRENDS} hiddenItems="「騎手の傾向」「騎手の特徴」「注目ポイント」「データQ&A」" />}
        <Ad unit="dataTop" />

        <Sec id="profile-section" head={<Hno w={WHO} title="基本情報" />}>
          <InfoTable label={`${WHO}の基本情報`} items={tiles.filter((x) => x[1])} />
        </Sec>
        <Sec id="summary-section" head={<Hno w={WHO} title="データ概要" />}>
          <Summary blocks={summaryBlocks} links={summaryLinks} />
        </Sec>
        <Sec id="leading" head={<H w={WHO} title="年度別成績" sub="勝利数とリーディング順位（直近3年）" />}>
          <YearCharts lead={leadYears} ystat={ystat} />
        </Sec>
        {gradedWins.length > 0 && (
          <Sec id="graded-wins-section" head={<Hno w={WHO} title="重賞勝ち" sub="直近3年間・平地・新しい順" />}>
            <GradedWins
              wins={gradedWins}
              classStats={jockey.class_stats}
              fourth={['コース', (w) => <>{w.venue}{w.surface === 'ダート' ? 'ダ' : w.surface}<span className={cx('num')}>{w.distance}m</span></>]}
            />
          </Sec>
        )}
        {notableHorses.length > 0 && (
          <Sec id="horses-section" head={<Hno w={WHO} title="主なお手馬" sub="直近3年間に勝たせた馬。G1の勝利数→重賞の勝利数→勝利数の順" />}>
            <HorseList
              label={`${WHO}の主なお手馬`}
              initial={10}
              note="成績はこの騎手が乗ったレースのみ（直近3年間・JRA）"
              cols={[{ label: '馬名', m: 'm1' }, { label: '性・生年', m: 'm1b' }, { label: '騎乗成績', m: 'm2', num: true }, { label: '主な勝ち鞍', m: 'm3' }, { label: '父', m: 'm4', ml: '父' }]}
              rows={notableHorses.map((h: any) => [<b key="n">{h.horse_name}</b>, `${h.sex}・${h.birth_year ? `${h.birth_year}年生` : ''}`, `${h.races}戦${h.wins}勝`, <Titles key="t" list={formatTitles(h.titles)} />, h.father ?? '—'])}
            />
          </Sec>
        )}
        {enoughRaces && (
          <Sec id="characteristics" head={<Hno w={WHO} title="特徴" sub="判定と、その根拠になった数字" />}>
            <Meters
              note={shownTrends.length ? '※複勝率ランキングは1番人気が10走以上の騎手を対象　※道悪・乗り替わり・人気薄・ローカルは、乗った馬の人気（単勝オッズ）の偏りを補正して判定' : '※複勝率ランキングは1番人気が10走以上の騎手を対象'}
              items={[
                {
                  label: '人気時の信頼度', pos: POS.rel, result: lbl('rel'), scale: ['低い', '標準', '高い'],
                  ev: [['1番人気の複勝率', chars.fav1_place_rate], ['全騎手の平均', chars.all_fav1_place_rate, true]],
                  facts: (
                    <p className={cx('fx')}>
                      {chars.fav1_ranking > 0 && chars.total_jockeys > 0 && <span>複勝率ランキング <b className={cx('num')}>{chars.fav1_ranking}位/{chars.total_jockeys}人</b></span>}
                      {typeof chars.fav1_races === 'number' && <span>1番人気の騎乗数 <b className={cx('num')}>{chars.fav1_races.toLocaleString('ja-JP')}回</b></span>}
                    </p>
                  ),
                },
                { label: '得意なコース傾向', pos: POS.sf, result: lbl('sf'), scale: ['芝が得意', '差分なし', 'ダートが得意'], ev: sfSorted.map((x) => [`${x.surface} 複勝率`, x.place_rate] as [string, number]) },
                {
                  label: '得意な脚質傾向', pos: POS.st, result: lbl('st'), scale: ['逃げ・先行が得意', '差分なし', '差し・追込が得意'],
                  ev: [['逃げ・先行 複勝率', mergeRate(sOf('escape'), sOf('lead'))], ['差し・追込 複勝率', mergeRate(sOf('pursue'), sOf('close'))]],
                },
                {
                  label: '得意な距離傾向', pos: POS.ds, result: lbl('ds'), scale: ['短距離が得意', '差分なし', '長距離が得意'],
                  ev: [['短距離〜マイル 複勝率', mergeRate(dOf('短距離'), dOf('マイル'))], ['中距離〜長距離 複勝率', mergeRate(dOf('中距離'), dOf('長距離'))]],
                },
                ...shownTrends.map((k) => TREND_VIEW[k].meter(jt[k]!)),
              ]}
            />
          </Sec>
        )}
        {enoughRaces && (
          <Sec id="highlights-section" head={<Hno w={WHO} title="注目ポイント" sub="成績が目立つコース。コース名をタップすると詳細へ" />}>
            <Highlights courses={courseRows} urlOf={(c) => resolveCourseUrl(c)} shortOf={(c) => courseLabel(c, { withRacecourse: true, shortDirt: true })} />
          </Sec>
        )}
        {enoughRaces && aim.hi.length > 0 && (
          <Sec id="aim-section" head={<Hno w={WHO} title="狙い目・消し条件" sub={`直近3年間で${AIM_MIN}回以上騎乗した条件のうち、複勝回収率が高い条件・低い条件`} />}>
            <HorseList
              label={`${WHO}の狙い目・消し条件`}
              className="es-aim"
              initial={aim.hi.length + aim.lo.length}
              note="条件：競馬場・コース・距離・クラス・人気・枠・馬場・性別・調教師・種牡馬"
              cols={[{ label: '条件', m: 'm1' }, { label: '複勝回収率', m: 'm2', num: true }, { label: '単勝回収率', m: 'm4', ml: '単回', num: true }, { label: '複勝率', m: 'm4', ml: '複勝率', num: true }, { label: '騎乗数', m: 'm4', ml: '騎乗', num: true }]}
              rows={[...aim.hi.map((r) => ['狙い目', r] as const), ...aim.lo.map((r) => ['消し', r] as const)].map(([k, r]) => [
                <b key="c"><small className={cx('es-cp', k === '消し' && 'es-cpx')}>{k}</small>{r.label}</b>,
                `${r.place_payback.toFixed(0)}%`,
                `${r.win_payback.toFixed(0)}%`,
                `${r.place_rate.toFixed(1)}%`,
                `${r.races.toLocaleString('ja-JP')}回`,
              ])}
            />
          </Sec>
        )}
        {cond('class-stats', 'クラス別データ', classRows, { keyLabel: 'クラス' })}
        {cond('popularity-stats', '人気別データ', popRows, { keyLabel: '人気' }, '', false)}
        {rideRows.length > 0 && cond('ride-change-stats', '継続騎乗・乗り替わり別データ', rideRows, { keyLabel: '騎乗' }, '前走と同じ騎手か（平地のみ）。初騎乗＝この騎手が初めて乗る馬、再騎乗＝以前に乗ったことがある馬')}
        {cond('running-style-stats', '脚質別データ', styleRows, { keyLabel: '脚質', hint: <DefLink anchor="running-style" /> })}
        {cond('gate-stats', '枠順別データ', gRows, { keyLabel: '枠番' })}
        <Ad unit="dataMid" />
        {cond('distance-stats', '距離別データ', distRows, { keyLabel: '距離', hint: <DefLink anchor="distance" /> })}
        {cond('gender-stats', '性別データ', genderRows, { keyLabel: '性別' })}
        {cond('surface-stats', 'コース区分別データ', surfRows, { keyLabel: '区分' })}
        {cond('track-condition-stats', '馬場状態別データ', trackRows, { keyLabel: '馬場' }, '芝・ダート・障害 × 良・稍重・重・不良')}
        {cond('racecourse-stats', '競馬場別成績', rcRows, { keyLabel: '競馬場', summaryRows: rcSum })}
        <Sec id="course-stats" head={<H w={WHO} title="コース別成績" sub="競馬場をタップすると、コースごとの13項目を表示" />}>
          <CourseAcc courses={courseRows} urlOf={(c) => resolveCourseUrl(c)} labelOf={(c) => courseLabel(c)} />
        </Sec>
        {rankSec('trainer-stats', '調教師別データ', trainerList, '調教師', '※現役調教師のみ')}
        {sireList.length > 0 && rankSec('sire-stats', '種牡馬別データ', sireList, '種牡馬', '最大50件まで表示', '騎乗馬の父（種牡馬）別・勝利数順')}
        {rankSec('owner-stats', '馬主別データ', ownerList, '馬主', '最大50件まで表示')}
        <Ad unit="dataBottom" />
        {enoughRaces && (
          <Sec id="faq-section" head={<Head title="データQ&A" />}>
            <Faq items={faqItems} />
          </Sec>
        )}
        <About period={periodFromDataPeriod(jockey.data_period)} updated={jockey.last_updated} />
      </EntityRoot>
    </>
  );
}
