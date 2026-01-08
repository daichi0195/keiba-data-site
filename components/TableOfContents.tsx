'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './TableOfContents.module.css';

type Item = { id: string; label: string };

export default function TableOfContents({ items }: { items: Item[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // スクロール位置に応じてアクティブセクションを追跡
  useEffect(() => {
    const sections = items
      .map(i => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el);

    const observer = new IntersectionObserver(
      (entries) => {
        // 一番viewport上部に近いものをactiveに
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
        rootMargin: '-20% 0px -60% 0px',
      }
    );

    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  // スクロール検知
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // activeIdが変わったら全てのボタンのフォーカスを外す
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [activeId]);

  const handleClick = (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: y, behavior: 'smooth' });
    // クリック後にフォーカスを外す
    event.currentTarget.blur();
  };

  return (
    <aside className={styles.tableOfContents}>
      <nav className={`${styles.nav} ${isScrolling ? styles.scrolling : ''}`}>
        <h2 className={styles.title}>目次</h2>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.listItem}>
              <button
                className={`${styles.link} ${activeId === item.id ? styles.active : ''}`}
                onClick={(e) => handleClick(item.id, e)}
                type="button"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
