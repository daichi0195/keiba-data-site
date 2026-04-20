import { MetadataRoute } from 'next';
import { ALL_COURSES } from '@/lib/courses';
import { ALL_JOCKEYS } from '@/lib/jockeys';
import { ALL_TRAINERS } from '@/lib/trainers';
import { ALL_SIRES } from '@/lib/sires';
import { getAllArticles } from '@/lib/articles';

interface AIRaceIndexEntry {
  slug: string;
  date: string;
}

async function fetchAIRaceSlugs(): Promise<AIRaceIndexEntry[]> {
  try {
    const res = await fetch(
      `https://storage.googleapis.com/umadata/predictions/index.json?t=${Date.now()}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    return (await res.json()) as AIRaceIndexEntry[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ベースURL
  const baseUrl = 'https://www.keibadata.com';

  // ホームページ
  const homeEntry: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  // コースページ
  const courseEntries: MetadataRoute.Sitemap = ALL_COURSES.map(course => {
    let path = `/courses/${course.racecourse}/${course.surface}/${course.distance}`;

    if (course.variant === 'inner') {
      path = `/courses/${course.racecourse}/${course.surface}/${course.distance}-inner`;
    } else if (course.variant === 'outer') {
      path = `/courses/${course.racecourse}/${course.surface}/${course.distance}-outer`;
    }

    return {
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    };
  });

  // 騎手ページ
  const jockeyEntries: MetadataRoute.Sitemap = ALL_JOCKEYS.map(jockey => ({
    url: `${baseUrl}/jockeys/${jockey.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 調教師ページ
  const trainerEntries: MetadataRoute.Sitemap = ALL_TRAINERS.map(trainer => ({
    url: `${baseUrl}/trainers/${trainer.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 種牡馬ページ
  const sireEntries: MetadataRoute.Sitemap = ALL_SIRES.map(sire => ({
    url: `${baseUrl}/sires/${sire.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 記事ページ（link指定のカルーセル専用エントリは除外）
  const articleEntries: MetadataRoute.Sitemap = getAllArticles()
    .filter((article) => !article.frontmatter.link)
    .map((article) => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: article.frontmatter.date
        ? new Date(article.frontmatter.date)
        : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // AI予測レースページ
  const aiRaces = await fetchAIRaceSlugs();
  const aiRaceEntries: MetadataRoute.Sitemap = aiRaces.map((race) => ({
    url: `${baseUrl}/ai/races/${race.slug}`,
    lastModified: race.date ? new Date(race.date) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  // 静的ページ
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/jockeys`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/trainers`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sires`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ai`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ai/races`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  return [
    ...homeEntry,
    ...staticEntries,
    ...articleEntries,
    ...aiRaceEntries,
    ...courseEntries,
    ...jockeyEntries,
    ...trainerEntries,
    ...sireEntries,
  ];
}
