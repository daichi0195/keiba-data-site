import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';
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
    <StaticPageLayout pageName="サイト情報・運営者情報">
      <div className={styles.staticPageCard}>
        <div className={styles.staticPageHeader}>
          <h1 className={styles.staticPageTitle}>サイト情報・運営者情報</h1>
        </div>

        <SiteAbout />
        <OperatorInfo />
        <RacingHistory />
        <ContactSection />
      </div>
    </StaticPageLayout>
  );
}
