// AI予測の3ページ（/ai・/ai/races・/ai/races/[slug]）で共通に使うデータ取得と表記
// 見本：docs/redesign/src/pages/ai-shared.mjs
import { getCoursesByRacecourse } from '@/lib/courses';

export interface RaceSummary {
  slug: string;
  date: string;
  dateLabel: string;
  venueLabel: string;
  raceNumber: number;
  raceName: string;
  surface: string;
  distance: number;
  updatedAt?: string;
}

export interface HorsePrediction {
  rank: number;
  winRate: number;
  name: string;
  /** 'honmei' | 'himo' | 'kiken'（旧形式）または '【本命】' | '【紐】' | '【危険】'（現行形式） */
  mark?: string;
}

export interface RacePrediction extends RaceSummary {
  venue: string;
  predictions: HorsePrediction[];
}

const BASE = 'https://storage.googleapis.com/umadata/predictions';

/** 予測の一覧（index.json。並びは index.json のまま） */
export async function fetchPredictionIndex(): Promise<RaceSummary[]> {
  try {
    const res = await fetch(`${BASE}/index.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** レースごとの予測 */
export async function fetchPrediction(slug: string): Promise<RacePrediction | null> {
  try {
    const res = await fetch(`${BASE}/${slug}.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** 競馬場の並び（北から南。共通の枠の左メニューと同じ lib/courses の順） */
export const VENUE_ORDER: string[] = getCoursesByRacecourse().map((g) => g.racecourse_ja.replace('競馬場', ''));

export * from './format';
