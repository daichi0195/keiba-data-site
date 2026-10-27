'use client';

import { useState } from 'react';
import styles from './course.module.css';

/**
 * 表の横スクロール枠（全表共通）
 * 横にスクロールすると .narrow を付け、1列目（.keyIn / .rnm）を先頭3文字分に縮める
 */
export default function ScrollTable({ children }: { children: React.ReactNode }) {
  const [narrow, setNarrow] = useState(false);
  return (
    <div
      className={`${styles.tbl} ${narrow ? styles.narrow : ''}`}
      onScroll={(e) => setNarrow(e.currentTarget.scrollLeft > 8)}
    >
      {children}
    </div>
  );
}
