import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getSireDataFromGCS } from '@/lib/getSireDataFromGCS';
import { ALL_SIRES } from '@/lib/sires';
import { resolveCourseUrl, courseLabel } from '@/lib/courseLinks';
import { buildSireSummaryKeyed } from '@/lib/dataPageText';
import { MIN_RACES_FOR_TRENDS, hasEnoughRaces, THIN_PAGE_ROBOTS } from '@/lib/dataPageRules';
import { jaDateToIso, periodFromDataPeriod, buildWebPageJsonLd } from '@/lib/dataDate';
import { buildSireSummaryBlocks } from '@/lib/sireSummaryBlocks';
import { sireDescription } from '@/lib/metaDescriptions';
import { bestBand, buildSireLead, formatTitles, buildSireBandAnswer, buildSireGrowthAnswer, buildProgenyAnswer, gradedTotals, thisYearOf, type NotableHorse, type SireProfile, type GrowthRate } from '@/lib/entityExtras';
import {
  About, Ad, BestNote, Cnt, CourseAcc, DefLink, EntityRoot, Faq, GTag, H, Head, Highlights, Hero, Hno, HorseList, MaybeLink, Meters,
  PageNav, Pn, Sec, SfTag, Stats, Subs, Summary, ThinNote, Tiles, Titles, gateRows as toGateRows, sfKey,
  type CourseRow, type NameLink,
} from '@/components/v6/entity/parts';
import { Butterfly, CondBars, FigRow, LineChart, YearCharts } from '@/components/v6/entity/charts';
import { R, ZERO, fill, int, pct, type Row } from '@/components/v6/entity/format';
import type { StatsProps } from '@/components/v6/entity/Stats';
import { cx } from '@/components/v6/entity/cx';

// 旧部品の行の型（集計の途中で使う）
type ConditionRow = any;

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
  const url = `https://www.keibadata.com/sires/${id}`;

  // 対象レース数が少ないページは傾向判定を出さず、インデックスもさせない（コースページと同じ方針）
  let thin = false;
  let sireData: any = null;
  try {
    sireData = await getSireDataFromGCS(id);
    thin = !hasEnoughRaces(sireData?.total_races);
  } catch {
    thin = false;
  }
  // 検索結果で他の種牡馬と見分けられるよう、得意条件・重馬場の数値を入れる
  const description = sireDescription(sireName, sireData);

  return {
    title,
    description,
    ...(thin ? { robots: THIN_PAGE_ROBOTS } : {}),
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

  // コース別成績：実在するコースページだけにリンクする（内回り・外回りはコース名の「内」「外」から解決）
  const courseTableData = sire.course_stats
    .map((stat: any) => ({
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

  // 検索意図に合わせた追加項目（gcs/v2/generate_extras.py）：基本情報・代表産駒・芝ダート別の距離帯・馬齢別
  const sireProfile: SireProfile | null = (sire as any).profile ?? null;
  const notableProgeny: NotableHorse[] = (sire as any).notable_progeny ?? [];
  const distanceSurface: { turf?: any[]; dirt?: any[] } = (sire as any).distance_surface_stats ?? {};
  const growthRates: GrowthRate[] = (sire as any).growth_rates ?? [];
  const sireGraded = gradedTotals(sire.class_stats as any);
  const sireThisYear = thisYearOf(sire.yearly_leading as any);
  const sireBandAnswer = buildSireBandAnswer(sire.name, distanceSurface.turf, distanceSurface.dirt);
  const sireGrowthAnswer = buildSireGrowthAnswer(sire.name, growthRates);
  const sireProgenyAnswer = buildProgenyAnswer(sire.name, notableProgeny);
  const turfBandRows: ConditionRow[] = (distanceSurface.turf ?? []).map((r: any) => ({ ...r, label: r.category }));
  const dirtBandRows: ConditionRow[] = (distanceSurface.dirt ?? []).map((r: any) => ({ ...r, label: r.category }));
  const hasBandRows = turfBandRows.length > 0 || dirtBandRows.length > 0;

  // FAQ構造化データ
  const faqSireJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { question: `${sire.name}産駒の得意な競馬場は？`, answer: sireGoodRacecourseAnswer },
      { question: `${sire.name}産駒の得意なコースは？`, answer: sireGoodCourseAnswer },
      { question: `${sire.name}産駒は芝とダートどちらが得意？`, answer: sireSurfaceFaqAnswer },
      { question: `${sire.name}産駒の得意な距離は？`, answer: sireDistanceFaqAnswer },
      ...(sireBandAnswer ? [{ question: `${sire.name}産駒の芝・ダートそれぞれの得意距離は？`, answer: sireBandAnswer }] : []),
      { question: `${sire.name}産駒の馬場適性は？`, answer: sireTrackConditionFaqAnswer },
      ...(sireGrowthAnswer ? [{ question: `${sire.name}産駒は早熟？晩成？`, answer: sireGrowthAnswer }] : []),
      ...(sireProgenyAnswer ? [{ question: `${sire.name}の代表産駒は？`, answer: sireProgenyAnswer }] : []),
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
    { id: 'profile-section', label: '基本情報' },
    { id: 'summary-section', label: 'データ概要' },
    { id: 'leading', label: '年度別' },
    { id: 'progeny-section', label: '代表産駒' },
    { id: 'characteristics', label: '特徴' },
    { id: 'highlights-section', label: '注目ポイント' },
    { id: 'class-stats', label: 'クラス別' },
    { id: 'running-style-stats', label: '脚質別' },
    { id: 'gate-stats', label: '枠順別' },
    { id: 'distance-stats', label: '距離別' },
    { id: 'distance-surface-stats', label: '芝・ダート別の距離' },
    { id: 'gender-stats', label: '性別' },
    { id: 'age-stats', label: '馬齢別' },
    { id: 'horse-weight-stats', label: '馬体重別' },
    { id: 'surface-stats', label: '芝・ダート別' },
    { id: 'surface-change-stats', label: '芝・ダート変わり' },
    { id: 'track-condition-stats', label: '重馬場・馬場状態別' },
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

  // ===== 表示（リデザイン v6。見本 docs/redesign/src/pages/sire.mjs と同じ並び・同じ整形） =====
  const periodText = periodFromDataPeriod(sire.data_period) ?? '直近3年間分';
  const dateIso = jaDateToIso(sire.last_updated);
  const n: string = sire.name;
  const W = `${n}産駒`;
  // 対象レース数が少ないページは傾向判定・特徴・注目ポイント・データQ&Aを出さない（現行どおり）
  const enoughRaces = hasEnoughRaces(sire.total_races);

  // 判定（1〜5）と表示名
  const clampPos = (v: number) => Math.min(5, Math.max(1, Math.round(v) || 3));
  const surfacePos = clampPos(surfaceTrendPosition);
  const distancePos = clampPos(distanceTrendPosition);
  const turfPos = clampPos(turfConditionTrendPosition);
  const dirtPos = clampPos(dirtConditionTrendPosition);
  const surfaceTrendText = ['芝が得意', 'やや芝が得意', '差分なし', 'ややダートが得意', 'ダートが得意'][surfacePos - 1];
  const distanceTrendText = ['短距離が得意', 'やや短距離が得意', '差分なし', 'やや長距離が得意', '長距離が得意'][distancePos - 1];
  const CT = ['良馬場が得意', 'やや良馬場が得意', '差分なし', 'やや重馬場が得意', '重馬場が得意'];

  // 良馬場と道悪（稍重〜不良）
  const condOf = (merged: any[]) => {
    const good = merged.find((d) => d.condition_label === '良') ?? ZERO;
    const bad = merged.find((d) => d.condition_label === '稍〜不') ?? ZERO;
    return { good, bad };
  };
  const turfCond = condOf(mergedTurfConditionStats as any[]);
  const dirtCond = condOf(mergedDirtConditionStats as any[]);
  const md = (c: string) => (mergedDistanceStats as any[]).find((x) => x.category === c);
  const turf = sire.surface_stats.find((r: any) => r.surface === '芝');
  const dirt = sire.surface_stats.find((r: any) => r.surface === 'ダート');
  const ev = (pairs: [string, any][]): [string, number][] => pairs.filter(([, r]) => r && r.races > 0).map(([l, r]) => [`${l} 複勝率`, r.place_rate]);

  // データ概要（先頭に結論の1文。コース名・母父名は詳細ページへリンク）
  const summaryBlocks = buildSireSummaryBlocks(buildSireSummaryKeyed(sire as any));
  if (enoughRaces) {
    summaryBlocks.unshift({
      key: 'lead',
      text: buildSireLead({
        name: n,
        profile: sireProfile,
        surfaceTrendText,
        distanceTrendText,
        bestTurf: bestBand(distanceSurface.turf),
        bestDirt: bestBand(distanceSurface.dirt),
        progeny: notableProgeny,
      }),
    });
  }
  const allCourses = sire.course_stats as CourseRow[];
  const summaryLinks: Partial<Record<string, NameLink[]>> = {
    racecourse: allCourses.map((c) => ({ name: c.name, href: resolveCourseUrl(c) ?? '' })).filter((l) => l.href),
    damSire: damSireStatsWithLinks.filter((d: any) => d.link).map((d: any) => ({ name: d.name, href: d.link })),
  };

  // 基本情報（父・母父は JRA-VAN の繁殖馬データ）
  const p: SireProfile = sireProfile ?? {};
  const hasProfileTiles = Boolean(p.father || p.damsire);
  const tiles: [string, ReactNode, ReactNode?][] = [
    ['父', p.father ?? '', ''],
    ['母父', p.damsire ?? '', ''],
    ['生年', p.birth_year ? `${p.birth_year}年` : '', ''],
    ['生産', p.birthplace ? `${p.birthplace}${p.imported ? '（輸入）' : ''}` : '', ''],
    ...(sireThisYear ? [[`${sireThisYear.year}年の勝利数`, <><Cnt v={sireThisYear.wins} />勝</>, sireThisYear.ranking > 0 ? `リーディング${sireThisYear.ranking}位` : ''] as [string, ReactNode, ReactNode]] : []),
    ['産駒の重賞勝ち', <><Cnt v={sireGraded.wins} />勝</>, `集計期間・G1 ${sireGraded.g1}勝`],
  ];

  // 年度別（図は古い順、表は新しい順）
  const YEAR = dateIso ? Number(dateIso.slice(0, 4)) : currentYear;
  const years = [YEAR - 2, YEAR - 1, YEAR];
  const ystat = years.map((y) => ({ ...ZERO, ...(sire.yearly_stats.find((r: any) => r.year === y) ?? {}), year: y }));
  const leadYears = years.map((y) => sire.yearly_leading.find((r: any) => r.year === y) ?? { year: y, wins: 0, ranking: 0 });

  // 条件別の行（並び・件数は現行どおり）
  const classRows = ['G1', 'G2', 'G3', 'オープン', '3勝', '2勝', '1勝', '未勝利', '新馬'].map((c) =>
    R(sire.class_stats.find((x: any) => x.class_name === c), /^G\d$/.test(c) ? <GTag g={c} /> : c, c));
  const styleRows = fill(['escape', 'lead', 'pursue', 'close'], sire.running_style_stats, (r: any) => r.style, (k) => ({ escape: '逃げ', lead: '先行', pursue: '差し', close: '追込' } as Record<string, string>)[k]);
  const gRows = toGateRows(sire.gate_stats);
  const distRows = fill(['短距離', 'マイル', '中距離', '長距離'], sire.distance_stats, (r: any) => r.category);
  const band = (rows: any[] | undefined): Row[] => (rows ?? []).map((r) => R(r, <span className={cx('num')}>{r.category}</span>, r.category));
  const turfBand = band(distanceSurface.turf);
  const dirtBand = band(distanceSurface.dirt);
  const genderRows = fill(['牡馬', '牝馬', 'セン馬'], sire.gender_stats, (r: any) => r.name);
  const ageRows = fill(['2歳', '3歳', '4歳', '5歳', '6歳-'], sire.age_stats, (r: any) => r.age);
  const weightRows = fill(['400kg以下', '401-420kg', '421-440kg', '441-460kg', '461-480kg', '481-500kg', '501-520kg', '521-540kg', '541kg以上'], sire.horse_weight_stats ?? [], (r: any) => r.weight_category, (k) => k.replace(/kg/g, ''));
  const SF3: [string, string][] = [['芝', 'turf'], ['ダート', 'dirt'], ['障害', 'steeplechase']];
  const surfRows = SF3.map(([ja, en]) => R(sire.surface_stats.find((x: any) => x.surface === ja), <SfTag sf={sfKey(en)} />, ja));
  const sc = sire.surface_change_stats;
  const changeRows = sc ? [R(sc.turf_to_dirt, '芝→ダ'), R(sc.dirt_to_turf, 'ダ→芝')] : [];
  const COND: [string, string][] = [['good', '良'], ['yielding', '稍'], ['soft', '重'], ['heavy', '不']];
  const trackRows = SF3.flatMap(([ja, en]) =>
    COND.map(([c, cl]) =>
      R(sire.track_condition_stats.find((r: any) => r.surface === ja && r.condition === c), <><SfTag sf={sfKey(en)} /><span className={cx('tc')}>{cl}</span></>, `${ja === 'ダート' ? 'ダ' : ja === '障害' ? '障' : ja}・${cl}`)));
  const RCS: [string, string][] = [['sapporo', '札幌'], ['hakodate', '函館'], ['fukushima', '福島'], ['niigata', '新潟'], ['tokyo', '東京'], ['nakayama', '中山'], ['chukyo', '中京'], ['kyoto', '京都'], ['hanshin', '阪神'], ['kokura', '小倉']];
  const rcRows = RCS.map(([en, ja]) => R(sire.racecourse_stats.find((r: any) => r.racecourse_en === en), ja));
  const rcSum = ['right_turn', 'left_turn', 'central', 'local']
    .map((en) => sire.racecourse_stats.find((r: any) => r.racecourse_en === en))
    .filter(Boolean)
    .map((r: any) => R(r, <b>{r.name}</b>, r.name));
  // 母父別：勝利数の多い順（同数は出走数の多い順）に並べ直し、順位は1から振り直す（オーナー指示。元データは出走数順）
  const damRows: Row[] = [...damSireStatsWithLinks]
    .sort((x: any, y: any) => y.wins - x.wins || y.races - x.races)
    .map((r: any, i: number) => ({ ...R(r, <MaybeLink href={r.link}>{r.name}</MaybeLink>, r.name), rowKey: `${r.name}-${i}` }));
  const flat = (rows: Row[]) => rows.filter((r) => !/^障/.test(r.text)); // 「最も高い」の対象から障害を外す

  // 図（同じ JSON の数字だけを使う）
  const ds = distanceSurface;
  const bOf = (rows: any[] | undefined, c: string) => (rows ?? []).find((r) => r.category === c);
  const bands = [...new Set([...(ds.turf ?? []), ...(ds.dirt ?? [])].map((r: any) => r.category as string))];
  const figBands = (
    <Butterfly
      title="芝とダートの距離帯別 複勝率"
      label={`${W}の距離帯別の複勝率：${bands.map((c) => `${c} 芝${bOf(ds.turf, c) ? pct(bOf(ds.turf, c).place_rate) : 'なし'}・ダート${bOf(ds.dirt, c) ? pct(bOf(ds.dirt, c).place_rate) : 'なし'}`).join('、')}`}
      rows={bands.map((c) => ({ label: c, l: bOf(ds.turf, c)?.place_rate, ln: bOf(ds.turf, c)?.races, r: bOf(ds.dirt, c)?.place_rate, rn: bOf(ds.dirt, c)?.races }))}
      foot="棒が長いほど複勝率が高い距離帯。太字は芝とダートで高い方です"
    />
  );
  const cg = (c: { good: any; bad: any }) => [{ label: '良', v: c.good.place_rate, n: c.good.races }, { label: '稍重〜不良', v: c.bad.place_rate, n: c.bad.races }];
  const figTrack = (
    <CondBars
      title="良馬場と道悪（稍重〜不良）の複勝率"
      label={`${W}の複勝率：芝 良${pct(turfCond.good.place_rate)}・稍重〜不良${pct(turfCond.bad.place_rate)}、ダート 良${pct(dirtCond.good.place_rate)}・稍重〜不良${pct(dirtCond.bad.place_rate)}`}
      groups={[{ sf: 'turf', cls: 'tf', rows: cg(turfCond) }, { sf: 'dirt', cls: 'dt', rows: cg(dirtCond) }]}
    />
  );
  const gr = growthRates;
  const figGrowth = gr.length >= 2 ? (
    <LineChart
      title="成長曲線（馬齢別の複勝率）"
      x={gr.map((r) => [r.age, `${int(r.races)}戦`] as [string, string])}
      label={`${W}の馬齢別の複勝率（全出走馬との比較）：${gr.map((r) => `${r.age} ${pct(r.place_rate)}（全出走馬${pct(r.all_place_rate)}）`).join('、')}`}
      series={[{ name: W, cls: 'g', values: gr.map((r) => r.place_rate) }, { name: '全出走馬', cls: 's', values: gr.map((r) => r.all_place_rate) }]}
    />
  ) : null;

  // データQ&A
  const faqItems = [
    { q: `${n}産駒の得意な競馬場は？`, a: sireGoodRacecourseAnswer },
    { q: `${n}産駒の得意なコースは？`, a: sireGoodCourseAnswer },
    { q: `${n}産駒は芝とダートどちらが得意？`, a: sireSurfaceFaqAnswer, lead: true },
    { q: `${n}産駒の得意な距離は？`, a: sireDistanceFaqAnswer, lead: true },
    ...(sireBandAnswer ? [{ q: `${n}産駒の芝・ダートそれぞれの得意距離は？`, a: sireBandAnswer }] : []),
    { q: `${n}産駒の馬場適性は？`, a: sireTrackConditionFaqAnswer, lead: true },
    ...(sireGrowthAnswer ? [{ q: `${n}産駒は早熟？晩成？`, a: sireGrowthAnswer }] : []),
    ...(sireProgenyAnswer ? [{ q: `${n}の代表産駒は？`, a: sireProgenyAnswer }] : []),
    { q: `${n}産駒の苦手な競馬場は？`, a: sireBadRacecourseAnswer },
    { q: `${n}産駒の苦手なコースは？`, a: sireBadCourseAnswer },
  ];
  const lines = (text: string | null) => (text ?? '').split('\n');

  // 節：条件別（補足文「出走30以上で…」は板の外、見出しの下）
  const cond = (
    id: string, title: string, rows: Row[], opt: Partial<StatsProps> & { keyLabel: string },
    { sub = '', note = true, markRows = null, before = null, own = false }: { sub?: string; note?: boolean; markRows?: Row[] | null; before?: ReactNode; own?: boolean } = {},
  ) => {
    const Hd = own ? Hno : H;
    return (
      <Sec id={id} head={<Hd w={W} title={title} sub={sub || note ? <Subs sub={sub} note={note ? <BestNote rows={markRows ?? rows} /> : null} /> : undefined} />}>
        <Pn>{before}<Stats rows={rows} mark={note} markRows={markRows} {...opt} /></Pn>
      </Sec>
    );
  };

  // ページ内の移動（データがない節・対象レース数が少ないページで出さない節は外す）
  const highlightPool = allCourses.filter((c) => c.races >= 10);
  const hasHighlights = highlightPool.length > 0;
  const hasBands = turfBand.length > 0 || dirtBand.length > 0;
  const thinHidden = new Set(['characteristics', 'highlights-section', 'faq-section']);
  const navItems = [
    ...(hasProfileTiles ? [['profile-section', '基本情報']] : []), ['summary-section', '概要'], ['leading', '年度別'], ...(notableProgeny.length ? [['progeny-section', '代表産駒']] : []),
    ['characteristics', '特徴'], ...(hasHighlights ? [['highlights-section', '注目']] : []), ['class-stats', 'クラス別'], ['running-style-stats', '脚質別'], ['gate-stats', '枠順別'],
    ['distance-stats', '距離別'], ...(hasBands ? [['distance-surface-stats', '芝ダ距離']] : []), ['gender-stats', '性別'], ['age-stats', '馬齢別'], ['horse-weight-stats', '馬体重別'],
    ['surface-stats', '芝・ダ別'], ...(changeRows.length ? [['surface-change-stats', '芝ダ変わり']] : []), ['track-condition-stats', '馬場状態'], ['racecourse-stats', '競馬場別'],
    ['course-stats', 'コース別'], ['dam-sire-stats', '母父別'], ['faq-section', 'Q&A'],
  ].filter(([id]) => enoughRaces || !thinHidden.has(id)).map(([id, label]) => ({ id, label }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      {enoughRaces && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSireJsonLd) }} />}
      <EntityRoot>
        <PageNav items={navItems} className="es-n11" />
        <Hero
          crumb={{ label: '種牡馬一覧', href: '/sires' }}
          name={n}
          h1={W}
          h1s="の特徴・傾向"
          lead={`${W}の成績・データをまとめたページです。独自のデータベースで直近3年間・${int(sire.total_races)}レースのデータを集計し、毎週更新しています。`}
          kpi={[['出走数', sire.total_stats.races, 0, ''], ['1着', sire.total_stats.wins, 0, ''], ['勝率', sire.total_stats.win_rate, 1, '%'], ['連対率', sire.total_stats.quinella_rate, 1, '%'], ['複勝率', sire.total_stats.place_rate, 1, '%']]}
          races={sire.total_races}
          period={periodText}
          updated={sire.last_updated}
          iso={dateIso}
          verdictTitle={`${W}の傾向`}
          verdict={enoughRaces ? [
            { label: '芝・ダート', pos: surfacePos, text: surfaceTrendText },
            { label: '距離', pos: distancePos, text: distanceTrendText },
            { label: '芝の馬場', pos: turfPos, text: CT[turfPos - 1] },
            { label: <><span className={cx('es-s')}>ダ</span><span className={cx('es-lg')}>ダート</span>の馬場</>, pos: dirtPos, text: CT[dirtPos - 1] },
          ] : null}
        />
        {!enoughRaces && <ThinNote totalRaces={sire.total_races} minRaces={MIN_RACES_FOR_TRENDS} hiddenItems="「産駒の傾向」「産駒の特徴」「注目ポイント」「データQ&A」" />}
        <Ad unit="dataTop" />

        {hasProfileTiles && (
          <Sec id="profile-section" head={<Hno w={n} title="基本情報" />}>
            <Tiles className="es-tl" items={tiles.filter((x) => x[1])} />
          </Sec>
        )}
        <Sec id="summary-section" head={<Hno w={W} title="データ概要" />}>
          <Summary blocks={summaryBlocks} links={summaryLinks} />
        </Sec>
        <Sec id="leading" head={<H w={W} title="年度別成績" sub="勝利数とリーディング順位（直近3年）" />}>
          <YearCharts lead={leadYears} ystat={ystat} />
        </Sec>
        {notableProgeny.length > 0 && (
          <Sec id="progeny-section" head={<Hno w={n} title="代表産駒" sub="集計期間に勝ち星を挙げた産駒。重賞の勝利数→勝利数の順" />}>
            <HorseList
              label={`${n}の代表産駒`}
              note="集計期間外の実績は含みません"
              cols={[{ label: '馬名', m: 'm1' }, { label: '性齢', m: 'm1b' }, { label: '成績', m: 'm2', num: true }, { label: '主な勝ち鞍', m: 'm3' }, { label: '母父', m: 'm4', ml: '母父' }]}
              rows={notableProgeny.map((h: NotableHorse) => [<b key="n">{h.horse_name}</b>, `${h.sex}${h.age ?? ''}`, `${h.races}戦${h.wins}勝`, <Titles key="t" list={formatTitles(h.titles)} />, h.damsire ?? '—'])}
            />
          </Sec>
        )}
        {enoughRaces && (
          <Sec id="characteristics" head={<Hno w={W} title="特徴" sub="判定と、その根拠になった複勝率" />}>
            <Meters
              items={[
                { label: '得意なコース傾向', pos: surfacePos, result: surfaceTrendText, scale: ['芝が得意', '差分なし', 'ダートが得意'], ev: ev([['芝', turf], ['ダート', dirt]]) },
                { label: '得意な距離傾向', pos: distancePos, result: distanceTrendText, scale: ['短距離が得意', '差分なし', '長距離が得意'], ev: ev([['短距離〜マイル', md('短〜マ')], ['中距離〜長距離', md('中〜長')]]) },
                { label: '得意な馬場傾向 - 芝', pos: turfPos, result: CT[turfPos - 1], scale: ['良馬場が得意', '差分なし', '重馬場が得意'], ev: ev([['良', turfCond.good], ['稍重〜不良', turfCond.bad]]) },
                { label: '得意な馬場傾向 - ダート', pos: dirtPos, result: CT[dirtPos - 1], scale: ['良馬場が得意', '差分なし', '重馬場が得意'], ev: ev([['良', dirtCond.good], ['稍重〜不良', dirtCond.bad]]) },
              ]}
            />
          </Sec>
        )}
        {enoughRaces && hasHighlights && (
          <Sec id="highlights-section" head={<Hno w={W} title="注目ポイント" sub="成績が目立つコース。コース名をタップすると詳細へ" />}>
            <Highlights courses={allCourses} urlOf={(c) => resolveCourseUrl(c)} shortOf={(c) => courseLabel(c, { withRacecourse: true, shortDirt: true })} />
          </Sec>
        )}
        {cond('class-stats', 'クラス別データ', classRows, { keyLabel: 'クラス' })}
        {cond('running-style-stats', '脚質別データ', styleRows, { keyLabel: '脚質', hint: <DefLink anchor="running-style" /> })}
        {cond('gate-stats', '枠順別データ', gRows, { keyLabel: '枠番' })}
        {cond('distance-stats', '距離別データ', distRows, { keyLabel: '距離', hint: <DefLink anchor="distance" /> })}
        {hasBands && (
          <Sec id="distance-surface-stats" head={<Hno w={W} title="芝・ダート別の得意距離" sub={<Subs sub="芝とダートそれぞれの距離帯別" />} />}>
            <Pn>
              {figBands}
              {turfBand.length > 0 && (
                <>
                  <p className={cx('es-sub')}><SfTag sf="turf" /><span><BestNote rows={turfBand} /></span></p>
                  <Stats rows={turfBand} keyLabel="距離" extra="es-nol" />
                </>
              )}
              {dirtBand.length > 0 && (
                <>
                  <p className={cx('es-sub')}><SfTag sf="dirt" /><span><BestNote rows={dirtBand} /></span></p>
                  <Stats rows={dirtBand} keyLabel="距離" extra="es-nol" />
                </>
              )}
            </Pn>
          </Sec>
        )}
        <Ad unit="dataMid" />
        {cond('gender-stats', '性別データ', genderRows, { keyLabel: '性別' })}
        {cond('age-stats', '馬齢別データ', ageRows, { keyLabel: '馬齢' }, { before: figGrowth ? <FigRow figure={figGrowth} lines={lines(sireGrowthAnswer)} /> : null })}
        {cond('horse-weight-stats', '馬体重別データ', weightRows, { keyLabel: '馬体重' }, { sub: '馬体重（kg）別' })}
        {cond('surface-stats', '芝・ダート別データ', surfRows, { keyLabel: '馬場' }, { markRows: flat(surfRows) })}
        {changeRows.length > 0 && cond('surface-change-stats', '芝・ダート変わりデータ', changeRows, { keyLabel: '区分', hint: <>※芝→ダ：芝デビュー後、初めてダートに挑戦した際の成績<br />※ダ→芝：ダートデビュー後、初めて芝に挑戦した際の成績</> }, { note: false })}
        {cond('track-condition-stats', '重馬場・道悪成績', trackRows, { keyLabel: '馬場状態' }, { own: true, sub: '馬場状態別：芝・ダート・障害 × 良・稍重・重・不良', markRows: flat(trackRows), before: <FigRow figure={figTrack} lines={lines(sireTrackConditionFaqAnswer)} /> })}
        {cond('racecourse-stats', '競馬場別データ', rcRows, { keyLabel: '競馬場', summaryRows: rcSum }, { sub: '表の最後に右回り・左回り・中央・ローカルの集計' })}
        <Sec id="course-stats" head={<H w={W} title="コース別データ" sub="競馬場をタップすると、コースごとの13項目を表示" />}>
          <CourseAcc courses={allCourses} urlOf={(c) => resolveCourseUrl(c)} labelOf={(c) => courseLabel(c)} />
        </Sec>
        <Sec id="dam-sire-stats" head={<H w={W} title="母父別データ" sub={<Subs sub="勝利数順" />} />}>
          <Pn><Stats rows={damRows} keyLabel="母父" rank initial={10} bar="wins" barLabel={'勝利数\n（横棒）'} hint="最大50件まで表示" shrink /></Pn>
        </Sec>
        <Ad unit="dataBottom" />
        {enoughRaces && (
          <Sec id="faq-section" head={<Head title="データQ&A" />}>
            <Faq items={faqItems} />
          </Sec>
        )}
        <About period={periodFromDataPeriod(sire.data_period)} updated={sire.last_updated} />
      </EntityRoot>
    </>
  );
}
