'use client';

// 折れ線グラフ（chart.js を使う lines.tsx）は、使う記事でだけ読み込む（chart.js は gzip で約50KB）。
// 対応表（index.tsx）から直接読み込むと、グラフのない記事にも chart.js が載るため、ここで分ける。SSR はそのまま行う。
import dynamic from 'next/dynamic';

export const MaturityChart = dynamic(() => import('./lines').then((m) => m.MaturityChart));
export const AverageMaturityChart = dynamic(() => import('./lines').then((m) => m.AverageMaturityChart));
