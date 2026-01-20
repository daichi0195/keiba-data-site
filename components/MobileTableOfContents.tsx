'use client';

import { useState } from 'react';
import styles from './MobileTableOfContents.module.css';

type Heading = {
  level: number;
  text: string;
  id: string;
};

type Props = {
  headings: Heading[];
  initialShow?: number;
};

export default function MobileTableOfContents({ headings, initialShow = 5 }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  // H2とH3のみをフィルタリング
  const filteredHeadings = headings.filter(h => h.level === 2 || h.level === 3);

  if (filteredHeadings.length === 0) {
    return null;
  }

  const displayHeadings = isExpanded ? filteredHeadings : filteredHeadings.slice(0, initialShow);
  const hasMore = filteredHeadings.length > initialShow;

  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // ヘッダー分のオフセット
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className={styles.tocContainer}>
      <div className={styles.tocHeader}>
        <h2 className={styles.tocTitle}>目次</h2>
      </div>

      <ul className={styles.tocList}>
        {displayHeadings.map((heading, index) => (
          <li
            key={index}
            className={heading.level === 3 ? styles.tocItemIndent : styles.tocItem}
          >
            <button
              onClick={() => handleHeadingClick(heading.id)}
              className={styles.tocLink}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>

      {!isExpanded && hasMore && (
        <button
          onClick={() => setIsExpanded(true)}
          className={styles.showAllButton}
        >
          すべて表示
        </button>
      )}
    </nav>
  );
}
