import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import CoursesList, { racecoursesData } from '@/components/CoursesList';
import BottomNav from '@/components/BottomNav';
import styles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: 'コース別データ一覧｜コースの成績・特徴がまるわかり！- 競馬データ.com',
  description: 'コースの成績や特徴がまるわかり！豊富な統計データをどこよりもみやすく！',
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
