import { MetadataRoute } from 'next';
import { ALL_COURSES } from '@/lib/courses';
import { ALL_JOCKEYS } from '@/lib/jockeys';
import { ALL_TRAINERS } from '@/lib/trainers';

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

  return [...homeEntry, ...courseEntries, ...jockeyEntries, ...trainerEntries];
}
