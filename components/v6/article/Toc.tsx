'use client';

// 目次（見本 js/article.js）：本文の中の目次（先に5件、残りは「すべて表示」）と、PC の右に固定する目次（いま読んでいる見出しを現在地にする）
import { useEffect, useRef, useState } from 'react';
import { cx } from './cx';

export type Heading = { level: number; text: string; id: string };

// 目次から見出しへ（履歴に積まない）
function jump(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

export function TocInline({ headings, initialShow = 5 }: { headings: Heading[]; initialShow?: number }) {
  const [open, setOpen] = useState(false);
  if (headings.length === 0) return null;
  const hasMore = headings.length > initialShow;
  return (
    <nav className={cx('toc', open && 'open')} aria-label="目次">
      <p className={cx('toc-h')}>目次</p>
      <ol>
        {headings.map((h, i) => (
          <li key={h.id + i} className={cx(`l${h.level}`)} data-more={i >= initialShow ? '' : undefined}>
            <a href={`#${h.id}`} onClick={(e) => jump(e, h.id)}>
              {h.text}
            </a>
          </li>
        ))}
      </ol>
      {hasMore && (
        <button type="button" className={cx('toc-m')} aria-expanded={open} onClick={() => setOpen(true)}>
          すべて表示（全{headings.length}件）
        </button>
      )}
    </nav>
  );
}

export function TocSide({ headings }: { headings: Heading[] }) {
  const [cur, setCur] = useState(0);
  const box = useRef<HTMLElement>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (headings.length === 0) return;
    const els = headings.map((h) => document.getElementById(h.id));
    let tick = false;
    const mark = () => {
      tick = false;
      let k = 0;
      els.forEach((h, i) => {
        if (h && h.getBoundingClientRect().top < 140) k = i;
      });
      setCur(k);
    };
    const onScroll = () => {
      if (!tick) {
        tick = true;
        requestAnimationFrame(mark);
      }
    };
    addEventListener('scroll', onScroll, { passive: true });
    mark();
    return () => removeEventListener('scroll', onScroll);
  }, [headings]);

  // 現在地が目次の枠の外なら、枠の中で見える位置まで送る
  useEffect(() => {
    const b = box.current, a = links.current[cur];
    if (b && a && b.scrollHeight > b.clientHeight && getComputedStyle(b).display !== 'none') b.scrollTo({ top: a.offsetTop - b.clientHeight / 2 });
  }, [cur]);

  if (headings.length === 0) return null;
  return (
    <aside className={cx('ts')} aria-label="目次">
      <nav className={cx('ts-in')} ref={box}>
        <p className={cx('ts-h')}>目次</p>
        <ol>
          {headings.map((h, i) => (
            <li key={h.id + i} className={cx(`l${h.level}`)}>
              <a
                ref={(el) => {
                  links.current[i] = el;
                }}
                href={`#${h.id}`}
                className={cx(i === cur && 'on')}
                aria-current={i === cur ? 'location' : undefined}
                onClick={(e) => jump(e, h.id)}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
