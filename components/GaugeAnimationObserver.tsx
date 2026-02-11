'use client';

import { useEffect } from 'react';

/**
 * ゲージの馬アイコンのアニメーションを制御するコンポーネント
 * Intersection Observerを使用して、要素が表示された時にアニメーションを開始する
 */
export default function GaugeAnimationObserver() {
  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    // Intersection Observerのオプション
    const observerOptions = {
      root: null, // ビューポートを基準
      rootMargin: '0px',
      threshold: 0.1, // 10%表示されたら検知
    };

    // コールバック関数
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.classList.contains('animate')) {
          // 要素が表示されたらアニメーションクラスを追加
          entry.target.classList.add('animate');
          // 一度アニメーションしたら監視を解除
          if (observer) {
            observer.unobserve(entry.target);
          }
        }
      });
    };

    // 要素を監視対象に追加する関数
    const observeIcons = () => {
      const horseIcons = document.querySelectorAll('.gauge-horse-icon');
      horseIcons.forEach((icon) => {
        if (!icon.classList.contains('animate') && observer) {
          observer.observe(icon);
        }
      });
    };

    // DOMの準備を待ってから監視を開始
    const initObserver = () => {
      // Observerを作成
      observer = new IntersectionObserver(observerCallback, observerOptions);

      // 初期の要素を監視
      observeIcons();

      // MutationObserverで動的に追加される要素も監視
      mutationObserver = new MutationObserver(() => {
        observeIcons();
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    };

    // DOMの準備完了を待つ
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initObserver);
    } else {
      // すでにDOMが準備完了している場合は少し待ってから実行
      setTimeout(initObserver, 100);
    }

    // クリーンアップ
    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
      document.removeEventListener('DOMContentLoaded', initObserver);
    };
  }, []);

  return null; // このコンポーネントは何も描画しない
}
