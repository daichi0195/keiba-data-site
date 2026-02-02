import { Metadata } from 'next';
import Link from 'next/link';
import SiteAbout from './content/site-about';
import OperatorInfo from './content/operator-info';
import RacingHistory from './content/racing-history';
import ContactSection from './content/contact-section';
import styles from '../static-page.module.css';

export const metadata: Metadata = {
  title: 'サイト情報・運営者情報 | 競馬データ.com',
  description: '競馬データ.comの運営者情報・サイトについてのページです。',
};

export default function AboutPage() {
  return (
    <div className={styles.staticPageContainer}>
      {/* パンくずリスト */}
      <nav className={styles.staticPageBreadcrumb}>
        <Link href="/">HOME</Link>
        <span> &gt; </span>
        <span>サイト情報・運営者情報</span>
      </nav>

      {/* コンテンツカード */}
      <div className={styles.staticPageCard}>
        {/* ヘッダー */}
        <div className={styles.staticPageHeader}>
          <h1 className={styles.staticPageTitle}>サイト情報・運営者情報</h1>
        </div>

        <SiteAbout />
        <OperatorInfo />
        <RacingHistory />
        <ContactSection />
      </div>
    </div>
  );
}
