'use client';

import { useEffect, useRef, useState } from 'react';
import Link from '@/components/HardLink';
import { cx } from './cx';

export interface RankRow {
  id: number;
  name: string;
  wins: number;
  rides: number;
  winRate: number;
}

/**
 * リーディング上位10件（見本 lib.mjs の rank()）
 * 1行＝順位・名前（勝率・騎乗/出走数）・棒・勝利数。棒はテーマカラー1色で、値が大きいほど長く濃い。
 * 画面に入ったら棒が左から伸び、勝利数が0から数え上がる（1回だけ。動きを減らす設定では出さない）。
 * 「6〜10位を表示」は見本どおり置く（見本の CSS では今の幅のどれでも10位まで出ていて、ボタンは隠れる）。
 */
export default function LeadingRank({ rows, unit, hrefPrefix }: { rows: RankRow[]; unit: string; hrefPrefix: string }) {
  const top = rows.slice(0, 10);
  const max = top[0]?.wins ?? 1;
  const min = top[top.length - 1]?.wins ?? 0;
  const [open, setOpen] = useState(false);
  const [anim, setAnim] = useState(false);
  const [seen, setSeen] = useState(false);
  const [counts, setCounts] = useState<number[] | null>(null);
  const olRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const ol = olRef.current;
    if (!ol || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // 読み込んだ時点で画面に入っているものは動かさない（完成形が一瞬出てから0に戻るちらつきを防ぐ）
    const r0 = ol.getBoundingClientRect();
    if (r0.top < innerHeight && r0.bottom > 0) return;
    setAnim(true);
    let raf = 0;
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((en) => {
          if (!en.isIntersecting) return;
          io.disconnect();
          setSeen(true);
          // 勝利数を0から数え上げる（1行ごとに45msずらす）
          const t0 = performance.now();
          const tick = (now: number) => {
            let done = true;
            const next = top.map((x, k) => {
              const p = Math.min(1, Math.max(0, (now - t0 - k * 45) / 650));
              if (p < 1) done = false;
              return Math.round(x.wins * (1 - Math.pow(1 - p, 3)));
            });
            setCounts(next);
            if (!done) raf = requestAnimationFrame(tick);
            else setCounts(null);
          };
          raf = requestAnimationFrame(tick);
        });
      },
      { threshold: 0.2 }
    );
    io.observe(ol);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // 行は初回の表示のまま（動きは1回だけ）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ol ref={olRef} className={cx('rk', open && 'open', anim && 'anim', seen && 'in')}>
        {top.map((x, i) => (
          <li key={x.id} data-more={i >= 5 ? '' : undefined} style={{ ['--i' as string]: i }}>
            <Link prefetch={false} href={`${hrefPrefix}${x.id}`}>
              <span className={cx('rk-n num', i < 3 && `t3 m${i + 1}`)}>{i + 1}</span>
              <span className={cx('rk-t')}>
                <b>{x.name}</b>
                <span>
                  勝率 {x.winRate.toFixed(1)}%・{x.rides.toLocaleString('ja-JP')}
                  {unit}
                </span>
              </span>
              <span className={cx('rk-b')}>
                <i
                  style={{
                    width: `${((x.wins / max) * 100).toFixed(1)}%`,
                    opacity: (max === min ? 1 : 0.55 + (0.45 * (x.wins - min)) / (max - min)).toFixed(2),
                  }}
                />
              </span>
              <span className={cx('rk-w')}>
                <b className={cx('num')}>{counts ? counts[i] : x.wins}</b>勝
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <button className={cx('rk-m')} type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? '5位までにする' : '6〜10位を表示'}
      </button>
    </>
  );
}
