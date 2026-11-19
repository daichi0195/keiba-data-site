'use client';

import { useEffect, useRef, useState } from 'react';
import s from './ai.module.css';

/**
 * ページ内の見出しへのチップ（見本 top.js のチップ＋ js/ai.js の固定）。
 * - 画面に入った見出しのチップを現在地にする。最下部では最後のチップ、上端付近では無し
 * - 押したチップは、送りが止まって利用者が自分で動かすまで現在地に固定する（短いページで隣のチップが点くのを防ぐ）
 * - 横に並ぶ見出しが同じ高さにあるときは左を優先する
 */
export default function SectionChips({ items }: { items: { id: string; label: string }[] }) {
  const [on, setOn] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const locked = useRef<string | null>(null);
  const lockUntil = useRef(0);

  // 現在地のチップを横送りの中央へ
  useEffect(() => {
    const b = box.current;
    if (!b) return;
    if (!on) {
      b.scrollTo({ left: 0 });
      return;
    }
    const c = b.querySelector<HTMLElement>(`a[href="#${on}"]`);
    if (c) b.scrollTo({ left: c.offsetLeft - b.offsetLeft - (b.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
  }, [on]);

  useEffect(() => {
    const ids = items.map((x) => x.id);
    const target = (id: string) => document.getElementById(id);
    const atBottom = () => innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    const choose = (id: string | null) => {
      if (locked.current) return setOn(locked.current);
      if (Date.now() < lockUntil.current) return;
      // 横に並ぶ見出し（上端が同じ）は左を優先
      if (id) {
        const i = ids.indexOf(id);
        const prev = ids[i - 1];
        const a = prev ? target(prev) : null;
        const b = target(id);
        if (a && b && Math.abs(a.getBoundingClientRect().top - b.getBoundingClientRect().top) < 2 && !atBottom()) id = prev;
      }
      setOn(id);
    };
    const onScroll = () => {
      if (atBottom()) choose(ids[ids.length - 1]);
      else if (scrollY < 200) choose(null);
    };
    addEventListener('scroll', onScroll, { passive: true });
    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (es) => es.forEach((en) => en.isIntersecting && choose(en.target.id)),
        { rootMargin: '-25% 0px -65% 0px' },
      );
      ids.forEach((id) => {
        const el = target(id);
        if (el) io!.observe(el);
      });
    }
    return () => {
      removeEventListener('scroll', onScroll);
      io?.disconnect();
    };
  }, [items]);

  const unlock = () => {
    locked.current = null;
  };
  const onClick = (e: React.MouseEvent, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    locked.current = id;
    lockUntil.current = Date.now() + 1200;
    setOn(id);
    // 送りが止まるまで固定し、そのあと利用者が自分で動かしたら外す
    setTimeout(() => {
      addEventListener('wheel', unlock, { once: true, passive: true });
      addEventListener('touchmove', unlock, { once: true, passive: true });
      addEventListener('keydown', unlock, { once: true });
    }, 900);
  };

  return (
    <nav className={s.chips} aria-label="ページ内の見出し">
      <div ref={box}>
        {items.map((x) => (
          <a key={x.id} href={`#${x.id}`} className={on === x.id ? s.on : undefined} onClick={(e) => onClick(e, x.id)}>
            {x.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
