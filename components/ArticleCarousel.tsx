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
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const isScrollingRef = useRef(false);

  // 新着順でソート
  const sortedArticles = [...articles].sort((a, b) => {
    return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
  });

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

  // ページ読み込み完了後にアニメーション開始
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  // 10秒ごとに自動スクロール
  useEffect(() => {
    const autoScroll = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedArticles.length);
    }, 10000);

    return () => clearInterval(autoScroll);
  }, [sortedArticles.length]);

  // currentIndexが変更されたらスクロール
  useEffect(() => {
    if (!carouselRef.current) return;

    isScrollingRef.current = true;

    if (isMobile) {
      // モバイル: カード幅 + gap を計算してスクロール
      const cardWidth = carouselRef.current.scrollWidth / sortedArticles.length;
      const gap = 8;
      const targetScroll = (cardWidth + gap) * currentIndex;
      carouselRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    } else {
      // デスクトップ: 画面幅でスクロール
      const scrollAmount = carouselRef.current.offsetWidth * currentIndex;
      carouselRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    }

    // スクロール完了後にフラグをリセット
    const timer = setTimeout(() => {
      isScrollingRef.current = false;
    }, 600);

    return () => clearTimeout(timer);
  }, [currentIndex, isMobile, sortedArticles.length]);

  // モバイルでのスクロール終了時にインデックスを更新
  useEffect(() => {
    if (!isMobile || !carouselRef.current) return;

    const handleScrollEnd = () => {
      // プログラムによるスクロール中は何もしない
      if (isScrollingRef.current) return;

      const scrollLeft = carouselRef.current!.scrollLeft;
      const cardWidth = carouselRef.current!.scrollWidth / sortedArticles.length;
      const gap = 8;

      // 現在のスクロール位置から最も近いインデックスを計算
      const calculatedIndex = Math.round(scrollLeft / (cardWidth + gap));
      const clampedIndex = Math.max(0, Math.min(calculatedIndex, sortedArticles.length - 1));

      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
      }
    };

    const carousel = carouselRef.current;
    carousel.addEventListener('scrollend', handleScrollEnd);

    return () => {
      carousel.removeEventListener('scrollend', handleScrollEnd);
    };
  }, [isMobile, currentIndex, sortedArticles.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : sortedArticles.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < sortedArticles.length - 1 ? prev + 1 : 0));
  };

  const handleIndicatorClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (sortedArticles.length === 0) {
    return <p className={styles.emptyMessage}>まだ記事がありません</p>;
  }

  return (
    <div className={`${styles.carouselContainer} ${isLoaded ? styles.loaded : ''}`}>
      <button className={styles.navButton + ' ' + styles.navButtonPrev} onClick={handlePrev} aria-label="前の記事">
      </button>

      <div className={styles.carouselWrapper} ref={carouselRef}>
        {sortedArticles.map((article, index) => (
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

      {/* インジケーター */}
      <div className={styles.indicators}>
        {sortedArticles.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${index === currentIndex ? styles.indicatorActive : ''}`}
            onClick={() => handleIndicatorClick(index)}
            aria-label={`記事${index + 1}へ移動`}
          />
        ))}
      </div>
    </div>
  );
}
