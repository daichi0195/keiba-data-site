import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import styles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '免責事項 | 競馬データ.com',
  description: '競馬データ.comの免責事項です。当サイトのご利用にあたっての注意事項をご確認ください。',
};

export default function DisclaimerPage() {
  return (
    <ArticleLayout
      title="免責事項"
      showDateIcon={false}
    >
      <section className={styles.section}>
        <h2 className={styles.heading}>データの利用について</h2>
        <p className={styles.text}>
          当サイトで提供する情報は、過去のレース結果に基づく統計データであり、将来のレース結果を保証するものではありません。馬券の購入は自己責任で行ってください。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>免責について</h2>
        <p className={styles.text}>
          当サイトの情報を利用して生じたいかなる損害についても、当サイトは一切の責任を負いかねます。また、掲載している情報は予告なく変更される場合があります。
        </p>
        <p className={styles.text}>
          データの正確性には最善を尽くしていますが、誤りや最新性の欠如がある可能性がございます。重要な情報については、必ず公式データをご確認ください。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>外部リンクについて</h2>
        <p className={styles.text}>
          当サイトから外部サイトへのリンクが含まれる場合がありますが、リンク先のサイトの内容について当サイトは一切の責任を負いません。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>サービスの中断・停止について</h2>
        <p className={styles.text}>
          当サイトは、メンテナンスやシステム障害等により、予告なくサービスを一時的に中断または停止する場合があります。これにより生じた損害について、当サイトは一切の責任を負いません。
        </p>
      </section>
    </ArticleLayout>
  );
}
