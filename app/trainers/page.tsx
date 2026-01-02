import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import TrainersList, { trainersGroupedByKana } from '@/components/TrainersList';
import BottomNav from '@/components/BottomNav';
import styles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '調教師一覧 | 競馬データ.com',
  description: '過去3年間に30レース以上出走している現役中央調教師の一覧。あいうえお順に並べて表示しています。',
};

export default function TrainersPage() {
  const navigationItems = trainersGroupedByKana.map(group => ({
    id: group.id,
    label: group.label
  }));

  return (
    <>
      <ArticleLayout
        title="調教師一覧"
        showDateIcon={false}
      >
        <p className={styles.text}>
          過去3年間に30レース以上出走している現役中央調教師を対象としています。
        </p>
        <TrainersList />
      </ArticleLayout>
      <BottomNav items={navigationItems} />
    </>
  );
}
