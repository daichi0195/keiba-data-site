import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';
import AllJockeysList from '@/components/AllJockeysList';
import { getJockeyLeading } from '@/lib/getLeadingData';
import styles from '@/app/static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '騎手別データ一覧｜成績・特徴・回収率を比較【毎週更新】',
  description: 'JRA騎手の成績・特徴・回収率を比較できるデータ一覧。直近3年のデータで、得意なコース・距離まで分析。毎週更新。',
};

export default async function JockeysPage() {
  const jockeyLeading = await getJockeyLeading();

  return (
    <StaticPageLayout pageName="騎手データ一覧">
      <div className={styles.staticPageCard}>
        <div className={styles.staticPageHeader}>
          <h1 className={styles.staticPageTitle}>騎手データ一覧</h1>
        </div>

        <p className={contentStyles.text}>
          過去3年間に30レース以上出走している現役中央騎手のデータを集計しています。
        </p>

        <AllJockeysList leadingData={jockeyLeading} />
      </div>
    </StaticPageLayout>
  );
}
