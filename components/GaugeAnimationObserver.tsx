'use client';

import { useEffect } from 'react';

/**
 * ゲージの馬アイコンのアニメーションを制御するコンポーネント
 * Intersection Observerを使用して、要素が表示された時にアニメーションを開始する
 */
export default function GaugeAnimationObserver() {
  useEffect(() => {
    // Intersection Observerのオプション
    const observerOptions = {
      root: null, // ビューポートを基準
      rootMargin: '0px',
      threshold: 0.1, // 10%表示されたら検知
    };

    // コールバック関数
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // 要素が表示されたらアニメーションクラスを追加
          entry.target.classList.add('animate');
          // 一度アニメーションしたら監視を解除（再度スクロールしても再生しない）
          observer.unobserve(entry.target);
        }
      });
    };

    // Observerを作成
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // すべての馬アイコンを監視対象に追加
    const horseIcons = document.querySelectorAll('.gauge-horse-icon');
    horseIcons.forEach((icon) => {
      observer.observe(icon);
    });

    // クリーンアップ
    return () => {
      horseIcons.forEach((icon) => {
        observer.unobserve(icon);
      });
    };
  }, []);

  return null; // このコンポーネントは何も描画しない
}
