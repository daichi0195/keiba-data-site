'use client';

// 動画（見本の .st-v）：押すまでは静止画＋再生ボタン。押すとその場で YouTube の再生に切り替える（JS が無いときは YouTube を開く）
import { useState } from 'react';
import Image from 'next/image';
import { cx } from './cx';

export default function Video({ id, title }: { id: string; title: string }) {
  const [play, setPlay] = useState(false);
  return (
    <figure className={cx('st-v')}>
      {play ? (
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <a
          href={`https://www.youtube.com/watch?v=${id}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`動画を再生：${title}（YouTube）`}
          onClick={(e) => {
            e.preventDefault();
            setPlay(true);
          }}
        >
          <Image src={`/images/about/video-${id}.jpg`} alt="" width={880} height={495} sizes="(min-width: 1800px) 384px, (min-width: 700px) 50vw, 100vw" />
          <span className={cx('st-play')} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
        </a>
      )}
    </figure>
  );
}
