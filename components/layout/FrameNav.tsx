'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from '@/components/HardLink';
import { usePathname } from 'next/navigation';
import { FRAME_ICONS, FrameIcon, type FrameIconKey } from './icons';
import s from './SiteFrame.module.css';

type NavItem = { key: FrameIconKey; label: string; href: string };

/** 左メニュー（PC）・引き出しメニュー（スマホ）の上段 */
export const MAIN_NAV: NavItem[] = [
  { key: 'home', label: 'ホーム', href: '/' },
  { key: 'race', label: 'レースデータ', href: '/races' },
  { key: 'ai', label: 'AI予測', href: '/ai' },
  { key: 'course', label: 'コースデータ', href: '/courses' },
  { key: 'jockey', label: '騎手データ', href: '/jockeys' },
  { key: 'sire', label: '血統データ', href: '/sires' },
  { key: 'trainer', label: '調教師データ', href: '/trainers' },
  { key: 'col', label: 'コラム', href: '/articles' },
];

/** スマホ・タブレットの下部メニュー */
export const TAB_NAV: NavItem[] = [
  { key: 'race', label: 'レース', href: '/races' },
  { key: 'course', label: 'コース', href: '/courses' },
  { key: 'jockey', label: '騎手', href: '/jockeys' },
  { key: 'sire', label: '血統', href: '/sires' },
  { key: 'trainer', label: '調教師', href: '/trainers' },
  { key: 'ai', label: 'AI予測', href: '/ai' },
];

/** 現在地の判定：ホームは完全一致、それ以外は配下のページも含める */
function isCurrent(pathname: string, href: string) {
  const p = pathname.replace(/\/$/, '') || '/';
  if (href === '/') return p === '/';
  return p === href || p.startsWith(href + '/');
}

export const MENU_ID = 'site-menu';
const OPEN_CLASS = 'menu-open';

/**
 * ヘッダーのメニューボタン。1100px 未満では左メニューを引き出す（body.menu-open）。
 * ページ移動・Esc・メニューの外側のクリック・メニュー内のリンクで閉じる。
 */
export function MenuButton() {
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);

  const set = useCallback((v: boolean) => {
    document.body.classList.toggle(OPEN_CLASS, v);
    setOpen(v);
  }, []);

  useEffect(() => {
    set(false);
  }, [pathname, set]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t) return;
      if (t.closest(`#${MENU_ID} a`)) return set(false);
      if (!t.closest(`#${MENU_ID}`) && !t.closest('[data-menu-button]')) set(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') set(false);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, set]);

  // 画面を離れるときにクラスを残さない
  useEffect(() => () => document.body.classList.remove(OPEN_CLASS), []);

  return (
    <button
      type="button"
      className={s.hbtn}
      aria-label={open ? "メニューを閉じる" : "メニューを開く"}
      aria-expanded={open}
      aria-controls={MENU_ID}
      data-menu-button=""
      onClick={() => set(!open)}
    >
      <FrameIcon icon={open ? FRAME_ICONS.close : FRAME_ICONS.menu} className={s.ic} />
    </button>
  );
}

/** 左メニューの上段（ホーム〜コラム）。現在地は濃い灰の塗り＋白文字 */
export function MainNav() {
  const pathname = usePathname() ?? '';
  return (
    <nav className={s.nav}>
      {MAIN_NAV.map((it) => {
        const on = isCurrent(pathname, it.href);
        return (
          <Link prefetch={false} key={it.key} href={it.href} className={on ? s.on : undefined} aria-current={on ? 'page' : undefined}>
            <FrameIcon icon={FRAME_ICONS[it.key]} className={s.ic} />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** 下部メニュー（1100px 未満） */
export function TabBar() {
  const pathname = usePathname() ?? '';
  return (
    <nav className={s.tabbar} aria-label="メインメニュー">
      {TAB_NAV.map((it) => {
        const on = isCurrent(pathname, it.href);
        return (
          <Link prefetch={false} key={it.key} href={it.href} className={on ? s.on : undefined} aria-current={on ? 'page' : undefined}>
            <FrameIcon icon={FRAME_ICONS[it.key]} className={s.ic} />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
