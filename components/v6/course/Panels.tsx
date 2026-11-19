'use client';

import { useRef, useState } from 'react';
import s from './course.module.css';
import { useSeen } from './motion';

/**
 * 条件別（人気・枠順・脚質・性別・馬体重）の板。
 * スマホ・タブレット（900px未満）は複勝率の横棒を見せ、「全項目を見る」で全13項目の表を開閉する。
 * 900px以上は表を最初から出す（CSS）。画面に入ったら横棒が伸びる（.in）。
 */
export function CondPanel({ lead, bars, table, extra }: { lead: React.ReactNode; bars: React.ReactNode; table: React.ReactNode; extra?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [ref, seen] = useSeen<HTMLDivElement>();
  return (
    <div ref={ref} className={`${s.cp} ${s.cd} ${s.an}${seen ? ` ${s.in}` : ''}${open ? ` ${s.open}` : ''}`}>
      {lead}
      {bars}
      <button className={s['cd-m']} type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? '表を閉じる' : '全項目を見る（13項目）'}
      </button>
      {table}
      {extra}
    </div>
  );
}

/** 騎手・種牡馬・母父・調教師のランキングの板：最初は10件、「さらに表示」で全件（最大50件） */
export function RankPanel({ rest, note, children, onOpen }: { rest: number; note: string; children: React.ReactNode; onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toggle = () => {
    const next = !open;
    if (next) onOpen?.();
    setOpen(next);
    // 閉じたときに表の先頭が画面の上へ出ていたら、見出しまで戻す
    const box = ref.current;
    if (!next && box && box.getBoundingClientRect().top < 120) {
      box.closest('section')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };
  return (
    <div ref={ref} className={`${s.cp} ${s.rkt}${open ? ` ${s.open}` : ''}`}>
      {children}
      <div className={`${s['rkt-f']}${rest > 0 ? '' : ` ${s.solo}`}`}>
        <span>{note}</span>
        {rest > 0 && (
          <button className={s['rkt-m']} type="button" aria-expanded={open} onClick={toggle}>
            {open ? '10件までにする' : `さらに表示（残り${rest}件）`}
          </button>
        )}
      </div>
    </div>
  );
}
