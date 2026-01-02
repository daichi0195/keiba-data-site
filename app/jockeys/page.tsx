import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import JockeysList, { jockeysGroupedByKana } from '@/components/JockeysList';
import BottomNav from '@/components/BottomNav';
import styles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '騎手一覧 | 競馬データ.com',
  description: '過去3年間に30レース以上出走している現役中央騎手の一覧。あいうえお順に並べて表示しています。',
};

export default function JockeysPage() {
  const navigationItems = jockeysGroupedByKana.map(group => ({
    id: group.id,
    label: group.label
  }));

  return (
    <>
      <ArticleLayout
        title="騎手一覧"
        showDateIcon={false}
      >
        <p className={styles.text}>
          過去3年間に30レース以上出走している現役中央騎手を対象としています。
        </p>
        <JockeysList />
      </ArticleLayout>
      <BottomNav items={navigationItems} />
    </>
  );
}
