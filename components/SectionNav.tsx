'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SectionNav.module.css';

type Item = { id: string; label: string };

export default function SectionNav({ items }: { items: Item[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // ★ 交差判定（既存ロジックがある場合はそれを使用）
  useEffect(() => {
    const sections = items
      .map(i => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el);

    const io = new IntersectionObserver(
      (entries) => {
        // 一番 viewport 上部に近いものをactiveに
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));

        if (visible[0]) {
          const id = visible[0].target.id;
          setActiveId(id);
        }
      },
      {
        root: null,
        threshold: [0.1, 0.25, 0.5],
        rootMargin: '-20% 0px -60% 0px', // 上を優先（調整可）
      }
    );

    sections.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // クリック時に該当セクションへスムーズスクロール
    const y = el.getBoundingClientRect().top + window.scrollY - 80; // ヘッダーぶん調整
    window.scrollTo({ top: y, behavior: 'smooth' });
    // メニューを閉じる
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* ハンバーガーメニューボタン */}
      <button
        className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        type="button"
        aria-label="メニューを開く"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* モバイルメニュー */}
      {isMenuOpen && (
        <>
          <div
            className={styles.menuOverlay}
            onClick={() => setIsMenuOpen(false)}
          />
          <div className={styles.mobileMenu}>
            {items.map((item) => (
              <button
                key={item.id}
                className={`${styles.mobileMenuItem} ${activeId === item.id ? styles.active : ''}`}
                onClick={() => handleClick(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
