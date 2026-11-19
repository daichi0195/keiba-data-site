'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import s from './course.module.css';

type Item = { id: string; label: string };

/**
 * ページ内の移動（チップの帯）。見本 top.js の「チップの現在地」と course.js の帯の高さの反映。
 * - 表示中の節のチップを現在地（濃い灰の塗り）にする。ページの一番上では現在地なし、一番下では最後のチップ
 * - 押したら節へ移動（履歴に積まない）。移動が終わるまでは押したチップを現在地に固定する
 * - 帯の高さ（幅で1行／2行）を --chips-h に入れ、見出しへ移動したときの止まる位置に使う
 */
export default function CourseChips({ items }: { items: Item[] }) {
  const [active, setActive] = useState('');
  const navRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const lockUntil = useRef(0);

  const setChip = useCallback((id: string) => {
    setActive(id);
    const box = boxRef.current;
    const chip = box?.querySelector<HTMLAnchorElement>(`a[href="#${CSS.escape(id)}"]`);
    if (box && chip) box.scrollTo({ left: chip.offsetLeft - (box.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }, []);

  // 帯の高さ
  useEffect(() => {
    const nav = navRef.current;
    const root = nav?.closest<HTMLElement>('[data-course-page]');
    if (!nav || !root) return;
    const apply = () => root.style.setProperty('--chips-h', `${nav.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);

  // 現在地
  useEffect(() => {
    const onScroll = () => {
      if (Date.now() < lockUntil.current || items.length === 0) return;
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) setChip(items[items.length - 1].id);
      else if (scrollY < 200) {
        setActive('');
        boxRef.current?.scrollTo({ left: 0 });
      }
    };
    addEventListener('scroll', onScroll, { passive: true });
    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (es) => {
          es.forEach((en) => {
            if (!en.isIntersecting || Date.now() < lockUntil.current) return;
            setChip(en.target.id);
          });
        },
        { rootMargin: '-25% 0px -65% 0px' }
      );
      items.forEach((it) => {
        const el = document.getElementById(it.id);
        if (el) io!.observe(el);
      });
    }
    return () => {
      removeEventListener('scroll', onScroll);
      io?.disconnect();
    };
  }, [items, setChip]);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    lockUntil.current = Date.now() + 1200;
    setChip(id);
  };

  return (
    <nav ref={navRef} className={s.chips} aria-label="ページ内">
      <div ref={boxRef}>
        {items.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            className={it.id === active ? s.on : undefined}
            aria-current={it.id === active ? 'location' : undefined}
            onClick={(e) => onClick(e, it.id)}
          >
            {it.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
