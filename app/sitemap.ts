import { MetadataRoute } from 'next';
import { ALL_COURSES } from '@/lib/courses';
import { ALL_JOCKEYS } from '@/lib/jockeys';
import { ALL_TRAINERS } from '@/lib/trainers';
import { ALL_SIRES } from '@/lib/sires';

export default function sitemap(): MetadataRoute.Sitemap {
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

  // 記事ページ
  const articleEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/articles/1`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

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

  return [...homeEntry, ...staticEntries, ...articleEntries, ...courseEntries, ...jockeyEntries, ...trainerEntries, ...sireEntries];
}
