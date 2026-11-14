import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // content/articles を動的ルート（sitemap等）のランタイムにも含める
  outputFileTracingIncludes: {
    '/**': ['./content/**/*'],
  },
  // Disable polyfills for modern browsers
  experimental: {
    // Use modern JavaScript output
    optimizePackageImports: ['react-icons'],
  },
  // Optimize for modern browsers (ES2020+)
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // Cloudflare Workers のテスト用ドメイン（*.workers.dev）は本番と重複するため検索エンジンに登録させない
  async headers() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: '(?<sub>.*)\\.workers\\.dev' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
  // 廃止したページのリダイレクト（空ページ・テストページの整理）
  async redirects() {
    return [
      // 有馬記念ページ（データなしの空ページ）→ 中山芝2500mのコースデータへ
      { source: '/races/arima-kinen', destination: '/courses/nakayama/turf/2500', permanent: true },
      { source: '/races', destination: '/courses', permanent: true },
      // テスト用ページ
      { source: '/trainers/test', destination: '/trainers', permanent: true },
      // 直近3年に騎乗がなくなりデータが空になった騎手ページ（URL は残し一覧へ）
      { source: '/jockeys/5621', destination: '/jockeys', permanent: true },
      { source: '/jockeys/5620', destination: '/jockeys', permanent: true },
      // 旧URL（Search Console で 404・ソフト404・クロール済み未登録として残っているもの）
      // 障害コースは旧パス jump → steeplechase
      { source: '/courses/:venue/jump/:distance', destination: '/courses/:venue/steeplechase/:distance', permanent: true },
      // 内回り・外回りを分ける前の URL → レース数の多い方へ
      { source: '/courses/kyoto/turf/1400', destination: '/courses/kyoto/turf/1400-outer', permanent: true },
      { source: '/courses/kyoto/turf/1600', destination: '/courses/kyoto/turf/1600-inner', permanent: true },
      { source: '/courses/niigata/turf/2000', destination: '/courses/niigata/turf/2000-outer', permanent: true },
      // 「1600-外」形式の旧URL（新潟芝1600mは外回りのみ）
      { source: '/courses/niigata/turf/1600-%E5%A4%96', destination: '/courses/niigata/turf/1600', permanent: true },
      // 「1700-2」のような数字の接尾辞付き URL（得意・苦手コースのチップの React key がページ内データに残り、Googlebot が拾っていた）→ 接尾辞なしのコースへ
      { source: '/courses/:venue/:surface/:distance(\\d+)-:n(\\d)', destination: '/courses/:venue/:surface/:distance', permanent: true },
      // ページのない人物 ID（引退・対象外など。Search Console の 404 やコラムの旧リンクに残っていたもの）→ 一覧へ
      ...[5592, 5443, 5299, 5416, 5389, 5524, 5558, 5534, 1014, 1188, 1199, 1116, 1205, 1164, 1029].map((id) => ({ source: `/jockeys/${id}`, destination: '/jockeys', permanent: true })),
      ...[1072, 1107, 412, 1005, 425, 428, 1002, 420, 438, 1003, 1010, 1046, 1033, 1041].map((id) => ({ source: `/trainers/${id}`, destination: '/trainers', permanent: true })),
      ...[1005, 666].map((id) => ({ source: `/sires/${id}`, destination: '/sires', permanent: true })),
      // 末尾に「$」が付いた誤リンク → トップ
      { source: '/\\$', destination: '/', permanent: true },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);


// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
