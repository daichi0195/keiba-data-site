import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import JockeysList, { jockeysGroupedByKana } from '@/components/JockeysList';
import BottomNav from '@/components/BottomNav';
import styles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '騎手別データ一覧｜騎手の成績・特徴がまるわかり！- 競馬データ.com',
  description: '騎手の成績や特徴がまるわかり！豊富な統計データで予想をサポート。',
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
