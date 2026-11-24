import fs from 'fs';
import path from 'path';

/**
 * レース別ページ（/races/[slug]、「〇〇 過去10年」）の一覧とデータ。
 * データは gcs/v2/generate_races.py が public/data/races/<slug>.json に書き出す（docs/seo/race_serp_2026-11.md）。
 */

export interface RaceDef {
  slug: string;
  /** 公開前のテストページ（noindex・サイトマップ／一覧に出さない） */
  test?: boolean;
  /** コースページのパス（/courses/<venue>/<surface>/<distance>） */
  course?: string;
}

export const RACES: RaceDef[] = [
  { slug: 'japan-cup', test: true, course: '/courses/tokyo/turf/2400' },
  { slug: 'keihan-hai', test: true, course: '/courses/kyoto/turf/1200' },
  { slug: 'kyoto-nisai-stakes', test: true, course: '/courses/kyoto/turf/2000' },
];

export interface RaceStat {
  label?: string;
  name?: string;
  id?: string;
  gate?: number;
  races: number;
  wins: number;
  places_2: number;
  places_3: number;
  win_rate: number;
  quinella_rate: number;
  place_rate: number;
  win_payback: number;
  place_payback: number;
  avg_popularity: number | null;
  avg_rank: number;
  median_popularity: number | null;
  median_rank: number;
}

export interface PrevRun {
  name: string | null;
  grade: string | null;
  kind: '中央' | '地方' | '海外';
  finish: number | null;
  pop: number | null;
  days: number;
  venue: string | null;
  surface: string | null;
  distance: number | null;
  same_jockey: boolean | null;
  /** 前走の上がり3F と、そのレースでの順位（中央のレースのみ） */
  last3f: number | null;
  last3f_rank: number | null;
}

export interface RaceRunner {
  fin: number;
  frame: number | null;
  num: number | null;
  horse: string;
  horse_id: string;
  sex: string;
  age: number | null;
  affil: string;
  kg: number | null;
  jockey: string | null;
  jockey_id: string | null;
  trainer: string | null;
  trainer_id: string | null;
  sire: string | null;
  damsire: string | null;
  bw: number | null;
  bw_diff: number | null;
  time: number | null;
  diff: number | null;
  corners: number[];
  last3f: number | null;
  /** このレースでの上がり3F順位 */
  last3f_rank: number | null;
  pop: number | null;
  odds: number | null;
  style: string | null;
  prev: PrevRun | null;
}

export interface Payout {
  combo: string;
  yen: number;
  pop: number | null;
}

export interface RaceEdition {
  race_id: string;
  date: string;
  year: number;
  venue: string;
  surface: string;
  distance: number;
  going: string | null;
  weather: string | null;
  runners: number;
  included: boolean;
  name: string;
  first3f: number | null;
  last3f: number | null;
  results: RaceRunner[];
  payouts: Record<'win' | 'place' | 'quinella' | 'exacta' | 'wide' | 'trio' | 'trifecta', Payout[]>;
}

export type StatKey =
  | 'popularity' | 'frame' | 'number' | 'style' | 'last3f' | 'age' | 'sex' | 'affil'
  | 'prev_class' | 'prev_race' | 'prev_finish' | 'prev_pop' | 'prev_last3f' | 'interval' | 'jockey_change' | 'body_weight'
  | 'jockey' | 'trainer' | 'sire' | 'damsire';

export interface RaceData {
  slug: string;
  name: string;
  grade: string | null;
  venue: string;
  surface: 'turf' | 'dirt';
  distance: number;
  weight_type: string | null;
  next_date: string | null;
  period: { from: number; to: number; count: number };
  total_runners: number;
  editions: RaceEdition[];
  stats: Record<StatKey, RaceStat[]>;
  generated_at: string;
}

export function getRaceDef(slug: string): RaceDef | undefined {
  return RACES.find((r) => r.slug === slug);
}

export function getRaceData(slug: string): RaceData | null {
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'races', `${slug}.json`);
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as RaceData;
  } catch {
    return null;
  }
}
