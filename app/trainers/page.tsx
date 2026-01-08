import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import TrainersList, { trainersGroupedByKana } from '@/components/TrainersList';
import BottomNav from '@/components/BottomNav';
import TableOfContents from '@/components/TableOfContents';
import styles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '調教師別データ一覧｜調教師の成績・特徴がまるわかり！- 競馬データ.com',
  description: '調教師の成績や特徴がまるわかり！豊富な統計データで予想をサポート。',
};

export default function TrainersPage() {
  const navigationItems = trainersGroupedByKana.map(group => ({
    id: group.id,
    label: group.label
  }));

  return (
    <main>
      <ArticleLayout
        title="調教師データ一覧"
        showDateIcon={false}
      >
        <p className={styles.text}>
          過去3年間に30レース以上出走している現役中央調教師を対象としています。
        </p>
        <TrainersList />
      </ArticleLayout>
      <TableOfContents items={navigationItems} />
      <BottomNav items={navigationItems} />
    </main>
  );
}
