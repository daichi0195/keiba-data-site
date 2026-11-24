'use client';

import { useRef } from 'react';
import { ScrollBar, useScrollBar } from '@/components/layout/ScrollBar';
import w from './week.module.css';

/** 今週の重賞のバナーを横に送る枠（スマホ・タブレット）と、その下の細いスクロールバー */
export default function BannerScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { bar, update } = useScrollBar(ref);
  return (
    <>
      <div ref={ref} className={w.bn} onScroll={update}>
        {children}
      </div>
      <ScrollBar bar={bar} />
    </>
  );
}
