import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.siteName}>
          <h2>競馬データ.com</h2>
          <p className={styles.tagline}>競馬予想にさらなるワクワクを</p>
        </div>

        <ul className={styles.footerLinks}>
          <li>
            <Link href="/privacy" className={styles.footerLink}>
              プライバシーポリシー
            </Link>
          </li>
          <li>
            <Link href="/contact" className={styles.footerLink}>
              お問い合わせ
            </Link>
          </li>
        </ul>

        <p className={styles.copyright}>© 2025 競馬データ.com All rights reserved.</p>
      </div>
    </footer>
  );
}
