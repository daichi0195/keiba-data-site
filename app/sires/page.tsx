import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import SiresList, { siresGroupedByKana } from '@/components/SiresList';
import BottomNav from '@/components/BottomNav';
import TableOfContents from '@/components/TableOfContents';
import styles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '種牡馬別データ一覧｜種牡馬の成績・特徴がまるわかり！- 競馬データ.com',
  description: '種牡馬の成績や特徴がまるわかり！豊富な統計データで予想をサポート。',
};

export default function SiresPage() {
  const navigationItems = siresGroupedByKana.map(group => ({
    id: group.id,
    label: group.label
  }));

  return (
    <main>
      <ArticleLayout
        title="種牡馬データ一覧"
        showDateIcon={false}
      >
        <p className={styles.text}>
          過去3年間に産駒が出走している主要種牡馬を対象としています。
        </p>
        <SiresList />
      </ArticleLayout>
      <TableOfContents items={navigationItems} />
      <BottomNav items={navigationItems} />
    </main>
  );
}
