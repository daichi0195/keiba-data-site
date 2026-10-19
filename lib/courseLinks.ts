/**
 * 騎手・種牡馬・調教師ページ共通：コース別成績の行 → 実在するコースページの URL・表示名
 *
 * データの variant は「外」「内」「inner」「outer」や空のこともあり、
 * そのまま URL を組み立てると存在しないページ（404）へのリンクになる。
 * ここで ALL_COURSES に実在するページだけに解決する。
 */

import { ALL_COURSES, getCourseUrl } from './courses';

export interface CourseRowLike {
  name: string;
  racecourse?: string;
  racecourse_en: string;
  surface_en: string;
  distance: number;
  variant?: string | null;
  link?: string;
}

const COURSE_URLS = new Set(ALL_COURSES.map((c) => getCourseUrl(c)));

/** データの馬場区分をコースページの URL 表記にそろえる（障害は jump / obstacle のこともある） */
function surfaceSlug(surfaceEn: string): string {
  if (surfaceEn === 'jump' || surfaceEn === 'obstacle') return 'steeplechase';
  return surfaceEn;
}

/** 内回り・外回りの区別（データの variant、またはコース名末尾の「内」「外」） */
export function courseVariantOf(row: CourseRowLike): 'inner' | 'outer' | undefined {
  const v = row.variant ?? '';
  if (v === 'inner' || v === '内' || v === '内回り') return 'inner';
  if (v === 'outer' || v === '外' || v === '外回り') return 'outer';
  const m = String(row.name ?? '').match(/m(内|外)(回り)?$|（(内|外)回り）$/);
  const mark = m?.[1] ?? m?.[3];
  if (mark === '内') return 'inner';
  if (mark === '外') return 'outer';
  return undefined;
}

/**
 * 実在するコースページの URL（内回り・外回りのページがあるコースはそちらへ）。
 * ページが存在しないコースは undefined（リンク切れを作らない）
 */
export function resolveCourseUrl(row: CourseRowLike): string | undefined {
  const base = `/courses/${row.racecourse_en}/${surfaceSlug(row.surface_en)}/${row.distance}`;
  const variant = courseVariantOf(row);
  if (variant && COURSE_URLS.has(`${base}-${variant}`)) return `${base}-${variant}`;
  if (COURSE_URLS.has(base)) return base;
  if (row.link && COURSE_URLS.has(row.link)) return row.link;
  return undefined;
}

/** URL が実在するコースページかどうか */
export function isCourseUrl(url: string | undefined): boolean {
  return typeof url === 'string' && COURSE_URLS.has(url);
}

/**
 * 表示用のコース名（データのコース名から競馬場名と空白を除く。例：「京都競馬場 芝 1400m外」→「芝1400m外」）
 * withRacecourse で「京都芝1400m外」、shortDirt で「ダ」表記
 */
export function courseLabel(row: CourseRowLike, opts: { withRacecourse?: boolean; shortDirt?: boolean } = {}): string {
  const rc = String(row.racecourse ?? '').replace(/競馬場$/, '');
  let label = String(row.name ?? '')
    .replace(/[^\s]*競馬場/, '')
    .replace(/\s+/g, '')
    .replace(/（外回り）/g, '外')
    .replace(/（内回り）/g, '内');
  if (opts.shortDirt) label = label.replace(/ダート/g, 'ダ');
  return opts.withRacecourse ? `${rc}${label}` : label;
}
