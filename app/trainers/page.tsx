import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';
import AllTrainersList from '@/components/AllTrainersList';
import { getTrainerLeading } from '@/lib/getLeadingData';
import styles from '@/app/static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '調教師別データ一覧｜調教師の成績・特徴がまるわかり！- 競馬データ.com',
  description: '調教師の成績や特徴がまるわかり！豊富な統計データで予想をサポート。',
};

export default async function TrainersPage() {
  const trainerLeading = await getTrainerLeading();

  return (
    <StaticPageLayout pageName="調教師データ一覧">
      <div className={styles.staticPageCard}>
        <div className={styles.staticPageHeader}>
          <h1 className={styles.staticPageTitle}>調教師データ一覧</h1>
        </div>

        <p className={contentStyles.text}>
          過去3年間に30レース以上出走している現役中央調教師のデータを集計しています。
        </p>

        <AllTrainersList leadingData={trainerLeading} />
      </div>
    </StaticPageLayout>
  );
}
