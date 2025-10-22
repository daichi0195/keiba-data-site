'use client';

import { useState, useEffect } from 'react';
import styles from './SectionNav.module.css';

type NavItem = {
  id: string;
  label: string;
};

type Props = {
  items: NavItem[];
};

export default function SectionNav({ items }: Props) {
  const [activeSection, setActiveSection] = useState<string>(items[0]?.id || '');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // ナビバーの高さ分オフセット

      // 各セクションの位置を確認
      for (const item of items) {
        const section = document.getElementById(item.id);
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;

          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 初期状態を設定

    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      const offsetTop = section.offsetTop - 100; // ナビバーの高さ分を考慮
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav className={styles.sectionNav}>
      <div className={styles.navContainer}>
        {items.map((item) => (
          <button
            key={item.id}
            className={`${styles.navButton} ${
              activeSection === item.id ? styles.active : ''
            }`}
            onClick={() => scrollToSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}