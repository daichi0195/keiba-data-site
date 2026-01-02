import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import CoursesList, { racecoursesData } from '@/components/CoursesList';
import BottomNav from '@/components/BottomNav';
import styles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: 'コース別データ一覧 | 競馬データ.com',
  description: '全国の中央競馬場（中山・東京・阪神・京都など）のコース別データ一覧。芝・ダート・障害、各距離ごとの詳細なデータを確認できます。',
};

export default function CoursesPage() {
  const navigationItems = racecoursesData.map(racecourse => ({
    id: racecourse.nameEn,
    label: racecourse.name
  }));

  return (
    <>
      <ArticleLayout
        title="コース別データ一覧"
        showDateIcon={false}
      >
        <p className={styles.text}>
          直近3年間でレースが行われた全てのコースを対象としています。
        </p>
        <CoursesList />
      </ArticleLayout>
      <BottomNav items={navigationItems} />
    </>
  );
}
