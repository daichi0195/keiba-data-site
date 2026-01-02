import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import styles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '運営者情報 | 競馬データ.com',
  description: '競馬データ.comの運営者情報・サイトについてのページです。',
};

export default function AboutPage() {
  return (
    <ArticleLayout
      title="運営者情報"
      publishDate="2025年1月1日"
    >
      <section className={styles.section}>
        <h2 className={styles.heading}>サイトについて</h2>
        <p className={styles.text}>
          競馬データ.comは、競馬予想に役立つ統計データを提供する情報サイトです。コース別成績、騎手・調教師・種牡馬データなど、豊富な統計情報を見やすく整理し、皆様の競馬予想をサポートします。
        </p>
        <p className={styles.text}>
          当サイトは、過去3年間の中央競馬のレース結果を基に、様々な角度から分析したデータを提供しています。データは定期的に更新され、常に最新の傾向を把握できるよう努めています。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>運営者情報</h2>
        <p className={styles.text}>
          <strong>サイト名：</strong>競馬データ.com
        </p>
        <p className={styles.text}>
          <strong>URL：</strong>https://www.keibadata.com
        </p>
        <p className={styles.text}>
          <strong>運営開始：</strong>2025年1月
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>免責事項</h2>
        <p className={styles.text}>
          当サイトで提供する情報は、過去のレース結果に基づく統計データであり、将来のレース結果を保証するものではありません。馬券の購入は自己責任で行ってください。
        </p>
        <p className={styles.text}>
          当サイトの情報を利用して生じたいかなる損害についても、当サイトは一切の責任を負いかねます。また、掲載している情報は予告なく変更される場合があります。
        </p>
        <p className={styles.text}>
          データの正確性には最善を尽くしていますが、誤りや最新性の欠如がある可能性がございます。重要な情報については、必ず公式データをご確認ください。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>著作権について</h2>
        <p className={styles.text}>
          当サイトに掲載されているコンテンツ（文章、データ、画像など）の著作権は、競馬データ.comに帰属します。無断転載・複製を禁じます。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>お問い合わせ</h2>
        <p className={styles.text}>
          当サイトに関するご意見・ご要望は、
          <a href="/contact" className={styles.link}>お問い合わせページ</a>
          よりご連絡ください。
        </p>
      </section>
    </ArticleLayout>
  );
}
