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
