import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import TableOfContents from '@/components/TableOfContents';
import styles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: 'お問い合わせ | 競馬データ.com',
  description: '競馬データ.comへのお問い合わせはこちらから。サイトに関するご質問やご要望をお寄せください。',
};

export default function ContactPage() {
  return (
    <main>
      <ArticleLayout
        title="お問い合わせ"
        publishDate="2025年1月1日"
      >
      <section className={styles.section}>
        <h2 className={styles.heading}>お問い合わせについて</h2>
        <p className={styles.text}>
          競馬データ.comをご利用いただき、ありがとうございます。
        </p>
        <p className={styles.text}>
          サイトに関するご質問、ご意見、ご要望などがございましたら、以下のフォームからお問い合わせください。
        </p>
        <p className={styles.text} style={{ marginTop: '1.5rem', marginBottom: '3rem', textAlign: 'center' }}>
          <a
            href="https://docs.google.com/forms/d/1Gp27xw-fd14nb9R7GAMIEEW7VsKQtQspf2DYSnbon64/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.button}
          >
            お問い合わせフォームを開く
          </a>
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>個人情報の取り扱いについて</h2>
        <p className={styles.text}>
          お問い合わせの際にご提供いただいた個人情報は、お問い合わせへの対応のみに使用し、適切に管理いたします。詳しくは
          <a href="/privacy" className={styles.link}>
            プライバシーポリシー
          </a>
          をご確認ください。
        </p>
      </section>

      <div className={styles.note}>
        フォームが開かない場合は、下記のメールアドレスまでご連絡ください
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <a href="mailto:umadata.daichi@gmail.com" className={styles.link}>
            umadata.daichi@gmail.com
          </a>
        </div>
      </div>
      </ArticleLayout>
      <TableOfContents />
    </main>
  );
}
