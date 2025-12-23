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
import BarChartAnimation from '@/components/BarChartAnimation';
import VolatilityExplanation from '@/components/VolatilityExplanation';
import GatePositionExplanation from '@/components/GatePositionExplanation';
import RunningStyleExplanation from '@/components/RunningStyleExplanation';
import DistanceTrendExplanation from '@/components/DistanceTrendExplanation';
import JockeyTrainerHighlights from '@/components/JockeyTrainerHighlights';

export default function SireTestPage() {
  // テスト用のモックデータ
  const sire = {
    id: '1',
    name: 'ディープインパクト',
    name_en: 'Deep Impact',
    birth_year: 2002,
    total_stats: {
      races: 15234,
      wins: 2456,
      places_2: 2103,
      places_3: 1876,
      win_rate: 16.1,
      place_rate: 42.0,
      quinella_rate: 29.9,
    },
    data_period: '2022-01-01〜2024-12-31（直近3年間）',
    last_updated: '2024-12-24',
    total_races: 15234,
    yearly_leading: [
      { year: 2022, wins: 850, ranking: 1 },
      { year: 2023, wins: 820, ranking: 1 },
      { year: 2024, wins: 786, ranking: 1 },
    ],
    yearly_stats: [
      { year: 2024, races: 5124, wins: 786, places_2: 701, places_3: 625, win_rate: 15.3, place_rate: 41.1, quinella_rate: 29.0, win_payback: 0, place_payback: 0 },
      { year: 2023, races: 5056, wins: 820, places_2: 702, places_3: 626, win_rate: 16.2, place_rate: 42.3, quinella_rate: 30.1, win_payback: 0, place_payback: 0 },
      { year: 2022, races: 5054, wins: 850, places_2: 700, places_3: 625, win_rate: 16.8, place_rate: 42.6, quinella_rate: 30.7, win_payback: 0, place_payback: 0 },
    ],
    distance_stats: [
      { category: '短距離', races: 3456, wins: 568, places_2: 485, places_3: 432, win_rate: 16.4, place_rate: 42.9, quinella_rate: 30.5, win_payback: 98, place_payback: 95 },
      { category: 'マイル', races: 4567, wins: 745, places_2: 638, places_3: 568, win_rate: 16.3, place_rate: 42.7, quinella_rate: 30.3, win_payback: 97, place_payback: 94 },
      { category: '中距離', races: 5678, wins: 912, places_2: 785, places_3: 698, win_rate: 16.1, place_rate: 42.1, quinella_rate: 29.9, win_payback: 96, place_payback: 93 },
      { category: '長距離', races: 1533, wins: 231, places_2: 195, places_3: 178, win_rate: 15.1, place_rate: 39.4, quinella_rate: 27.8, win_payback: 94, place_payback: 92 },
    ],
    surface_stats: [
      { surface: '芝', races: 10234, wins: 1868, places_2: 1625, places_3: 1456, win_rate: 18.3, place_rate: 48.1, quinella_rate: 34.1, win_payback: 99, place_payback: 96 },
      { surface: 'ダート', races: 5000, wins: 588, places_2: 478, places_3: 420, win_rate: 11.8, place_rate: 29.7, quinella_rate: 21.3, win_payback: 89, place_payback: 87 },
    ],
    popularity_stats: {
      fav1: { races: 2456, wins: 1235, places_2: 568, places_3: 324, win_rate: 50.3, quinella_rate: 73.4, place_rate: 86.6, win_payback: 152, place_payback: 135 },
      fav2: { races: 2345, wins: 568, places_2: 512, places_3: 445, win_rate: 24.2, quinella_rate: 46.1, place_rate: 65.1, win_payback: 125, place_payback: 112 },
      fav3: { races: 2234, wins: 345, places_2: 398, places_3: 387, win_rate: 15.4, quinella_rate: 33.3, place_rate: 50.6, win_payback: 98, place_payback: 95 },
      fav4: { races: 2123, wins: 198, places_2: 268, places_3: 312, win_rate: 9.3, quinella_rate: 21.9, place_rate: 36.6, win_payback: 82, place_payback: 85 },
      fav5: { races: 2012, wins: 78, places_2: 198, places_3: 268, win_rate: 3.9, quinella_rate: 13.7, place_rate: 27.0, win_payback: 65, place_payback: 72 },
      fav6to9: { races: 3456, wins: 32, places_2: 125, places_3: 298, win_rate: 0.9, quinella_rate: 4.5, place_rate: 13.2, win_payback: 45, place_payback: 58 },
      fav10plus: { races: 608, wins: 0, places_2: 34, places_3: 42, win_rate: 0.0, quinella_rate: 5.6, place_rate: 12.5, win_payback: 0, place_payback: 42 },
    },
    running_style_stats: [
      { style: 'escape', style_label: '逃げ', races: 2345, wins: 456, places_2: 385, places_3: 342, win_rate: 19.4, place_rate: 50.4, quinella_rate: 35.9, win_payback: 102, place_payback: 98 },
      { style: 'lead', style_label: '先行', races: 5678, wins: 985, places_2: 845, places_3: 756, win_rate: 17.3, place_rate: 45.5, quinella_rate: 32.2, win_payback: 99, place_payback: 96 },
      { style: 'pursue', style_label: '差し', races: 5234, wins: 768, places_2: 658, places_3: 589, win_rate: 14.7, place_rate: 38.5, quinella_rate: 27.3, win_payback: 94, place_payback: 92 },
      { style: 'close', style_label: '追込', races: 1977, wins: 247, places_2: 215, places_3: 189, win_rate: 12.5, place_rate: 32.9, quinella_rate: 23.4, win_payback: 89, place_payback: 88 },
    ],
    gate_stats: [
      { gate: 1, color: '#FFFFFF', races: 1568, wins: 256, places_2: 225, places_3: 198, win_rate: 16.3, place_rate: 43.3, quinella_rate: 30.7, win_payback: 98, place_payback: 95 },
      { gate: 2, color: '#000000', races: 1587, wins: 268, places_2: 232, places_3: 203, win_rate: 16.9, place_rate: 44.3, quinella_rate: 31.5, win_payback: 99, place_payback: 96 },
      { gate: 3, color: '#FF0000', races: 1598, wins: 271, places_2: 235, places_3: 206, win_rate: 17.0, place_rate: 44.6, quinella_rate: 31.7, win_payback: 100, place_payback: 97 },
      { gate: 4, color: '#0000FF', races: 1576, wins: 253, places_2: 221, places_3: 194, win_rate: 16.0, place_rate: 42.4, quinella_rate: 30.1, win_payback: 97, place_payback: 94 },
      { gate: 5, color: '#FFFF00', races: 1543, wins: 245, places_2: 215, places_3: 189, win_rate: 15.9, place_rate: 42.1, quinella_rate: 29.8, win_payback: 96, place_payback: 93 },
      { gate: 6, color: '#00FF00', races: 1534, wins: 238, places_2: 208, places_3: 183, win_rate: 15.5, place_rate: 41.0, quinella_rate: 29.1, win_payback: 95, place_payback: 92 },
      { gate: 7, color: '#FFA500', races: 1512, wins: 232, places_2: 203, places_3: 178, win_rate: 15.3, place_rate: 40.5, quinella_rate: 28.8, win_payback: 94, place_payback: 91 },
      { gate: 8, color: '#FFC0CB', races: 1482, wins: 225, places_2: 196, places_3: 172, win_rate: 15.2, place_rate: 40.0, quinella_rate: 28.4, win_payback: 93, place_payback: 90 },
    ],
    course_stats: [
      { rank: 1, name: '東京・芝1600m', racecourse: '東京競馬場', racecourse_en: 'tokyo', surface: '芝', surface_en: 'turf', distance: 1600, races: 456, wins: 98, places_2: 85, places_3: 76, win_rate: 21.5, place_rate: 56.8, quinella_rate: 40.1, win_payback: 105, place_payback: 102 },
      { rank: 2, name: '中山・芝1600m', racecourse: '中山競馬場', racecourse_en: 'nakayama', surface: '芝', surface_en: 'turf', distance: 1600, races: 423, wins: 89, places_2: 78, places_3: 69, win_rate: 21.0, place_rate: 55.8, quinella_rate: 39.5, win_payback: 104, place_payback: 101 },
      { rank: 3, name: '阪神・芝2000m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: '芝', surface_en: 'turf', distance: 2000, races: 398, wins: 82, places_2: 71, places_3: 63, win_rate: 20.6, place_rate: 54.3, quinella_rate: 38.4, win_payback: 103, place_payback: 100 },
    ],
    trainer_stats: [
      { rank: 1, name: '藤沢和雄', races: 568, wins: 125, places_2: 98, places_3: 85, win_rate: 22.0, place_rate: 54.2, quinella_rate: 39.3, win_payback: 108, place_payback: 104 },
      { rank: 2, name: '友道康夫', races: 523, wins: 112, places_2: 89, places_3: 78, win_rate: 21.4, place_rate: 53.3, quinella_rate: 38.4, win_payback: 106, place_payback: 103 },
      { rank: 3, name: '池江泰寿', races: 498, wins: 105, places_2: 84, places_3: 73, win_rate: 21.1, place_rate: 52.6, quinella_rate: 38.0, win_payback: 105, place_payback: 102 },
    ],
    jockey_stats: [
      { rank: 1, name: '武豊', races: 623, wins: 138, places_2: 112, places_3: 98, win_rate: 22.1, place_rate: 55.9, quinella_rate: 40.1, win_payback: 109, place_payback: 105 },
      { rank: 2, name: '福永祐一', races: 578, wins: 125, places_2: 102, places_3: 89, win_rate: 21.6, place_rate: 54.7, quinella_rate: 39.3, win_payback: 107, place_payback: 104 },
      { rank: 3, name: 'ルメール', races: 545, wins: 118, places_2: 96, places_3: 84, win_rate: 21.7, place_rate: 54.7, quinella_rate: 39.3, win_payback: 107, place_payback: 104 },
    ],
    track_condition_stats: [
      { surface: '芝', condition: 'good', condition_label: '良', races: 7234, wins: 1345, places_2: 1168, places_3: 1045, win_rate: 18.6, place_rate: 49.2, quinella_rate: 34.7, win_payback: 100, place_payback: 97 },
      { surface: '芝', condition: 'yielding', condition_label: '稍重', races: 1568, wins: 268, places_2: 232, places_3: 203, win_rate: 17.1, place_rate: 44.8, quinella_rate: 31.9, win_payback: 96, place_payback: 94 },
      { surface: '芝', condition: 'soft', condition_label: '重', races: 897, wins: 156, places_2: 135, places_3: 118, win_rate: 17.4, place_rate: 45.6, quinella_rate: 32.4, win_payback: 97, place_payback: 95 },
      { surface: '芝', condition: 'heavy', condition_label: '不良', races: 535, wins: 99, places_2: 90, places_3: 90, win_rate: 18.5, place_rate: 52.1, quinella_rate: 35.3, win_payback: 101, place_payback: 99 },
      { surface: 'ダート', condition: 'good', condition_label: '良', races: 3234, wins: 385, places_2: 312, places_3: 273, win_rate: 11.9, place_rate: 30.0, quinella_rate: 21.6, win_payback: 89, place_payback: 87 },
      { surface: 'ダート', condition: 'yielding', condition_label: '稍重', races: 856, wins: 98, places_2: 79, places_3: 69, win_rate: 11.4, place_rate: 28.7, quinella_rate: 20.7, win_payback: 87, place_payback: 86 },
      { surface: 'ダート', condition: 'soft', condition_label: '重', races: 612, wins: 71, places_2: 58, places_3: 50, win_rate: 11.6, place_rate: 29.2, quinella_rate: 21.1, win_payback: 88, place_payback: 86 },
      { surface: 'ダート', condition: 'heavy', condition_label: '不良', races: 298, wins: 34, places_2: 29, places_3: 28, win_rate: 11.4, place_rate: 30.5, quinella_rate: 21.1, win_payback: 88, place_payback: 87 },
    ],
    class_stats: [
      { rank: 1, class_name: '新馬', races: 2845, wins: 568, places_2: 485, places_3: 432, win_rate: 20.0, place_rate: 52.2, quinella_rate: 37.0, win_payback: 102, place_payback: 99 },
      { rank: 2, class_name: '未勝利', races: 4567, wins: 756, places_2: 645, places_3: 574, win_rate: 16.6, place_rate: 43.2, quinella_rate: 30.7, win_payback: 98, place_payback: 95 },
      { rank: 3, class_name: '1勝', races: 3456, wins: 512, places_2: 438, places_3: 389, win_rate: 14.8, place_rate: 38.7, quinella_rate: 27.5, win_payback: 94, place_payback: 92 },
      { rank: 4, class_name: '2勝', races: 2234, wins: 325, places_2: 278, places_3: 247, win_rate: 14.5, place_rate: 38.1, quinella_rate: 27.0, win_payback: 93, place_payback: 91 },
      { rank: 5, class_name: '3勝', races: 1456, wins: 198, places_2: 169, places_3: 150, win_rate: 13.6, place_rate: 35.5, quinella_rate: 25.2, win_payback: 91, place_payback: 89 },
      { rank: 6, class_name: 'オープン', races: 676, wins: 97, places_2: 88, places_3: 84, win_rate: 14.3, place_rate: 39.8, quinella_rate: 27.4, win_payback: 93, place_payback: 92 },
    ],
    gender_stats: [
      { name: '牡馬', races: 8456, wins: 1368, places_2: 1225, places_3: 1085, win_rate: 16.2, place_rate: 42.6, quinella_rate: 30.7, win_payback: 98, place_payback: 95 },
      { name: '牝馬', races: 6778, wins: 1088, places_2: 878, places_3: 791, win_rate: 16.0, place_rate: 40.8, quinella_rate: 29.0, win_payback: 96, place_payback: 92 },
    ],
    characteristics: {
      volatility: 2,
      trifecta_avg_payback_rank: 35,
      total_courses: 120,
      trifecta_median_payback: 58.3,
      trifecta_all_median_payback: 58.3,
      gate_position: 0,
      distance_trend: 1,
    },
  };

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
    { id: 'surface-stats', label: '芝・ダート別' },
    { id: 'track-condition-stats', label: '馬場状態別' },
    { id: 'racecourse-stats', label: '競馬場別' },
    { id: 'course-stats', label: 'コース別' },
    { id: 'trainer-stats', label: '調教師別' },
    { id: 'jockey-stats', label: '騎手別' },
  ];

  return (
    <>
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
