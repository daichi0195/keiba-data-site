import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /_next/ は CSS・JS の配信元。ブロックすると Googlebot がページを正しく描画できないため許可する
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: 'https://www.keibadata.com/sitemap.xml',
  };
}
