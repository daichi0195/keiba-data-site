import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';
import AllJockeysList from '@/components/AllJockeysList';
import { getJockeyLeading } from '@/lib/getLeadingData';
import styles from '@/app/static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '騎手別データ一覧｜騎手の成績・特徴がまるわかり！- 競馬データ.com',
  description: '騎手の成績や特徴がまるわかり！豊富な統計データで予想をサポート。',
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
