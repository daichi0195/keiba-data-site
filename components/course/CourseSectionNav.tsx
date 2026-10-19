'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './course.module.css';

type Item = { id: string; label: string };

/**
 * ヘッダー直下に固定するページ内ナビ（横スクロールのチップ列）。
 * 表示中のセクションをテーマカラーで示す。
 */
export default function CourseSectionNav({ items }: { items: Item[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');
  const navRef = useRef<HTMLElement>(null);

  // 固定ヘッダーの高さに合わせて、ナビの固定位置をずらす
  useEffect(() => {
    const header = document.querySelector('header');
    const apply = () => {
      const h = header ? header.getBoundingClientRect().height : 48;
      document.documentElement.style.setProperty('--course-header-h', `${Math.round(h)}px`);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  // 表示中のセクションを追跡
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-130px 0px -65% 0px' }
    );
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  // 選択中のチップが見える位置までナビを横スクロール
  useEffect(() => {
    const nav = navRef.current;
    const chip = nav?.querySelector<HTMLAnchorElement>(`a[href="#${activeId}"]`);
    if (nav && chip) {
      nav.scrollTo({ left: chip.offsetLeft - 16, behavior: 'smooth' });
    }
  }, [activeId]);

  return (
    <nav ref={navRef} className={styles.snav} aria-label="ページ内">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={`${styles.chip} ${item.id === activeId ? styles.chipOn : ''}`}
          aria-current={item.id === activeId ? 'true' : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
