import { Metadata } from 'next';
import StaticPageLayout from '@/components/StaticPageLayout';
import CoursesList from '@/components/CoursesList';
import styles from '@/app/static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: 'コース別データ一覧｜全競馬場の傾向・特徴【毎週更新】',
  description: 'JRA全10競馬場のコース別に、枠順・脚質・血統・騎手の傾向を比較できるデータ一覧。直近3年のデータで毎週更新。',
};

export default function CoursesPage() {
  return (
    <StaticPageLayout pageName="コースデータ一覧">
      <div className={styles.staticPageCard}>
        <div className={styles.staticPageHeader}>
          <h1 className={styles.staticPageTitle}>コースデータ一覧</h1>
        </div>

        <p className={contentStyles.text}>
          直近3年間でレースが行われた全てのコースを対象としています。
        </p>
<CoursesList />
      </div>
    </StaticPageLayout>
  );
}
