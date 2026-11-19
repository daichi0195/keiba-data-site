'use client';

// 開閉する板（見本 js/jockey.js の [data-tg] の部分）。
// 「さらに表示」（open-m）と「全項目を見る」（open-t）の2つの状態を持ち、板の下端にボタンを出す。
// 中身（棒の一覧・表）はサーバーで描いたものを children で受け取る。表示の切り替えは CSS（.open-m / .open-t）が行う。
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { cx, sel } from './cx';

type Open = { m: boolean; t: boolean };
type Ctx = { open: Open; set: (k: keyof Open, v: boolean) => void };
const SyncCtx = createContext<Ctx | null>(null);

/** 横に並ぶ板（得意・苦手）を一緒に開閉する */
export function SyncGroup({ className, children }: { className: string; children: ReactNode }) {
  const [open, setOpen] = useState<Open>({ m: false, t: false });
  const set = (k: keyof Open, v: boolean) => setOpen((o) => ({ ...o, [k]: v }));
  return (
    <SyncCtx.Provider value={{ open, set }}>
      <div className={cx(className)} data-sync>{children}</div>
    </SyncCtx.Provider>
  );
}

/** 開閉したあと、表の右端の合図と見出し行の位置を測り直す（EntityEffects が受け取る） */
export const refresh = () => window.dispatchEvent(new Event('jk:refresh'));

export default function Box({
  className,
  children,
  ftClass = 'jk-ft',
  bsClass = 'jk-bs',
  hint,
  more,
  table = false,
  foot = true,
}: {
  className: string;
  children: ReactNode;
  ftClass?: string;
  bsClass?: string;
  hint?: ReactNode;
  /** さらに表示：残りの件数と、閉じたときの件数 */
  more?: { rest: number; initial: number };
  /** 全項目を見る（13項目） */
  table?: boolean;
  foot?: boolean;
}) {
  const sync = useContext(SyncCtx);
  const [own, setOwn] = useState<Open>({ m: false, t: false });
  const open = sync ? sync.open : own;
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    refresh();
  }, [open.m, open.t]);

  const toggle = (k: keyof Open) => {
    const next = !open[k];
    if (sync) sync.set(k, next);
    else setOwn((o) => ({ ...o, [k]: next }));
    // 閉じたときに板の上端がヘッダーとナビの下に隠れていたら、節の見出しまで戻す
    if (!next && ref.current) {
      const box = ref.current;
      const pn = (box.closest(sel('jk-pn')) as HTMLElement | null) ?? box;
      const hdr = document.querySelector('header');
      const nav = document.querySelector(sel('jk-nav'));
      const topH = (hdr?.getBoundingClientRect().height ?? 0) + (nav && getComputedStyle(nav).position === 'sticky' ? (nav as HTMLElement).offsetHeight : 0);
      requestAnimationFrame(() => {
        if (pn.getBoundingClientRect().top < topH + 8) {
          const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
          ((box.closest(sel('sc')) as HTMLElement | null) ?? pn).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    }
  };

  const rest = more?.rest ?? 0;
  return (
    <div ref={ref} className={cx(className, open.m && 'open-m', open.t && 'open-t')}>
      {children}
      {foot && (
        <div className={cx(ftClass)}>
          {hint}
          <span className={cx(bsClass)}>
            {rest > 0 && more && (
              <button type="button" className={cx('jk-btn')} aria-expanded={open.m} onClick={() => toggle('m')}>
                {open.m ? `${more.initial}件までにする` : `さらに表示（残り${rest}件）`}
              </button>
            )}
            {table && (
              <button type="button" className={cx('jk-btn', 'tg-t')} aria-expanded={open.t} onClick={() => toggle('t')}>
                {open.t ? '表を閉じる' : '全項目を見る（13項目）'}
              </button>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
