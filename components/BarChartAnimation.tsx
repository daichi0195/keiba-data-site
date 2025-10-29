'use client';

import { useEffect } from 'react';

interface BarChartAnimationProps {
  children: React.ReactNode;
}

export default function BarChartAnimation({ children }: BarChartAnimationProps) {
  useEffect(() => {
    // DOMが完全に読み込まれた後に実行
    const initializeObservers = () => {
      // 各表要素が画面内に入ったときにアニメーションを開始
      const gateDetailElement = document.querySelector('.gate-place-rate-detail');
      const runningStyleDetailElement = document.querySelector('.running-style-place-rate-detail');

      console.log('BarChartAnimation: gate-place-rate-detail element found:', gateDetailElement);
      console.log('BarChartAnimation: running-style-place-rate-detail element found:', runningStyleDetailElement);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const container = entry.target as HTMLElement;
              const bars = container.querySelectorAll('.gate-bar, .running-style-bar');

              console.log('BarChartAnimation: Table element visible, found bars:', bars.length);

              bars.forEach((bar, index) => {
                console.log(`Adding visible class to bar ${index}`);
                bar.classList.add('visible');
              });

              // 一度アニメーションしたら監視を解除
              observer.unobserve(container);
            }
          });
        },
        {
          threshold: 0.1, // 10%見えたらトリガー
          rootMargin: '0px 0px -100px 0px' // 下部から100px手前でトリガー
        }
      );

      // 各表要素を監視
      if (gateDetailElement) {
        console.log('BarChartAnimation: Starting to observe gate-place-rate-detail');
        observer.observe(gateDetailElement);
      }

      if (runningStyleDetailElement) {
        console.log('BarChartAnimation: Starting to observe running-style-place-rate-detail');
        observer.observe(runningStyleDetailElement);
      }

      return () => {
        if (gateDetailElement) observer.unobserve(gateDetailElement);
        if (runningStyleDetailElement) observer.unobserve(runningStyleDetailElement);
      };
    };

    // ページ読み込み完了後に実行
    if (document.readyState === 'loading') {
      console.log('BarChartAnimation: DOM still loading, waiting for DOMContentLoaded');
      document.addEventListener('DOMContentLoaded', initializeObservers);
      return () => document.removeEventListener('DOMContentLoaded', initializeObservers);
    } else {
      console.log('BarChartAnimation: DOM already loaded, initializing now');
      initializeObservers();
    }
  }, []);

  return <>{children}</>;
}
