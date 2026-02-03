import { Metadata } from 'next';
import Link from 'next/link';
import AllSiresList from '@/components/AllSiresList';
import styles from '@/app/static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '種牡馬別データ一覧｜種牡馬の成績・特徴がまるわかり！- 競馬データ.com',
  description: '種牡馬の成績や特徴がまるわかり！豊富な統計データで予想をサポート。',
};

export default function SiresPage() {
  return (
    <div className={styles.staticPageContainer}>
      <nav className={styles.staticPageBreadcrumb}>
        <Link href="/">HOME</Link>
        <span> &gt; </span>
        <span>種牡馬データ一覧</span>
      </nav>

      <div className={styles.staticPageCard}>
        <div className={styles.staticPageHeader}>
          <h1 className={styles.staticPageTitle}>種牡馬データ一覧</h1>
        </div>

        <p className={contentStyles.text}>
          過去3年間に産駒が50レース以上出走し、かつ産駒が10頭以上いる種牡馬のデータを集計しています。
        </p>
        <AllSiresList />
      </div>
    </div>
  );
}
