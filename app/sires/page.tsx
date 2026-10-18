import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';
import AllSiresList from '@/components/AllSiresList';
import { getSireLeading } from '@/lib/getLeadingData';
import styles from '@/app/static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '種牡馬別データ一覧｜産駒の特徴・成績を血統ごとに比較【毎週更新】',
  description: '種牡馬（血統）別に産駒の特徴と成績を比較できるデータ一覧。直近3年のデータで、得意距離・コース・重馬場成績まで分析。毎週更新。',
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
