import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import { getSireDataFromGCS } from '@/lib/getSireDataFromGCS';
import BottomNav from '@/components/BottomNav';
import TableOfContents from '@/components/TableOfContents';
import JockeyLeadingChart from '@/components/JockeyLeadingChart';
import YearlyTable from '@/components/YearlyTable';
import ClassTable from '@/components/ClassTable';
import RunningStyleTable from '@/components/RunningStyleTable';
import GateTable from '@/components/GateTable';
import DistanceTable from '@/components/DistanceTable';
import SurfaceTable from '@/components/SurfaceTable';
import TrackConditionTable from '@/components/TrackConditionTable';
import RacecourseTable from '@/components/RacecourseTable';
import RacecourseCourseTable from '@/components/RacecourseCourseTable';
import GenderTable from '@/components/GenderTable';
import AgeTable from '@/components/AgeTable';
import HorseWeightTable from '@/components/HorseWeightTable';
import BarChartAnimation from '@/components/BarChartAnimation';
import VolatilityExplanation from '@/components/VolatilityExplanation';
import GatePositionExplanation from '@/components/GatePositionExplanation';
import RunningStyleExplanation from '@/components/RunningStyleExplanation';
import DistanceTrendExplanation from '@/components/DistanceTrendExplanation';
import TurfConditionExplanation from '@/components/TurfConditionExplanation';
import JockeyTrainerHighlights from '@/components/JockeyTrainerHighlights';
import { ALL_SIRES } from '@/lib/sires';

// ISR: 週1回（604800秒）再生成
export const revalidate = 604800;

// generateStaticParams: 全種牡馬ページを事前生成
export async function generateStaticParams() {
  return ALL_SIRES.map((sire) => ({
    id: String(sire.id),
  }));
}

// generateMetadata: 動的メタデータ生成
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sireInfo = ALL_SIRES.find(s => s.id === parseInt(id));
  const sireName = sireInfo?.name || '種牡馬';

  return {
    title: `${sireName}産駒の成績・データ | 競馬データ.com`,
    description: `${sireName}産駒の詳細な成績データを掲載。年度別成績、距離別・芝ダート別・競馬場別の詳細データを網羅。`,
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

  // GCSから計算済みの傾向データを取得
  const surfaceTrendPosition = sire.characteristics?.surface_trend_position ?? 3;
  const runningStyleTrendPosition = sire.characteristics?.running_style_trend_position ?? 3;
  const distanceTrendPosition = sire.characteristics?.distance_trend_position ?? 3;

  // 芝馬場状態別傾向を計算（良 vs 重・不良の複勝率差から判定）
  const turfGoodConditions = sire.track_condition_stats.filter(s =>
    s.surface === '芝' && s.condition === 'good'
  );
  const turfBadConditions = sire.track_condition_stats.filter(s =>
    s.surface === '芝' && (s.condition === 'soft' || s.condition === 'heavy')
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

  // ダート馬場状態別傾向を計算（良 vs 重・不良の複勝率差から判定）
  const dirtGoodConditions = sire.track_condition_stats.filter(s =>
    s.surface === 'ダート' && s.condition === 'good'
  );
  const dirtBadConditions = sire.track_condition_stats.filter(s =>
    s.surface === 'ダート' && (s.condition === 'soft' || s.condition === 'heavy')
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

  // ナビゲーションアイテム
  const navigationItems = [
    { id: 'leading', label: '年度別' },
    { id: 'characteristics', label: '特徴' },
    { id: 'highlights-section', label: '注目ポイント' },
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
  ];

  return (
    <>
      <BottomNav items={navigationItems} />
      <main>
        <div>
          {/* パンくずリスト */}
          <nav className="breadcrumb">
            <Link href="/">HOME</Link>
            <span> &gt; </span>
            <Link href="/sires">種牡馬一覧</Link>
            <span> &gt; </span>
            <span>{sire.name}</span>
          </nav>

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

          <article className="content-card">
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
                <h2 className="section-title">{sire.name}産駒の特徴</h2>

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
                    <span>芝が得意</span>
                    <span>差分なし</span>
                    <span>ダートが得意</span>
                  </div>
                  <div className="gauge-result">
                    {surfaceTrendPosition === 1 && '芝が得意'}
                    {surfaceTrendPosition === 2 && 'やや芝が得意'}
                    {surfaceTrendPosition === 3 && '差分なし'}
                    {surfaceTrendPosition === 4 && 'ややダートが得意'}
                    {surfaceTrendPosition === 5 && 'ダートが得意'}
                  </div>

                  {/* コース別複勝率グラフ */}
                  <div className="gate-place-rate-detail">
                    <div className="gate-detail-title">コース別複勝率</div>
                    <div className="gate-chart">
                      {sire.surface_stats
                        .filter((surface) => surface.surface === '芝' || surface.surface === 'ダート')
                        .sort((a, b) => {
                          // 芝を左に、ダートを右に
                          if (a.surface === '芝') return -1;
                          if (b.surface === '芝') return 1;
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
                          <div key={distance.category} className="gate-chart-item">
                            <div
                              className="distance-badge"
                              style={{
                                background: '#f0f0f0',
                                border: '1px solid #ddd',
                                color: '#333'
                              }}
                            >
                              {distance.category}
                            </div>
                            <div className="gate-bar-container">
                              <div
                                className="gate-bar"
                                style={{
                                  width: `${distance.place_rate}%`
                                }}
                              ></div>
                            </div>
                            <div className="gate-rate" style={{ textAlign: distance.races > 0 ? 'right' : 'center' }}>{distance.races > 0 ? `${distance.place_rate.toFixed(1)}%` : '-'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                </div>

                {/* 区切り線 */}
                <div className="section-divider"></div>

                {/* 得意な馬場傾向（芝） */}
                <div className="gauge-item">
                  <div className="gauge-header">
                    <h3 className="gauge-label">得意な馬場傾向 - 芝</h3>
                    <TurfConditionExplanation />
                  </div>
                  <div className="gauge-track">
                    <div className="gauge-indicator" style={{ left: `${(turfConditionTrendPosition - 1) * 25}%` }}></div>
                    <div className="gauge-horse-icon" style={{ left: `${(turfConditionTrendPosition - 1) * 25}%` }}>🏇</div>
                  </div>
                  <div className="gauge-labels">
                    <span>良馬場が得意</span>
                    <span>差分なし</span>
                    <span>重馬場が得意</span>
                  </div>
                  <div className="gauge-result">
                    {turfConditionTrendPosition === 1 && '良馬場が得意'}
                    {turfConditionTrendPosition === 2 && 'やや良馬場が得意'}
                    {turfConditionTrendPosition === 3 && '差分なし'}
                    {turfConditionTrendPosition === 4 && 'やや重馬場が得意'}
                    {turfConditionTrendPosition === 5 && '重馬場が得意'}
                  </div>

                  {/* 馬場状態別複勝率グラフ */}
                  <div className="gate-place-rate-detail">
                    <div className="gate-detail-title">馬場状態別複勝率</div>
                    <div className="gate-chart">
                      {turfConditionStatsData.map((condition) => (
                          <div key={condition.condition} className="gate-chart-item">
                            <div
                              style={{
                                background: '#f0f0f0',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                color: '#333',
                                padding: '4px 6px',
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                textAlign: 'center',
                                minWidth: '40px',
                                display: 'inline-block'
                              }}
                            >
                              {condition.condition_label}
                            </div>
                            <div className="gate-bar-container">
                              <div
                                className="gate-bar"
                                style={{
                                  width: `${condition.place_rate}%`
                                }}
                              ></div>
                            </div>
                            <div className="gate-rate" style={{ textAlign: condition.races > 0 ? 'right' : 'center' }}>{condition.races > 0 ? `${condition.place_rate.toFixed(1)}%` : '-'}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* 区切り線 */}
                <div className="section-divider"></div>

                {/* 得意な馬場傾向（ダート） */}
                <div className="gauge-item">
                  <div className="gauge-header">
                    <h3 className="gauge-label">得意な馬場傾向 - ダート</h3>
                    <TurfConditionExplanation />
                  </div>
                  <div className="gauge-track">
                    <div className="gauge-indicator" style={{ left: `${(dirtConditionTrendPosition - 1) * 25}%` }}></div>
                    <div className="gauge-horse-icon" style={{ left: `${(dirtConditionTrendPosition - 1) * 25}%` }}>🏇</div>
                  </div>
                  <div className="gauge-labels">
                    <span>良馬場が得意</span>
                    <span>差分なし</span>
                    <span>重馬場が得意</span>
                  </div>
                  <div className="gauge-result">
                    {dirtConditionTrendPosition === 1 && '良馬場が得意'}
                    {dirtConditionTrendPosition === 2 && 'やや良馬場が得意'}
                    {dirtConditionTrendPosition === 3 && '差分なし'}
                    {dirtConditionTrendPosition === 4 && 'やや重馬場が得意'}
                    {dirtConditionTrendPosition === 5 && '重馬場が得意'}
                  </div>

                  {/* 馬場状態別複勝率グラフ */}
                  <div className="gate-place-rate-detail">
                    <div className="gate-detail-title">馬場状態別複勝率</div>
                    <div className="gate-chart">
                      {dirtConditionStatsData.map((condition) => (
                          <div key={condition.condition} className="gate-chart-item">
                            <div
                              style={{
                                background: '#f0f0f0',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                color: '#333',
                                padding: '4px 6px',
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                textAlign: 'center',
                                minWidth: '40px',
                                display: 'inline-block'
                              }}
                            >
                              {condition.condition_label}
                            </div>
                            <div className="gate-bar-container">
                              <div
                                className="gate-bar"
                                style={{
                                  width: `${condition.place_rate}%`
                                }}
                              ></div>
                            </div>
                            <div className="gate-rate" style={{ textAlign: condition.races > 0 ? 'right' : 'center' }}>{condition.races > 0 ? `${condition.place_rate.toFixed(1)}%` : '-'}</div>
                          </div>
                        ))}
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
              data={classStatsData}
            />
          </section>

          {/* 脚質別データセクション */}
          <section id="running-style-stats" aria-label="脚質別データ">
            <RunningStyleTable
              title={`${sire.name}産駒 脚質別データ`}
              data={runningStyleStatsData}
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
              data={distanceStatsData}
            />
          </section>

          {/* 性別データセクション */}
          <section id="gender-stats" aria-label="性別データ">
            <GenderTable
              title={`${sire.name}産駒 性別データ`}
              data={genderStatsData}
            />
          </section>

          {/* 馬齢別データセクション */}
          <section id="age-stats" aria-label="馬齢別データ">
            <AgeTable
              title={`${sire.name}産駒 馬齢別データ`}
              data={ageStatsData}
            />
          </section>

          {/* 馬体重別データセクション */}
          <section id="horse-weight-stats" aria-label="馬体重別データ">
            <HorseWeightTable
              title={`${sire.name}産駒 馬体重別データ`}
              data={horseWeightStatsData}
            />
          </section>

          {/* 芝・ダート別データセクション */}
          <section id="surface-stats" aria-label="芝・ダート別データ">
            <SurfaceTable
              title={`${sire.name}産駒 芝・ダート別データ`}
              data={surfaceStatsData}
            />
          </section>

          {/* 芝・ダート変わりデータセクション */}
          {surfaceChangeStatsData.length > 0 && (() => {
            // 各カラムの最大値を計算
            const maxRaces = Math.max(...surfaceChangeStatsData.map(d => d.races ?? 0));
            const maxWins = Math.max(...surfaceChangeStatsData.map(d => d.wins ?? 0));
            const maxPlaces2 = Math.max(...surfaceChangeStatsData.map(d => d.places_2 ?? 0));
            const maxPlaces3 = Math.max(...surfaceChangeStatsData.map(d => d.places_3 ?? 0));
            const maxWinRate = Math.max(...surfaceChangeStatsData.map(d => d.win_rate ?? 0));
            const maxPlaceRate = Math.max(...surfaceChangeStatsData.map(d => d.place_rate ?? 0));
            const maxQuinellaRate = Math.max(...surfaceChangeStatsData.map(d => d.quinella_rate ?? 0));
            const maxWinPayback = Math.max(...surfaceChangeStatsData.map(d => d.win_payback ?? 0));
            const maxPlacePayback = Math.max(...surfaceChangeStatsData.map(d => d.place_payback ?? 0));

            const isHighlight = (value: number, maxValue: number) => value === maxValue && value > 0;

            return (
              <section id="surface-change-stats" aria-label="芝・ダート変わりデータ">
                <div className="section">
                  <h2 className="section-title">{sire.name}産駒 芝・ダート変わりデータ</h2>
                  <div className="mobile-table-container">
                    <div className="mobile-table-scroll">
                      <table className="mobile-data-table no-rank-column">
                        <thead>
                          <tr>
                            <th className="mobile-sticky-col mobile-col-name mobile-col-name-header mobile-col-name-first">区分</th>
                            <th className="mobile-scroll-col">出走数</th>
                            <th className="mobile-scroll-col">1着</th>
                            <th className="mobile-scroll-col">2着</th>
                            <th className="mobile-scroll-col">3着</th>
                            <th className="mobile-scroll-col mobile-col-rate">勝率</th>
                            <th className="mobile-scroll-col mobile-col-rate">連対率</th>
                            <th className="mobile-scroll-col mobile-col-rate">複勝率</th>
                            <th className="mobile-scroll-col mobile-col-payback">単勝回収率</th>
                            <th className="mobile-scroll-col mobile-col-payback">複勝回収率</th>
                            <th className="mobile-scroll-col" style={{ width: '80px', minWidth: '80px' }}>平均人気</th>
                            <th className="mobile-scroll-col" style={{ width: '80px', minWidth: '80px' }}>平均着順</th>
                            <th className="mobile-scroll-col" style={{ width: '80px', minWidth: '80px' }}>人気中央値</th>
                            <th className="mobile-scroll-col" style={{ width: '80px', minWidth: '80px' }}>着順中央値</th>
                          </tr>
                        </thead>
                        <tbody>
                          {surfaceChangeStatsData.map((stat, index) => (
                            <tr key={stat.name} className={index % 2 === 0 ? 'mobile-row-even' : 'mobile-row-odd'}>
                              <td className="mobile-sticky-col mobile-col-name mobile-sticky-body mobile-name-cell mobile-col-name-first">
                                <span style={{
                                  background: '#f0f0f0',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  color: '#333',
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  display: 'inline-block',
                                  minWidth: '60px',
                                  textAlign: 'center'
                                }}>
                                  {stat.name}
                                </span>
                              </td>
                              <td className="mobile-scroll-col">
                                <span className={isHighlight(stat.races, maxRaces) ? 'mobile-highlight' : ''}>
                                  {stat.races}
                                </span>
                              </td>
                              <td className="mobile-scroll-col mobile-col-wins">
                                <span className={isHighlight(stat.wins, maxWins) ? 'mobile-highlight' : ''}>
                                  {stat.wins}
                                </span>
                              </td>
                              <td className="mobile-scroll-col">
                                <span className={isHighlight(stat.places_2, maxPlaces2) ? 'mobile-highlight' : ''}>
                                  {stat.places_2}
                                </span>
                              </td>
                              <td className="mobile-scroll-col">
                                <span className={isHighlight(stat.places_3, maxPlaces3) ? 'mobile-highlight' : ''}>
                                  {stat.places_3}
                                </span>
                              </td>
                              <td className="mobile-scroll-col mobile-col-rate">
                                <span className={isHighlight(stat.win_rate, maxWinRate) ? 'mobile-highlight' : ''}>
                                  {stat.win_rate.toFixed(1)}%
                                </span>
                              </td>
                              <td className="mobile-scroll-col mobile-col-rate">
                                <span className={isHighlight(stat.quinella_rate, maxQuinellaRate) ? 'mobile-highlight' : ''}>
                                  {stat.quinella_rate.toFixed(1)}%
                                </span>
                              </td>
                              <td className="mobile-scroll-col mobile-col-rate">
                                <span className={isHighlight(stat.place_rate, maxPlaceRate) ? 'mobile-highlight' : ''}>
                                  {stat.place_rate.toFixed(1)}%
                                </span>
                              </td>
                              <td className="mobile-scroll-col mobile-col-payback">
                                <span className={isHighlight(stat.win_payback, maxWinPayback) ? 'mobile-highlight' : ''}>
                                  {stat.win_payback.toFixed(1)}%
                                </span>
                              </td>
                              <td className="mobile-scroll-col mobile-col-payback">
                                <span className={isHighlight(stat.place_payback, maxPlacePayback) ? 'mobile-highlight' : ''}>
                                  {stat.place_payback.toFixed(1)}%
                                </span>
                              </td>
                              <td className="mobile-scroll-col" style={{ width: '80px', minWidth: '80px' }}>
                                <span>{stat.avg_popularity != null ? stat.avg_popularity.toFixed(1) : '-'}</span>
                              </td>
                              <td className="mobile-scroll-col" style={{ width: '80px', minWidth: '80px' }}>
                                <span>{stat.avg_rank != null ? stat.avg_rank.toFixed(1) : '-'}</span>
                              </td>
                              <td className="mobile-scroll-col" style={{ width: '80px', minWidth: '80px' }}>
                                <span>{stat.median_popularity != null ? Math.round(stat.median_popularity) : '-'}</span>
                              </td>
                              <td className="mobile-scroll-col" style={{ width: '80px', minWidth: '80px' }}>
                                <span>{stat.median_rank != null ? Math.round(stat.median_rank) : '-'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <p className="note-text" style={{ marginTop: '1rem' }}>
                    ※芝→ダ：芝デビュー後、初めてダートに挑戦した際の成績<br />
                    ※ダ→芝：ダートデビュー後、初めて芝に挑戦した際の成績
                  </p>
                </div>
              </section>
            );
          })()}

          {/* 馬場状態別データセクション */}
          <section id="track-condition-stats" aria-label="馬場状態別データ">
            <TrackConditionTable
              title={`${sire.name}産駒 馬場状態別データ`}
              data={trackConditionStatsData}
            />
          </section>

          {/* 競馬場別データセクション */}
          <section id="racecourse-stats" aria-label="競馬場別データ">
            <RacecourseTable
              title={`${sire.name}産駒 競馬場別データ`}
              data={racecourseSummaryDataWithTotals}
            />
          </section>

          {/* コース別データ */}
          <section id="course-stats" aria-label="コース別データ">
            <RacecourseCourseTable
              title={`${sire.name}産駒 コース別データ`}
              data={coursesByRacecourse}
            />
          </section>

          {/* 母父別データセクション */}
          <section id="dam-sire-stats" aria-label="母父別データ">
            <DataTable
              title={`${sire.name}産駒 母父別データ`}
              data={damSireStatsWithLinks}
              initialShow={10}
              nameLabel="母父"
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
