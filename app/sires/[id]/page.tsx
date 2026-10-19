import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSireDataFromGCS } from '@/lib/getSireDataFromGCS';
import TableOfContents from '@/components/TableOfContents';
import { ALL_SIRES } from '@/lib/sires';
import pageStyles from '@/app/static-page.module.css';
import AIBanner from '@/components/AIBanner';
import DataSourceNote from '@/components/DataSourceNote';
import { ALL_COURSES, getCourseUrl } from '@/lib/courses';
import { buildSireSummary } from '@/lib/dataPageText';
import { MIN_RACES_FOR_MENTION } from '@/lib/dataPageRules';
import { jaDateToIso, periodFromDataPeriod, buildWebPageJsonLd } from '@/lib/dataDate';
import { buildSireSummaryBlocks } from '@/lib/sireSummaryBlocks';
import cs from '@/components/course/course.module.css';
import CourseSectionNav from '@/components/course/CourseSectionNav';
import CourseFaq from '@/components/course/CourseFaq';
import RankingTable, { type RankingRow } from '@/components/course/RankingTable';
import { ConditionCard, RichText, type ConditionRow, type NameLink } from '@/components/course/CourseParts';
import xs from '@/components/datapage/sire/sire.module.css';
import SireLeadingChart from '@/components/datapage/sire/SireLeadingChart';
import {
  SireMeter, VerdictRow, SireStatsTable, SireConditionCard, CourseGroups, PickChips,
  type SireStatRow, type RacecourseCourseGroup,
} from '@/components/datapage/sire/SireParts';

// ISR: 週1回（604800秒）再生成
export const revalidate = 604800;

// generateStaticParams: 全種牡馬ページを事前生成
export async function generateStaticParams() {
  return ALL_SIRES.map((sire) => ({
    id: String(sire.id),
  }));
}

// 定義済みID以外のURLは404を返す（ソフト404の防止）
export const dynamicParams = false;

// generateMetadata: 動的メタデータ生成
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sireInfo = ALL_SIRES.find(s => s.id === parseInt(id));
  const sireName = sireInfo?.name || '種牡馬';

  // 検索語の上位は「〇〇産駒 特徴」「〇〇産駒 重馬場」のため、両方をタイトルの前半に入れる
  const title = `${sireName}産駒の特徴・傾向｜得意距離・コース・重馬場成績【毎週更新】`;
  const description = `${sireName}産駒の特徴を直近3年のデータで分析。芝・ダート、得意距離、競馬場別、重馬場・道悪の成績、母父別の相性まで。毎週更新。`;
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
  let sire;
  try {
    sire = await getSireDataFromGCS(id);

    // 必須フィールドの存在チェック
    if (!sire ||
        !Array.isArray(sire.yearly_stats) ||
        !Array.isArray(sire.distance_stats) ||
        !Array.isArray(sire.surface_stats) ||
        !Array.isArray(sire.track_condition_stats) ||
        !Array.isArray(sire.class_stats) ||
        !Array.isArray(sire.running_style_stats) ||
        !Array.isArray(sire.age_stats) ||
        !Array.isArray(sire.gender_stats) ||
        !Array.isArray(sire.dam_sire_stats) ||
        !Array.isArray(sire.course_stats) ||
        !Array.isArray(sire.racecourse_stats)) {
      console.error(`Incomplete data for sire ${id}`);
      notFound();
    }
  } catch (error) {
    console.error(`Failed to load sire data for ${id}:`, error);
    notFound();
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

  // 距離別データをテーブル形式に変換（GCSから取得したデータをそのまま使用）
  const allDistanceCategories = ['短距離', 'マイル', '中距離', '長距離'];
  const distanceStatsData = allDistanceCategories.map(category => {
    const existingData = sire.distance_stats.find(stat => stat.category === category);
    if (existingData) {
      return {
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
      return {
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

  // 距離別データを2グループに統合（特徴セクション用: 短〜マ と 中〜長）
  const mergedDistanceStats = (() => {
    const short = sire.distance_stats.find(s => s.category === '短距離');
    const mile = sire.distance_stats.find(s => s.category === 'マイル');
    const middle = sire.distance_stats.find(s => s.category === '中距離');
    const long = sire.distance_stats.find(s => s.category === '長距離');
    const merge = (d1: any, d2: any, label: string) => {
      if (!d1 && !d2) return null;
      if (!d1) return { ...d2, category: label, name: label };
      if (!d2) return { ...d1, category: label, name: label };
      const r = d1.races + d2.races;
      return {
        category: label, name: label,
        races: r, wins: d1.wins + d2.wins,
        places_2: d1.places_2 + d2.places_2, places_3: d1.places_3 + d2.places_3,
        win_rate: r > 0 ? ((d1.wins + d2.wins) / r) * 100 : 0,
        quinella_rate: r > 0 ? ((d1.wins + d2.wins + d1.places_2 + d2.places_2) / r) * 100 : 0,
        place_rate: r > 0 ? ((d1.wins + d2.wins + d1.places_2 + d2.places_2 + d1.places_3 + d2.places_3) / r) * 100 : 0,
        win_payback: r > 0 ? (d1.win_payback * d1.races + d2.win_payback * d2.races) / r : 0,
        place_payback: r > 0 ? (d1.place_payback * d1.races + d2.place_payback * d2.races) / r : 0,
      };
    };
    return [merge(short, mile, '短〜マ'), merge(middle, long, '中〜長')].filter(Boolean);
  })();

  // 母父統計にリンクを追加（ページが存在する種牡馬のみ）
  const damSireStatsWithLinks = sire.dam_sire_stats.map(stat => {
    const sireData = ALL_SIRES.find(s => s.name === stat.name);
    return {
      ...stat,
      link: sireData ? `/sires/${sireData.id}` : undefined
    };
  });

  // 芝・ダート別データをテーブル形式に変換（全カテゴリを表示）
  const allSurfaces = ['芝', 'ダート', '障害'];
  const surfaceStatsData = allSurfaces.map(surface => {
    const existingData = sire.surface_stats.find(stat => stat.surface === surface);
    return existingData ? {
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
    } : {
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
  });

  // 芝・ダート変わりデータ（GCSから取得、存在しない場合は空配列）
  const surfaceChangeStatsData = sire.surface_change_stats ? [
    {
      name: '芝→ダ',
      description: '芝デビュー後、初ダート時の成績',
      total_horses: sire.surface_change_stats.turf_to_dirt?.total_horses || 0,
      races: sire.surface_change_stats.turf_to_dirt?.races || 0,
      wins: sire.surface_change_stats.turf_to_dirt?.wins || 0,
      places_2: sire.surface_change_stats.turf_to_dirt?.places_2 || 0,
      places_3: sire.surface_change_stats.turf_to_dirt?.places_3 || 0,
      win_rate: sire.surface_change_stats.turf_to_dirt?.win_rate || 0,
      quinella_rate: sire.surface_change_stats.turf_to_dirt?.quinella_rate || 0,
      place_rate: sire.surface_change_stats.turf_to_dirt?.place_rate || 0,
      win_payback: sire.surface_change_stats.turf_to_dirt?.win_payback || 0,
      place_payback: sire.surface_change_stats.turf_to_dirt?.place_payback || 0,
      avg_popularity: sire.surface_change_stats.turf_to_dirt?.avg_popularity,
      avg_rank: sire.surface_change_stats.turf_to_dirt?.avg_rank,
      median_popularity: sire.surface_change_stats.turf_to_dirt?.median_popularity,
      median_rank: sire.surface_change_stats.turf_to_dirt?.median_rank,
    },
    {
      name: 'ダ→芝',
      description: 'ダートデビュー後、初芝時の成績',
      total_horses: sire.surface_change_stats.dirt_to_turf?.total_horses || 0,
      races: sire.surface_change_stats.dirt_to_turf?.races || 0,
      wins: sire.surface_change_stats.dirt_to_turf?.wins || 0,
      places_2: sire.surface_change_stats.dirt_to_turf?.places_2 || 0,
      places_3: sire.surface_change_stats.dirt_to_turf?.places_3 || 0,
      win_rate: sire.surface_change_stats.dirt_to_turf?.win_rate || 0,
      quinella_rate: sire.surface_change_stats.dirt_to_turf?.quinella_rate || 0,
      place_rate: sire.surface_change_stats.dirt_to_turf?.place_rate || 0,
      win_payback: sire.surface_change_stats.dirt_to_turf?.win_payback || 0,
      place_payback: sire.surface_change_stats.dirt_to_turf?.place_payback || 0,
      avg_popularity: sire.surface_change_stats.dirt_to_turf?.avg_popularity,
      avg_rank: sire.surface_change_stats.dirt_to_turf?.avg_rank,
      median_popularity: sire.surface_change_stats.dirt_to_turf?.median_popularity,
      median_rank: sire.surface_change_stats.dirt_to_turf?.median_rank,
    },
  ] : [];

  // 馬場状態別データ（全カテゴリを表示）
  const allTrackConditions = [
    { condition: 'good', condition_label: '良' },
    { condition: 'yielding', condition_label: '稍重' },
    { condition: 'soft', condition_label: '重' },
    { condition: 'heavy', condition_label: '不良' }
  ];

  const turfConditionStatsData = allTrackConditions.map(({ condition, condition_label }) => {
    const existingData = sire.track_condition_stats.find(
      s => s.surface === '芝' && s.condition === condition
    );
    return existingData || {
      surface: '芝',
      condition,
      condition_label,
      races: 0,
      wins: 0,
      places_2: 0,
      places_3: 0,
      win_rate: 0,
      place_rate: 0,
      quinella_rate: 0,
      win_payback: 0,
      place_payback: 0,
      avg_popularity: undefined,
      avg_rank: undefined,
      median_popularity: undefined,
      median_rank: undefined,
    };
  });

  const dirtConditionStatsData = allTrackConditions.map(({ condition, condition_label }) => {
    const existingData = sire.track_condition_stats.find(
      s => s.surface === 'ダート' && s.condition === condition
    );
    return existingData || {
      surface: 'ダート',
      condition,
      condition_label,
      races: 0,
      wins: 0,
      places_2: 0,
      places_3: 0,
      win_rate: 0,
      place_rate: 0,
      quinella_rate: 0,
      win_payback: 0,
      place_payback: 0,
      avg_popularity: undefined,
      avg_rank: undefined,
      median_popularity: undefined,
      median_rank: undefined,
    };
  });

  // 芝の馬場状態データを2グループに統合（良、稍〜不）
  const mergedTurfConditionStats = (() => {
    const good = turfConditionStatsData.find(s => s.condition === 'good');
    const yielding = turfConditionStatsData.find(s => s.condition === 'yielding');
    const soft = turfConditionStatsData.find(s => s.condition === 'soft');
    const heavy = turfConditionStatsData.find(s => s.condition === 'heavy');

    const mergeConditions = (items: any[], label: string) => {
      const conditions = items.filter(Boolean);
      if (conditions.length === 0) return null;
      const totalRaces = conditions.reduce((sum, c) => sum + c.races, 0);
      const totalWins = conditions.reduce((sum, c) => sum + c.wins, 0);
      const totalPlaces2 = conditions.reduce((sum, c) => sum + c.places_2, 0);
      const totalPlaces3 = conditions.reduce((sum, c) => sum + c.places_3, 0);
      return {
        condition_label: label,
        races: totalRaces, wins: totalWins, places_2: totalPlaces2, places_3: totalPlaces3,
        win_rate: totalRaces > 0 ? (totalWins / totalRaces) * 100 : 0,
        quinella_rate: totalRaces > 0 ? ((totalWins + totalPlaces2) / totalRaces) * 100 : 0,
        place_rate: totalRaces > 0 ? ((totalWins + totalPlaces2 + totalPlaces3) / totalRaces) * 100 : 0,
        win_payback: totalRaces > 0 ? conditions.reduce((sum, c) => sum + (c.win_payback * c.races), 0) / totalRaces : 0,
        place_payback: totalRaces > 0 ? conditions.reduce((sum, c) => sum + (c.place_payback * c.races), 0) / totalRaces : 0,
      };
    };

    const goodCondition = good ? { ...good, condition_label: '良' } : null;
    const badConditions = mergeConditions([yielding, soft, heavy], '稍〜不');

    return [goodCondition, badConditions].filter(Boolean);
  })();

  // ダートの馬場状態データを2グループに統合（良、稍〜不）
  const mergedDirtConditionStats = (() => {
    const good = dirtConditionStatsData.find(s => s.condition === 'good');
    const yielding = dirtConditionStatsData.find(s => s.condition === 'yielding');
    const soft = dirtConditionStatsData.find(s => s.condition === 'soft');
    const heavy = dirtConditionStatsData.find(s => s.condition === 'heavy');

    const mergeConditions = (items: any[], label: string) => {
      const conditions = items.filter(Boolean);
      if (conditions.length === 0) return null;
      const totalRaces = conditions.reduce((sum, c) => sum + c.races, 0);
      const totalWins = conditions.reduce((sum, c) => sum + c.wins, 0);
      const totalPlaces2 = conditions.reduce((sum, c) => sum + c.places_2, 0);
      const totalPlaces3 = conditions.reduce((sum, c) => sum + c.places_3, 0);
      return {
        condition_label: label,
        races: totalRaces, wins: totalWins, places_2: totalPlaces2, places_3: totalPlaces3,
        win_rate: totalRaces > 0 ? (totalWins / totalRaces) * 100 : 0,
        quinella_rate: totalRaces > 0 ? ((totalWins + totalPlaces2) / totalRaces) * 100 : 0,
        place_rate: totalRaces > 0 ? ((totalWins + totalPlaces2 + totalPlaces3) / totalRaces) * 100 : 0,
        win_payback: totalRaces > 0 ? conditions.reduce((sum, c) => sum + (c.win_payback * c.races), 0) / totalRaces : 0,
        place_payback: totalRaces > 0 ? conditions.reduce((sum, c) => sum + (c.place_payback * c.races), 0) / totalRaces : 0,
      };
    };

    const goodCondition = good ? { ...good, condition_label: '良' } : null;
    const badConditions = mergeConditions([yielding, soft, heavy], '稍〜不');

    return [goodCondition, badConditions].filter(Boolean);
  })();

  // GCSから計算済みの傾向データを取得
  const surfaceTrendPosition = sire.characteristics?.surface_trend_position ?? 3;
  const runningStyleTrendPosition = sire.characteristics?.running_style_trend_position ?? 3;
  const distanceTrendPosition = sire.characteristics?.distance_trend_position ?? 3;

  // 芝馬場状態別傾向を計算（良 vs 稍重・重・不良の複勝率差から判定）
  const turfGoodConditions = sire.track_condition_stats.filter(s =>
    s.surface === '芝' && s.condition === 'good'
  );
  const turfBadConditions = sire.track_condition_stats.filter(s =>
    s.surface === '芝' && (s.condition === 'yielding' || s.condition === 'soft' || s.condition === 'heavy')
  );

  let turfConditionTrendPosition = 3; // デフォルトは互角
  if (turfGoodConditions.length > 0 && turfBadConditions.length > 0) {
    // 加重平均で複勝率を計算（出走数で重み付け）
    const goodTotalRaces = turfGoodConditions.reduce((sum, s) => sum + s.races, 0);
    const goodWeightedPlaceRate = turfGoodConditions.reduce((sum, s) =>
      sum + (s.place_rate * s.races), 0
    ) / goodTotalRaces;

    const badTotalRaces = turfBadConditions.reduce((sum, s) => sum + s.races, 0);
    const badWeightedPlaceRate = turfBadConditions.reduce((sum, s) =>
      sum + (s.place_rate * s.races), 0
    ) / badTotalRaces;

    const diff = goodWeightedPlaceRate - badWeightedPlaceRate;
    if (diff >= 5) turfConditionTrendPosition = 1; // 良馬場が得意
    else if (diff >= 2) turfConditionTrendPosition = 2; // やや良馬場が得意
    else if (diff <= -5) turfConditionTrendPosition = 5; // 重馬場が得意
    else if (diff <= -2) turfConditionTrendPosition = 4; // やや重馬場が得意
    else turfConditionTrendPosition = 3; // 互角
  }

  // ダート馬場状態別傾向を計算（良 vs 稍重・重・不良の複勝率差から判定）
  const dirtGoodConditions = sire.track_condition_stats.filter(s =>
    s.surface === 'ダート' && s.condition === 'good'
  );
  const dirtBadConditions = sire.track_condition_stats.filter(s =>
    s.surface === 'ダート' && (s.condition === 'yielding' || s.condition === 'soft' || s.condition === 'heavy')
  );

  let dirtConditionTrendPosition = 3; // デフォルトは互角
  if (dirtGoodConditions.length > 0 && dirtBadConditions.length > 0) {
    // 加重平均で複勝率を計算（出走数で重み付け）
    const goodTotalRaces = dirtGoodConditions.reduce((sum, s) => sum + s.races, 0);
    const goodWeightedPlaceRate = dirtGoodConditions.reduce((sum, s) =>
      sum + (s.place_rate * s.races), 0
    ) / goodTotalRaces;

    const badTotalRaces = dirtBadConditions.reduce((sum, s) => sum + s.races, 0);
    const badWeightedPlaceRate = dirtBadConditions.reduce((sum, s) =>
      sum + (s.place_rate * s.races), 0
    ) / badTotalRaces;

    const diff = goodWeightedPlaceRate - badWeightedPlaceRate;
    if (diff >= 5) dirtConditionTrendPosition = 1; // 良馬場が得意
    else if (diff >= 2) dirtConditionTrendPosition = 2; // やや良馬場が得意
    else if (diff <= -5) dirtConditionTrendPosition = 5; // 重馬場が得意
    else if (diff <= -2) dirtConditionTrendPosition = 4; // やや重馬場が得意
    else dirtConditionTrendPosition = 3; // 互角
  }

  // 馬場状態別データをテーブル形式に変換（全ての馬場状態を表示）
  const trackConditionSurfaces = ['芝', 'ダート', '障害'];
  const trackConditions = [
    { condition: 'good', condition_label: '良', short_label: '良' },
    { condition: 'yielding', condition_label: '稍重', short_label: '稍' },
    { condition: 'soft', condition_label: '重', short_label: '重' },
    { condition: 'heavy', condition_label: '不良', short_label: '不' }
  ];

  const trackConditionStatsData = trackConditionSurfaces.flatMap(surface => {
    return trackConditions.map(({ condition, condition_label, short_label }) => {
      const existingData = sire.track_condition_stats.find(
        stat => stat.surface === surface && stat.condition === condition
      );

      const shortSurface = surface === 'ダート' ? 'ダ' : surface === '障害' ? '障' : surface;

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

  // クラス別データをテーブル形式に変換（順位なし）
  // クラス別データ（全クラスを表示）
  const allClasses = ['新馬', '未勝利', '1勝', '2勝', '3勝', 'オープン', 'G3', 'G2', 'G1'];
  const classStatsData = allClasses.map((className, index) => {
    const existingData = sire.class_stats.find(stat => stat.class_name === className);
    return existingData ? {
      rank: existingData.rank || index + 1,
      class_name: existingData.class_name,
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
    } : {
      rank: index + 1,
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
      avg_popularity: undefined,
      avg_rank: undefined,
      median_popularity: undefined,
      median_rank: undefined,
    };
  });

  // 枠順別データ（GateTableコンポーネント側で全枠表示）

  // 脚質別データ（全脚質を表示）
  const allRunningStyles = [
    { style: 'escape', style_label: '逃げ' },
    { style: 'lead', style_label: '先行' },
    { style: 'pursue', style_label: '差し' },
    { style: 'close', style_label: '追込' }
  ];
  const runningStyleStatsData = allRunningStyles.map(({ style, style_label }) => {
    const existingData = sire.running_style_stats.find(stat => stat.style === style);
    return existingData || {
      style,
      style_label,
      races: 0,
      wins: 0,
      places_2: 0,
      places_3: 0,
      win_rate: 0,
      place_rate: 0,
      quinella_rate: 0,
      win_payback: 0,
      place_payback: 0,
      avg_popularity: undefined,
      avg_rank: undefined,
      median_popularity: undefined,
      median_rank: undefined,
    };
  });

  // 馬齢別データ（全馬齢を表示）
  const allAges = ['2歳', '3歳', '4歳', '5歳', '6歳-'];
  const ageStatsData = allAges.map(age => {
    const existingData = sire.age_stats.find(stat => stat.age === age);
    return existingData || {
      age,
      races: 0,
      wins: 0,
      places_2: 0,
      places_3: 0,
      win_rate: 0,
      place_rate: 0,
      quinella_rate: 0,
      win_payback: 0,
      place_payback: 0,
      avg_popularity: undefined,
      avg_rank: undefined,
      median_popularity: undefined,
      median_rank: undefined,
    };
  });

  // 馬体重別データ（全カテゴリを表示）
  const allWeightCategories = [
    '400kg以下',
    '401-420kg',
    '421-440kg',
    '441-460kg',
    '461-480kg',
    '481-500kg',
    '501-520kg',
    '521-540kg',
    '541kg以上'
  ];
  const horseWeightStatsData = allWeightCategories.map(category => {
    const existingData = sire.horse_weight_stats?.find(stat => stat.weight_category === category);
    return existingData || {
      weight_category: category,
      races: 0,
      wins: 0,
      places_2: 0,
      places_3: 0,
      win_rate: 0,
      place_rate: 0,
      quinella_rate: 0,
      win_payback: 0,
      place_payback: 0,
      avg_popularity: undefined,
      avg_rank: undefined,
      median_popularity: undefined,
      median_rank: undefined,
    };
  });

  // 性別データ（全性別を表示）
  const allGenders = ['牡馬', '牝馬', 'セン馬'];
  const genderStatsData = allGenders.map(gender => {
    const existingData = sire.gender_stats.find(stat => stat.name === gender);
    if (existingData) {
      return {
        name: existingData.name,
        races: existingData.races,
        wins: existingData.wins,
        places_2: existingData.places_2,
        places_3: existingData.places_3,
        win_rate: existingData.win_rate,
        place_rate: existingData.place_rate,
        quinella_rate: existingData.quinella_rate,
        win_payback: existingData.win_payback,
        place_payback: existingData.place_payback,
        avg_popularity: existingData.avg_popularity,
        avg_rank: existingData.avg_rank,
        median_popularity: existingData.median_popularity,
        median_rank: existingData.median_rank,
      };
    }
    return {
      name: gender,
      races: 0,
      wins: 0,
      places_2: 0,
      places_3: 0,
      win_rate: 0,
      place_rate: 0,
      quinella_rate: 0,
      win_payback: 0,
      place_payback: 0,
      avg_popularity: undefined,
      avg_rank: undefined,
      median_popularity: undefined,
      median_rank: undefined,
    };
  });

  // 関連リンク用: 実在するコースページのURL
  const courseUrls = new Set(ALL_COURSES.map((c) => getCourseUrl(c)));

  // DataTableコンポーネント用にデータ整形（linkプロパティを追加）
  // 障害コースを除外
  const courseTableData = sire.course_stats
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

  // 競馬場別サマリーデータをracecourse_statsから取得（全競馬場を表示）
  // GCSから右回り・左回り・中央・ローカルの集計行も取得
  const rightTurnData = sire.racecourse_stats.find(r => r.racecourse_en === 'right_turn');
  const leftTurnData = sire.racecourse_stats.find(r => r.racecourse_en === 'left_turn');
  const centralData = sire.racecourse_stats.find(r => r.racecourse_en === 'central');
  const localData = sire.racecourse_stats.find(r => r.racecourse_en === 'local');

  const racecourseSummaryData = racecourseOrder
    .map(racecourseItem => {
      const racecourse = sire.racecourse_stats.find(r => r.racecourse_en === racecourseItem.en);
      // 競馬場名から「競馬場」をカット
      const displayName = racecourseItem.ja.replace('競馬場', '');

      if (!racecourse) {
        // データがない場合は0で埋める
        return {
          name: displayName,
          racecourse_ja: racecourseItem.ja,
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
        name: displayName,
        racecourse_ja: racecourse.racecourse_ja,
        racecourse_en: racecourse.racecourse_en,
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

  // 競馬場データの最後に右回り・左回り・中央・ローカルを追加（GCSから取得）
  const racecourseSummaryDataWithTotals = [
    ...racecourseSummaryData,
    ...(rightTurnData ? [rightTurnData] : []),
    ...(leftTurnData ? [leftTurnData] : []),
    ...(centralData ? [centralData] : []),
    ...(localData ? [localData] : [])
  ];

  // ===== データQ&A 回答生成 =====
  const formatSireCourseName = (c: { racecourse: string; surface_en: string; distance: number; variant?: string }) => {
    const rc = c.racecourse.replace('競馬場', '');
    const surf = c.surface_en === 'turf' ? '芝' : c.surface_en === 'dirt' ? 'ダート' : '障害';
    const variant = c.variant === 'inner' || c.variant === '内' ? '内回り' : c.variant === 'outer' || c.variant === '外' ? '外回り' : '';
    return `${rc}${surf}${c.distance}m${variant}`;
  };
  const stripBoldSire = (text: string) => text.replace(/\*\*([^*]+)\*\*/g, '$1');

  // 得意な競馬場 / 苦手な競馬場
  const sireRacecourseQualified = (sire.racecourse_stats ?? [])
    .filter((r: any) => r.name !== '中央' && r.name !== 'ローカル' && r.races >= 20);
  const sireGoodRacecourseAnswer = (() => {
    if (sireRacecourseQualified.length === 0) return '対象となる競馬場が存在しません。\n※直近3年間で20走以上を対象としています。';
    const rcName = (r: any) => r.name.endsWith('競馬場') ? r.name : `${r.name}競馬場`;
    const byWin = [...sireRacecourseQualified].sort((a: any, b: any) => b.win_rate - a.win_rate).slice(0, 3)
      .map((r: any) => `${rcName(r)}（**${r.win_rate.toFixed(1)}%**）`).join('、');
    const byPlace = [...sireRacecourseQualified].sort((a: any, b: any) => b.place_rate - a.place_rate).slice(0, 3)
      .map((r: any) => `${rcName(r)}（**${r.place_rate.toFixed(1)}%**）`).join('、');
    return [
      byWin ? `勝率が高い競馬場TOP3は${byWin}です。` : '',
      byPlace ? `複勝率が高い競馬場TOP3は${byPlace}です。` : '',
      '※直近3年間で20走以上を対象としています。',
    ].filter(Boolean).join('\n');
  })();
  const sireBadRacecourseAnswer = (() => {
    if (sireRacecourseQualified.length === 0) return '対象となる競馬場が存在しません。\n※直近3年間で20走以上を対象としています。';
    const rcName = (r: any) => r.name.endsWith('競馬場') ? r.name : `${r.name}競馬場`;
    const byWin = [...sireRacecourseQualified].sort((a: any, b: any) => a.win_rate - b.win_rate).slice(0, 3)
      .map((r: any) => `${rcName(r)}（**${r.win_rate.toFixed(1)}%**）`).join('、');
    const byPlace = [...sireRacecourseQualified].sort((a: any, b: any) => a.place_rate - b.place_rate).slice(0, 3)
      .map((r: any) => `${rcName(r)}（**${r.place_rate.toFixed(1)}%**）`).join('、');
    return [
      byWin ? `勝率が低い競馬場TOP3は${byWin}です。` : '',
      byPlace ? `複勝率が低い競馬場TOP3は${byPlace}です。` : '',
      '※直近3年間で20走以上を対象としています。',
    ].filter(Boolean).join('\n');
  })();

  // 得意なコース / 苦手なコース
  const sireCourseQualified = (sire.course_stats ?? []).filter((c: any) => c.races >= 10 && c.surface_en !== 'obstacle');
  const sireGoodCourseAnswer = (() => {
    if (sireCourseQualified.length === 0) return '対象となるコースが存在しません。\n※直近3年間で10走以上を対象としています。';
    const byWin = [...sireCourseQualified].sort((a: any, b: any) => b.win_rate - a.win_rate).slice(0, 3)
      .map((c: any) => `${formatSireCourseName(c)}（**${c.win_rate.toFixed(1)}%**）`).join('、');
    const byPlace = [...sireCourseQualified].sort((a: any, b: any) => b.place_rate - a.place_rate).slice(0, 3)
      .map((c: any) => `${formatSireCourseName(c)}（**${c.place_rate.toFixed(1)}%**）`).join('、');
    return [
      byWin ? `勝率が高いコースTOP3は${byWin}です。` : '',
      byPlace ? `複勝率が高いコースTOP3は${byPlace}です。` : '',
      '※直近3年間で10走以上を対象としています。',
    ].filter(Boolean).join('\n');
  })();
  const sireBadCourseAnswer = (() => {
    if (sireCourseQualified.length === 0) return '対象となるコースが存在しません。\n※直近3年間で10走以上を対象としています。';
    const byWin = [...sireCourseQualified].sort((a: any, b: any) => a.win_rate - b.win_rate).slice(0, 3)
      .map((c: any) => `${formatSireCourseName(c)}（**${c.win_rate.toFixed(1)}%**）`).join('、');
    const byPlace = [...sireCourseQualified].sort((a: any, b: any) => a.place_rate - b.place_rate).slice(0, 3)
      .map((c: any) => `${formatSireCourseName(c)}（**${c.place_rate.toFixed(1)}%**）`).join('、');
    return [
      byWin ? `勝率が低いコースTOP3は${byWin}です。` : '',
      byPlace ? `複勝率が低いコースTOP3は${byPlace}です。` : '',
      '※直近3年間で10走以上を対象としています。',
    ].filter(Boolean).join('\n');
  })();

  // 芝とダートどちらが得意？
  const sireTurfStat = sire.surface_stats.find((s: any) => s.surface === '芝');
  const sireDirtStat = sire.surface_stats.find((s: any) => s.surface === 'ダート');
  const sireSurfaceFaqAnswer = (() => {
    if (!sireTurfStat && !sireDirtStat) return '対象となるデータが存在しません。';
    if (!sireTurfStat) return `ダートの成績のみあります。ダートの複勝率は**${sireDirtStat!.place_rate.toFixed(1)}%**です。`;
    if (!sireDirtStat) return `芝の成績のみあります。芝の複勝率は**${sireTurfStat.place_rate.toFixed(1)}%**です。`;
    const diff = sireTurfStat.place_rate - sireDirtStat.place_rate;
    const detail = `芝の複勝率は**${sireTurfStat.place_rate.toFixed(1)}%**、ダートは**${sireDirtStat.place_rate.toFixed(1)}%**です。`;
    if (diff >= 5) return `芝の方が得意な傾向があります。\n${detail}`;
    if (diff >= 3) return `やや芝の方が得意な傾向があります。\n${detail}`;
    if (diff <= -5) return `ダートの方が得意な傾向があります。\n${detail}`;
    if (diff <= -3) return `ややダートの方が得意な傾向があります。\n${detail}`;
    return `芝とダートで差はありません。\n${detail}`;
  })();

  // 得意な距離は？
  const sireDistanceCategoryFullName = (cat: string) =>
    cat === '短〜マ' ? '短距離〜マイル' : cat === '中〜長' ? '中距離〜長距離' : cat;
  const sireDistanceFaqAnswer = (() => {
    const groups = mergedDistanceStats as any[];
    if (groups.length === 0) return '対象となるデータが存在しません。';
    const best = [...groups].sort((a, b) => b.place_rate - a.place_rate)[0];
    const other = groups.find(g => g.category !== best.category);
    const diff = other ? best.place_rate - other.place_rate : 0;
    const detail = groups.map(g => `${sireDistanceCategoryFullName(g.category)}の複勝率は**${g.place_rate.toFixed(1)}%**`).join('、');
    const conclusion = diff >= 5
      ? `${sireDistanceCategoryFullName(best.category)}が得意な傾向があります。`
      : diff >= 3
      ? `やや${sireDistanceCategoryFullName(best.category)}が得意な傾向があります。`
      : '距離帯で差はありません。';
    return [conclusion, `${detail}です。`].join('\n');
  })();

  // 馬場適性（芝・ダート両方）
  const sireTrackConditionFaqAnswer = (() => {
    const turfGood = (mergedTurfConditionStats as any[]).find(s => s.condition_label === '良');
    const turfBad = (mergedTurfConditionStats as any[]).find(s => s.condition_label === '稍〜不');
    const dirtGood = (mergedDirtConditionStats as any[]).find(s => s.condition_label === '良');
    const dirtBad = (mergedDirtConditionStats as any[]).find(s => s.condition_label === '稍〜不');

    const conditionText = (good: any, bad: any, surface: string) => {
      if (!good && !bad) return null;
      const detail = [
        good ? `良馬場の複勝率は**${good.place_rate.toFixed(1)}%**` : '',
        bad ? `稍〜不良馬場は**${bad.place_rate.toFixed(1)}%**` : '',
      ].filter(Boolean).join('、');
      if (!good || !bad) return `${surface}：${detail}です。`;
      const diff = good.place_rate - bad.place_rate;
      const trend = diff >= 5 ? `**${surface}は良馬場の方が得意な傾向があります。**`
        : diff >= 3 ? `**${surface}はやや良馬場の方が得意な傾向があります。**`
        : diff <= -5 ? `**${surface}は道悪の方が得意な傾向があります。**`
        : diff <= -3 ? `**${surface}はやや道悪の方が得意な傾向があります。**`
        : `**${surface}は馬場状態による差はありません。**`;
      const rainNote = diff <= -5 ? `雨が降った馬場では有利になる傾向があります。`
        : diff <= -3 ? `雨が降った馬場ではやや有利になる傾向があります。`
        : diff >= 5 ? `雨が降った馬場では割引が必要です。`
        : diff >= 3 ? `雨が降った馬場ではやや割引が必要です。`
        : '';
      return [trend, `${detail}です。`, rainNote].filter(Boolean).join('\n');
    };

    const turfText = conditionText(turfGood, turfBad, '芝');
    const dirtText = conditionText(dirtGood, dirtBad, 'ダート');
    if (!turfText && !dirtText) return '対象となるデータが存在しません。';
    return [turfText, dirtText].filter(Boolean).join('\n\n');
  })();

  // FAQ構造化データ
  const faqSireJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { question: `${sire.name}産駒の得意な競馬場は？`, answer: sireGoodRacecourseAnswer },
      { question: `${sire.name}産駒の得意なコースは？`, answer: sireGoodCourseAnswer },
      { question: `${sire.name}産駒は芝とダートどちらが得意？`, answer: sireSurfaceFaqAnswer },
      { question: `${sire.name}産駒の得意な距離は？`, answer: sireDistanceFaqAnswer },
      { question: `${sire.name}産駒の馬場適性は？`, answer: sireTrackConditionFaqAnswer },
      { question: `${sire.name}産駒の苦手な競馬場は？`, answer: sireBadRacecourseAnswer },
      { question: `${sire.name}産駒の苦手なコースは？`, answer: sireBadCourseAnswer },
    ].map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: stripBoldSire(answer) },
    })),
  };

  // ナビゲーションアイテム
  const navigationItems = [
    { id: 'summary-section', label: 'データ概要' },
    { id: 'characteristics', label: '特徴' },
    { id: 'highlights-section', label: '注目ポイント' },
    { id: 'leading', label: '年度別' },
    { id: 'class-stats', label: 'クラス別' },
    { id: 'running-style-stats', label: '脚質別' },
    { id: 'gate-stats', label: '枠順別' },
    { id: 'distance-stats', label: '距離別' },
    { id: 'gender-stats', label: '性別' },
    { id: 'age-stats', label: '馬齢別' },
    { id: 'horse-weight-stats', label: '馬体重別' },
    { id: 'surface-stats', label: '芝・ダート別' },
    { id: 'surface-change-stats', label: '芝・ダート変わり' },
    { id: 'track-condition-stats', label: '馬場状態別' },
    { id: 'racecourse-stats', label: '競馬場別' },
    { id: 'course-stats', label: 'コース別' },
    { id: 'dam-sire-stats', label: '母父別' },
    { id: 'faq-section', label: 'データQ&A' },
  ];

  // 構造化データ - WebPage（データ更新日を dateModified で明示）
  const webPageJsonLd = buildWebPageJsonLd({
    url: `https://www.keibadata.com/sires/${id}`,
    name: `${sire.name}産駒の成績データ`,
    description: `${sire.name}産駒の直近3年間の成績を、コース・距離・馬場状態・馬齢・母父別などで集計したデータページ`,
    dateModified: jaDateToIso(sire.last_updated),
  });

  // 構造化データ - BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://www.keibadata.com' },
      { '@type': 'ListItem', position: 2, name: '種牡馬一覧', item: 'https://www.keibadata.com/sires' },
      { '@type': 'ListItem', position: 3, name: sire.name, item: `https://www.keibadata.com/sires/${id}` },
    ],
  };

  // ===== 表示用データ（docs/redesign のデザイン） =====
  const periodText = periodFromDataPeriod(sire.data_period);
  const dateModifiedIso = jaDateToIso(sire.last_updated);

  // 判定（1〜5）と表示名
  const clampPos = (v: number) => Math.min(5, Math.max(1, Math.round(v) || 3));
  const surfacePos = clampPos(surfaceTrendPosition);
  const distancePos = clampPos(distanceTrendPosition);
  const turfPos = clampPos(turfConditionTrendPosition);
  const dirtPos = clampPos(dirtConditionTrendPosition);
  const surfaceTrendText = ['芝が得意', 'やや芝が得意', '差分なし', 'ややダートが得意', 'ダートが得意'][surfacePos - 1];
  const distanceTrendText = ['短距離が得意', 'やや短距離が得意', '差分なし', 'やや長距離が得意', '長距離が得意'][distancePos - 1];
  const conditionTexts = ['良馬場が得意', 'やや良馬場が得意', '差分なし', 'やや重馬場が得意', '重馬場が得意'];

  // 判定の根拠の数値（出走がなければ「-」）
  const rateOf = (row: any) => (row && row.races > 0 ? `${Number(row.place_rate).toFixed(1)}%` : '-');
  const shortMile = (mergedDistanceStats as any[]).find((d) => d.category === '短〜マ');
  const middleLong = (mergedDistanceStats as any[]).find((d) => d.category === '中〜長');
  const turfGoodRow = (mergedTurfConditionStats as any[]).find((d) => d.condition_label === '良');
  const turfBadRow = (mergedTurfConditionStats as any[]).find((d) => d.condition_label === '稍〜不');
  const dirtGoodRow = (mergedDirtConditionStats as any[]).find((d) => d.condition_label === '良');
  const dirtBadRow = (mergedDirtConditionStats as any[]).find((d) => d.condition_label === '稍〜不');

  // 枠番の色（背景はデータの色、文字色は背景に合わせる。データがない枠はトンマナの枠番色）
  const frameColors = ['#FFFFFF', '#222222', '#D32F2F', '#2459B5', '#F7D85D', '#28854A', '#E58A35', '#F0A5C5'];
  const gateFg: Record<number, string> = { 1: '#222222', 5: '#222222', 7: '#222222' };
  const gateRows: ConditionRow[] = [1, 2, 3, 4, 5, 6, 7, 8].map((gateNum) => {
    const g: any = (sire.gate_stats ?? []).find((d: any) => d.gate === gateNum) ?? {
      gate: gateNum, races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, quinella_rate: 0, place_rate: 0, win_payback: 0, place_payback: 0,
    };
    const bg = typeof g.color === 'string' && g.color.startsWith('#') ? g.color : frameColors[gateNum - 1];
    return { ...g, label: `${gateNum}枠`, gate: { number: gateNum, bg, fg: gateFg[gateNum] ?? '#FFFFFF' } };
  });

  // 条件別の行（行数・並びは現行の表と同じ）
  const yearlyRows: ConditionRow[] = yearlyStatsData.map((r: any) => ({ ...r, label: `${r.year}年` }));
  const classOrder = ['G1', 'G2', 'G3', 'オープン', '3勝', '2勝', '1勝', '未勝利', '新馬'];
  const classRows: ConditionRow[] = classOrder
    .map((name) => classStatsData.find((c) => c.class_name === name))
    .filter(Boolean)
    .map((r: any) => ({ ...r, label: r.class_name }));
  const styleRows: ConditionRow[] = runningStyleStatsData.map((r: any) => ({ ...r, label: r.style_label }));
  const distanceRows: ConditionRow[] = distanceStatsData.map((r: any) => ({ ...r, label: r.category }));
  const genderRows: ConditionRow[] = genderStatsData.map((r: any) => ({ ...r, label: r.name }));
  const ageRows: ConditionRow[] = ageStatsData.map((r: any) => ({ ...r, label: r.age }));
  const weightRows: ConditionRow[] = horseWeightStatsData.map((r: any) => ({
    ...r,
    label: String(r.weight_category ?? '').replace(/kg/g, ''),
  }));
  const surfaceRows: ConditionRow[] = surfaceStatsData.map((r: any) => ({ ...r, label: r.name }));
  const surfaceChangeRows: ConditionRow[] = surfaceChangeStatsData.map((r: any) => ({ ...r, label: r.name }));
  const trackRows: ConditionRow[] = trackConditionStatsData.map((r: any) => ({ ...r, label: r.name }));
  const summaryNames = ['右回り', '左回り', '中央', 'ローカル'];
  const racecourseRows: SireStatRow[] = racecourseSummaryDataWithTotals.map((r: any) => ({
    ...r,
    label: r.name,
    summary: summaryNames.includes(r.name),
  }));

  // コース別（競馬場ごと）。リンクはページが存在するコースだけに付ける
  const courseGroups: RacecourseCourseGroup[] = coursesByRacecourse.map((g) => ({
    racecourse_ja: g.racecourse_ja,
    racecourse_en: g.racecourse_en,
    rows: g.courses.map((c: any) => ({
      ...c,
      label: String(c.name).replace(g.racecourse_ja, '').trim().replace(/\s+/g, ''),
      link: courseUrls.has(c.link) ? c.link : undefined,
    })),
  }));

  // 注目ポイント：得意なコース・苦手なコース（出走10回以上・複勝率順。判定条件は現行どおり）
  const shortCourseName = (name: string) =>
    name.replace(/競馬場/g, '').replace(/\s+/g, '').replace(/ダート/g, 'ダ').replace(/（外回り）/g, '外').replace(/（内回り）/g, '内');
  const highlightBase = [...courseTableData.filter((c: any) => c.races >= 10)].sort((a: any, b: any) => b.place_rate - a.place_rate);
  const toHighlightRow = (c: any): SireStatRow => ({
    ...c,
    label: shortCourseName(String(c.name)),
    link: courseUrls.has(c.link) ? c.link : undefined,
  });
  const goodCourses = highlightBase.slice(0, 5).map(toHighlightRow);
  const badCourses = highlightBase.slice(-5).reverse().map(toHighlightRow);
  const hasHighlights = goodCourses.length > 0 || badCourses.length > 0;

  // データ概要：見出し付きのブロック。名前は詳細ページへリンク
  const summaryBlocks = buildSireSummaryBlocks(sire.name, buildSireSummary(sire as any));
  const linkedCourses = courseTableData.filter((c: { link: string }) => courseUrls.has(c.link));
  const summaryLinks: Partial<Record<string, NameLink[]>> = {
    racecourse: linkedCourses.map((c: any) => ({ name: c.name, href: c.link })),
    damSire: damSireStatsWithLinks.filter((d: any) => d.link).map((d: any) => ({ name: d.name, href: d.link })),
  };

  // 関連データ（現行の RelatedLinks と同じ選び方：リンク先あり・20走以上・複勝率上位5件）
  const pickTop = (rows: any[]) =>
    rows
      .filter((r) => r.link && r.name && (r.races ?? 0) >= MIN_RACES_FOR_MENTION)
      .sort((a, b) => (b.place_rate ?? 0) - (a.place_rate ?? 0))
      .slice(0, 5);
  const relatedGroups = [
    {
      heading: '得意なコース（複勝率上位）',
      items: pickTop(linkedCourses).map((r) => ({ href: r.link, label: String(r.name ?? '').replace('競馬場', '').replace(/\s+/g, ''), rate: r.place_rate })),
    },
    {
      heading: '相性の良い母父',
      items: pickTop(damSireStatsWithLinks).map((r) => ({ href: r.link, label: r.name, rate: r.place_rate })),
    },
  ].filter((g) => g.items.length > 0);

  // 年度別グラフ（古い順。データがない年も含める）
  const leadingData = [currentYear - 2, currentYear - 1, currentYear].map(
    (year) => sire.yearly_leading.find((stat: any) => stat.year === year) || { year, wins: 0, ranking: 0 }
  );

  // ページ内ナビ（チップの表示名は短く、id は目次と共通）
  const chipLabels: Record<string, string> = {
    'summary-section': '概要', leading: '年度別', characteristics: '特徴', 'highlights-section': '注目',
    'class-stats': 'クラス別', 'running-style-stats': '脚質別', 'gate-stats': '枠順別', 'distance-stats': '距離別',
    'gender-stats': '性別', 'age-stats': '馬齢別', 'horse-weight-stats': '馬体重別', 'surface-stats': '芝・ダ別',
    'surface-change-stats': '芝ダ変わり', 'track-condition-stats': '馬場状態', 'racecourse-stats': '競馬場別',
    'course-stats': 'コース別', 'dam-sire-stats': '母父別', 'faq-section': 'Q&A',
  };
  const presentNavItems = navigationItems.filter(
    (item) => (item.id !== 'highlights-section' || hasHighlights) && (item.id !== 'surface-change-stats' || surfaceChangeStatsData.length > 0)
  );
  const chipItems = presentNavItems.map((item) => ({ id: item.id, label: chipLabels[item.id] ?? item.label }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSireJsonLd) }}
      />
      <div className={cs.canvas}>
      <div className={pageStyles.staticPageContainer}>
        <div className={pageStyles.staticPageColumns3}>
          {/* 左サイドバー */}
          <aside className={pageStyles.staticPageLeftSidebar}>
            <AIBanner />
          </aside>

          <article>
            {/* パンくずリスト */}
            <nav className={cs.crumb} aria-label="パンくず">
              <Link href="/">HOME</Link>
              <span aria-hidden="true">/</span>
              <Link href="/sires">種牡馬一覧</Link>
              <span aria-hidden="true">/</span>
              <span>{sire.name}</span>
            </nav>

            {/* 冒頭 */}
            <div className={cs.hero}>
              <div className={cs.badges}>
                <span className={cs.badge}>種牡馬</span>
              </div>
              <h1 className={cs.title}>{sire.name}産駒の特徴・傾向</h1>
              <p className={cs.lead}>
                {sire.name}産駒の成績・データをまとめたページです。独自のデータベースで直近3年間・{sire.total_races.toLocaleString()}レースのデータを集計し、毎週更新しています。
              </p>
              <div className={cs.meta}>
                <span>集計 <b>{periodText ?? '直近3年間分'}</b></span>
                <span>対象 <b>{sire.total_races.toLocaleString()}レース</b></span>
                <span>更新 <b><time dateTime={dateModifiedIso}>{sire.last_updated}</time></b></span>
              </div>
            </div>

            {/* 結論カード */}
            <div className={`${cs.card} ${cs.verdict}`}>
              <div className={cs.vHead}>
                <h2>{sire.name}産駒の傾向</h2>
                <span className={cs.note}>{sire.total_races.toLocaleString()}レース</span>
              </div>
              <div className={cs.vRows}>
                <VerdictRow label="芝・ダート" value={surfacePos} result={surfaceTrendText} href="#characteristics" />
                <VerdictRow label="距離" value={distancePos} result={distanceTrendText} href="#characteristics" />
                <VerdictRow label="芝の馬場" value={turfPos} result={conditionTexts[turfPos - 1]} href="#characteristics" />
                <VerdictRow label="ダートの馬場" value={dirtPos} result={conditionTexts[dirtPos - 1]} href="#characteristics" />
              </div>
            </div>

            <CourseSectionNav items={chipItems} />

            {/* データ概要（固有解説文）と関連データ */}
            <section id="summary-section" className={cs.section} aria-label="データの概要">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒のデータ概要</h2></div>
              <div className={`${cs.card} ${cs.article}`}>
                {summaryBlocks.map((block, i) => (
                  <div key={`${block.key}-${i}`} className={cs.blk}>
                    {block.title && <h3>{block.title}</h3>}
                    <p><RichText text={block.text} links={summaryLinks[block.key]} /></p>
                  </div>
                ))}
                {relatedGroups.map((g) => (
                  <nav key={g.heading} className={cs.blk} aria-label={`${sire.name}産駒の関連データ：${g.heading}`}>
                    <h3>{g.heading}</h3>
                    <ul className={xs.relList}>
                      {g.items.map((item) => (
                        <li key={item.href}>
                          <Link href={item.href} className={cs.textLink}>{item.label}</Link>
                          <small>複勝率{Number(item.rate).toFixed(1)}%</small>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ))}
              </div>
            </section>

            {/* 特徴 */}
            <section id="characteristics" className={cs.section} aria-label="種牡馬特徴">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒の特徴</h2><p>判定と、その根拠になった複勝率</p></div>
              <div className={cs.card}>
                <SireMeter
                  label="得意なコース傾向"
                  result={surfaceTrendText}
                  value={surfacePos}
                  scale={['芝が得意', '差分なし', 'ダートが得意']}
                  pair={[['芝 複勝率', rateOf(sireTurfStat)], ['ダート 複勝率', rateOf(sireDirtStat)]]}
                >
                  <details className={`${cs.more} ${xs.rule}`}>
                    <summary>判定の基準</summary>
                    <div className={xs.ruleBody}>
                      <p>芝とダートの複勝率を比較し、得意なコース傾向を判定しています。</p>
                      <ul>
                        <li>芝の複勝率がダートより5%以上高い：芝が得意</li>
                        <li>芝の複勝率がダートより2%以上高い：やや芝が得意</li>
                        <li>複勝率の差がほぼない：差分なし</li>
                        <li>ダートの複勝率が芝より2%以上高い：ややダートが得意</li>
                        <li>ダートの複勝率が芝より5%以上高い：ダートが得意</li>
                      </ul>
                    </div>
                  </details>
                </SireMeter>
                <SireMeter
                  label="得意な距離傾向"
                  result={distanceTrendText}
                  value={distancePos}
                  scale={['短距離が得意', '差分なし', '長距離が得意']}
                  pair={[['短距離〜マイル 複勝率', rateOf(shortMile)], ['中距離〜長距離 複勝率', rateOf(middleLong)]]}
                >
                  <details className={`${cs.more} ${xs.rule}`}>
                    <summary>判定の基準・距離の定義</summary>
                    <div className={xs.ruleBody}>
                      <p>短距離・マイルと中距離・長距離の複勝率を比較し、得意な距離傾向を判定しています。</p>
                      <ul>
                        <li>短距離・マイルの複勝率が中距離・長距離より5%以上高い：短距離が得意</li>
                        <li>短距離・マイルの複勝率が中距離・長距離より2%以上高い：やや短距離が得意</li>
                        <li>複勝率の差がほぼない：差分なし</li>
                        <li>中距離・長距離の複勝率が短距離・マイルより2%以上高い：やや長距離が得意</li>
                        <li>中距離・長距離の複勝率が短距離・マイルより5%以上高い：長距離が得意</li>
                      </ul>
                      <DistanceDefinitionList />
                    </div>
                  </details>
                </SireMeter>
                <SireMeter
                  label="得意な馬場傾向 - 芝"
                  result={conditionTexts[turfPos - 1]}
                  value={turfPos}
                  scale={['良馬場が得意', '差分なし', '重馬場が得意']}
                  pair={[['良 複勝率', rateOf(turfGoodRow)], ['稍重〜不良 複勝率', rateOf(turfBadRow)]]}
                >
                  <ConditionRule />
                </SireMeter>
                <SireMeter
                  label="得意な馬場傾向 - ダート"
                  result={conditionTexts[dirtPos - 1]}
                  value={dirtPos}
                  scale={['良馬場が得意', '差分なし', '重馬場が得意']}
                  pair={[['良 複勝率', rateOf(dirtGoodRow)], ['稍重〜不良 複勝率', rateOf(dirtBadRow)]]}
                >
                  <ConditionRule />
                </SireMeter>
              </div>
            </section>

            {/* 注目ポイント（得意・苦手なコース） */}
            {hasHighlights && (
              <section id="highlights-section" className={cs.section} aria-label="注目ポイント">
                <div className={cs.sh}>
                  <h2 className={cs.h2}>注目ポイント</h2>
                  <p>{sire.name}産駒の成績が目立つコース。名前をタップするとコースの詳細へ</p>
                </div>
                <div className={cs.legend}>
                  <span><i style={{ borderColor: '#5FC28A' }} />得意</span>
                  <span><i style={{ borderColor: '#D98A9E' }} />苦手</span>
                </div>
                <div className={`${cs.card} ${xs.pickCard}`}>
                  <div className={cs.grp}>
                    <span className={cs.gl}>{sire.name}産駒が得意なコース TOP5</span>
                    <PickChips items={goodCourses.map((r) => ({ name: r.label, link: r.link }))} kind="good" />
                  </div>
                  <div className={cs.grp}>
                    <span className={cs.gl}>{sire.name}産駒が苦手なコース TOP5</span>
                    <PickChips items={badCourses.map((r) => ({ name: r.label, link: r.link }))} kind="bad" />
                  </div>
                  <details className={cs.more}>
                    <summary>
                      全項目を見る<small>13項目・横にスクロール</small>
                    </summary>
                    <h3 className={xs.subTitle}>得意なコース TOP5</h3>
                    <SireStatsTable rows={goodCourses} keyLabel="コース" noHighlight />
                    <h3 className={xs.subTitle}>苦手なコース TOP5</h3>
                    <SireStatsTable rows={badCourses} keyLabel="コース" noHighlight />
                  </details>
                  <p className={cs.note}>※出走回数10回以上のコースを対象に、複勝率で評価しています</p>
                </div>
              </section>
            )}

            {/* 年度別成績 */}
            <section id="leading" className={cs.section} aria-label="年度別成績">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 年度別成績</h2></div>
              <div className={cs.card}>
                <SireLeadingChart data={leadingData} />
                <details className={cs.more}>
                  <summary>
                    全項目を見る<small>13項目・横にスクロール</small>
                  </summary>
                  <SireStatsTable rows={yearlyRows as SireStatRow[]} keyLabel="年度" />
                </details>
              </div>
            </section>

            {/* 条件別 */}
            <section id="class-stats" className={cs.section} aria-label="クラス別データ">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 クラス別データ</h2></div>
              <ConditionCard rows={classRows} keyLabel="クラス" />
            </section>
            <section id="running-style-stats" className={cs.section} aria-label="脚質別データ">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 脚質別データ</h2></div>
              <ConditionCard
                rows={styleRows}
                keyLabel="脚質"
                extra={
                  <details className={cs.more}>
                    <summary>脚質の定義</summary>
                    <ul className={cs.def}>
                      <li><b>逃げ</b>コーナーのいずれかが1位通過</li>
                      <li><b>先行</b>最終コーナーで第1集団</li>
                      <li><b>差し</b>最終コーナーで第2集団かつ上がりが3位以内</li>
                      <li><b>追込</b>最終コーナーで第3集団かつ上がりが3位以内</li>
                    </ul>
                    <p className={cs.note} style={{ marginBottom: 12 }}>出走頭数を3で割ったものを第1集団〜第3集団とし、上記に該当しない場合は集計から除外しています。</p>
                  </details>
                }
              />
            </section>
            <section id="gate-stats" className={cs.section} aria-label="枠順別データ">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 枠順別データ</h2></div>
              <ConditionCard rows={gateRows} keyLabel="枠番" />
            </section>
            <section id="distance-stats" className={cs.section} aria-label="距離別データ">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 距離別データ</h2></div>
              <ConditionCard
                rows={distanceRows}
                keyLabel="距離"
                extra={
                  <details className={cs.more}>
                    <summary>距離の定義</summary>
                    <div className={xs.ruleBody}>
                      <DistanceDefinitionList />
                    </div>
                  </details>
                }
              />
            </section>
            <section id="gender-stats" className={cs.section} aria-label="性別データ">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 性別データ</h2></div>
              <ConditionCard rows={genderRows} keyLabel="性別" />
            </section>
            <section id="age-stats" className={cs.section} aria-label="馬齢別データ">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 馬齢別データ</h2></div>
              <ConditionCard rows={ageRows} keyLabel="馬齢" />
            </section>
            <section id="horse-weight-stats" className={cs.section} aria-label="馬体重別データ">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 馬体重別データ</h2><p>馬体重（kg）別</p></div>
              <ConditionCard rows={weightRows} keyLabel="馬体重" />
            </section>
            <section id="surface-stats" className={cs.section} aria-label="芝・ダート別データ">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 芝・ダート別データ</h2></div>
              <ConditionCard rows={surfaceRows} keyLabel="馬場" />
            </section>
            {surfaceChangeStatsData.length > 0 && (
              <section id="surface-change-stats" className={cs.section} aria-label="芝・ダート変わりデータ">
                <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 芝・ダート変わりデータ</h2></div>
                <ConditionCard
                  rows={surfaceChangeRows}
                  keyLabel="区分"
                  extra={
                    <p className={cs.note} style={{ marginTop: 8 }}>
                      ※芝→ダ：芝デビュー後、初めてダートに挑戦した際の成績<br />
                      ※ダ→芝：ダートデビュー後、初めて芝に挑戦した際の成績
                    </p>
                  }
                />
              </section>
            )}
            <section id="track-condition-stats" className={cs.section} aria-label="馬場状態別データ">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 馬場状態別データ</h2><p>芝・ダート・障害 × 良・稍重・重・不良</p></div>
              <ConditionCard rows={trackRows} keyLabel="馬場状態" />
            </section>
            <section id="racecourse-stats" className={cs.section} aria-label="競馬場別データ">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 競馬場別データ</h2><p>表の最後に右回り・左回り・中央・ローカルの集計</p></div>
              <SireConditionCard rows={racecourseRows} keyLabel="競馬場" />
            </section>

            {/* コース別（競馬場ごとに開閉） */}
            <section id="course-stats" className={cs.section} aria-label="コース別データ">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 コース別データ</h2><p>競馬場をタップすると、コースごとの13項目の表を開きます</p></div>
              <CourseGroups groups={courseGroups} />
            </section>

            {/* 母父別（現行仕様：10件＋さらに表示で最大50件） */}
            <section id="dam-sire-stats" className={cs.section} aria-label="母父別データ">
              <div className={cs.sh}><h2 className={cs.h2}>{sire.name}産駒 母父別データ</h2><p>勝利数順</p></div>
              <RankingTable rows={damSireStatsWithLinks as RankingRow[]} nameLabel="母父" note="最大50件まで表示" />
            </section>

            {/* データQ&A */}
            <section id="faq-section" className={cs.section} aria-label="データQ&A">
              <div className={cs.sh}><h2 className={cs.h2}>データQ&amp;A</h2></div>
              <div className={cs.card}>
                <CourseFaq items={[
                  { question: `${sire.name}産駒の得意な競馬場は？`, answer: sireGoodRacecourseAnswer },
                  { question: `${sire.name}産駒の得意なコースは？`, answer: sireGoodCourseAnswer },
                  { question: `${sire.name}産駒は芝とダートどちらが得意？`, answer: sireSurfaceFaqAnswer, boldFirstLine: true },
                  { question: `${sire.name}産駒の得意な距離は？`, answer: sireDistanceFaqAnswer, boldFirstLine: true },
                  { question: `${sire.name}産駒の馬場適性は？`, answer: sireTrackConditionFaqAnswer, boldFirstLine: true },
                  { question: `${sire.name}産駒の苦手な競馬場は？`, answer: sireBadRacecourseAnswer },
                  { question: `${sire.name}産駒の苦手なコースは？`, answer: sireBadCourseAnswer },
                ]} />
              </div>
            </section>

            {/* データの出典・集計方法 */}
            <div className={cs.section}>
              <DataSourceNote periodText={periodText} lastUpdated={sire.last_updated} className={cs.about} />
            </div>
          </article>

          {/* PC用：右サイドバー目次 */}
          <TableOfContents items={presentNavItems} />
        </div>
      </div>
      </div>
    </>
  );
}

// 距離の定義（データ生成時の区分：gcs/v2/generate_sires.py の get_distance_stats）
function DistanceDefinitionList() {
  return (
    <>
      <p><b>距離の定義</b></p>
      <ul>
        <li>短距離：1000m〜1400m</li>
        <li>マイル：1401m〜1800m</li>
        <li>中距離：1801m〜2100m</li>
        <li>長距離：2101m〜</li>
      </ul>
    </>
  );
}

// 馬場状態の判定基準（芝・ダート共通）
function ConditionRule() {
  return (
    <details className={`${cs.more} ${xs.rule}`}>
      <summary>判定の基準</summary>
      <div className={xs.ruleBody}>
        <p>良馬場と稍重・重・不良馬場の複勝率を比較し、得意な馬場状態を判定しています。</p>
        <ul>
          <li>良馬場の複勝率が稍重〜不良馬場より5%以上高い：良馬場が得意</li>
          <li>良馬場の複勝率が稍重〜不良馬場より2%以上高い：やや良馬場が得意</li>
          <li>複勝率の差がほぼない：差分なし</li>
          <li>稍重〜不良馬場の複勝率が良馬場より2%以上高い：やや重馬場が得意</li>
          <li>稍重〜不良馬場の複勝率が良馬場より5%以上高い：重馬場が得意</li>
        </ul>
      </div>
    </details>
  );
}
