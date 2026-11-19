'use client';

import { useEffect, useRef, useState } from 'react';
import { cx } from './cx';

/**
 * トップの見出しチップ（見本 top.js の「ページ内の移動と、チップの現在地」）
 * - 押すと節へなめらかに移動（履歴に積まない）。押したチップを現在地にして、移動が終わるまで固定する
 * - スクロールに合わせて、画面の上 25〜35% にある節のチップを現在地にする。一番下では最後のチップ、上端付近では無し
 */
export default function TopChips({ items }: { items: { id: string; label: string }[] }) {
  const [current, setCurrent] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const lockUntil = useRef(0);

  // 現在地のチップを横送りの中央へ
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (!current) {
      box.scrollTo({ left: 0 });
      return;
    }
    const a = box.querySelector<HTMLElement>(`a[href="#${current}"]`);
    if (a) box.scrollTo({ left: a.offsetLeft - (box.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
  }, [current]);

  useEffect(() => {
    const ids = items.map((x) => x.id);
    const onScroll = () => {
      if (Date.now() < lockUntil.current) return;
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) setCurrent(ids[ids.length - 1]);
      else if (scrollY < 200) setCurrent(null);
    };
    addEventListener('scroll', onScroll, { passive: true });
    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (es) => {
          es.forEach((en) => {
            if (!en.isIntersecting || Date.now() < lockUntil.current) return;
            setCurrent(en.target.id);
          });
        },
        { rootMargin: '-25% 0px -65% 0px' }
      );
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) io!.observe(el);
      });
    }
    return () => {
      removeEventListener('scroll', onScroll);
      io?.disconnect();
    };
  }, [items]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    lockUntil.current = Date.now() + 1200;
    setCurrent(id);
  };

  return (
    <nav className={cx('chips')} aria-label="トップの見出し">
      <div ref={boxRef}>
        {items.map((x) => (
          <a key={x.id} href={`#${x.id}`} className={cx(current === x.id && 'on') || undefined} onClick={(e) => go(e, x.id)}>
            {x.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
