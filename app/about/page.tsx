import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import SiteAbout from './content/site-about';
import OperatorInfo from './content/operator-info';
import Disclaimer from './content/disclaimer';
import Copyright from './content/copyright';
import ContactSection from './content/contact-section';

export const metadata: Metadata = {
  title: 'このサイトについて | 競馬データ.com',
  description: '競馬データ.comの運営者情報・サイトについてのページです。',
};

export default function AboutPage() {
  return (
    <ArticleLayout
      title="このサイトについて"
      showDateIcon={false}
    >
      <SiteAbout />
      <OperatorInfo />
      <Disclaimer />
      <Copyright />
      <ContactSection />
    </ArticleLayout>
  );
}
