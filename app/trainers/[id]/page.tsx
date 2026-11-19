import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getTrainerDataFromGCS } from '@/lib/getTrainerDataFromGCS';
import { ALL_TRAINERS } from '@/lib/trainers';
import { ALL_JOCKEYS } from '@/lib/jockeys';
import { buildTrainerSummaryKeyed } from '@/lib/dataPageText';
import { jaDateToIso, periodFromDataPeriod, buildWebPageJsonLd } from '@/lib/dataDate';
import { toTrainerSummaryBlocks } from '@/lib/trainerPageData';
import { resolveCourseUrl, courseLabel } from '@/lib/courseLinks';
import { MIN_RACES_FOR_TRENDS, hasEnoughRaces, THIN_PAGE_ROBOTS } from '@/lib/dataPageRules';
import { trainerDescription } from '@/lib/metaDescriptions';
import { ageAt, buildGradedAnswer, formatTitles, buildPersonLead, gradedTotals, jaDate, thisYearOf, type GradedWin, type NotableHorse, type PersonProfile } from '@/lib/entityExtras';
import {
  About, Ad, BestNote, Cnt, CourseAcc, DefLink, EntityRoot, Faq, GTag, GradedWins, H, Head, Highlights, Hero, Hno, HorseList, MaybeLink, Meters,
  Nb, PageNav, Pn, Sec, SfTag, Stats, Subs, Summary, ThinNote, Tiles, Titles, sfKey,
  type CourseRow, type NameLink,
} from '@/components/v6/entity/parts';
import { YearCharts } from '@/components/v6/entity/charts';
import { R, ZERO, fill, int, pct, slashDate, type Row } from '@/components/v6/entity/format';
import type { StatsProps } from '@/components/v6/entity/Stats';
import { cx } from '@/components/v6/entity/cx';

// 旧部品の行の型（集計の途中で使う）
type ConditionRow = any;

// ISR: 週1回（604800秒）再生成
export const revalidate = 604800;

// generateStaticParams: 全調教師ページを事前生成
export async function generateStaticParams() {
  return ALL_TRAINERS.map((trainer) => ({
    id: String(trainer.id),
  }));
}

// 定義済みID以外のURLは404を返す（ソフト404の防止）
export const dynamicParams = false;

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

  // 「〇〇厩舎」「〇〇厩舎 評判」でも検索されるため、厩舎の語を入れる
  // 検索語「〇〇厩舎 傾向」「〇〇厩舎 データ」に合わせて前半に置く
  const title = `${trainer.name}厩舎（調教師）の傾向・データ｜成績・得意条件と騎手相性【毎週更新】`;
  // 検索結果で他の調教師と見分けられるよう、固有の数値を入れる
  const description = trainerDescription(trainer);
  const url = `https://www.keibadata.com/trainers/${id}`;

  return {
    title,
    description,
    // 対象レース数が少ないページは傾向判定を出さず、インデックスもさせない（コースページと同じ方針）
    ...(hasEnoughRaces(trainer.total_races) ? {} : { robots: THIN_PAGE_ROBOTS }),
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

  // 距離別データを2グループに統合（特徴セクション用: 短〜マ と 中〜長）
  const mergedDistanceStats = (() => {
    const short = trainer.distance_stats.find(s => s.category === '短距離');
    const mile = trainer.distance_stats.find(s => s.category === 'マイル');
    const middle = trainer.distance_stats.find(s => s.category === '中距離');
    const long = trainer.distance_stats.find(s => s.category === '長距離');
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

  // ===== データQ&A 回答生成 =====
  const formatTrainerCourseName = (c: { racecourse: string; surface_en: string; distance: number; variant?: string }) => {
    const rc = c.racecourse.replace('競馬場', '');
    const surf = c.surface_en === 'turf' ? '芝' : c.surface_en === 'dirt' ? 'ダート' : '障害';
    const variant = c.variant === 'inner' || c.variant === '内' ? '内回り' : c.variant === 'outer' || c.variant === '外' ? '外回り' : '';
    return `${rc}${surf}${c.distance}m${variant}`;
  };
  const stripBoldTrainer = (text: string) => text.replace(/\*\*([^*]+)\*\*/g, '$1');

  // 得意な競馬場 / 苦手な競馬場
  const trainerRacecourseQualified = (trainer.racecourse_stats ?? [])
    .filter(r => r.name !== '中央' && r.name !== 'ローカル' && r.races >= 20);
  const trainerGoodRacecourseAnswer = (() => {
    if (trainerRacecourseQualified.length === 0) return '対象となる競馬場が存在しません。\n※直近3年間で20走以上を対象としています。';
    const rcName = (r: { name: string }) => r.name.endsWith('競馬場') ? r.name : `${r.name}競馬場`;
    const byWin = [...trainerRacecourseQualified].sort((a, b) => b.win_rate - a.win_rate).slice(0, 3)
      .map(r => `${rcName(r)}（**${r.win_rate.toFixed(1)}%**）`).join('、');
    const byPlace = [...trainerRacecourseQualified].sort((a, b) => b.place_rate - a.place_rate).slice(0, 3)
      .map(r => `${rcName(r)}（**${r.place_rate.toFixed(1)}%**）`).join('、');
    return [
      byWin ? `勝率が高い競馬場TOP3は${byWin}です。` : '',
      byPlace ? `複勝率が高い競馬場TOP3は${byPlace}です。` : '',
      '※直近3年間で20走以上を対象としています。',
    ].filter(Boolean).join('\n');
  })();
  const trainerBadRacecourseAnswer = (() => {
    if (trainerRacecourseQualified.length === 0) return '対象となる競馬場が存在しません。\n※直近3年間で20走以上を対象としています。';
    const rcName = (r: { name: string }) => r.name.endsWith('競馬場') ? r.name : `${r.name}競馬場`;
    const byWin = [...trainerRacecourseQualified].sort((a, b) => a.win_rate - b.win_rate).slice(0, 3)
      .map(r => `${rcName(r)}（**${r.win_rate.toFixed(1)}%**）`).join('、');
    const byPlace = [...trainerRacecourseQualified].sort((a, b) => a.place_rate - b.place_rate).slice(0, 3)
      .map(r => `${rcName(r)}（**${r.place_rate.toFixed(1)}%**）`).join('、');
    return [
      byWin ? `勝率が低い競馬場TOP3は${byWin}です。` : '',
      byPlace ? `複勝率が低い競馬場TOP3は${byPlace}です。` : '',
      '※直近3年間で20走以上を対象としています。',
    ].filter(Boolean).join('\n');
  })();

  // 得意なコース / 苦手なコース
  const trainerCourseQualified = (trainer.course_stats ?? []).filter(c => c.races >= 10 && c.surface_en !== 'obstacle');
  const trainerGoodCourseAnswer = (() => {
    if (trainerCourseQualified.length === 0) return '対象となるコースが存在しません。\n※直近3年間で10走以上を対象としています。';
    const byWin = [...trainerCourseQualified].sort((a, b) => b.win_rate - a.win_rate).slice(0, 3)
      .map(c => `${formatTrainerCourseName(c)}（**${c.win_rate.toFixed(1)}%**）`).join('、');
    const byPlace = [...trainerCourseQualified].sort((a, b) => b.place_rate - a.place_rate).slice(0, 3)
      .map(c => `${formatTrainerCourseName(c)}（**${c.place_rate.toFixed(1)}%**）`).join('、');
    return [
      byWin ? `勝率が高いコースTOP3は${byWin}です。` : '',
      byPlace ? `複勝率が高いコースTOP3は${byPlace}です。` : '',
      '※直近3年間で10走以上を対象としています。',
    ].filter(Boolean).join('\n');
  })();
  const trainerBadCourseAnswer = (() => {
    if (trainerCourseQualified.length === 0) return '対象となるコースが存在しません。\n※直近3年間で10走以上を対象としています。';
    const byWin = [...trainerCourseQualified].sort((a, b) => a.win_rate - b.win_rate).slice(0, 3)
      .map(c => `${formatTrainerCourseName(c)}（**${c.win_rate.toFixed(1)}%**）`).join('、');
    const byPlace = [...trainerCourseQualified].sort((a, b) => a.place_rate - b.place_rate).slice(0, 3)
      .map(c => `${formatTrainerCourseName(c)}（**${c.place_rate.toFixed(1)}%**）`).join('、');
    return [
      byWin ? `勝率が低いコースTOP3は${byWin}です。` : '',
      byPlace ? `複勝率が低いコースTOP3は${byPlace}です。` : '',
      '※直近3年間で10走以上を対象としています。',
    ].filter(Boolean).join('\n');
  })();

  // 芝とダートどちらが得意？
  const trainerTurfStat = trainer.surface_stats.find(s => s.surface === '芝');
  const trainerDirtStat = trainer.surface_stats.find(s => s.surface === 'ダート');
  const trainerSurfaceFaqAnswer = (() => {
    if (!trainerTurfStat && !trainerDirtStat) return '対象となるデータが存在しません。';
    if (!trainerTurfStat) return `ダートの成績のみあります。ダートの複勝率は**${trainerDirtStat!.place_rate.toFixed(1)}%**です。`;
    if (!trainerDirtStat) return `芝の成績のみあります。芝の複勝率は**${trainerTurfStat.place_rate.toFixed(1)}%**です。`;
    const diff = trainerTurfStat.place_rate - trainerDirtStat.place_rate;
    const detail = `芝の複勝率は**${trainerTurfStat.place_rate.toFixed(1)}%**、ダートは**${trainerDirtStat.place_rate.toFixed(1)}%**です。`;
    if (diff >= 5) return `芝の方が得意な傾向があります。\n${detail}`;
    if (diff >= 3) return `やや芝の方が得意な傾向があります。\n${detail}`;
    if (diff <= -5) return `ダートの方が得意な傾向があります。\n${detail}`;
    if (diff <= -3) return `ややダートの方が得意な傾向があります。\n${detail}`;
    return `芝とダートで差はありません。\n${detail}`;
  })();

  // 得意な距離は？
  const trainerDistanceCategoryFullName = (cat: string) =>
    cat === '短〜マ' ? '短距離〜マイル' : cat === '中〜長' ? '中距離〜長距離' : cat;
  const trainerDistanceFaqAnswer = (() => {
    const groups = mergedDistanceStats as any[];
    if (groups.length === 0) return '対象となるデータが存在しません。';
    const best = [...groups].sort((a, b) => b.place_rate - a.place_rate)[0];
    const other = groups.find(g => g.category !== best.category);
    const diff = other ? best.place_rate - other.place_rate : 0;
    const detail = groups.map(g => `${trainerDistanceCategoryFullName(g.category)}の複勝率は**${g.place_rate.toFixed(1)}%**`).join('、');
    const conclusion = diff >= 5
      ? `${trainerDistanceCategoryFullName(best.category)}が得意な傾向があります。`
      : diff >= 3
      ? `やや${trainerDistanceCategoryFullName(best.category)}が得意な傾向があります。`
      : '距離帯で差はありません。';
    return [conclusion, `${detail}です。`].join('\n');
  })();

  // 検索意図に合わせた追加項目（gcs/v2/generate_extras.py）：基本情報・重賞勝ち・現役の主な管理馬・馬齢別
  const trainerProfile: PersonProfile = (trainer as any).profile ?? {};
  const trainerGradedWins: GradedWin[] = (trainer as any).graded_wins ?? [];
  const activeHorses: NotableHorse[] = (trainer as any).active_horses ?? [];
  const trainerAgeRows: ConditionRow[] = ((trainer as any).age_stats ?? []).map((r: any) => ({ ...r, label: r.age }));
  const trainerGraded = gradedTotals(trainer.class_stats as any);
  const trainerThisYear = thisYearOf(trainer.yearly_leading as any);
  const trainerAsOf = new Date(jaDateToIso(trainer.last_updated) ?? Date.now());
  const trainerAge = ageAt(trainerProfile.birth_date, trainerAsOf);
  const trainerGradedAnswer = buildGradedAnswer(`${trainer.name}調教師`, trainerGraded, trainerGradedWins);
  const activeHorsesAnswer = activeHorses.length > 0
    ? `直近半年に出走した${trainer.name}厩舎の管理馬では、${activeHorses.slice(0, 5).map((h) => `**${h.horse_name}**${h.titles.length > 0 ? `（${formatTitles(h.titles, 2).join('、')}）` : `（${h.wins}勝）`}`).join('、')}が主な馬です。\n※集計期間の重賞勝ち→勝利数の順。`
    : null;
  const twoYo = trainerAgeRows.find((r) => r.label === '2歳');
  const otherAges = trainerAgeRows.filter((r) => r.label !== '2歳');
  const otherRaces = otherAges.reduce((a, r) => a + (r.races ?? 0), 0);
  const otherPlaceRate = otherRaces > 0 ? otherAges.reduce((a, r) => a + (r.place_rate ?? 0) * (r.races ?? 0), 0) / otherRaces : null;
  const twoYoAnswer = twoYo && (twoYo.races ?? 0) >= 20 && otherPlaceRate !== null
    ? `${trainer.name}調教師の2歳戦の成績は${twoYo.races}戦${twoYo.wins}勝、複勝率**${(twoYo.place_rate ?? 0).toFixed(1)}%**です（3歳以上は${otherPlaceRate.toFixed(1)}%）。\n2歳戦の単勝回収率は${(twoYo.win_payback ?? 0).toFixed(1)}%です。`
    : null;
  const profileTiles = [
    { label: '所属', value: (trainer as any).stable ?? trainerProfile.region ?? '' },
    { label: '生年月日', value: jaDate(trainerProfile.birth_date) ?? '', sub: trainerAge !== null ? `${trainerAge}歳` : undefined },
    { label: '開業', value: trainer.debut_year ? `${trainer.debut_year}年` : '', sub: trainer.debut_year ? `${trainerAsOf.getFullYear() - Number(trainer.debut_year) + 1}年目` : undefined },
    ...(trainerThisYear ? [{ label: `${trainerThisYear.year}年の勝利数`, value: `${trainerThisYear.wins}勝`, sub: trainerThisYear.ranking > 0 ? `リーディング${trainerThisYear.ranking}位` : undefined }] : []),
    { label: '勝率・複勝率', value: `${Number(trainer.total_stats?.win_rate ?? 0).toFixed(1)}%・${Number(trainer.total_stats?.place_rate ?? 0).toFixed(1)}%`, sub: '直近3年間' },
    { label: '重賞勝ち（平地）', value: `${trainerGraded.wins}勝`, sub: `直近3年間・G1 ${trainerGraded.g1}勝` },
  ];

  // FAQ構造化データ
  const faqTrainerJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { question: `${trainer.name}調教師の得意な競馬場は？`, answer: trainerGoodRacecourseAnswer },
      { question: `${trainer.name}調教師の得意なコースは？`, answer: trainerGoodCourseAnswer },
      { question: `${trainer.name}調教師は芝とダートどちらが得意？`, answer: trainerSurfaceFaqAnswer },
      { question: `${trainer.name}調教師の得意な距離は？`, answer: trainerDistanceFaqAnswer },
      { question: `${trainer.name}調教師の重賞成績は？`, answer: trainerGradedAnswer },
      ...(activeHorsesAnswer ? [{ question: `${trainer.name}厩舎の主な管理馬は？`, answer: activeHorsesAnswer }] : []),
      ...(twoYoAnswer ? [{ question: `${trainer.name}厩舎の2歳戦の成績は？`, answer: twoYoAnswer }] : []),
      { question: `${trainer.name}調教師の苦手な競馬場は？`, answer: trainerBadRacecourseAnswer },
      { question: `${trainer.name}調教師の苦手なコースは？`, answer: trainerBadCourseAnswer },
    ].map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: stripBoldTrainer(answer) },
    })),
  };

  // ナビゲーションアイテム
  const navigationItems = [
    { id: 'profile-section', label: '基本情報' },
    { id: 'summary-section', label: 'データ概要' },
    { id: 'leading', label: '年度別' },
    ...(activeHorses.length > 0 ? [{ id: 'active-horses-section', label: '主な管理馬' }] : []),
    ...(trainerGradedWins.length > 0 ? [{ id: 'graded-wins-section', label: '重賞勝ち' }] : []),
    { id: 'characteristics', label: '特徴' },
    { id: 'highlights-section', label: '注目ポイント' },
    { id: 'class-stats', label: 'クラス別' },
    { id: 'popularity-stats', label: '人気別' },
    { id: 'distance-stats', label: '距離別' },
    { id: 'gender-stats', label: '性別' },
    ...(trainerAgeRows.length > 0 ? [{ id: 'age-stats', label: '馬齢別' }] : []),
    { id: 'interval-stats', label: 'レース間隔' },
    { id: 'surface-stats', label: 'コース区分別' },
    { id: 'racecourse-stats', label: '競馬場別' },
    { id: 'course-stats', label: 'コース別' },
    { id: 'jockey-stats', label: '騎手別' },
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

  // 構造化データ - WebPage（データ更新日を dateModified で明示）
  const webPageJsonLd = buildWebPageJsonLd({
    url: `https://www.keibadata.com/trainers/${id}`,
    name: `${trainer.name}調教師の成績データ`,
    description: `${trainer.name}調教師の管理馬の直近3年間の成績を、コース・距離・馬場・騎手・レース間隔別などで集計したデータページ`,
    dateModified: jaDateToIso(trainer.last_updated),
  });

  // ===== 表示（リデザイン v6。見本 docs/redesign/src/pages/trainer.mjs と同じ並び・同じ整形） =====
  const periodText = periodFromDataPeriod(trainer.data_period) ?? '直近3年間';
  const dateIso = jaDateToIso(trainer.last_updated);
  const n = trainer.name;
  const W = `${n}調教師`;
  const ST = `${n}厩舎`;
  // 対象レース数が少ないページは傾向判定・特徴・注目ポイント・データQ&Aを出さない（現行どおり）
  const enoughRaces = hasEnoughRaces(trainer.total_races);
  const jockeyIds = new Set(ALL_JOCKEYS.map((j) => String(j.id)));

  // 判定（3ページ共通の向き：左＝芝／短距離、右＝ダート／長距離）
  const sText: Record<number, string> = { 1: '芝が得意', 2: 'やや芝が得意', 3: '差分なし', 4: 'ややダートが得意', 5: 'ダートが得意' };
  const dText: Record<number, string> = { 1: '短距離が得意', 2: 'やや短距離が得意', 3: '差分なし', 4: 'やや長距離が得意', 5: '長距離が得意' };
  // 調教師データでは芝・ダートの判定が gate_position に入っており、1＝ダートが得意。表示用に反転する（6 - 値）
  const rawSurfaceTrend = trainer.characteristics?.gate_position;
  const surfacePos = typeof rawSurfaceTrend === 'number' ? 6 - rawSurfaceTrend : 0;
  const distancePos = trainer.characteristics?.distance_trend_position ?? 0;
  const hasS = surfacePos >= 1 && surfacePos <= 5;
  const hasD = typeof distancePos === 'number' && distancePos >= 1 && distancePos <= 5;
  const md = (c: string) => (mergedDistanceStats as any[]).find((d) => d.category === c);
  const turf = trainer.surface_stats.find((r) => r.surface === '芝');
  const dirt = trainer.surface_stats.find((r) => r.surface === 'ダート');
  const ev = (pairs: [string, any][]): [string, number][] => pairs.filter(([, r]) => r).map(([l, r]) => [`${l} 複勝率`, r.place_rate]);

  // 騎手のリンク（騎手ページが存在する騎手だけ）
  const jockeyUrl = (j: any): string | undefined => {
    const fromData = typeof j.link === 'string' && jockeyIds.has(j.link.split('/').pop() ?? '') ? j.link : undefined;
    const byName = ALL_JOCKEYS.find((x) => x.name === j.name);
    return fromData ?? (byName ? `/jockeys/${byName.id}` : undefined);
  };
  const courses = trainer.course_stats.filter((c) => c.surface_en !== 'obstacle') as unknown as CourseRow[];

  // データ概要（先頭に結論の1文。騎手名・コース名は詳細ページへリンク）
  const summaryBlocks = toTrainerSummaryBlocks(buildTrainerSummaryKeyed(trainer as any));
  if (enoughRaces && summaryBlocks.length > 0) {
    summaryBlocks.unshift({
      key: 'lead',
      text: buildPersonLead({
        kind: '調教師',
        name: n,
        region: (trainer as any).stable,
        debutYear: trainer.debut_year,
        traits: [hasS ? sText[surfacePos] : '', hasD ? dText[distancePos] : ''].filter((x) => x && x !== '差分なし'),
        graded: trainerGraded,
        recentWin: trainerGradedWins[0] ?? null,
      }),
    });
  }
  const summaryLinks: Partial<Record<string, NameLink[]>> = {
    jockey: trainer.jockey_stats.filter((j: any) => jockeyUrl(j)).map((j: any) => ({ name: j.name, href: jockeyUrl(j) as string })),
    racecourse: courses.map((c) => ({ name: c.name, href: resolveCourseUrl(c) ?? '' })).filter((l) => l.href),
  };

  // 基本情報
  const ts = trainer.total_stats;
  const tiles: [string, ReactNode, ReactNode?][] = [
    ['所属', (trainer as any).stable ?? trainerProfile.region ?? '', ''],
    ['生年月日', jaDate(trainerProfile.birth_date) ?? '', trainerAge !== null ? `${trainerAge}歳` : ''],
    ['開業', trainer.debut_year ? `${trainer.debut_year}年` : '', trainer.debut_year ? `${trainerAsOf.getFullYear() - Number(trainer.debut_year) + 1}年目` : ''],
    ...(trainerThisYear ? [[`${trainerThisYear.year}年の勝利数`, <><Cnt v={trainerThisYear.wins} />勝</>, trainerThisYear.ranking > 0 ? `リーディング${trainerThisYear.ranking}位` : ''] as [string, ReactNode, ReactNode]] : []),
    // 冒頭のマスと大きな数字が重ならないよう、着度数を主に見せて勝率・複勝率は補足行に残す（騎手詳細と同じ）
    ['着度数（直近3年間）', <span className={cx('num')}>{`${ts.wins}-${ts.places_2}-${ts.places_3}-${ts.races - ts.wins - ts.places_2 - ts.places_3}`}</span>, <Nb>勝率{ts.win_rate.toFixed(1)}%／複勝{ts.place_rate.toFixed(1)}%</Nb>],
    ['重賞勝ち（平地）', <><Cnt v={trainerGraded.wins} />勝</>, `直近3年間・G1 ${trainerGraded.g1}勝`],
  ];

  // 年度別（図は古い順、表は新しい順）
  const YEAR = dateIso ? Number(dateIso.slice(0, 4)) : currentYear;
  const years = [YEAR - 2, YEAR - 1, YEAR];
  const ystat = years.map((y) => ({ ...ZERO, ...(trainer.yearly_stats.find((r) => r.year === y) ?? {}), year: y }));
  const leadYears = years.map((y) => trainer.yearly_leading.find((r) => r.year === y) ?? { year: y, wins: 0, ranking: 0 });

  // 条件別の行（並び・件数は現行どおり）
  const classRows = ['G1', 'G2', 'G3', 'オープン', '3勝', '2勝', '1勝', '未勝利', '新馬'].map((c) =>
    R(trainer.class_stats.find((x) => x.class_name === c), /^G\d$/.test(c) ? <GTag g={c} /> : c, c));
  const POP = [['fav1', '1番人気'], ['fav2', '2番人気'], ['fav3', '3番人気'], ['fav4', '4番人気'], ['fav5', '5番人気'], ['fav6to9', '6〜9番人気'], ['fav10plus', '10番人気〜']] as const;
  const popRows = POP.filter(([k]) => (trainer.popularity_stats as any)?.[k]).map(([k, l]) => R((trainer.popularity_stats as any)[k], l));
  const distRows = trainer.distance_stats.map((r: any) => R(r, r.category));
  const genderRows = trainer.gender_stats.map((r: any) => R(r, r.name));
  const ageRows: Row[] = ((trainer as any).age_stats ?? []).map((r: any) => R(r, r.age));
  // スマホの横棒の行には勝率も添える（表では勝率の列にある）
  const intervalRows = fill(['連闘', '1-3週', '4-7週', '8-10週', '11週-'], trainer.interval_stats ?? [], (r: any) => r.interval).map((r) => ({ ...r, listSub: `勝率${pct(r.win_rate)}` }));
  const SFEN: Record<string, string> = { 芝: 'turf', ダート: 'dirt', 障害: 'steeplechase' };
  const surfRows = trainer.surface_stats.map((r) => R(r, SFEN[r.surface] ? <SfTag sf={sfKey(SFEN[r.surface])} /> : r.surface, r.surface));
  const RCS: [string, string][] = [['sapporo', '札幌'], ['hakodate', '函館'], ['fukushima', '福島'], ['niigata', '新潟'], ['tokyo', '東京'], ['nakayama', '中山'], ['chukyo', '中京'], ['kyoto', '京都'], ['hanshin', '阪神'], ['kokura', '小倉']];
  const rcRows = RCS.map(([en, ja]) => (trainer.racecourse_stats ?? []).find((x: any) => x.racecourse_en === en || x.name === ja))
    .map((r, i) => (r ? R(r, RCS[i][1]) : null))
    .filter((r): r is Row => r !== null);
  const rcSum = ['中央', 'ローカル']
    .map((nm) => (trainer.racecourse_stats ?? []).find((r: any) => r.name === nm))
    .filter(Boolean)
    .map((r: any) => R(r, <b>{r.name}</b>, r.name));
  const nameRow = (r: any, href: string | undefined, i: number): Row => ({ ...R(r, <MaybeLink href={href}>{r.name}</MaybeLink>, r.name), rowKey: `${r.name}-${i}` });
  const jockeyList = trainer.jockey_stats.map((r: any, i: number) => nameRow(r, jockeyUrl(r), i));
  const ownerList = trainer.owner_stats.map((r: any, i: number) => nameRow(r, undefined, i));

  // 節：条件別（補足文「出走30以上で…」は板の外、見出しの下）とランキング
  const cond = (
    w: string, id: string, title: string, rows: Row[], opt: Partial<StatsProps> & { keyLabel: string },
    { sub = '', note = true, markRows = null }: { sub?: string; note?: boolean; markRows?: Row[] | null } = {},
  ) => (
    <Sec id={id} head={<H w={w} title={title} sub={sub || note ? <Subs sub={sub} note={note ? <BestNote rows={markRows ?? rows} /> : null} /> : undefined} />}>
      <Pn><Stats rows={rows} mark={note} markRows={markRows} {...opt} /></Pn>
    </Sec>
  );
  const rankSec = (id: string, title: string, rows: Row[], keyLabel: string) => (
    <Sec id={id} head={<H w={W} title={title} sub={<Subs sub="勝利数順" />} />}>
      <Pn><Stats rows={rows} keyLabel={keyLabel} rank initial={10} bar="wins" barLabel={'勝利数\n（横棒）'} hint="最大50件まで表示" shrink /></Pn>
    </Sec>
  );

  // ページ内の移動（データがない節・対象レース数が少ないページで出さない節は外す）
  const hasHighlights = courses.some((c) => c.races >= 10);
  const thinHidden = new Set(['characteristics', 'highlights-section', 'faq-section']);
  const showChars = enoughRaces && Boolean(trainer.characteristics) && (hasS || hasD);
  const navItems = [
    ['profile-section', '基本情報'], ...(summaryBlocks.length ? [['summary-section', '概要']] : []), ['leading', '年度別'],
    ...(activeHorses.length ? [['active-horses-section', '管理馬']] : []), ...(trainerGradedWins.length ? [['graded-wins-section', '重賞勝ち']] : []),
    ...(showChars ? [['characteristics', '特徴']] : []), ...(hasHighlights ? [['highlights-section', '注目']] : []), ['class-stats', 'クラス別'], ['popularity-stats', '人気別'],
    ['distance-stats', '距離別'], ['gender-stats', '性別'], ...(ageRows.length ? [['age-stats', '馬齢別']] : []), ['interval-stats', '間隔別'],
    ['surface-stats', '芝ダート別'], ['racecourse-stats', '競馬場別'], ['course-stats', 'コース別'], ['jockey-stats', '騎手'], ['owner-stats', '馬主'], ['faq-section', 'Q&A'],
  ].filter(([id]) => enoughRaces || !thinHidden.has(id)).map(([id, label]) => ({ id, label }));

  const faqItems = [
    { q: `${n}調教師の得意な競馬場は？`, a: trainerGoodRacecourseAnswer },
    { q: `${n}調教師の得意なコースは？`, a: trainerGoodCourseAnswer },
    { q: `${n}調教師は芝とダートどちらが得意？`, a: trainerSurfaceFaqAnswer, lead: true },
    { q: `${n}調教師の得意な距離は？`, a: trainerDistanceFaqAnswer, lead: true },
    { q: `${n}調教師の重賞成績は？`, a: trainerGradedAnswer },
    ...(activeHorsesAnswer ? [{ q: `${n}厩舎の主な管理馬は？`, a: activeHorsesAnswer }] : []),
    ...(twoYoAnswer ? [{ q: `${n}厩舎の2歳戦の成績は？`, a: twoYoAnswer }] : []),
    { q: `${n}調教師の苦手な競馬場は？`, a: trainerBadRacecourseAnswer },
    { q: `${n}調教師の苦手なコースは？`, a: trainerBadCourseAnswer },
  ];
  const stable = (trainer as any).stable as string | undefined;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      {enoughRaces && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqTrainerJsonLd) }} />}
      <EntityRoot>
        <PageNav items={navItems} />
        <Hero
          crumb={{ label: '調教師一覧', href: '/trainers' }}
          name={n}
          h1={ST}
          h1s="（調教師）の傾向・成績データ"
          lead={`${W}${stable || trainer.debut_year ? `（${[stable, trainer.debut_year ? `${trainer.debut_year}年開業` : ''].filter(Boolean).join('・')}）` : ''}の成績・データをまとめたページです。独自のデータベースで直近3年間・${int(trainer.total_races)}レースのデータを集計し、毎週更新しています。`}
          kpi={[['出走数', ts.races, 0, ''], ['1着', ts.wins, 0, ''], ['勝率', ts.win_rate, 1, '%'], ['連対率', ts.quinella_rate, 1, '%'], ['複勝率', ts.place_rate, 1, '%']]}
          races={trainer.total_races}
          period={periodText}
          updated={trainer.last_updated}
          iso={dateIso}
          verdictTitle={`${W}の傾向`}
          verdict={enoughRaces ? [
            ...(hasS ? [{ label: '芝・ダート', pos: surfacePos, text: sText[surfacePos] }] : []),
            ...(hasD ? [{ label: '距離', pos: distancePos, text: dText[distancePos] }] : []),
          ] : null}
        />
        {!enoughRaces && <ThinNote totalRaces={trainer.total_races} minRaces={MIN_RACES_FOR_TRENDS} hiddenItems="「調教師の傾向」「調教師の特徴」「注目ポイント」「データQ&A」" />}
        <Ad unit="dataTop" />

        <Sec id="profile-section" head={<Hno w={ST} title="基本情報" />}>
          <Tiles className="es-tl" items={tiles.filter((x) => x[1])} />
        </Sec>
        {summaryBlocks.length > 0 && (
          <Sec id="summary-section" head={<Hno w={W} title="データ概要" />}>
            <Summary blocks={summaryBlocks} links={summaryLinks} />
          </Sec>
        )}
        <Sec id="leading" head={<H w={W} title="年度別成績" sub="勝利数とリーディング順位（直近3年）" />}>
          <YearCharts lead={leadYears} ystat={ystat} />
        </Sec>
        {activeHorses.length > 0 && (
          <Sec id="active-horses-section" head={<Hno w={ST} title="主な管理馬" sub="直近半年に出走した馬。集計期間の重賞勝ち→勝利数の順" />}>
            <HorseList
              label={`${ST}の主な管理馬`}
              note="成績は「1着-2着-3着-着外」。直近3年間・当厩舎での出走分"
              cols={[{ label: '馬名', m: 'm1' }, { label: '性齢', m: 'm1b' }, { label: '成績', m: 'm2', num: true }, { label: '主な勝ち鞍', m: 'm3' }, { label: '父', m: 'm4', ml: '父' }, { label: '最終出走', m: 'm4', ml: '最終出走' }]}
              rows={activeHorses.map((h: NotableHorse) => {
                const p2 = h.places_2 ?? 0, p3 = h.places_3 ?? 0;
                return [
                  <b key="n">{h.horse_name}</b>,
                  `${h.sex}${h.age ?? ''}`,
                  <span key="r" className={cx('num')}>{`${h.races}戦 ${h.wins}-${p2}-${p3}-${h.races - h.wins - p2 - p3}`}</span>,
                  <Titles key="t" list={formatTitles(h.titles)} />,
                  h.father ?? '—',
                  h.last_date ? <span key="d" className={cx('num')}>{slashDate(h.last_date)}</span> : '—',
                ];
              })}
            />
          </Sec>
        )}
        {trainerGradedWins.length > 0 && (
          <Sec id="graded-wins-section" head={<Hno w={ST} title="重賞勝ち" sub="直近3年間・平地・新しい順" />}>
            <GradedWins wins={trainerGradedWins} classStats={trainer.class_stats} fourth={['騎手', (w) => w.jockey_name ?? '—']} />
          </Sec>
        )}
        {showChars && (
          <Sec id="characteristics" head={<Hno w={W} title="特徴" sub="判定と、その根拠になった数字" />}>
            <Meters
              items={[
                ...(hasS ? [{ label: '得意なコース傾向', pos: surfacePos, result: sText[surfacePos], scale: ['芝が得意', '差分なし', 'ダートが得意'] as [string, string, string], ev: ev([['芝', turf], ['ダート', dirt]]) }] : []),
                ...(hasD ? [{ label: '得意な距離傾向', pos: distancePos, result: dText[distancePos], scale: ['短距離が得意', '差分なし', '長距離が得意'] as [string, string, string], ev: ev([['短距離〜マイル', md('短〜マ')], ['中距離〜長距離', md('中〜長')]]) }] : []),
              ]}
            />
          </Sec>
        )}
        {enoughRaces && hasHighlights && (
          <Sec id="highlights-section" head={<Hno w={W} title="注目ポイント" sub="管理馬が得意・苦手なコース。コース名をタップすると詳細へ" />}>
            <Highlights courses={courses} urlOf={(c) => resolveCourseUrl(c)} shortOf={(c) => courseLabel(c, { withRacecourse: true, shortDirt: true })} />
          </Sec>
        )}
        {cond(W, 'class-stats', 'クラス別データ', classRows, { keyLabel: 'クラス' })}
        {cond(W, 'popularity-stats', '人気別データ', popRows, { keyLabel: '人気' }, { note: false })}
        {cond(W, 'distance-stats', '距離別データ', distRows, { keyLabel: '距離', hint: <DefLink anchor="distance" /> })}
        <Ad unit="dataMid" />
        {cond(W, 'gender-stats', '性別データ', genderRows, { keyLabel: '性別' })}
        {ageRows.length > 0 && cond(ST, 'age-stats', '馬齢別データ', ageRows, { keyLabel: '馬齢' }, { sub: '2歳戦（新馬・未勝利が中心）の成績も確認できます' })}
        {cond(W, 'interval-stats', 'レース間隔別データ', intervalRows, { keyLabel: '間隔' })}
        {cond(W, 'surface-stats', 'コース区分別データ', surfRows, { keyLabel: '区分' }, { markRows: surfRows.filter((r) => r.text !== '障害') })}
        {cond(W, 'racecourse-stats', '競馬場別成績', rcRows, { keyLabel: '競馬場', summaryRows: rcSum })}
        <Sec id="course-stats" head={<H w={W} title="コース別成績" sub="競馬場をタップすると、コースごとの13項目を表示" />}>
          <CourseAcc courses={courses} urlOf={(c) => resolveCourseUrl(c)} labelOf={(c) => courseLabel(c)} />
        </Sec>
        {rankSec('jockey-stats', '騎手別データ', jockeyList, '騎手')}
        {rankSec('owner-stats', '馬主別データ', ownerList, '馬主')}
        <Ad unit="dataBottom" />
        {enoughRaces && (
          <Sec id="faq-section" head={<Head title="データQ&A" />}>
            <Faq items={faqItems} />
          </Sec>
        )}
        <About period={periodFromDataPeriod(trainer.data_period)} updated={trainer.last_updated} />
      </EntityRoot>
    </>
  );
}
