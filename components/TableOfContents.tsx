'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './TableOfContents.module.css';
import AIBanner from './AIBanner';

type Item = { id: string; label: string };

export default function TableOfContents({ items, hideToc, showBanner }: { items?: Item[]; hideToc?: boolean; showBanner?: boolean }) {
  const [tocItems, setTocItems] = useState<Item[]>(items || []);
  const [activeId, setActiveId] = useState<string>('');
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const activeItemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const tocRef = useRef<HTMLElement>(null);

  // 🔍 強化されたデバッグログ
  useEffect(() => {
    if (!tocRef.current) return;

    const logDebugInfo = () => {
      if (!tocRef.current) return;

      const element = tocRef.current;
      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);

      // 全ての親要素を取得
      const ancestors: HTMLElement[] = [];
      let current = element.parentElement;
      while (current) {
        ancestors.push(current);
        current = current.parentElement;
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 ENHANCED DEBUG INFO - TableOfContents');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      console.log('\n📍 Element (<aside>) Computed Styles:');
      console.log('  position:', styles.position);
      console.log('  top:', styles.top);
      console.log('  bottom:', styles.bottom);
      console.log('  left:', styles.left);
      console.log('  right:', styles.right);
      console.log('  display:', styles.display);
      console.log('  align-self:', styles.alignSelf);
      console.log('  justify-self:', styles.justifySelf);
      console.log('  grid-column:', styles.gridColumn);
      console.log('  grid-row:', styles.gridRow);
      console.log('  grid-area:', styles.gridArea);
      console.log('  z-index:', styles.zIndex);
      console.log('  transform:', styles.transform);
      console.log('  will-change:', styles.willChange);
      console.log('  contain:', styles.contain);
      console.log('  overflow:', styles.overflow);
      console.log('  overflow-x:', styles.overflowX);
      console.log('  overflow-y:', styles.overflowY);
      console.log('  height:', styles.height);
      console.log('  max-height:', styles.maxHeight);
      console.log('  width:', styles.width);

      console.log('\n📏 Element BoundingClientRect:');
      console.log('  top:', rect.top);
      console.log('  bottom:', rect.bottom);
      console.log('  left:', rect.left);
      console.log('  right:', rect.right);
      console.log('  width:', rect.width);
      console.log('  height:', rect.height);

      console.log('\n🌳 Ancestor Elements Chain:');
      ancestors.forEach((ancestor, index) => {
        const ancestorStyles = window.getComputedStyle(ancestor);
        const tagName = ancestor.tagName.toLowerCase();
        const className = ancestor.className;
        console.log(`\n  [${index}] <${tagName}>${className ? ` .${className}` : ''}`);
        console.log('    position:', ancestorStyles.position);
        console.log('    overflow:', ancestorStyles.overflow);
        console.log('    overflow-x:', ancestorStyles.overflowX);
        console.log('    overflow-y:', ancestorStyles.overflowY);
        console.log('    transform:', ancestorStyles.transform);
        console.log('    will-change:', ancestorStyles.willChange);
        console.log('    contain:', ancestorStyles.contain);
        console.log('    perspective:', ancestorStyles.perspective);
        console.log('    filter:', ancestorStyles.filter);
        console.log('    isolation:', ancestorStyles.isolation);
        console.log('    display:', ancestorStyles.display);
        console.log('    height:', ancestorStyles.height);
        console.log('    grid-template-columns:', ancestorStyles.gridTemplateColumns);
        console.log('    grid-template-rows:', ancestorStyles.gridTemplateRows);
      });

      console.log('\n📜 Scroll Info:');
      console.log('  window.scrollY:', window.scrollY);
      console.log('  document.documentElement.scrollTop:', document.documentElement.scrollTop);
      console.log('  document.body.scrollTop:', document.body.scrollTop);

      console.log('\n🎯 Sticky Detection:');
      console.log('  CSS.supports("position", "sticky"):', CSS.supports('position', 'sticky'));
      console.log('  CSS.supports("position", "-webkit-sticky"):', CSS.supports('position', '-webkit-sticky'));

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    };

    // 初回ログ出力
    setTimeout(logDebugInfo, 1000);

    // スクロール時のログ出力
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (!tocRef.current) return;
        const rect = tocRef.current.getBoundingClientRect();
        console.log('\n📜 SCROLL EVENT:');
        console.log('  window.scrollY:', window.scrollY);
        console.log('  Element top:', rect.top, '← Should be 90px when sticky');
        console.log('  Expected:', rect.top === 90 ? '✅ STICKY WORKING!' : '❌ NOT STICKY');
      }, 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // H2要素を自動検出して目次を生成
  useEffect(() => {
    if (items && items.length > 0) {
      setTocItems(items);
      setActiveId(items[0]?.id ?? '');
      return;
    }

    // article内のH2だけを検出
    const articleElement = document.querySelector('article');
    if (!articleElement) return;

    const headings = Array.from(articleElement.querySelectorAll('h2'));
    const generatedItems = headings
      .filter(heading => !heading.classList.contains('section-title')) // 表のタイトルを除外
      .map((heading, index) => {
        let id = heading.id;
        if (!id) {
          id = `heading-${index}`;
          heading.id = id;
        }
        return {
          id,
          label: heading.textContent || '',
        };
      })
      .filter(item => item.label.trim() !== ''); // 空のlabelを除外

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
    <aside ref={tocRef} className={styles.tableOfContents} style={hideToc ? { position: 'relative', top: 'auto' } : undefined}>
      {!hideToc && (
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
      )}
      {(hideToc || showBanner) && <AIBanner />}
    </aside>
  );
}
