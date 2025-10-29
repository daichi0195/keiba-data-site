'use client';

import { useEffect } from 'react';

interface BarChartAnimationProps {
  children: React.ReactNode;
}

export default function BarChartAnimation({ children }: BarChartAnimationProps) {
  useEffect(() => {
    // DOMが完全に読み込まれた後に実行
    const initializeObserver = () => {
      const section = document.getElementById('characteristics-section');
      console.log('BarChartAnimation: section element found:', section);

      if (!section) {
        console.error('BarChartAnimation: characteristics-section not found');
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            console.log('BarChartAnimation: IntersectionObserver triggered', {
              isIntersecting: entry.isIntersecting,
              intersectionRatio: entry.intersectionRatio
            });

            if (entry.isIntersecting) {
              // セクション内のすべての横棒グラフに.visibleクラスを追加
              const gateBars = section.querySelectorAll('.gate-bar');
              const runningStyleBars = section.querySelectorAll('.running-style-bar');

              console.log('BarChartAnimation: Found gate-bars:', gateBars.length);
              console.log('BarChartAnimation: Found running-style-bars:', runningStyleBars.length);

              gateBars.forEach((bar, index) => {
                console.log(`Adding visible class to gate-bar ${index}`);
                bar.classList.add('visible');
              });

              runningStyleBars.forEach((bar, index) => {
                console.log(`Adding visible class to running-style-bar ${index}`);
                bar.classList.add('visible');
              });

              // 一度アニメーションしたら監視を解除
              observer.unobserve(section);
            }
          });
        },
        {
          threshold: 0.1, // 10%見えたらトリガー
          rootMargin: '0px 0px -100px 0px' // 下部から100px手前でトリガー
        }
      );

      console.log('BarChartAnimation: Starting to observe section');
      observer.observe(section);

      return () => {
        if (section) {
          observer.unobserve(section);
        }
      };
    };

    // ページ読み込み完了後に実行
    if (document.readyState === 'loading') {
      console.log('BarChartAnimation: DOM still loading, waiting for DOMContentLoaded');
      document.addEventListener('DOMContentLoaded', initializeObserver);
      return () => document.removeEventListener('DOMContentLoaded', initializeObserver);
    } else {
      console.log('BarChartAnimation: DOM already loaded, initializing now');
      initializeObserver();
    }
  }, []);

  return <>{children}</>;
}
