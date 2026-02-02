import { Metadata } from 'next';
import Link from 'next/link';
import styles from '../static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '免責事項 | 競馬データ.com',
  description: '競馬データ.comの免責事項です。当サイトのご利用にあたっての注意事項をご確認ください。',
};

export default function DisclaimerPage() {
  return (
    <div className={styles.staticPageContainer}>
      {/* パンくずリスト */}
      <nav className={styles.staticPageBreadcrumb}>
        <Link href="/">HOME</Link>
        <span> &gt; </span>
        <span>免責事項</span>
      </nav>

      {/* コンテンツカード */}
      <div className={styles.staticPageCard}>
        {/* ヘッダー */}
        <div className={styles.staticPageHeader}>
          <h1 className={styles.staticPageTitle}>免責事項</h1>
        </div>

        <h2 className={contentStyles.heading}>データの利用について</h2>
        <p className={contentStyles.text}>
          当サイトで提供する情報は、過去のレース結果に基づく統計データであり、将来のレース結果を保証するものではありません。馬券の購入は自己責任で行ってください。
        </p>

        <h2 className={contentStyles.heading}>免責について</h2>
        <p className={contentStyles.text}>
          当サイトの情報を利用して生じたいかなる損害についても、当サイトは一切の責任を負いかねます。また、掲載している情報は予告なく変更される場合があります。
        </p>
        <p className={contentStyles.text}>
          データの正確性には最善を尽くしていますが、誤りや最新性の欠如がある可能性がございます。重要な情報については、必ず公式データをご確認ください。
        </p>

        <h2 className={contentStyles.heading}>外部リンクについて</h2>
        <p className={contentStyles.text}>
          当サイトから外部サイトへのリンクが含まれる場合がありますが、リンク先のサイトの内容について当サイトは一切の責任を負いません。
        </p>

        <h2 className={contentStyles.heading}>サービスの中断・停止について</h2>
        <p className={contentStyles.text}>
          当サイトは、メンテナンスやシステム障害等により、予告なくサービスを一時的に中断または停止する場合があります。これにより生じた損害について、当サイトは一切の責任を負いません。
        </p>
      </div>
    </div>
  );
}
