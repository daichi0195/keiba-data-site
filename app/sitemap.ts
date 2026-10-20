import { MetadataRoute } from 'next';
import { ALL_COURSES, getCourseUrl } from '@/lib/courses';
import { ALL_JOCKEYS } from '@/lib/jockeys';
import { ALL_TRAINERS } from '@/lib/trainers';
import { ALL_SIRES } from '@/lib/sires';
import { getAllArticles } from '@/lib/articles';
import { getCourseDataFromGCS } from '@/lib/getCourseDataFromGCS';
import { getJockeyDataFromGCS } from '@/lib/getJockeyDataFromGCS';
import { getTrainerDataFromGCS } from '@/lib/getTrainerDataFromGCS';
import { getSireDataFromGCS } from '@/lib/getSireDataFromGCS';
import { hasEnoughRaces } from '@/lib/dataPageRules';
import { getDataUpdatedAt } from '@/lib/dataDate';

// 1日1回再生成
export const revalidate = 86400;

/**
 * 対象レース数が十分なコースだけを返す
 * （レース数が少ないコースページは noindex のため、サイトマップにも載せない）
 */
async function getIndexableCourses() {
  const results = await Promise.allSettled(
    ALL_COURSES.map(async (course) => {
      const variant = (course as { variant?: string }).variant;
      const distanceParam = variant ? `${course.distance}-${variant}` : course.distance;
      const data = await getCourseDataFromGCS(course.racecourse, course.surface, distanceParam);
      const totalRaces = data?.total_races ?? data?.course_info?.total_races ?? 0;
      return { course, indexable: hasEnoughRaces(totalRaces) };
    })
  );

  return results.flatMap((r) => (r.status === 'fulfilled' && r.value.indexable ? [r.value.course] : []));
}

/**
 * 対象レース数が十分な騎手・調教師・種牡馬だけを返す（少ないページは noindex のため、サイトマップにも載せない）
 * データが取れなかったときは、ページ側と同じく載せる側に倒す
 */
async function filterIndexable<T extends { id: number }>(items: T[], load: (id: number) => Promise<any>): Promise<T[]> {
  const results = await Promise.allSettled(items.map(async (item) => hasEnoughRaces((await load(item.id))?.total_races)));
  return items.filter((_, i) => {
    const r = results[i];
    return r.status === 'rejected' || r.value;
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ベースURL
  const baseUrl = 'https://www.keibadata.com';
  // lastmod はデータの実際の更新日（週次）にする。毎回「今日」にすると Google に lastmod を信用されなくなる
  const dataUpdatedAt = getDataUpdatedAt() ?? new Date();

  // ホームページ
  const homeEntry: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  // コースページ（対象レース数が十分なもののみ）
  const indexableCourses = await getIndexableCourses();
  const courseEntries: MetadataRoute.Sitemap = indexableCourses.map((course) => ({
    url: `${baseUrl}${getCourseUrl(course)}`,
    lastModified: dataUpdatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 騎手ページ（リストは直近3年で30レース以上の現役騎手に限定済み）
  const jockeyEntries: MetadataRoute.Sitemap = (await filterIndexable(ALL_JOCKEYS, getJockeyDataFromGCS)).map((jockey) => ({
    url: `${baseUrl}/jockeys/${jockey.id}`,
    lastModified: dataUpdatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 調教師ページ
  const trainerEntries: MetadataRoute.Sitemap = (await filterIndexable(ALL_TRAINERS, getTrainerDataFromGCS)).map((trainer) => ({
    url: `${baseUrl}/trainers/${trainer.id}`,
    lastModified: dataUpdatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 種牡馬ページ
  const sireEntries: MetadataRoute.Sitemap = (await filterIndexable(ALL_SIRES, getSireDataFromGCS)).map((sire) => ({
    url: `${baseUrl}/sires/${sire.id}`,
    lastModified: dataUpdatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 記事ページ（link指定のカルーセル専用エントリは除外）
  const articleEntries: MetadataRoute.Sitemap = getAllArticles()
    .filter((article) => !article.frontmatter.link)
    .map((article) => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: article.frontmatter.date ? new Date(article.frontmatter.date) : dataUpdatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));

  // AI予測のレース個別ページ（/ai/races/[slug]）は noindex のためサイトマップに含めない

  // 静的ページ
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/courses`, lastModified: dataUpdatedAt, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/jockeys`, lastModified: dataUpdatedAt, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/trainers`, lastModified: dataUpdatedAt, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/sires`, lastModified: dataUpdatedAt, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/articles`, lastModified: dataUpdatedAt, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/ai`, lastModified: dataUpdatedAt, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/about/data`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/disclaimer`, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/contact`, changeFrequency: 'yearly' as const, priority: 0.3 },
  ];

  return [
    ...homeEntry,
    ...staticEntries,
    ...articleEntries,
    ...courseEntries,
    ...jockeyEntries,
    ...trainerEntries,
    ...sireEntries,
  ];
}
