// 表記（サーバー・クライアントの両方で使う）。見本：docs/redesign/src/pages/ai-shared.mjs
import GRADES from './raceGrades.json';

/* ---------- 表記（日付は 'YYYY-MM-DD' を日本の暦日として扱う。サーバーの時刻帯に左右されないよう UTC で計算） ---------- */
const WD = '日月火水木金土';
const ymd = (s: string) => new Date(`${s}T00:00:00Z`);
/** 2026年11月15日（日） */
export const dateY = (s: string) => {
  const d = ymd(s);
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${WD[d.getUTCDay()]}）`;
};
/** 11月15日（日） */
export const dateOf = (s: string) => {
  const d = ymd(s);
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${WD[d.getUTCDay()]}）`;
};
/** 11/15（日） */
export const shortDate = (s: string) => {
  const d = ymd(s);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}（${WD[d.getUTCDay()]}）`;
};
/** 2026年4月 */
export const monthLabel = (s: string) => {
  const d = ymd(s);
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月`;
};

/** 「3歳以上1勝クラス」→「3歳以上 1勝クラス」（見本 lib.mjs の short） */
export const shortName = (n: string) => n.replace(/^(\d歳(以上)?)/, '$1 ');

export type SurfaceKey = 'turf' | 'dirt' | 'steeplechase';
export const sfKey = (s: string): SurfaceKey => (s === '芝' ? 'turf' : s === '障害' ? 'steeplechase' : 'dirt');
export const sfJa = (s: string) => (s === '芝' ? '芝' : s === '障害' ? '障害' : 'ダート');

/** 重賞の格付け（レース名から。見本 data/grades.json と同じ表） */
export const gradeOf = (raceName: string): string | null => (GRADES as Record<string, string>)[raceName] ?? null;
