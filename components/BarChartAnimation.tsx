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
      if (!section) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // セクション内のすべてのbar-fillに.visibleクラスを追加
              const barFills = section.querySelectorAll('.bar-fill');
              barFills.forEach((bar) => {
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

      observer.observe(section);

      return () => {
        if (section) {
          observer.unobserve(section);
        }
      };
    };

    // ページ読み込み完了後に実行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeObserver);
      return () => document.removeEventListener('DOMContentLoaded', initializeObserver);
    } else {
      initializeObserver();
    }
  }, []);

  return <>{children}</>;
}
