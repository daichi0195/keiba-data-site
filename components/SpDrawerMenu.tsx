'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SpDrawerMenu.module.css';
import FaIcon from './FaIcon';
import { faHouse, faRobot, faFlag, faHelmetSafety, faHorse, faUser } from '@fortawesome/free-solid-svg-icons';
import { faPenToSquare } from '@fortawesome/free-regular-svg-icons';

const navItems = [
  { label: 'HOME', href: '/', icon: faHouse },
  { label: 'AI勝率予測', href: '/ai', icon: faRobot },
  { label: 'コースデータ', href: '/courses', icon: faFlag },
  { label: '騎手データ', href: '/jockeys', icon: faHelmetSafety },
  { label: '血統データ', href: '/sires', icon: faHorse },
  { label: '調教師データ', href: '/trainers', icon: faUser },
  { label: 'コラム', href: '/articles', icon: faPenToSquare },
];

const subItems = [
  { label: 'このサイトについて', href: '/about' },
  { label: 'お問い合わせ', href: '/contact' },
];

/** SP：ヘッダー右のハンバーガーボタンと、右から出るナビゲーション */
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

  return (
    <>
      <button
        type="button"
        // トップは緑のヘッダー（globals.css の header:has([data-home-header])）に合わせて白のボタン
        data-home-header={pathname === '/' ? '' : undefined}
        className={`${styles.trigger} ${pathname === '/' ? styles.onBrand : ''}`}
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
                <span className={styles.icon} aria-hidden="true"><FaIcon icon={item.icon} /></span>
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
