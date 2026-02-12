'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/articles';
import styles from './ArticleCarousel.module.css';

interface ArticleCarouselProps {
  articles: Article[];
}

export default function ArticleCarousel({ articles }: ArticleCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const isScrollingRef = useRef(false);

  // 新着順でソート
  const sortedArticles = [...articles].sort((a, b) => {
    return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
  });

  // 無限スクロール用：配列を30回繰り返す
  const repeatCount = 30;
  const infiniteArticles = sortedArticles.length > 0
    ? Array(repeatCount).fill(sortedArticles).flat()
    : sortedArticles;

  // 真ん中あたり（15サイクル目）から開始
  const [currentIndex, setCurrentIndex] = useState(sortedArticles.length * 15);

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ページ読み込み完了後に初期位置設定
  useEffect(() => {
    if (typeof window !== 'undefined' && sortedArticles.length > 0 && carouselRef.current) {
      const carousel = carouselRef.current;

      // DOM要素が完全にレンダリングされるまで待つ
      const initScroll = () => {
        const firstCard = carousel.children[0] as HTMLElement;
        if (!firstCard || firstCard.offsetWidth === 0) {
          // まだレンダリングされていない場合は少し待つ
          setTimeout(initScroll, 10);
          return;
        }

        // 初期位置にスクロール（アニメーションなし）
        const cardWidth = firstCard.offsetWidth;
        const gap = isMobile ? 8 : 24;
        const targetScroll = (cardWidth + gap) * sortedArticles.length * 15;
        carousel.scrollLeft = targetScroll;

        requestAnimationFrame(() => {
          setIsLoaded(true);
          setTimeout(() => {
            resetAutoScrollTimer();
          }, 50);
        });
      };

      initScroll();
    }
  }, [sortedArticles.length, isMobile]);

  // インデックスからスクロール位置を計算してスクロールする関数
  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
    if (!carouselRef.current || infiniteArticles.length === 0) return;

    const carousel = carouselRef.current;

    // 各カードの実際の幅を取得
    const firstCard = carousel.children[0] as HTMLElement;
    if (!firstCard) return;

    const cardWidth = firstCard.offsetWidth;
    const gap = isMobile ? 8 : 24;

    // スクロール位置を計算
    const targetScroll = (cardWidth + gap) * index;

    // スクロール
    carousel.scrollTo({
      left: targetScroll,
      behavior
    });
  };

  // 自動スクロール用のタイマー管理
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetAutoScrollTimer = () => {
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
    }

    if (sortedArticles.length > 0) {
      autoScrollTimerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 8000);
    }
  };

  useEffect(() => {
    return () => {
      if (autoScrollTimerRef.current) {
        clearTimeout(autoScrollTimerRef.current);
      }
    };
  }, []);

  // currentIndexが変更されたらスクロール
  useEffect(() => {
    if (!carouselRef.current || sortedArticles.length === 0) return;

    isScrollingRef.current = true;
    scrollToIndex(currentIndex);

    const resetTimer = setTimeout(() => {
      isScrollingRef.current = false;
      resetAutoScrollTimer();
    }, 600);

    // エッジ検出：最初の5サイクルまたは最後の5サイクルに入ったらジャンプ
    const loopTimer = setTimeout(() => {
      if (!carouselRef.current || sortedArticles.length === 0) return;

      const cycleNumber = Math.floor(currentIndex / sortedArticles.length);

      if (cycleNumber < 5) {
        // 最初の方に近づいた → 15サイクル目の対応する位置へ
        const offset = currentIndex % sortedArticles.length;
        const newIndex = sortedArticles.length * 15 + offset;
        scrollToIndex(newIndex, 'auto');
        setTimeout(() => {
          setCurrentIndex(newIndex);
        }, 0);
      } else if (cycleNumber >= 25) {
        // 最後の方に近づいた → 15サイクル目の対応する位置へ
        const offset = currentIndex % sortedArticles.length;
        const newIndex = sortedArticles.length * 15 + offset;
        scrollToIndex(newIndex, 'auto');
        setTimeout(() => {
          setCurrentIndex(newIndex);
        }, 0);
      }
    }, 650);

    return () => {
      clearTimeout(resetTimer);
      clearTimeout(loopTimer);
    };
  }, [currentIndex, sortedArticles.length]);

  // モバイルでのスクロール終了時にインデックスを更新
  useEffect(() => {
    if (!isMobile || !carouselRef.current || infiniteArticles.length === 0) return;

    const handleScrollEnd = () => {
      // プログラムによるスクロール中は何もしない
      if (isScrollingRef.current) return;

      const carousel = carouselRef.current!;
      const firstCard = carousel.children[0] as HTMLElement;
      if (!firstCard) return;

      const cardWidth = firstCard.offsetWidth;
      const gap = 8;
      const scrollLeft = carousel.scrollLeft;

      // 現在のスクロール位置から最も近いインデックスを計算
      const calculatedIndex = Math.round(scrollLeft / (cardWidth + gap));
      const clampedIndex = Math.max(0, Math.min(calculatedIndex, infiniteArticles.length - 1));

      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
      }
    };

    const carousel = carouselRef.current;
    carousel.addEventListener('scrollend', handleScrollEnd);

    return () => {
      carousel.removeEventListener('scrollend', handleScrollEnd);
    };
  }, [isMobile, currentIndex, infiniteArticles.length]);

  const handlePrev = () => {
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
    }
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleIndicatorClick = (index: number) => {
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
    }

    // 現在位置を元の配列のインデックスに変換
    const currentNormalized = currentIndex % sortedArticles.length;

    // 前方と後方の距離を計算
    let forwardDistance = index - currentNormalized;
    if (forwardDistance < 0) {
      forwardDistance += sortedArticles.length;
    }

    let backwardDistance = currentNormalized - index;
    if (backwardDistance < 0) {
      backwardDistance += sortedArticles.length;
    }

    // より近い方向に移動
    if (forwardDistance <= backwardDistance) {
      setCurrentIndex(currentIndex + forwardDistance);
    } else {
      setCurrentIndex(currentIndex - backwardDistance);
    }
  };

  if (sortedArticles.length === 0) {
    return <p className={styles.emptyMessage}>まだ記事がありません</p>;
  }

  return (
    <div className={`${styles.carouselContainer} ${isLoaded ? styles.loaded : ''}`}>
      <div className={styles.carouselWrapperContainer}>
        <button className={styles.navButton + ' ' + styles.navButtonPrev} onClick={handlePrev} aria-label="前の記事">
        </button>

        <div className={styles.carouselWrapper} ref={carouselRef}>
          {infiniteArticles.map((article, index) => (
            <Link
              key={`${article.slug}-${index}`}
              href={`/articles/${article.slug}`}
              className={styles.carouselItem}
            >
              {article.frontmatter.thumbnail && (
                <div className={styles.thumbnailWrapper}>
                  <Image
                    src={article.frontmatter.thumbnail}
                    alt={article.frontmatter.title}
                    fill
                    className={styles.thumbnail}
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>
              )}
            </Link>
          ))}
        </div>

        <button className={styles.navButton + ' ' + styles.navButtonNext} onClick={handleNext} aria-label="次の記事">
        </button>
      </div>

      {/* インジケーター */}
      <div className={styles.indicators}>
        {sortedArticles.map((_, index) => {
          const normalizedIndex = currentIndex % sortedArticles.length;
          return (
            <button
              key={index}
              className={`${styles.indicator} ${index === normalizedIndex ? styles.indicatorActive : ''}`}
              onClick={() => handleIndicatorClick(index)}
              aria-label={`記事${index + 1}へ移動`}
            />
          );
        })}
      </div>
    </div>
  );
}
