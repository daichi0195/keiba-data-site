import { MetadataRoute } from 'next';
import { ALL_COURSES } from '@/lib/courses';

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

  return [...homeEntry, ...courseEntries];
}
