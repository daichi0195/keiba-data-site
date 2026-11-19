/**
 * 重賞の格付け（レース名 → G1 / G2 / G3）
 *
 * raceGrades.json はコースデータ（GCS のコース別 JSON の graded_races：集計期間に行われた重賞と直近の格付け）から作ったもの。
 * リデザイン v6 の見本（docs/redesign/src/data/grades.json）と同じ内容。
 */
import grades from './raceGrades.json';

export type RaceGrade = 'G1' | 'G2' | 'G3';

const GRADES = grades as Record<string, string>;

/** レース名から格付けを引く。重賞でなければ null */
export function getRaceGrade(raceName: string): RaceGrade | null {
  const g = GRADES[raceName];
  return g === 'G1' || g === 'G2' || g === 'G3' ? g : null;
}
