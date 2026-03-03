import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';
import AllSiresList from '@/components/AllSiresList';
import { getSireLeading } from '@/lib/getLeadingData';
import styles from '@/app/static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '血統（種牡馬）別データ一覧｜種牡馬の成績・特徴がまるわかり！- 競馬データ.com',
  description: '血統（種牡馬）別の成績や特徴がまるわかり！豊富な統計データで予想をサポート。',
};

export default async function SiresPage() {
  const sireLeading = await getSireLeading();

  return (
    <StaticPageLayout pageName="血統（種牡馬）別データ一覧">
      <div className={styles.staticPageCard}>
        <div className={styles.staticPageHeader}>
          <h1 className={styles.staticPageTitle}>血統（種牡馬）別データ一覧</h1>
        </div>

        <p className={contentStyles.text}>
          過去3年間に産駒が50レース以上出走し、かつ産駒が10頭以上いる種牡馬のデータを集計しています。
        </p>

        <AllSiresList leadingData={sireLeading} />
      </div>
    </StaticPageLayout>
  );
}
