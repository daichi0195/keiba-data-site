/**
 * 今週末のオープン以上（G1〜G3・リステッド・オープン特別）のレースと、トップで大きく見せる注目レース。
 * いまは手で更新する（2026-11-28・29 は JRA 公式と netkeiba の出馬表で確認）。
 * 将来は JRA-VAN の特別登録データから週次で自動生成する。
 */

export type WeekGrade = 'G1' | 'G2' | 'G3' | 'L' | 'OP';

export interface WeekRace {
  date: string; // YYYY-MM-DD
  venue: string;
  venueId: string;
  raceNo: number;
  name: string;
  grade: WeekGrade;
  surface: 'turf' | 'dirt';
  distance: number;
  condition: string;
  weightType: string;
  /** 過去10年データのページ（/races/<slug>）がある場合 */
  slug?: string;
  /** コースデータのページ */
  course: string;
}

export const WEEK_RACES: WeekRace[] = [
  { date: '2026-11-28', venue: '東京', venueId: 'tokyo', raceNo: 11, name: 'キャピタルステークス', grade: 'L', surface: 'turf', distance: 1600, condition: '3歳以上', weightType: '別定', slug: 'capital-stakes', course: '/courses/tokyo/turf/1600' },
  { date: '2026-11-28', venue: '京都', venueId: 'kyoto', raceNo: 11, name: '京都2歳ステークス', grade: 'G3', surface: 'turf', distance: 2000, condition: '2歳', weightType: '馬齢', slug: 'kyoto-nisai-stakes', course: '/courses/kyoto/turf/2000' },
  { date: '2026-11-29', venue: '東京', venueId: 'tokyo', raceNo: 9, name: 'カトレアステークス', grade: 'OP', surface: 'dirt', distance: 1600, condition: '2歳', weightType: '別定', slug: 'cattleya-stakes', course: '/courses/tokyo/dirt/1600' },
  { date: '2026-11-29', venue: '東京', venueId: 'tokyo', raceNo: 12, name: 'ジャパンカップ', grade: 'G1', surface: 'turf', distance: 2400, condition: '3歳以上', weightType: '定量', slug: 'japan-cup', course: '/courses/tokyo/turf/2400' },
  { date: '2026-11-29', venue: '京都', venueId: 'kyoto', raceNo: 11, name: 'オータムリーフステークス', grade: 'OP', surface: 'dirt', distance: 1400, condition: '3歳以上', weightType: '別定', slug: 'autumn-leaf-stakes', course: '/courses/kyoto/dirt/1400' },
  { date: '2026-11-29', venue: '京都', venueId: 'kyoto', raceNo: 12, name: '京阪杯', grade: 'G3', surface: 'turf', distance: 1200, condition: '3歳以上', weightType: '別定', slug: 'keihan-hai', course: '/courses/kyoto/turf/1200' },
];


const GRADE_ORDER: Record<WeekGrade, number> = { G1: 0, G2: 1, G3: 2, L: 3, OP: 4 };

/** 日付ごとに、格の高い順→レース番号順 */
export function weekRacesByDate() {
  const dates = [...new Set(WEEK_RACES.map((r) => r.date))].sort();
  return dates.map((date) => ({
    date,
    races: WEEK_RACES.filter((r) => r.date === date).sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.venue.localeCompare(b.venue) || a.raceNo - b.raceNo),
  }));
}

export function jaDateShort(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const w = '日月火水木金土'[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}月${d}日（${w}）`;
}

/** 「11/28（土）・29（日）」 */
export function weekSpan(dates: string[]) {
  return dates
    .map((iso, i) => {
      const [y, m, d] = iso.split('-').map(Number);
      const w = '日月火水木金土'[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
      const prevMonth = i > 0 ? Number(dates[i - 1].split('-')[1]) : 0;
      return `${m === prevMonth ? '' : `${m}/`}${d}（${w}）`;
    })
    .join('・');
}
