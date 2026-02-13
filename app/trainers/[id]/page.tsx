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
import DistanceTable from '@/components/DistanceTable';
import SurfaceTable from '@/components/SurfaceTable';
import RacecourseTable from '@/components/RacecourseTable';
import RacecourseCourseTable from '@/components/RacecourseCourseTable';
import GenderTable from '@/components/GenderTable';
import IntervalTable from '@/components/IntervalTable';
import BarChartAnimation from '@/components/BarChartAnimation';
import VolatilityExplanation from '@/components/VolatilityExplanation';
import GatePositionExplanation from '@/components/GatePositionExplanation';
import DistanceTrendExplanation from '@/components/DistanceTrendExplanation';
import DistanceDefinition from '@/components/DistanceDefinition';
import JockeyTrainerHighlights from '@/components/JockeyTrainerHighlights';
import { getTrainerDataFromGCS } from '@/lib/getTrainerDataFromGCS';
import { ALL_TRAINERS } from '@/lib/trainers';

// ISR: 週1回（604800秒）再生成
export const revalidate = 604800;

// generateStaticParams: 全調教師ページを事前生成
export async function generateStaticParams() {
  return ALL_TRAINERS.map((trainer) => ({
    id: String(trainer.id),
  }));
}

// 調教師データ型定義
interface TrainerData {
  id: string;
  name: string;
  kana: string;
  stable: string;
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
    win_payback: number;
    place_payback: number;
    avg_popularity?: number;
    avg_rank?: number;
    median_popularity?: number;
    median_rank?: number;
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
    avg_popularity?: number;
    avg_rank?: number;
    median_popularity?: number;
    median_rank?: number;
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
    avg_popularity?: number;
    avg_rank?: number;
    median_popularity?: number;
    median_rank?: number;
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
  characteristics: {
    volatility: number;
    trifecta_avg_payback_rank: number;
    total_courses: number;
    trifecta_median_payback: number;
    trifecta_all_median_payback: number;
    gate_position: number;
    running_style_trend_position?: number;
    distance_trend_position?: number;
  };
  running_style_trends?: Array<{
    style: string;
    style_label: string;
    place_rate: number;
  }>;
  racecourse_stats?: Array<{
    name: string;
    racecourse_ja: string;
    racecourse_en: string;
    races: number;
    wins: number;
    places_2: number;
    places_3: number;
    win_rate: number;
    place_rate: number;
    quinella_rate: number;
    win_payback: number;
    place_payback: number;
    avg_popularity?: number;
    avg_rank?: number;
    median_popularity?: number;
    median_rank?: number;
  }>;
}

// 池江泰寿のモックデータ
const mockTrainerData: Record<string, TrainerData> = {
  '777': {
    id: '777',
    name: '池江泰寿',
    kana: 'イケエヤスヒサ',
    stable: '栗東',
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
      { category: '長距離', races: 267, wins: 51, places_2: 44, places_3: 36, win_rate: 19.1, place_rate: 49.1, quinella_rate: 35.8, win_payback: 106, place_payback: 102 },
    ],
    surface_stats: [
      { surface: '芝', races: 1563, wins: 295, places_2: 247, places_3: 203, win_rate: 18.9, place_rate: 47.7, quinella_rate: 34.7, win_payback: 102, place_payback: 98 },
      { surface: 'ダート', races: 926, wins: 158, places_2: 135, places_3: 109, win_rate: 17.1, place_rate: 43.4, quinella_rate: 31.6, win_payback: 98, place_payback: 95 },
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
      // 札幌競馬場
      { rank: 1, name: '札幌競馬場 芝 1200m', racecourse: '札幌競馬場', racecourse_en: 'sapporo', surface: '芝', surface_en: 'turf', distance: 1200, races: 28, wins: 5, places_2: 4, places_3: 3, win_rate: 17.9, place_rate: 42.9, quinella_rate: 32.1, win_payback: 95, place_payback: 92 },
      { rank: 2, name: '札幌競馬場 芝 1500m', racecourse: '札幌競馬場', racecourse_en: 'sapporo', surface: '芝', surface_en: 'turf', distance: 1500, races: 22, wins: 4, places_2: 3, places_3: 2, win_rate: 18.2, place_rate: 40.9, quinella_rate: 31.8, win_payback: 98, place_payback: 94 },
      { rank: 3, name: '札幌競馬場 芝 1800m', racecourse: '札幌競馬場', racecourse_en: 'sapporo', surface: '芝', surface_en: 'turf', distance: 1800, races: 26, wins: 5, places_2: 4, places_3: 4, win_rate: 19.2, place_rate: 50.0, quinella_rate: 34.6, win_payback: 102, place_payback: 97 },
      { rank: 4, name: '札幌競馬場 芝 2000m', racecourse: '札幌競馬場', racecourse_en: 'sapporo', surface: '芝', surface_en: 'turf', distance: 2000, races: 18, wins: 3, places_2: 3, places_3: 2, win_rate: 16.7, place_rate: 44.4, quinella_rate: 33.3, win_payback: 96, place_payback: 93 },
      { rank: 5, name: '札幌競馬場 芝 2600m', racecourse: '札幌競馬場', racecourse_en: 'sapporo', surface: '芝', surface_en: 'turf', distance: 2600, races: 12, wins: 2, places_2: 2, places_3: 1, win_rate: 16.7, place_rate: 41.7, quinella_rate: 33.3, win_payback: 94, place_payback: 91 },
      { rank: 6, name: '札幌競馬場 ダ 1000m', racecourse: '札幌競馬場', racecourse_en: 'sapporo', surface: 'ダート', surface_en: 'dirt', distance: 1000, races: 15, wins: 2, places_2: 2, places_3: 2, win_rate: 13.3, place_rate: 40.0, quinella_rate: 26.7, win_payback: 88, place_payback: 86 },
      { rank: 7, name: '札幌競馬場 ダ 1700m', racecourse: '札幌競馬場', racecourse_en: 'sapporo', surface: 'ダート', surface_en: 'dirt', distance: 1700, races: 19, wins: 3, places_2: 3, places_3: 2, win_rate: 15.8, place_rate: 42.1, quinella_rate: 31.6, win_payback: 92, place_payback: 89 },
      { rank: 8, name: '札幌競馬場 ダ 2400m', racecourse: '札幌競馬場', racecourse_en: 'sapporo', surface: 'ダート', surface_en: 'dirt', distance: 2400, races: 8, wins: 1, places_2: 1, places_3: 1, win_rate: 12.5, place_rate: 37.5, quinella_rate: 25.0, win_payback: 85, place_payback: 83 },

      // 函館競馬場
      { rank: 9, name: '函館競馬場 芝 1200m', racecourse: '函館競馬場', racecourse_en: 'hakodate', surface: '芝', surface_en: 'turf', distance: 1200, races: 32, wins: 6, places_2: 5, places_3: 4, win_rate: 18.8, place_rate: 46.9, quinella_rate: 34.4, win_payback: 99, place_payback: 95 },
      { rank: 10, name: '函館競馬場 芝 1800m', racecourse: '函館競馬場', racecourse_en: 'hakodate', surface: '芝', surface_en: 'turf', distance: 1800, races: 24, wins: 5, places_2: 4, places_3: 3, win_rate: 20.8, place_rate: 50.0, quinella_rate: 37.5, win_payback: 104, place_payback: 99 },
      { rank: 11, name: '函館競馬場 芝 2000m', racecourse: '函館競馬場', racecourse_en: 'hakodate', surface: '芝', surface_en: 'turf', distance: 2000, races: 20, wins: 4, places_2: 3, places_3: 3, win_rate: 20.0, place_rate: 50.0, quinella_rate: 35.0, win_payback: 101, place_payback: 97 },
      { rank: 12, name: '函館競馬場 芝 2600m', racecourse: '函館競馬場', racecourse_en: 'hakodate', surface: '芝', surface_en: 'turf', distance: 2600, races: 10, wins: 2, places_2: 1, places_3: 1, win_rate: 20.0, place_rate: 40.0, quinella_rate: 30.0, win_payback: 98, place_payback: 94 },
      { rank: 13, name: '函館競馬場 ダ 1000m', racecourse: '函館競馬場', racecourse_en: 'hakodate', surface: 'ダート', surface_en: 'dirt', distance: 1000, races: 18, wins: 3, places_2: 2, places_3: 2, win_rate: 16.7, place_rate: 38.9, quinella_rate: 27.8, win_payback: 91, place_payback: 88 },
      { rank: 14, name: '函館競馬場 ダ 1700m', racecourse: '函館競馬場', racecourse_en: 'hakodate', surface: 'ダート', surface_en: 'dirt', distance: 1700, races: 16, wins: 3, places_2: 2, places_3: 2, win_rate: 18.8, place_rate: 43.8, quinella_rate: 31.3, win_payback: 95, place_payback: 92 },
      { rank: 15, name: '函館競馬場 ダ 2400m', racecourse: '函館競馬場', racecourse_en: 'hakodate', surface: 'ダート', surface_en: 'dirt', distance: 2400, races: 6, wins: 1, places_2: 1, places_3: 0, win_rate: 16.7, place_rate: 33.3, quinella_rate: 33.3, win_payback: 88, place_payback: 86 },

      // 福島競馬場
      { rank: 16, name: '福島競馬場 芝 1200m', racecourse: '福島競馬場', racecourse_en: 'fukushima', surface: '芝', surface_en: 'turf', distance: 1200, races: 35, wins: 7, places_2: 6, places_3: 5, win_rate: 20.0, place_rate: 51.4, quinella_rate: 37.1, win_payback: 103, place_payback: 98 },
      { rank: 17, name: '福島競馬場 芝 1800m', racecourse: '福島競馬場', racecourse_en: 'fukushima', surface: '芝', surface_en: 'turf', distance: 1800, races: 28, wins: 6, places_2: 5, places_3: 4, win_rate: 21.4, place_rate: 53.6, quinella_rate: 39.3, win_payback: 106, place_payback: 101 },
      { rank: 18, name: '福島競馬場 芝 2000m', racecourse: '福島競馬場', racecourse_en: 'fukushima', surface: '芝', surface_en: 'turf', distance: 2000, races: 22, wins: 4, places_2: 4, places_3: 3, win_rate: 18.2, place_rate: 50.0, quinella_rate: 36.4, win_payback: 99, place_payback: 95 },
      { rank: 19, name: '福島競馬場 芝 2600m', racecourse: '福島競馬場', racecourse_en: 'fukushima', surface: '芝', surface_en: 'turf', distance: 2600, races: 14, wins: 3, places_2: 2, places_3: 2, win_rate: 21.4, place_rate: 50.0, quinella_rate: 35.7, win_payback: 102, place_payback: 97 },
      { rank: 20, name: '福島競馬場 ダ 1150m', racecourse: '福島競馬場', racecourse_en: 'fukushima', surface: 'ダート', surface_en: 'dirt', distance: 1150, races: 20, wins: 3, places_2: 3, places_3: 3, win_rate: 15.0, place_rate: 45.0, quinella_rate: 30.0, win_payback: 90, place_payback: 87 },
      { rank: 21, name: '福島競馬場 ダ 1700m', racecourse: '福島競馬場', racecourse_en: 'fukushima', surface: 'ダート', surface_en: 'dirt', distance: 1700, races: 24, wins: 4, places_2: 4, places_3: 3, win_rate: 16.7, place_rate: 45.8, quinella_rate: 33.3, win_payback: 93, place_payback: 90 },
      { rank: 22, name: '福島競馬場 ダ 2400m', racecourse: '福島競馬場', racecourse_en: 'fukushima', surface: 'ダート', surface_en: 'dirt', distance: 2400, races: 8, wins: 1, places_2: 1, places_3: 1, win_rate: 12.5, place_rate: 37.5, quinella_rate: 25.0, win_payback: 86, place_payback: 84 },

      // 苦手なコース例（複勝率20%以下、複勝回収率30%未満）
      { rank: 93, name: '中京競馬場 芝 2200m', racecourse: '中京競馬場', racecourse_en: 'chukyo', surface: '芝', surface_en: 'turf', distance: 2200, races: 25, wins: 1, places_2: 2, places_3: 2, win_rate: 4.0, place_rate: 20.0, quinella_rate: 12.0, win_payback: 22, place_payback: 28 },
      { rank: 94, name: '阪神競馬場 ダ 2000m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: 'ダート', surface_en: 'dirt', distance: 2000, races: 28, wins: 1, places_2: 2, places_3: 3, win_rate: 3.6, place_rate: 21.4, quinella_rate: 10.7, win_payback: 20, place_payback: 26 },
      { rank: 95, name: '京都競馬場 芝 3000m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: '芝', surface_en: 'turf', distance: 3000, races: 22, wins: 0, places_2: 2, places_3: 2, win_rate: 0.0, place_rate: 18.2, quinella_rate: 9.1, win_payback: 18, place_payback: 24 },
      { rank: 96, name: '小倉競馬場 ダ 2400m', racecourse: '小倉競馬場', racecourse_en: 'kokura', surface: 'ダート', surface_en: 'dirt', distance: 2400, races: 20, wins: 1, places_2: 1, places_3: 2, win_rate: 5.0, place_rate: 20.0, quinella_rate: 10.0, win_payback: 21, place_payback: 27 },

      // 新潟競馬場
      { rank: 23, name: '新潟競馬場 芝 1000m', racecourse: '新潟競馬場', racecourse_en: 'niigata', surface: '芝', surface_en: 'turf', distance: 1000, races: 30, wins: 6, places_2: 5, places_3: 4, win_rate: 20.0, place_rate: 50.0, quinella_rate: 36.7, win_payback: 101, place_payback: 97 },
      { rank: 24, name: '新潟競馬場 芝 1200m', racecourse: '新潟競馬場', racecourse_en: 'niigata', surface: '芝', surface_en: 'turf', distance: 1200, races: 38, wins: 8, places_2: 7, places_3: 6, win_rate: 21.1, place_rate: 55.3, quinella_rate: 39.5, win_payback: 105, place_payback: 100 },
      { rank: 25, name: '新潟競馬場 芝 1400m', racecourse: '新潟競馬場', racecourse_en: 'niigata', surface: '芝', surface_en: 'turf', distance: 1400, races: 32, wins: 7, places_2: 6, places_3: 5, win_rate: 21.9, place_rate: 56.3, quinella_rate: 40.6, win_payback: 107, place_payback: 102 },
      { rank: 26, name: '新潟競馬場 芝 1600m', racecourse: '新潟競馬場', racecourse_en: 'niigata', surface: '芝', surface_en: 'turf', distance: 1600, races: 42, wins: 9, places_2: 8, places_3: 7, win_rate: 21.4, place_rate: 57.1, quinella_rate: 40.5, win_payback: 106, place_payback: 101 },
      { rank: 27, name: '新潟競馬場 芝 1800m', racecourse: '新潟競馬場', racecourse_en: 'niigata', surface: '芝', surface_en: 'turf', distance: 1800, races: 36, wins: 7, places_2: 7, places_3: 6, win_rate: 19.4, place_rate: 55.6, quinella_rate: 38.9, win_payback: 103, place_payback: 98 },
      { rank: 28, name: '新潟競馬場 芝 2000m', racecourse: '新潟競馬場', racecourse_en: 'niigata', surface: '芝', surface_en: 'turf', distance: 2000, races: 28, wins: 6, places_2: 5, places_3: 4, win_rate: 21.4, place_rate: 53.6, quinella_rate: 39.3, win_payback: 104, place_payback: 99 },
      { rank: 29, name: '新潟競馬場 芝 2200m', racecourse: '新潟競馬場', racecourse_en: 'niigata', surface: '芝', surface_en: 'turf', distance: 2200, races: 20, wins: 4, places_2: 4, places_3: 3, win_rate: 20.0, place_rate: 55.0, quinella_rate: 40.0, win_payback: 102, place_payback: 98 },
      { rank: 30, name: '新潟競馬場 芝 2400m', racecourse: '新潟競馬場', racecourse_en: 'niigata', surface: '芝', surface_en: 'turf', distance: 2400, races: 16, wins: 3, places_2: 3, places_3: 2, win_rate: 18.8, place_rate: 50.0, quinella_rate: 37.5, win_payback: 100, place_payback: 96 },
      { rank: 31, name: '新潟競馬場 ダ 1200m', racecourse: '新潟競馬場', racecourse_en: 'niigata', surface: 'ダート', surface_en: 'dirt', distance: 1200, races: 26, wins: 4, places_2: 4, places_3: 4, win_rate: 15.4, place_rate: 46.2, quinella_rate: 30.8, win_payback: 92, place_payback: 89 },
      { rank: 32, name: '新潟競馬場 ダ 1800m', racecourse: '新潟競馬場', racecourse_en: 'niigata', surface: 'ダート', surface_en: 'dirt', distance: 1800, races: 30, wins: 5, places_2: 5, places_3: 4, win_rate: 16.7, place_rate: 46.7, quinella_rate: 33.3, win_payback: 94, place_payback: 91 },

      // 東京競馬場
      { rank: 33, name: '東京競馬場 芝 1400m', racecourse: '東京競馬場', racecourse_en: 'tokyo', surface: '芝', surface_en: 'turf', distance: 1400, races: 78, wins: 16, places_2: 14, places_3: 12, win_rate: 20.5, place_rate: 53.8, quinella_rate: 38.5, win_payback: 104, place_payback: 99 },
      { rank: 34, name: '東京競馬場 芝 1600m', racecourse: '東京競馬場', racecourse_en: 'tokyo', surface: '芝', surface_en: 'turf', distance: 1600, races: 95, wins: 19, places_2: 17, places_3: 15, win_rate: 20.0, place_rate: 53.7, quinella_rate: 37.9, win_payback: 103, place_payback: 98 },
      { rank: 35, name: '東京競馬場 芝 1800m', racecourse: '東京競馬場', racecourse_en: 'tokyo', surface: '芝', surface_en: 'turf', distance: 1800, races: 82, wins: 17, places_2: 15, places_3: 13, win_rate: 20.7, place_rate: 54.9, quinella_rate: 39.0, win_payback: 105, place_payback: 100 },
      { rank: 36, name: '東京競馬場 芝 2000m', racecourse: '東京競馬場', racecourse_en: 'tokyo', surface: '芝', surface_en: 'turf', distance: 2000, races: 88, wins: 18, places_2: 16, places_3: 14, win_rate: 20.5, place_rate: 54.5, quinella_rate: 38.6, win_payback: 104, place_payback: 99 },
      { rank: 37, name: '東京競馬場 芝 2400m', racecourse: '東京競馬場', racecourse_en: 'tokyo', surface: '芝', surface_en: 'turf', distance: 2400, races: 89, wins: 21, places_2: 18, places_3: 14, win_rate: 23.6, place_rate: 59.6, quinella_rate: 43.8, win_payback: 108, place_payback: 104 },
      { rank: 38, name: '東京競馬場 芝 3400m', racecourse: '東京競馬場', racecourse_en: 'tokyo', surface: '芝', surface_en: 'turf', distance: 3400, races: 12, wins: 3, places_2: 2, places_3: 2, win_rate: 25.0, place_rate: 58.3, quinella_rate: 41.7, win_payback: 110, place_payback: 105 },
      { rank: 39, name: '東京競馬場 ダ 1300m', racecourse: '東京競馬場', racecourse_en: 'tokyo', surface: 'ダート', surface_en: 'dirt', distance: 1300, races: 52, wins: 9, places_2: 8, places_3: 7, win_rate: 17.3, place_rate: 46.2, quinella_rate: 32.7, win_payback: 96, place_payback: 93 },
      { rank: 40, name: '東京競馬場 ダ 1400m', racecourse: '東京競馬場', racecourse_en: 'tokyo', surface: 'ダート', surface_en: 'dirt', distance: 1400, races: 58, wins: 10, places_2: 9, places_3: 8, win_rate: 17.2, place_rate: 46.6, quinella_rate: 32.8, win_payback: 97, place_payback: 94 },
      { rank: 41, name: '東京競馬場 ダ 1600m', racecourse: '東京競馬場', racecourse_en: 'tokyo', surface: 'ダート', surface_en: 'dirt', distance: 1600, races: 64, wins: 11, places_2: 10, places_3: 9, win_rate: 17.2, place_rate: 46.9, quinella_rate: 32.8, win_payback: 98, place_payback: 95 },
      { rank: 42, name: '東京競馬場 ダ 2100m', racecourse: '東京競馬場', racecourse_en: 'tokyo', surface: 'ダート', surface_en: 'dirt', distance: 2100, races: 48, wins: 8, places_2: 7, places_3: 6, win_rate: 16.7, place_rate: 43.8, quinella_rate: 31.3, win_payback: 95, place_payback: 92 },
      { rank: 43, name: '東京競馬場 ダ 2400m', racecourse: '東京競馬場', racecourse_en: 'tokyo', surface: 'ダート', surface_en: 'dirt', distance: 2400, races: 20, wins: 3, places_2: 3, places_3: 3, win_rate: 15.0, place_rate: 45.0, quinella_rate: 30.0, win_payback: 93, place_payback: 90 },

      // 中山競馬場
      { rank: 44, name: '中山競馬場 芝 1200m', racecourse: '中山競馬場', racecourse_en: 'nakayama', surface: '芝', surface_en: 'turf', distance: 1200, races: 68, wins: 14, places_2: 12, places_3: 10, win_rate: 20.6, place_rate: 52.9, quinella_rate: 38.2, win_payback: 103, place_payback: 98 },
      { rank: 45, name: '中山競馬場 芝 1600m', racecourse: '中山競馬場', racecourse_en: 'nakayama', surface: '芝', surface_en: 'turf', distance: 1600, races: 76, wins: 15, places_2: 13, places_3: 11, win_rate: 19.7, place_rate: 51.3, quinella_rate: 36.8, win_payback: 101, place_payback: 97 },
      { rank: 46, name: '中山競馬場 芝 1800m', racecourse: '中山競馬場', racecourse_en: 'nakayama', surface: '芝', surface_en: 'turf', distance: 1800, races: 72, wins: 15, places_2: 13, places_3: 11, win_rate: 20.8, place_rate: 54.2, quinella_rate: 38.9, win_payback: 104, place_payback: 99 },
      { rank: 47, name: '中山競馬場 芝 2000m', racecourse: '中山競馬場', racecourse_en: 'nakayama', surface: '芝', surface_en: 'turf', distance: 2000, races: 92, wins: 20, places_2: 16, places_3: 13, win_rate: 21.7, place_rate: 53.3, quinella_rate: 39.1, win_payback: 102, place_payback: 98 },
      { rank: 48, name: '中山競馬場 芝 2200m', racecourse: '中山競馬場', racecourse_en: 'nakayama', surface: '芝', surface_en: 'turf', distance: 2200, races: 38, wins: 8, places_2: 7, places_3: 6, win_rate: 21.1, place_rate: 55.3, quinella_rate: 39.5, win_payback: 105, place_payback: 100 },
      { rank: 49, name: '中山競馬場 芝 2500m', racecourse: '中山競馬場', racecourse_en: 'nakayama', surface: '芝', surface_en: 'turf', distance: 2500, races: 24, wins: 5, places_2: 4, places_3: 4, win_rate: 20.8, place_rate: 54.2, quinella_rate: 37.5, win_payback: 103, place_payback: 98 },
      { rank: 50, name: '中山競馬場 芝 3600m', racecourse: '中山競馬場', racecourse_en: 'nakayama', surface: '芝', surface_en: 'turf', distance: 3600, races: 8, wins: 2, places_2: 1, places_3: 1, win_rate: 25.0, place_rate: 50.0, quinella_rate: 37.5, win_payback: 108, place_payback: 102 },
      { rank: 51, name: '中山競馬場 ダ 1200m', racecourse: '中山競馬場', racecourse_en: 'nakayama', surface: 'ダート', surface_en: 'dirt', distance: 1200, races: 62, wins: 11, places_2: 10, places_3: 9, win_rate: 17.7, place_rate: 48.4, quinella_rate: 33.9, win_payback: 99, place_payback: 96 },
      { rank: 52, name: '中山競馬場 ダ 1800m', racecourse: '中山競馬場', racecourse_en: 'nakayama', surface: 'ダート', surface_en: 'dirt', distance: 1800, races: 75, wins: 23, places_2: 18, places_3: 12, win_rate: 30.7, place_rate: 70.7, quinella_rate: 54.7, win_payback: 115, place_payback: 108 },
      { rank: 53, name: '中山競馬場 ダ 2400m', racecourse: '中山競馬場', racecourse_en: 'nakayama', surface: 'ダート', surface_en: 'dirt', distance: 2400, races: 16, wins: 3, places_2: 2, places_3: 2, win_rate: 18.8, place_rate: 43.8, quinella_rate: 31.3, win_payback: 97, place_payback: 94 },

      // 中京競馬場
      { rank: 54, name: '中京競馬場 芝 1200m', racecourse: '中京競馬場', racecourse_en: 'chukyo', surface: '芝', surface_en: 'turf', distance: 1200, races: 52, wins: 11, places_2: 9, places_3: 8, win_rate: 21.2, place_rate: 53.8, quinella_rate: 38.5, win_payback: 105, place_payback: 100 },
      { rank: 55, name: '中京競馬場 芝 1400m', racecourse: '中京競馬場', racecourse_en: 'chukyo', surface: '芝', surface_en: 'turf', distance: 1400, races: 48, wins: 10, places_2: 9, places_3: 7, win_rate: 20.8, place_rate: 54.2, quinella_rate: 39.6, win_payback: 104, place_payback: 99 },
      { rank: 56, name: '中京競馬場 芝 1600m', racecourse: '中京競馬場', racecourse_en: 'chukyo', surface: '芝', surface_en: 'turf', distance: 1600, races: 56, wins: 12, places_2: 10, places_3: 9, win_rate: 21.4, place_rate: 55.4, quinella_rate: 39.3, win_payback: 106, place_payback: 101 },
      { rank: 57, name: '中京競馬場 芝 2000m', racecourse: '中京競馬場', racecourse_en: 'chukyo', surface: '芝', surface_en: 'turf', distance: 2000, races: 50, wins: 11, places_2: 9, places_3: 8, win_rate: 22.0, place_rate: 56.0, quinella_rate: 40.0, win_payback: 107, place_payback: 102 },
      { rank: 58, name: '中京競馬場 芝 2200m', racecourse: '中京競馬場', racecourse_en: 'chukyo', surface: '芝', surface_en: 'turf', distance: 2200, races: 28, wins: 6, places_2: 5, places_3: 4, win_rate: 21.4, place_rate: 53.6, quinella_rate: 39.3, win_payback: 105, place_payback: 100 },
      { rank: 59, name: '中京競馬場 ダ 1200m', racecourse: '中京競馬場', racecourse_en: 'chukyo', surface: 'ダート', surface_en: 'dirt', distance: 1200, races: 44, wins: 8, places_2: 7, places_3: 6, win_rate: 18.2, place_rate: 47.7, quinella_rate: 34.1, win_payback: 100, place_payback: 96 },
      { rank: 60, name: '中京競馬場 ダ 1400m', racecourse: '中京競馬場', racecourse_en: 'chukyo', surface: 'ダート', surface_en: 'dirt', distance: 1400, races: 48, wins: 9, places_2: 8, places_3: 7, win_rate: 18.8, place_rate: 50.0, quinella_rate: 35.4, win_payback: 101, place_payback: 97 },
      { rank: 61, name: '中京競馬場 ダ 1800m', racecourse: '中京競馬場', racecourse_en: 'chukyo', surface: 'ダート', surface_en: 'dirt', distance: 1800, races: 40, wins: 7, places_2: 6, places_3: 6, win_rate: 17.5, place_rate: 47.5, quinella_rate: 32.5, win_payback: 98, place_payback: 95 },
      { rank: 62, name: '中京競馬場 ダ 1900m', racecourse: '中京競馬場', racecourse_en: 'chukyo', surface: 'ダート', surface_en: 'dirt', distance: 1900, races: 32, wins: 6, places_2: 5, places_3: 5, win_rate: 18.8, place_rate: 50.0, quinella_rate: 34.4, win_payback: 102, place_payback: 98 },

      // 京都競馬場
      { rank: 63, name: '京都競馬場 芝 1200m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: '芝', surface_en: 'turf', distance: 1200, races: 72, wins: 16, places_2: 14, places_3: 12, win_rate: 22.2, place_rate: 58.3, quinella_rate: 41.7, win_payback: 108, place_payback: 103 },
      { rank: 64, name: '京都競馬場 芝 1400m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: '芝', surface_en: 'turf', distance: 1400, races: 68, wins: 15, places_2: 13, places_3: 11, win_rate: 22.1, place_rate: 57.4, quinella_rate: 41.2, win_payback: 107, place_payback: 102 },
      { rank: 65, name: '京都競馬場 芝 1600m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: '芝', surface_en: 'turf', distance: 1600, races: 85, wins: 19, places_2: 16, places_3: 14, win_rate: 22.4, place_rate: 57.6, quinella_rate: 41.2, win_payback: 108, place_payback: 103 },
      { rank: 66, name: '京都競馬場 芝 1800m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: '芝', surface_en: 'turf', distance: 1800, races: 76, wins: 17, places_2: 15, places_3: 13, win_rate: 22.4, place_rate: 59.2, quinella_rate: 42.1, win_payback: 109, place_payback: 104 },
      { rank: 67, name: '京都競馬場 芝 2000m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: '芝', surface_en: 'turf', distance: 2000, races: 98, wins: 22, places_2: 19, places_3: 15, win_rate: 22.4, place_rate: 57.1, quinella_rate: 41.8, win_payback: 106, place_payback: 102 },
      { rank: 68, name: '京都競馬場 芝 2200m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: '芝', surface_en: 'turf', distance: 2200, races: 52, wins: 12, places_2: 10, places_3: 9, win_rate: 23.1, place_rate: 59.6, quinella_rate: 42.3, win_payback: 110, place_payback: 105 },
      { rank: 69, name: '京都競馬場 芝 2400m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: '芝', surface_en: 'turf', distance: 2400, races: 44, wins: 10, places_2: 9, places_3: 7, win_rate: 22.7, place_rate: 59.1, quinella_rate: 43.2, win_payback: 109, place_payback: 104 },
      { rank: 70, name: '京都競馬場 芝 3000m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: '芝', surface_en: 'turf', distance: 3000, races: 18, wins: 4, places_2: 4, places_3: 3, win_rate: 22.2, place_rate: 61.1, quinella_rate: 44.4, win_payback: 111, place_payback: 106 },
      { rank: 71, name: '京都競馬場 芝 3200m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: '芝', surface_en: 'turf', distance: 3200, races: 12, wins: 3, places_2: 2, places_3: 2, win_rate: 25.0, place_rate: 58.3, quinella_rate: 41.7, win_payback: 112, place_payback: 107 },
      { rank: 72, name: '京都競馬場 ダ 1200m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: 'ダート', surface_en: 'dirt', distance: 1200, races: 58, wins: 10, places_2: 9, places_3: 8, win_rate: 17.2, place_rate: 46.6, quinella_rate: 32.8, win_payback: 98, place_payback: 95 },
      { rank: 73, name: '京都競馬場 ダ 1400m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: 'ダート', surface_en: 'dirt', distance: 1400, races: 64, wins: 11, places_2: 10, places_3: 9, win_rate: 17.2, place_rate: 46.9, quinella_rate: 32.8, win_payback: 99, place_payback: 96 },
      { rank: 74, name: '京都競馬場 ダ 1800m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: 'ダート', surface_en: 'dirt', distance: 1800, races: 70, wins: 12, places_2: 11, places_3: 10, win_rate: 17.1, place_rate: 47.1, quinella_rate: 32.9, win_payback: 100, place_payback: 97 },
      { rank: 75, name: '京都競馬場 ダ 1900m', racecourse: '京都競馬場', racecourse_en: 'kyoto', surface: 'ダート', surface_en: 'dirt', distance: 1900, races: 42, wins: 7, places_2: 6, places_3: 6, win_rate: 16.7, place_rate: 45.2, quinella_rate: 31.0, win_payback: 97, place_payback: 94 },

      // 阪神競馬場
      { rank: 76, name: '阪神競馬場 芝 1200m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: '芝', surface_en: 'turf', distance: 1200, races: 78, wins: 17, places_2: 15, places_3: 13, win_rate: 21.8, place_rate: 57.7, quinella_rate: 41.0, win_payback: 106, place_payback: 101 },
      { rank: 77, name: '阪神競馬場 芝 1400m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: '芝', surface_en: 'turf', distance: 1400, races: 72, wins: 16, places_2: 14, places_3: 12, win_rate: 22.2, place_rate: 58.3, quinella_rate: 41.7, win_payback: 107, place_payback: 102 },
      { rank: 78, name: '阪神競馬場 芝 1600m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: '芝', surface_en: 'turf', distance: 1600, races: 121, wins: 27, places_2: 22, places_3: 18, win_rate: 22.3, place_rate: 55.4, quinella_rate: 40.5, win_payback: 105, place_payback: 101 },
      { rank: 79, name: '阪神競馬場 芝 1800m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: '芝', surface_en: 'turf', distance: 1800, races: 86, wins: 19, places_2: 17, places_3: 14, win_rate: 22.1, place_rate: 58.1, quinella_rate: 41.9, win_payback: 108, place_payback: 103 },
      { rank: 80, name: '阪神競馬場 芝 2000m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: '芝', surface_en: 'turf', distance: 2000, races: 94, wins: 21, places_2: 18, places_3: 15, win_rate: 22.3, place_rate: 57.4, quinella_rate: 41.5, win_payback: 107, place_payback: 102 },
      { rank: 81, name: '阪神競馬場 芝 2200m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: '芝', surface_en: 'turf', distance: 2200, races: 48, wins: 11, places_2: 9, places_3: 8, win_rate: 22.9, place_rate: 58.3, quinella_rate: 41.7, win_payback: 109, place_payback: 104 },
      { rank: 82, name: '阪神競馬場 芝 2400m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: '芝', surface_en: 'turf', distance: 2400, races: 38, wins: 9, places_2: 7, places_3: 6, win_rate: 23.7, place_rate: 57.9, quinella_rate: 42.1, win_payback: 110, place_payback: 105 },
      { rank: 83, name: '阪神競馬場 芝 3000m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: '芝', surface_en: 'turf', distance: 3000, races: 16, wins: 4, places_2: 3, places_3: 3, win_rate: 25.0, place_rate: 62.5, quinella_rate: 43.8, win_payback: 112, place_payback: 107 },
      { rank: 84, name: '阪神競馬場 ダ 1200m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: 'ダート', surface_en: 'dirt', distance: 1200, races: 66, wins: 12, places_2: 11, places_3: 10, win_rate: 18.2, place_rate: 50.0, quinella_rate: 34.8, win_payback: 102, place_payback: 98 },
      { rank: 85, name: '阪神競馬場 ダ 1400m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: 'ダート', surface_en: 'dirt', distance: 1400, races: 68, wins: 18, places_2: 14, places_3: 11, win_rate: 26.5, place_rate: 63.2, quinella_rate: 47.1, win_payback: 110, place_payback: 105 },
      { rank: 86, name: '阪神競馬場 ダ 1800m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: 'ダート', surface_en: 'dirt', distance: 1800, races: 72, wins: 13, places_2: 12, places_3: 11, win_rate: 18.1, place_rate: 50.0, quinella_rate: 34.7, win_payback: 103, place_payback: 99 },
      { rank: 87, name: '阪神競馬場 ダ 2000m', racecourse: '阪神競馬場', racecourse_en: 'hanshin', surface: 'ダート', surface_en: 'dirt', distance: 2000, races: 28, wins: 5, places_2: 4, places_3: 4, win_rate: 17.9, place_rate: 46.4, quinella_rate: 32.1, win_payback: 100, place_payback: 97 },

      // 小倉競馬場
      { rank: 88, name: '小倉競馬場 芝 1200m', racecourse: '小倉競馬場', racecourse_en: 'kokura', surface: '芝', surface_en: 'turf', distance: 1200, races: 56, wins: 12, places_2: 10, places_3: 9, win_rate: 21.4, place_rate: 55.4, quinella_rate: 39.3, win_payback: 105, place_payback: 100 },
      { rank: 89, name: '小倉競馬場 芝 1800m', racecourse: '小倉競馬場', racecourse_en: 'kokura', surface: '芝', surface_en: 'turf', distance: 1800, races: 48, wins: 10, places_2: 9, places_3: 8, win_rate: 20.8, place_rate: 56.3, quinella_rate: 39.6, win_payback: 104, place_payback: 99 },
      { rank: 90, name: '小倉競馬場 芝 2000m', racecourse: '小倉競馬場', racecourse_en: 'kokura', surface: '芝', surface_en: 'turf', distance: 2000, races: 42, wins: 9, places_2: 8, places_3: 7, win_rate: 21.4, place_rate: 57.1, quinella_rate: 40.5, win_payback: 106, place_payback: 101 },
      { rank: 91, name: '小倉競馬場 芝 2600m', racecourse: '小倉競馬場', racecourse_en: 'kokura', surface: '芝', surface_en: 'turf', distance: 2600, races: 16, wins: 3, places_2: 3, places_3: 2, win_rate: 18.8, place_rate: 50.0, quinella_rate: 37.5, win_payback: 101, place_payback: 97 },
      { rank: 92, name: '小倉競馬場 ダ 1000m', racecourse: '小倉競馬場', racecourse_en: 'kokura', surface: 'ダート', surface_en: 'dirt', distance: 1000, races: 24, wins: 4, places_2: 4, places_3: 3, win_rate: 16.7, place_rate: 45.8, quinella_rate: 33.3, win_payback: 94, place_payback: 91 },
      { rank: 93, name: '小倉競馬場 ダ 1700m', racecourse: '小倉競馬場', racecourse_en: 'kokura', surface: 'ダート', surface_en: 'dirt', distance: 1700, races: 38, wins: 7, places_2: 6, places_3: 6, win_rate: 18.4, place_rate: 50.0, quinella_rate: 34.2, win_payback: 99, place_payback: 96 },
      { rank: 94, name: '小倉競馬場 ダ 2400m', racecourse: '小倉競馬場', racecourse_en: 'kokura', surface: 'ダート', surface_en: 'dirt', distance: 2400, races: 10, wins: 2, places_2: 1, places_3: 1, win_rate: 20.0, place_rate: 40.0, quinella_rate: 30.0, win_payback: 102, place_payback: 98 },
    ],
    jockey_stats: [
      { rank: 1, name: '武豊', races: 156, wins: 38, places_2: 28, places_3: 22, win_rate: 24.4, place_rate: 56.4, quinella_rate: 42.3, win_payback: 108, place_payback: 102 },
      { rank: 2, name: 'C.ルメール', races: 145, wins: 35, places_2: 26, places_3: 21, win_rate: 24.1, place_rate: 56.6, quinella_rate: 42.1, win_payback: 106, place_payback: 101 },
      { rank: 3, name: '川田将雅', races: 138, wins: 32, places_2: 25, places_3: 20, win_rate: 23.2, place_rate: 55.8, quinella_rate: 41.3, win_payback: 105, place_payback: 100 },
      { rank: 4, name: '福永祐一', races: 132, wins: 30, places_2: 24, places_3: 19, win_rate: 22.7, place_rate: 55.3, quinella_rate: 40.9, win_payback: 104, place_payback: 99 },
      { rank: 5, name: '松山弘平', races: 128, wins: 29, places_2: 23, places_3: 18, win_rate: 22.7, place_rate: 54.7, quinella_rate: 40.6, win_payback: 103, place_payback: 98 },
      { rank: 6, name: '岩田望来', races: 124, wins: 28, places_2: 22, places_3: 17, win_rate: 22.6, place_rate: 54.0, quinella_rate: 40.3, win_payback: 102, place_payback: 97 },
      { rank: 7, name: '横山武史', races: 118, wins: 26, places_2: 21, places_3: 16, win_rate: 22.0, place_rate: 53.4, quinella_rate: 39.8, win_payback: 101, place_payback: 96 },
      { rank: 8, name: '坂井瑠星', races: 115, wins: 25, places_2: 20, places_3: 16, win_rate: 21.7, place_rate: 53.0, quinella_rate: 39.1, win_payback: 100, place_payback: 95 },
      { rank: 9, name: '団野大成', races: 110, wins: 24, places_2: 19, places_3: 15, win_rate: 21.8, place_rate: 52.7, quinella_rate: 39.1, win_payback: 99, place_payback: 94 },
      { rank: 10, name: '浜中俊', races: 106, wins: 23, places_2: 18, places_3: 15, win_rate: 21.7, place_rate: 52.8, quinella_rate: 38.7, win_payback: 98, place_payback: 93 },
      { rank: 11, name: '和田竜二', races: 102, wins: 22, places_2: 17, places_3: 14, win_rate: 21.6, place_rate: 52.0, quinella_rate: 38.2, win_payback: 97, place_payback: 92 },
      { rank: 12, name: '松若風馬', races: 98, wins: 21, places_2: 16, places_3: 13, win_rate: 21.4, place_rate: 51.0, quinella_rate: 37.8, win_payback: 96, place_payback: 91 },
      { rank: 13, name: '藤岡佑介', races: 95, wins: 20, places_2: 16, places_3: 13, win_rate: 21.1, place_rate: 51.6, quinella_rate: 37.9, win_payback: 95, place_payback: 90 },
      { rank: 14, name: '太宰啓介', races: 92, wins: 19, places_2: 15, places_3: 12, win_rate: 20.7, place_rate: 50.0, quinella_rate: 37.0, win_payback: 94, place_payback: 89 },
      { rank: 15, name: '藤岡康太', races: 88, wins: 18, places_2: 15, places_3: 12, win_rate: 20.5, place_rate: 51.1, quinella_rate: 37.5, win_payback: 93, place_payback: 88 },
      { rank: 16, name: '角田大和', races: 85, wins: 17, places_2: 14, places_3: 11, win_rate: 20.0, place_rate: 49.4, quinella_rate: 36.5, win_payback: 92, place_payback: 87 },
      { rank: 17, name: '富田暁', races: 82, wins: 17, places_2: 13, places_3: 11, win_rate: 20.7, place_rate: 50.0, quinella_rate: 36.6, win_payback: 91, place_payback: 86 },
      { rank: 18, name: '荻野極', races: 78, wins: 16, places_2: 13, places_3: 10, win_rate: 20.5, place_rate: 50.0, quinella_rate: 37.2, win_payback: 90, place_payback: 85 },
      { rank: 19, name: '西村淳也', races: 75, wins: 15, places_2: 12, places_3: 10, win_rate: 20.0, place_rate: 49.3, quinella_rate: 36.0, win_payback: 89, place_payback: 84 },
      { rank: 20, name: '川又賢治', races: 72, wins: 14, places_2: 12, places_3: 9, win_rate: 19.4, place_rate: 48.6, quinella_rate: 36.1, win_payback: 88, place_payback: 83 },
    ],
    track_condition_stats: [
      // 芝
      { surface: '芝', condition: 'firm', condition_label: '良', races: 1158, wins: 228, places_2: 192, places_3: 158, win_rate: 19.7, place_rate: 49.9, quinella_rate: 36.3, win_payback: 104, place_payback: 99 },
      { surface: '芝', condition: 'good', condition_label: '稍重', races: 245, wins: 45, places_2: 36, places_3: 29, win_rate: 18.4, place_rate: 44.9, quinella_rate: 33.1, win_payback: 100, place_payback: 96 },
      { surface: '芝', condition: 'yielding', condition_label: '重', races: 108, wins: 16, places_2: 13, places_3: 11, win_rate: 14.8, place_rate: 37.0, quinella_rate: 26.9, win_payback: 94, place_payback: 90 },
      { surface: '芝', condition: 'soft', condition_label: '不良', races: 52, wins: 6, places_2: 6, places_3: 5, win_rate: 11.5, place_rate: 32.7, quinella_rate: 23.1, win_payback: 87, place_payback: 84 },
      // ダート
      { surface: 'ダ', condition: 'firm', condition_label: '良', races: 698, wins: 124, places_2: 106, places_3: 87, win_rate: 17.8, place_rate: 45.4, quinella_rate: 33.0, win_payback: 99, place_payback: 96 },
      { surface: 'ダ', condition: 'good', condition_label: '稍重', races: 137, wins: 23, places_2: 19, places_3: 15, win_rate: 16.8, place_rate: 41.6, quinella_rate: 30.7, win_payback: 95, place_payback: 92 },
      { surface: 'ダ', condition: 'yielding', condition_label: '重', races: 60, wins: 8, places_2: 7, places_3: 5, win_rate: 13.3, place_rate: 33.3, quinella_rate: 25.0, win_payback: 89, place_payback: 86 },
      { surface: 'ダ', condition: 'soft', condition_label: '不良', races: 31, wins: 3, places_2: 3, places_3: 2, win_rate: 9.7, place_rate: 25.8, quinella_rate: 19.4, win_payback: 82, place_payback: 79 },
    ],
    class_stats: [
      { rank: 1, class_name: 'G1', races: 245, wins: 58, places_2: 48, places_3: 38, win_rate: 23.7, place_rate: 58.8, quinella_rate: 43.3, win_payback: 112, place_payback: 106 },
      { rank: 2, class_name: 'G2', races: 198, wins: 42, places_2: 36, places_3: 30, win_rate: 21.2, place_rate: 54.5, quinella_rate: 39.4, win_payback: 108, place_payback: 103 },
      { rank: 3, class_name: 'G3', races: 186, wins: 38, places_2: 32, places_3: 26, win_rate: 20.4, place_rate: 51.6, quinella_rate: 37.6, win_payback: 105, place_payback: 100 },
      { rank: 4, class_name: 'オープン', races: 356, wins: 68, places_2: 58, places_3: 48, win_rate: 19.1, place_rate: 48.9, quinella_rate: 35.4, win_payback: 102, place_payback: 98 },
      { rank: 5, class_name: '3勝クラス', races: 428, wins: 78, places_2: 65, places_3: 54, win_rate: 18.2, place_rate: 46.0, quinella_rate: 33.4, win_payback: 100, place_payback: 96 },
      { rank: 6, class_name: '2勝クラス', races: 512, wins: 88, places_2: 72, places_3: 60, win_rate: 17.2, place_rate: 43.0, quinella_rate: 31.3, win_payback: 97, place_payback: 93 },
      { rank: 7, class_name: '1勝クラス', races: 382, wins: 58, places_2: 48, places_3: 38, win_rate: 15.2, place_rate: 37.7, quinella_rate: 27.7, win_payback: 94, place_payback: 90 },
      { rank: 8, class_name: '未勝利', races: 182, wins: 23, places_2: 23, places_3: 18, win_rate: 12.6, place_rate: 35.2, quinella_rate: 25.3, win_payback: 88, place_payback: 85 },
      { rank: 9, class_name: '新馬', races: 124, wins: 18, places_2: 16, places_3: 13, win_rate: 14.5, place_rate: 37.9, quinella_rate: 27.4, win_payback: 91, place_payback: 88 },
    ],
    owner_stats: [
      { rank: 1, name: 'サンデーレーシング', races: 125, wins: 28, places_2: 22, places_3: 18, win_rate: 22.4, place_rate: 54.4, quinella_rate: 40.0, win_payback: 106, place_payback: 101 },
      { rank: 2, name: 'キャロットファーム', races: 118, wins: 26, places_2: 21, places_3: 17, win_rate: 22.0, place_rate: 54.2, quinella_rate: 39.8, win_payback: 105, place_payback: 100 },
      { rank: 3, name: 'シルクレーシング', races: 112, wins: 24, places_2: 20, places_3: 16, win_rate: 21.4, place_rate: 53.6, quinella_rate: 39.3, win_payback: 104, place_payback: 99 },
      { rank: 4, name: '金子真人ホールディングス', races: 105, wins: 22, places_2: 18, places_3: 15, win_rate: 21.0, place_rate: 52.4, quinella_rate: 38.1, win_payback: 103, place_payback: 98 },
      { rank: 5, name: '社台レースホース', races: 98, wins: 20, places_2: 17, places_3: 14, win_rate: 20.4, place_rate: 52.0, quinella_rate: 37.8, win_payback: 102, place_payback: 97 },
      { rank: 6, name: 'G1レーシング', races: 92, wins: 19, places_2: 16, places_3: 13, win_rate: 20.7, place_rate: 52.2, quinella_rate: 38.0, win_payback: 101, place_payback: 96 },
      { rank: 7, name: 'DMMドリームクラブ', races: 88, wins: 18, places_2: 15, places_3: 12, win_rate: 20.5, place_rate: 51.1, quinella_rate: 37.5, win_payback: 100, place_payback: 95 },
      { rank: 8, name: '東京ホースレーシング', races: 85, wins: 17, places_2: 14, places_3: 12, win_rate: 20.0, place_rate: 50.6, quinella_rate: 36.5, win_payback: 99, place_payback: 94 },
      { rank: 9, name: 'ノルマンディーサラブレッドレーシング', races: 82, wins: 16, places_2: 14, places_3: 11, win_rate: 19.5, place_rate: 50.0, quinella_rate: 36.6, win_payback: 98, place_payback: 93 },
      { rank: 10, name: 'ロードホースクラブ', races: 78, wins: 15, places_2: 13, places_3: 11, win_rate: 19.2, place_rate: 50.0, quinella_rate: 35.9, win_payback: 97, place_payback: 92 },
      { rank: 11, name: 'ラッキーフィールド', races: 75, wins: 14, places_2: 13, places_3: 10, win_rate: 18.7, place_rate: 49.3, quinella_rate: 36.0, win_payback: 96, place_payback: 91 },
      { rank: 12, name: 'サトミホースカンパニー', races: 72, wins: 14, places_2: 12, places_3: 10, win_rate: 19.4, place_rate: 50.0, quinella_rate: 36.1, win_payback: 95, place_payback: 90 },
      { rank: 13, name: 'グリーンファーム', races: 68, wins: 13, places_2: 11, places_3: 9, win_rate: 19.1, place_rate: 48.5, quinella_rate: 35.3, win_payback: 94, place_payback: 89 },
      { rank: 14, name: 'Him Rock Racing', races: 65, wins: 12, places_2: 11, places_3: 9, win_rate: 18.5, place_rate: 49.2, quinella_rate: 35.4, win_payback: 93, place_payback: 88 },
      { rank: 15, name: 'サラブレッドクラブ・ラフィアン', races: 62, wins: 12, places_2: 10, places_3: 8, win_rate: 19.4, place_rate: 48.4, quinella_rate: 35.5, win_payback: 92, place_payback: 87 },
      { rank: 16, name: 'ウイン', races: 58, wins: 11, places_2: 10, places_3: 8, win_rate: 19.0, place_rate: 50.0, quinella_rate: 36.2, win_payback: 91, place_payback: 86 },
      { rank: 17, name: 'ターフ・スポート', races: 55, wins: 10, places_2: 9, places_3: 7, win_rate: 18.2, place_rate: 47.3, quinella_rate: 34.5, win_payback: 90, place_payback: 85 },
      { rank: 18, name: '吉田勝己', races: 52, wins: 10, places_2: 8, places_3: 7, win_rate: 19.2, place_rate: 48.1, quinella_rate: 34.6, win_payback: 89, place_payback: 84 },
      { rank: 19, name: '猪熊広次', races: 48, wins: 9, places_2: 8, places_3: 6, win_rate: 18.8, place_rate: 47.9, quinella_rate: 35.4, win_payback: 88, place_payback: 83 },
      { rank: 20, name: '里見治', races: 45, wins: 8, places_2: 7, places_3: 6, win_rate: 17.8, place_rate: 46.7, quinella_rate: 33.3, win_payback: 87, place_payback: 82 },
    ],
    gender_stats: [
      { name: '牡馬', races: 1456, wins: 268, places_2: 225, places_3: 185, win_rate: 18.4, place_rate: 46.6, quinella_rate: 33.9, win_payback: 102, place_payback: 97 },
      { name: '牝馬', races: 856, wins: 145, places_2: 120, places_3: 98, win_rate: 16.9, place_rate: 42.4, quinella_rate: 31.0, win_payback: 98, place_payback: 93 },
      { name: 'セン馬', races: 177, wins: 40, places_2: 37, places_3: 29, win_rate: 22.6, place_rate: 59.9, quinella_rate: 43.5, win_payback: 108, place_payback: 103 },
    ],
    interval_stats: [
      { interval: '連闘', races: 245, wins: 52, places_2: 41, places_3: 35, win_rate: 21.2, place_rate: 52.2, quinella_rate: 38.0, win_payback: 105, place_payback: 101 },
      { interval: '2-4週', races: 1523, wins: 285, places_2: 238, places_3: 195, win_rate: 18.7, place_rate: 47.1, quinella_rate: 34.3, win_payback: 103, place_payback: 98 },
      { interval: '5-7週', races: 456, wins: 75, places_2: 62, places_3: 51, win_rate: 16.4, place_rate: 41.2, quinella_rate: 30.0, win_payback: 97, place_payback: 92 },
      { interval: '8-10週', races: 198, wins: 28, places_2: 25, places_3: 21, win_rate: 14.1, place_rate: 37.4, quinella_rate: 26.8, win_payback: 92, place_payback: 88 },
      { interval: '11週-', races: 267, wins: 33, places_2: 30, places_3: 25, win_rate: 12.4, place_rate: 33.0, quinella_rate: 23.6, win_payback: 89, place_payback: 85 },
    ],
    characteristics: {
      volatility: 3,
      trifecta_avg_payback_rank: 50,
      total_courses: 100,
      trifecta_median_payback: 65.8,
      trifecta_all_median_payback: 58.3,
      gate_position: 3,
      running_style_trend_position: 2,
      distance_trend_position: 4,
    },
    running_style_trends: [
      { style: 'escape', style_label: '逃げ', place_rate: 35.5 },
      { style: 'lead', style_label: '先行', place_rate: 32.8 },
      { style: 'pursue', style_label: '差し', place_rate: 28.2 },
      { style: 'close', style_label: '追込', place_rate: 25.1 },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  // GCSから調教師データを取得
  let trainer: TrainerData;
  try {
    trainer = await getTrainerDataFromGCS(id) as TrainerData;
  } catch (error) {
    console.error(`Failed to load trainer data for ${id} in generateMetadata:`, error);
    return {
      title: '調教師データが見つかりません | 競馬データ.com',
    };
  }

  const title = `${trainer.name}調教師の成績・特徴まとめ｜得意な条件がまるわかり！`;
  const description = `${trainer.name}調教師の成績や特徴を徹底分析！得意なコースや得意な距離など、豊富な統計データで予想をサポート。`;
  const url = `https://www.keibadata.com/trainers/${id}`;

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

export default async function TrainerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // GCSから調教師データを取得
  let trainer: TrainerData;
  try {
    trainer = await getTrainerDataFromGCS(id) as TrainerData;

    // 必須フィールドの存在チェック
    // popularity_statsはオブジェクト、他は配列
    if (!trainer ||
        !Array.isArray(trainer.yearly_stats) ||
        !Array.isArray(trainer.distance_stats) ||
        !Array.isArray(trainer.surface_stats) ||
        !Array.isArray(trainer.class_stats) ||
        !trainer.popularity_stats || typeof trainer.popularity_stats !== 'object' ||
        !Array.isArray(trainer.gender_stats) ||
        !Array.isArray(trainer.course_stats) ||
        !Array.isArray(trainer.racecourse_stats)) {
      console.error(`Incomplete data for trainer ${id}`);
      notFound();
    }

    // interval_statsの全カテゴリを保証（欠けているカテゴリを0で補完）
    const defaultIntervals = [
      { interval: '連闘', races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, place_rate: 0, quinella_rate: 0, win_payback: 0, place_payback: 0 },
      { interval: '1-3週', races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, place_rate: 0, quinella_rate: 0, win_payback: 0, place_payback: 0 },
      { interval: '4-7週', races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, place_rate: 0, quinella_rate: 0, win_payback: 0, place_payback: 0 },
      { interval: '8-10週', races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, place_rate: 0, quinella_rate: 0, win_payback: 0, place_payback: 0 },
      { interval: '11週-', races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, place_rate: 0, quinella_rate: 0, win_payback: 0, place_payback: 0 },
    ];

    // 既存のデータがあれば上書き、なければデフォルト値を使用
    trainer.interval_stats = defaultIntervals.map(defaultInterval => {
      const existingData = trainer.interval_stats?.find(s => s.interval === defaultInterval.interval);
      return existingData || defaultInterval;
    });
  } catch (error) {
    console.error(`Failed to load trainer data for ${id}:`, error);
    notFound();
  }

  // 現在の年度を取得
  const currentYear = new Date().getFullYear();

  // チャート用: 左から2年前→1年前→当年
  const yearsForChart = [currentYear - 2, currentYear - 1, currentYear];
  const yearlyStatsDataForChart = yearsForChart.map(year => {
    const existingData = trainer.yearly_stats.find(stat => stat.year === year);
    return existingData ? {
      year: year,
      races: existingData.races,
      wins: existingData.wins,
      places_2: existingData.places_2,
      places_3: existingData.places_3,
      win_rate: existingData.win_rate,
      quinella_rate: existingData.quinella_rate,
      place_rate: existingData.place_rate,
      win_payback: existingData.win_payback || 0,
      place_payback: existingData.place_payback || 0,
      avg_popularity: existingData.avg_popularity,
      avg_rank: existingData.avg_rank,
      median_popularity: existingData.median_popularity,
      median_rank: existingData.median_rank,
    } : {
      year: year,
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

  // テーブル用: 上から当年→1年前→2年前
  const yearsForTable = [currentYear, currentYear - 1, currentYear - 2];
  const yearlyStatsDataForTable = yearsForTable.map(year => {
    const existingData = trainer.yearly_stats.find(stat => stat.year === year);
    return existingData ? {
      year: year,
      races: existingData.races,
      wins: existingData.wins,
      places_2: existingData.places_2,
      places_3: existingData.places_3,
      win_rate: existingData.win_rate,
      quinella_rate: existingData.quinella_rate,
      place_rate: existingData.place_rate,
      win_payback: existingData.win_payback || 0,
      place_payback: existingData.place_payback || 0,
      avg_popularity: existingData.avg_popularity,
      avg_rank: existingData.avg_rank,
      median_popularity: existingData.median_popularity,
      median_rank: existingData.median_rank,
    } : {
      year: year,
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

  // 距離別データをテーブル形式に変換（順位なし）
  const distanceStatsData = trainer.distance_stats.map((stat) => ({
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

  // 距離別データを2グループに統合（短〜マ と 中〜長）
  const mergedDistanceStats = (() => {
    const short = trainer.distance_stats.find(s => s.category === '短距離');
    const mile = trainer.distance_stats.find(s => s.category === 'マイル');
    const middle = trainer.distance_stats.find(s => s.category === '中距離');
    const long = trainer.distance_stats.find(s => s.category === '長距離');

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

  // 芝・ダート別データをテーブル形式に変換（順位なし）
  const surfaceStatsData = trainer.surface_stats.map((stat) => ({
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
    avg_popularity: stat.avg_popularity,
    avg_rank: stat.avg_rank,
    median_popularity: stat.median_popularity,
    median_rank: stat.median_rank,
  }));

  // 馬場状態別データをテーブル形式に変換（順位なし）
  const trackConditionStatsData = (trainer.track_condition_stats || []).map((stat) => {
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
  const classStatsData = trainer.class_stats.map((stat) => ({
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
  const courseTableData = trainer.course_stats
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

  // 競馬場別サマリーデータをracecourse_statsから取得し、順番を整理
  const racecourseSummaryData = racecourseOrder
    .map(racecourseItem => {
      // name フィールド(日本語)または racecourse_en フィールドで検索
      // GCSデータの name には「競馬場」が付いていないため、削除して比較
      const racecourseNameWithoutSuffix = racecourseItem.ja.replace('競馬場', '');
      const racecourse = trainer.racecourse_stats?.find(r =>
        r.racecourse_en === racecourseItem.en || r.name === racecourseNameWithoutSuffix
      );
      if (!racecourse) return null;
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
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // GCSから計算済みの中央・ローカルデータを取得
  const centralData = trainer.racecourse_stats?.find(r => r.racecourse_en === 'central' || r.name === '中央') || null;
  const localData = trainer.racecourse_stats?.find(r => r.racecourse_en === 'local' || r.name === 'ローカル') || null;

  // 競馬場データの最後に中央・ローカルを追加
  const racecourseSummaryDataWithTotals = [
    ...racecourseSummaryData,
    ...(centralData ? [centralData] : []),
    ...(localData ? [localData] : [])
  ];

  // ナビゲーションアイテム
  const navigationItems = [
    { id: 'leading', label: '年度別' },
    { id: 'characteristics', label: '特徴' },
    { id: 'highlights-section', label: '注目ポイント' },
    { id: 'class-stats', label: 'クラス別' },
    { id: 'popularity-stats', label: '人気別' },
    { id: 'distance-stats', label: '距離別' },
    { id: 'gender-stats', label: '性別' },
    { id: 'interval-stats', label: 'レース間隔' },
    { id: 'surface-stats', label: 'コース区分別' },
    { id: 'racecourse-stats', label: '競馬場別' },
    { id: 'course-stats', label: 'コース別' },
    { id: 'jockey-stats', label: '騎手別' },
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
        name: '調教師データ',
        item: `${baseUrl}/trainers`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: trainer.name,
        item: `${baseUrl}/trainers/${id}`,
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
            <Link href="/trainers">調教師一覧</Link>
            <span> &gt; </span>
            <span>{trainer.name}</span>
          </nav>

          {/* 調教師ヘッダー */}
          <div className="page-header">
            <h1>{trainer.name}調教師の成績・データ</h1>

            {/* データ情報セクション */}
            <div className="course-meta-section">
              <div className="meta-item">
                <span className="meta-label">データ取得期間</span>
                <span>
                  直近3年間分
                  <span className="meta-sub-text">
                    {trainer.data_period.match(/（[^）]+）/)?.[0] || trainer.data_period}
                  </span>
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">対象レース数</span>
                <span>{trainer.total_races.toLocaleString()}レース</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">最終更新日</span>
                <span>{trainer.last_updated}</span>
              </div>
            </div>
          </div>

          <article className="content-card">
          {/* 年度別成績セクション */}
          <section id="leading" aria-label="年度別成績">
            <JockeyLeadingChart
              title={`${trainer.name}調教師 年度別成績`}
              data={(() => {
                // チャート用: 左から2年前→1年前→当年の順で、データがない年も含める
                return yearsForChart.map(year => {
                  const existingData = trainer.yearly_leading.find(stat => stat.year === year);
                  return existingData || {
                    year,
                    wins: 0,
                    ranking: 0,
                  };
                });
              })()}
            >
              <YearlyTable
                data={yearlyStatsDataForTable}
              />
            </JockeyLeadingChart>
          </section>

          {/* 調教師特徴セクション */}
          {trainer.characteristics && (
            <section id="characteristics" aria-label="調教師特徴">
              <BarChartAnimation>
                <h2 className="section-title">{trainer.name}調教師の特徴</h2>

                {/* 得意なコース傾向 */}
                <div className="gauge-item">
                  <div className="gauge-header">
                    <h3 className="gauge-label">得意なコース傾向</h3>
                    <GatePositionExplanation pageType="trainer" />
                  </div>
                  <div className="gauge-track">
                    <div className="gauge-indicator" style={{ left: `${(trainer.characteristics.gate_position - 1) * 25}%` }}></div>
                    <div className="gauge-horse-icon" style={{ left: `${(trainer.characteristics.gate_position - 1) * 25}%` }}>🏇</div>
                  </div>
                  <div className="gauge-labels">
                    <span>ダート</span>
                    <span>互角</span>
                    <span>芝</span>
                  </div>
                  <div className="gauge-result">
                    {trainer.characteristics.gate_position === 1 && 'ダートが得意'}
                    {trainer.characteristics.gate_position === 2 && 'ややダートが得意'}
                    {trainer.characteristics.gate_position === 3 && '互角'}
                    {trainer.characteristics.gate_position === 4 && 'やや芝が得意'}
                    {trainer.characteristics.gate_position === 5 && '芝が得意'}
                  </div>

                  {/* コース別複勝率グラフ */}
                  <div className="gate-place-rate-detail">
                    <div className="gate-detail-title">コース別複勝率</div>
                    <div className="gate-chart">
                      {trainer.surface_stats
                        .filter(surface => surface.surface !== '障害')
                        .sort((a, b) => a.surface === '芝' ? -1 : 1)
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
                {trainer.characteristics.distance_trend_position && (
                  <div className="gauge-item">
                    <div className="gauge-header">
                      <h3 className="gauge-label">得意な距離傾向</h3>
                      <DistanceTrendExplanation />
                    </div>
                    <div className="gauge-track">
                      <div className="gauge-indicator" style={{ left: `${(trainer.characteristics.distance_trend_position - 1) * 25}%` }}></div>
                      <div className="gauge-horse-icon" style={{ left: `${(trainer.characteristics.distance_trend_position - 1) * 25}%` }}>🏇</div>
                    </div>
                    <div className="gauge-labels">
                      <span>短距離が得意</span>
                      <span>互角</span>
                      <span>長距離が得意</span>
                    </div>
                    <div className="gauge-result">
                      {trainer.characteristics.distance_trend_position === 1 && '短距離が得意'}
                      {trainer.characteristics.distance_trend_position === 2 && 'やや短距離が得意'}
                      {trainer.characteristics.distance_trend_position === 3 && '互角'}
                      {trainer.characteristics.distance_trend_position === 4 && 'やや長距離が得意'}
                      {trainer.characteristics.distance_trend_position === 5 && '長距離が得意'}
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
                            <div className="gate-rate">{distance.place_rate.toFixed(1)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <DistanceDefinition />
                  </div>
                )}

              </BarChartAnimation>
            </section>
          )}

          {/* 注目ポイントセクション */}
          <JockeyTrainerHighlights
            course_stats={trainer.course_stats}
          />

          {/* クラス別データセクション */}
          <section id="class-stats" aria-label="クラス別データ">
            <ClassTable
              title={`${trainer.name}調教師 クラス別データ`}
              data={trainer.class_stats}
            />
          </section>

          {/* 人気別データセクション */}
          <section id="popularity-stats" aria-label="人気別データ">
            <PopularityTable
              title={`${trainer.name}調教師 人気別データ`}
              data={trainer.popularity_stats}
            />
          </section>

          {/* 距離別データセクション */}
          <section id="distance-stats" aria-label="距離別データ">
            <DistanceTable
              title={`${trainer.name}調教師 距離別データ`}
              data={mergedDistanceStats}
            />
          </section>

          {/* 性別データセクション */}
          <section id="gender-stats" aria-label="性別データ">
            <GenderTable
              title={`${trainer.name}調教師 性別データ`}
              data={trainer.gender_stats}
            />
          </section>

          {/* レース間隔別データセクション */}
          <section id="interval-stats" aria-label="レース間隔別データ">
            <IntervalTable
              title={`${trainer.name}調教師 レース間隔別データ`}
              data={trainer.interval_stats}
            />
          </section>

          {/* コース区分別データセクション */}
          <section id="surface-stats" aria-label="コース区分別データ">
            <SurfaceTable
              title={`${trainer.name}調教師 コース区分別データ`}
              data={surfaceStatsData}
            />
          </section>

          {/* 競馬場別成績セクション */}
          <section id="racecourse-stats" aria-label="競馬場別成績">
            <RacecourseTable
              title={`${trainer.name}調教師 競馬場別成績`}
              data={racecourseSummaryDataWithTotals}
            />
          </section>

          {/* コース別成績 */}
          <section id="course-stats" aria-label="コース別成績">
            <RacecourseCourseTable
              title={`${trainer.name}調教師 コース別成績`}
              data={coursesByRacecourse}
            />
          </section>

          {/* 騎手別データセクション */}
          <section id="jockey-stats" aria-label="騎手別データ">
            <DataTable
              title={`${trainer.name}調教師 騎手別データ`}
              data={trainer.jockey_stats}
              initialShow={10}
              nameLabel="騎手"
            />
          </section>

          {/* 馬主別データセクション */}
          <section id="owner-stats" aria-label="馬主別データ">
            <DataTable
              title={`${trainer.name}調教師 馬主別データ`}
              data={trainer.owner_stats}
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
