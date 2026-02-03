import { Metadata } from 'next';
import Link from 'next/link';
import CoursesList from '@/components/CoursesList';
import styles from '@/app/static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: 'コース別データ一覧｜コースの成績・特徴がまるわかり！- 競馬データ.com',
  description: 'コースの成績や特徴がまるわかり！豊富な統計データで予想をサポート。',
};

export default function CoursesPage() {
  return (
    <div className={styles.staticPageContainer}>
      <nav className={styles.staticPageBreadcrumb}>
        <Link href="/">HOME</Link>
        <span> &gt; </span>
        <span>コースデータ一覧</span>
      </nav>

      <div className={styles.staticPageCard}>
        <div className={styles.staticPageHeader}>
          <h1 className={styles.staticPageTitle}>コースデータ一覧</h1>
        </div>

        <p className={contentStyles.text}>
          直近3年間でレースが行われた全てのコースを対象としています。
        </p>
        <CoursesList />
      </div>
    </div>
  );
}
