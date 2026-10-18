import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';
import AllTrainersList from '@/components/AllTrainersList';
import { getTrainerLeading } from '@/lib/getLeadingData';
import styles from '@/app/static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '調教師（厩舎）別データ一覧｜成績・特徴を比較【毎週更新】',
  description: 'JRA調教師（厩舎）の成績・特徴を比較できるデータ一覧。直近3年のデータで、得意条件や騎手との相性まで分析。毎週更新。',
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
