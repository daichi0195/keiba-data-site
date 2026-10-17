import type { Metadata } from 'next';
import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import styles from './static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: 'ページが見つかりません | 競馬データ.com',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <StaticPageLayout pageName="ページが見つかりません" noToc noLeftSidebar>
      <div className={styles.staticPageCard}>
        <div className={styles.staticPageHeader}>
          <h1 className={styles.staticPageTitle}>ページが見つかりません</h1>
        </div>

        <p className={contentStyles.text}>
          お探しのページは削除されたか、URLが変更された可能性があります。
          データページは対象の騎手・調教師・種牡馬・コースが集計対象外になると公開を終了することがあります。
        </p>

        <h2 className={contentStyles.heading}>主なページ</h2>
        <ul className={contentStyles.list}>
          <li><Link href="/" className={contentStyles.link}>トップページ</Link></li>
          <li><Link href="/courses" className={contentStyles.link}>コース別データ一覧</Link></li>
          <li><Link href="/jockeys" className={contentStyles.link}>騎手データ一覧</Link></li>
          <li><Link href="/sires" className={contentStyles.link}>種牡馬（血統）データ一覧</Link></li>
          <li><Link href="/trainers" className={contentStyles.link}>調教師データ一覧</Link></li>
          <li><Link href="/articles" className={contentStyles.link}>データ分析コラム</Link></li>
          <li><Link href="/ai" className={contentStyles.link}>競馬AI 勝率予測</Link></li>
        </ul>

        <p className={contentStyles.text}>
          リンク切れを見つけた場合は
          <Link href="/contact" className={contentStyles.link}>お問い合わせ</Link>
          からお知らせいただけると助かります。
        </p>
      </div>
    </StaticPageLayout>
  );
}
