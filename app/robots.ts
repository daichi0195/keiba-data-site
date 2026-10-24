import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /_next/ は CSS・JS の配信元。ブロックすると Googlebot がページを正しく描画できないため許可する
        // AI予測のレース個別ページ（/ai/races/〜、/ai/tomorrow/〜）は noindex で毎週数十件ずつ増え、
        // Googlebot がその再クロールに時間を使ってデータページが「検出 - インデックス未登録」のまま残るため、クロール自体を止める
        // （一覧の /ai・/ai/races・/ai/tomorrow は末尾の / がないので対象外）
        disallow: ['/api/', '/admin/', '/ai/races/', '/ai/tomorrow/'],
      },
      {
        // AdSense のクローラーは広告の内容判定のため全ページを読めるようにしておく
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
    ],
    sitemap: 'https://www.keibadata.com/sitemap.xml',
  };
}
