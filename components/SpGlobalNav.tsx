'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SpGlobalNav.module.css';

const navItems = [
  { label: 'HOME', href: '/' },
  { label: 'コースデータ', href: '/courses' },
  { label: '騎手データ', href: '/jockeys' },
  { label: '血統データ', href: '/sires' },
  { label: '調教師データ', href: '/trainers' },
  { label: 'コラム', href: '/articles' },
];

export default function SpGlobalNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
