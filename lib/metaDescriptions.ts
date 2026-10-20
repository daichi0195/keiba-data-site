import { hasEnoughRaces, MIN_RACES_FOR_TRENDS } from './dataPageRules';

/**
 * 検索結果に出る meta description を、ページ固有の数値入りで作る。
 * 定型文だけだと全ページ同じ説明文になり、検索結果で差別化できない（Search Console でクリック率が低かった）。
 * データが少ない（noindex の）ページや、数値が取れないときは定型文に戻す。
 */

type StatRow = {
  races?: number;
  wins?: number;
  places_2?: number;
  places_3?: number;
  win_rate?: number;
  place_rate?: number;
};

const pct = (v: number) => `${v.toFixed(1)}%`;

/** 出走数が十分な行の中で複勝率が最も高い行 */
function bestByPlaceRate<T extends StatRow>(rows: T[] | undefined, minRaces = MIN_RACES_FOR_TRENDS): T | undefined {
  return (rows ?? [])
    .filter((r) => (r.races ?? 0) >= minRaces && typeof r.place_rate === 'number')
    .sort((a, b) => (b.place_rate ?? 0) - (a.place_rate ?? 0))[0];
}

/** 複数行を合算した複勝率（行ごとの率の平均ではなく、着数の合計から計算する） */
function pooledPlaceRate(rows: StatRow[]): { races: number; rate: number } {
  const races = rows.reduce((s, r) => s + (r.races ?? 0), 0);
  const places = rows.reduce((s, r) => s + (r.wins ?? 0) + (r.places_2 ?? 0) + (r.places_3 ?? 0), 0);
  return { races, rate: races > 0 ? (places / races) * 100 : 0 };
}

export function sireDescription(name: string, d: any): string {
  const fallback = `${name}産駒の特徴を直近3年のデータで分析。芝・ダート、得意距離、競馬場別、重馬場・道悪の成績、母父別の相性まで。毎週更新。`;
  const total = d?.total_stats;
  if (!d || !hasEnoughRaces(d.total_races) || !total) return fallback;

  const parts: string[] = [
    `${name}産駒の特徴を直近3年・${d.total_races.toLocaleString('ja-JP')}走のデータで分析。勝率${pct(total.win_rate)}・複勝率${pct(total.place_rate)}。`,
  ];

  const surface = bestByPlaceRate((d.surface_stats ?? []).filter((r: any) => r.surface !== '障害'));
  const distance = bestByPlaceRate(d.distance_stats);
  if (surface && distance) {
    // 馬場と距離はそれぞれ別に集計した最良値なので、組み合わせた条件のように書かない
    parts.push(`得意な馬場は${surface.surface}、距離は${distance.category}（複勝率${pct(distance.place_rate)}）。`);
  }

  // 重馬場：稍重〜不良（障害を除く）を良馬場と比べる
  const flat = (d.track_condition_stats ?? []).filter((r: any) => r.surface !== '障害');
  const good = pooledPlaceRate(flat.filter((r: any) => r.condition === 'good'));
  const heavy = pooledPlaceRate(flat.filter((r: any) => r.condition !== 'good'));
  if (good.races >= MIN_RACES_FOR_TRENDS && heavy.races >= MIN_RACES_FOR_TRENDS) {
    const diff = heavy.rate - good.rate;
    // 判定の幅は種牡馬ページの本文（差 3pt 以上で「得意」）と揃える
    const verdict = diff >= 3 ? '良馬場より高い' : diff <= -3 ? '良馬場より低い' : '良馬場と同程度';
    parts.push(`重馬場（稍重〜不良）の複勝率は${pct(heavy.rate)}で${verdict}。`);
  }

  parts.push('距離・コース・母父別まで毎週更新。');
  return parts.join('');
}

export function jockeyDescription(d: any): string {
  const name = d?.name ?? '';
  const fallback = `${name}騎手の特徴を直近3年のデータで分析。勝率・複勝率・回収率、得意な競馬場・コース・距離、人気別成績、相性の良い調教師まで。毎週更新。`;
  const total = d?.total_stats;
  if (!d || !hasEnoughRaces(d.total_races) || !total) return fallback;

  const profile = [d.affiliation && `${d.affiliation}所属`, d.debut_year && `${d.debut_year}年デビュー`].filter(Boolean).join('・');
  const parts: string[] = [
    `${name}騎手${profile ? `（${profile}）` : ''}の成績を直近3年・${d.total_races.toLocaleString('ja-JP')}走で分析。勝率${pct(total.win_rate)}・複勝率${pct(total.place_rate)}。`,
  ];
  const course = bestByPlaceRate(d.racecourse_stats);
  if (course) parts.push(`得意な競馬場は${course.name}（複勝率${pct(course.place_rate)}）。`);
  parts.push('コース・距離・人気別の成績と回収率を毎週更新。');
  return parts.join('');
}

export function trainerDescription(d: any): string {
  const name = d?.name ?? '';
  const fallback = `${name}調教師${d?.stable ? `（${d.stable}）` : ''}の成績を直近3年のデータで分析。勝率・回収率、得意な距離・コース、主戦騎手、レース間隔別の成績まで。毎週更新。`;
  const total = d?.total_stats;
  if (!d || !hasEnoughRaces(d.total_races) || !total) return fallback;

  const parts: string[] = [
    `${name}調教師${d.stable ? `（${d.stable}）` : ''}の成績を直近3年・${d.total_races.toLocaleString('ja-JP')}走で分析。勝率${pct(total.win_rate)}・複勝率${pct(total.place_rate)}。`,
  ];
  const course = bestByPlaceRate(d.racecourse_stats);
  if (course) parts.push(`得意な競馬場は${course.name}（複勝率${pct(course.place_rate)}）。`);
  parts.push('主戦騎手やレース間隔別の成績まで毎週更新。');
  return parts.join('');
}

export function courseDescription(courseLabel: string, periodYears: number, d: any): string {
  const totalRaces: number = d?.total_races ?? d?.course_info?.total_races ?? 0;
  const fallback = `${courseLabel}の傾向を直近${periodYears}年${totalRaces ? `・${totalRaces.toLocaleString('ja-JP')}レース` : ''}のデータで分析。有利な枠順・脚質、得意な騎手・種牡馬・調教師、荒れやすさまで。毎週更新。`;
  if (!d || !hasEnoughRaces(totalRaces)) return fallback;

  const parts: string[] = [`${courseLabel}の傾向を直近${periodYears}年・${totalRaces.toLocaleString('ja-JP')}レースのデータで分析。`];
  // getCourseDataFromGCS は popularity_stats を { fav1: {...}, ... } の形に変換して返す（生の配列でも読めるようにしておく）
  const pop = d.popularity_stats;
  const fav1 = Array.isArray(pop) ? pop.find((r: any) => r.popularity_group === 'fav1') : pop?.fav1;
  if (fav1 && typeof fav1.place_rate === 'number') parts.push(`1番人気の複勝率は${pct(fav1.place_rate)}。`);
  const sire = Array.isArray(d.pedigree_stats) ? d.pedigree_stats[0] : undefined;
  if (sire?.name && sire.wins) parts.push(`種牡馬の最多勝は${sire.name}（${sire.wins}勝）。`);
  parts.push('有利な枠順・脚質、得意な騎手・調教師まで毎週更新。');
  return parts.join('');
}
