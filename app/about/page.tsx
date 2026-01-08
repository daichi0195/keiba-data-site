import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import TableOfContents from '@/components/TableOfContents';
import SiteAbout from './content/site-about';
import OperatorInfo from './content/operator-info';
import RacingHistory from './content/racing-history';
import ContactSection from './content/contact-section';

export const metadata: Metadata = {
  title: 'サイト情報・運営者情報 | 競馬データ.com',
  description: '競馬データ.comの運営者情報・サイトについてのページです。',
};

export default function AboutPage() {
  return (
    <main>
      <ArticleLayout
        title="サイト情報・運営者情報"
        showDateIcon={false}
      >
        <SiteAbout />
        <OperatorInfo />
        <RacingHistory />
        <ContactSection />
      </ArticleLayout>
      <TableOfContents />
    </main>
  );
}
