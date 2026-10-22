'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SpDrawerMenu.module.css';

const navItems = [
  { label: 'HOME', href: '/', icon: 'fa-solid fa-house' },
  { label: 'AI勝率予測', href: '/ai', icon: 'fa-solid fa-robot' },
  { label: 'コースデータ', href: '/courses', icon: 'fa-solid fa-flag' },
  { label: '騎手データ', href: '/jockeys', icon: 'fa-solid fa-helmet-safety' },
  { label: '血統データ', href: '/sires', icon: 'fa-solid fa-horse' },
  { label: '調教師データ', href: '/trainers', icon: 'fa-solid fa-user' },
  { label: 'コラム', href: '/articles', icon: 'fa-regular fa-pen-to-square' },
];

const subItems = [
  { label: 'このサイトについて', href: '/about' },
  { label: 'お問い合わせ', href: '/contact' },
];

/** SP（トップのみ）：ヘッダー右のハンバーガーボタンと、右から出るナビゲーション */
export default function SpDrawerMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? '';

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  // ページ遷移したら閉じる
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 開いている間は背面のスクロールを止め、Esc で閉じる
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // トップ以外は従来どおりヘッダー下の横並びナビ（SpGlobalNav）
  if (pathname !== '/') return null;

  return (
    <>
      <button
        type="button"
        data-home-header=""
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label="メニューを開く"
        aria-expanded={open}
        aria-controls="sp-drawer"
      >
        <span className={styles.bars} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      <div className={`${styles.overlay} ${open ? styles.open : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <nav
        id="sp-drawer"
        className={`${styles.drawer} ${open ? styles.open : ''}`}
        aria-label="メニュー"
        aria-hidden={!open}
        inert={!open}
      >
        <div className={styles.drawerHead}>
          <span className={styles.drawerTitle}>メニュー</span>
          <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="メニューを閉じる">
            <span aria-hidden="true" />
          </button>
        </div>
        <ul className={styles.list}>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.item} ${isActive(item.href) ? styles.active : ''}`}
                aria-current={isActive(item.href) ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                <i className={`${item.icon} ${styles.icon}`} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <ul className={styles.subList}>
          {subItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={styles.subItem} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
