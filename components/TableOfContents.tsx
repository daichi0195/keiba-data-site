'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './TableOfContents.module.css';

type Item = { id: string; label: string };

export default function TableOfContents({ items }: { items?: Item[] }) {
  const [tocItems, setTocItems] = useState<Item[]>(items || []);
  const [activeId, setActiveId] = useState<string>('');
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const activeItemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  // H2要素を自動検出して目次を生成
  useEffect(() => {
    if (items && items.length > 0) {
      setTocItems(items);
      setActiveId(items[0]?.id ?? '');
      return;
    }

    // main要素内のarticle内のH2だけを検出
    const articleElement = document.querySelector('main article');
    if (!articleElement) return;

    const headings = Array.from(articleElement.querySelectorAll('h2'));
    const generatedItems = headings.map((heading, index) => {
      let id = heading.id;
      if (!id) {
        id = `heading-${index}`;
        heading.id = id;
      }
      return {
        id,
        label: heading.textContent || '',
      };
    });

    setTocItems(generatedItems);
    if (generatedItems.length > 0) {
      setActiveId(generatedItems[0].id);
    }
  }, [items]);

  // スクロール位置に応じてアクティブセクションを追跡
  useEffect(() => {
    if (tocItems.length === 0) return;

    const sections = tocItems
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
  }, [tocItems]);

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

  // activeIdが変わったら、目次をスクロールして該当項目を表示
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // アクティブな項目を目次の表示範囲に自動スクロール
    const activeElement = activeItemRefs.current.get(activeId);
    if (activeElement && listRef.current) {
      const list = listRef.current;
      const elementTop = activeElement.offsetTop;
      const elementHeight = activeElement.offsetHeight;
      const listHeight = list.clientHeight;
      const listScrollTop = list.scrollTop;

      // 要素が表示範囲外の場合、スクロール
      if (elementTop < listScrollTop) {
        // 上にはみ出ている場合
        list.scrollTo({ top: elementTop - 20, behavior: 'smooth' });
      } else if (elementTop + elementHeight > listScrollTop + listHeight) {
        // 下にはみ出ている場合
        list.scrollTo({ top: elementTop + elementHeight - listHeight + 20, behavior: 'smooth' });
      }
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
        <ul className={styles.list} ref={listRef}>
          {tocItems.map((item) => (
            <li
              key={item.id}
              className={styles.listItem}
              ref={(el) => {
                if (el) {
                  activeItemRefs.current.set(item.id, el);
                } else {
                  activeItemRefs.current.delete(item.id);
                }
              }}
            >
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

      {/* バナーエリア */}
      <div className={styles.bannerArea}>
        <div className={styles.bannerPlaceholder}>
          <div className={styles.bannerTitle}>競馬AI製作中！</div>
          <div className={styles.bannerSubtitle}>COMING SOON</div>
        </div>
      </div>
    </aside>
  );
}
