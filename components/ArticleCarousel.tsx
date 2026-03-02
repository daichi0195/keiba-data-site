'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';

// サーバーでは useEffect、クライアントでは useLayoutEffect（描画前に実行 → 計測後の再レンダーをペイント前に完了）
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/articles';
import styles from './ArticleCarousel.module.css';

interface ArticleCarouselProps {
  articles: Article[];
}

// CSS の値と一致させる定数
const PC_CARD = 600;
const PC_GAP  = 16;
const MB_PEEK = 8; // SP時: centering=(viewport-cardWidth)/2=12px → コンテンツ(padding:12px)と左端を揃える
const MB_GAP  = 8;

export default function ArticleCarousel({ articles }: ArticleCarouselProps) {
  // 新着順でソート
  const sortedArticles = useMemo(
    () =>
      [...articles].sort(
        (a, b) =>
          new Date(b.frontmatter.date).getTime() -
          new Date(a.frontmatter.date).getTime()
      ),
    [articles]
  );

  const n = sortedArticles.length;

  // クローン配列: [最後のクローン, 記事1...記事N, 最初のクローン]
  const items = useMemo(
    () =>
      n > 0
        ? [sortedArticles[n - 1], ...sortedArticles, sortedArticles[0]]
        : [],
    [sortedArticles, n]
  );

  const [currentIndex, setCurrentIndex] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  // containerWidth: 初期値0 → useLayoutEffect で描画前に更新
  const [containerWidth, setContainerWidth] = useState(0);
  // isReady: 計測完了後にフェードインアニメーションを開始するためのフラグ
  const [isReady, setIsReady] = useState(false);

  const viewportRef    = useRef<HTMLDivElement>(null);
  const autoTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIndexRef = useRef(currentIndex);
  const touchStartXRef = useRef<number | null>(null);

  currentIndexRef.current = currentIndex;

  // ---- コンテナ幅の計測 ----
  useIsomorphicLayoutEffect(() => {
    if (!viewportRef.current) return;

    const updateWidth = () => {
      setContainerWidth(window.innerWidth);
    };

    updateWidth();
    setIsReady(true);

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // ---- transform の計算 ----
  // containerWidth が 0 の SSR / 初期レンダリング時は PC 想定値をフォールバックに使う
  const isMobile  = containerWidth > 0 && containerWidth <= 768;
  const cardWidth = containerWidth === 0 ? PC_CARD
    : isMobile ? containerWidth - MB_PEEK * 2 - MB_GAP
    : PC_CARD;
  const gap       = isMobile ? MB_GAP : PC_GAP;
  // 中央揃えオフセット (containerWidth == 0 のときは 0 → useLayoutEffect 後に補正)
  const centering = containerWidth > 0 ? (containerWidth - cardWidth) / 2 : 0;
  const trackOffset = centering - currentIndex * (cardWidth + gap);

  // ---- 自動スクロール ----
  const clearTimer = useCallback(() => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(() => {
    clearTimer();
    if (n === 0) return;
    autoTimerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsAnimating(true);
    }, 8000);
  }, [clearTimer, n]);

  useEffect(() => {
    if (n > 0) scheduleNext();
    return clearTimer;
  }, [scheduleNext, clearTimer, n]);

  // ---- トランジション終了: クローン → 本物へジャンプ ----
  const handleTransitionEnd = useCallback(() => {
    const idx = currentIndexRef.current;
    setIsAnimating(false);
    if (idx === 0) {
      setCurrentIndex(n);
    } else if (idx === n + 1) {
      setCurrentIndex(1);
    }
    scheduleNext();
  }, [n, scheduleNext]);

  const goPrev = useCallback(() => {
    if (isAnimating) return;
    clearTimer();
    setCurrentIndex((prev) => prev - 1);
    setIsAnimating(true);
  }, [isAnimating, clearTimer]);

  const goNext = useCallback(() => {
    if (isAnimating) return;
    clearTimer();
    setCurrentIndex((prev) => prev + 1);
    setIsAnimating(true);
  }, [isAnimating, clearTimer]);

  const handleIndicatorClick = useCallback(
    (targetIndex: number) => {
      if (isAnimating) return;
      clearTimer();
      setCurrentIndex(targetIndex + 1);
      setIsAnimating(true);
    },
    [isAnimating, clearTimer]
  );

  // ---- タッチスワイプ ----
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartXRef.current = null;
  };

  if (n === 0) {
    return <p className={styles.emptyMessage}>まだ記事がありません</p>;
  }

  const normalizedIndex = ((currentIndex - 1) % n + n) % n;

  return (
    <div className={`${styles.carouselContainer} ${isReady ? styles.carouselReady : ''}`}>
      <div className={styles.carouselWrapperContainer}>
        <button
          className={`${styles.navButton} ${styles.navButtonPrev}`}
          onClick={goPrev}
          aria-label="前の記事"
        />

        <div
          ref={viewportRef}
          className={styles.carouselViewport}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={styles.carouselTrack}
            style={{
              transform: `translateX(${trackOffset}px)`,
              transition: isAnimating ? 'transform 0.4s ease' : 'none',
              gap: `${gap}px`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {items.map((article, index) => (
              <Link
                key={`${article.slug}-${index}`}
                href={`/articles/${article.slug}`}
                className={styles.carouselItem}
                style={{ flex: `0 0 ${cardWidth}px` }}
              >
                {article.frontmatter.thumbnail && (
                  <div className={styles.thumbnailWrapper}>
                    <Image
                      src={article.frontmatter.thumbnail}
                      alt={article.frontmatter.title}
                      fill
                      className={styles.thumbnail}
                      sizes="(max-width: 768px) 90vw, 600px"
                      priority={true}
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>

        <button
          className={`${styles.navButton} ${styles.navButtonNext}`}
          onClick={goNext}
          aria-label="次の記事"
        />
      </div>

      <div className={styles.indicators}>
        {sortedArticles.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${index === normalizedIndex ? styles.indicatorActive : ''}`}
            onClick={() => handleIndicatorClick(index)}
            aria-label={`記事${index + 1}へ移動`}
          />
        ))}
      </div>
    </div>
  );
}
