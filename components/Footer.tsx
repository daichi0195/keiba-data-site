import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.siteName}>
          <h2>
            <Image
              src="/logo.png"
              alt="競馬データ.com ロゴ"
              width={28}
              height={28}
              className={styles.logo}
            />
            競馬データ.com
          </h2>
          <p className={styles.tagline}>競馬予想にさらなるワクワクを</p>
        </div>

        <ul className={styles.footerLinks}>
          <li>
            <Link href="/about" className={styles.footerLink}>
              サイト情報・運営者情報
            </Link>
          </li>
          <li>
            <Link href="/disclaimer" className={styles.footerLink}>
              免責事項
            </Link>
          </li>
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

        <div className={styles.disclaimer}>
          <p className={styles.disclaimerItem}>
            馬券の購入は20歳になってから
          </p>
          <p className={styles.disclaimerItem}>
            本サイトに掲載されているデータは参考情報であり、的中を保証するものではございません
          </p>
        </div>

        <p className={styles.copyright}>© 2025 競馬データ.com All rights reserved.</p>
      </div>
    </footer>
  );
}
