import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import SiresList, { siresGroupedByKana } from '@/components/SiresList';
import BottomNav from '@/components/BottomNav';
import styles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '種牡馬一覧 | 競馬データ.com',
  description: '過去3年間に産駒が出走している主要種牡馬の一覧。あいうえお順に並べて表示しています。',
};

export default function SiresPage() {
  const navigationItems = siresGroupedByKana.map(group => ({
    id: group.id,
    label: group.label
  }));

  return (
    <>
      <ArticleLayout
        title="種牡馬一覧"
        showDateIcon={false}
      >
        <p className={styles.text}>
          過去3年間に産駒が出走している主要種牡馬を対象としています。
        </p>
        <SiresList />
      </ArticleLayout>
      <BottomNav items={navigationItems} />
    </>
  );
}
