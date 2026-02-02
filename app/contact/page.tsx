import { Metadata } from 'next';
import Link from 'next/link';
import styles from '../static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: 'お問い合わせ | 競馬データ.com',
  description: '競馬データ.comへのお問い合わせはこちらから。サイトに関するご質問やご要望をお寄せください。',
};

export default function ContactPage() {
  return (
    <div className={styles.staticPageContainer}>
      {/* パンくずリスト */}
      <nav className={styles.staticPageBreadcrumb}>
        <Link href="/">HOME</Link>
        <span> &gt; </span>
        <span>お問い合わせ</span>
      </nav>

      {/* コンテンツカード */}
      <div className={styles.staticPageCard}>
        {/* ヘッダー */}
        <div className={styles.staticPageHeader}>
          <h1 className={styles.staticPageTitle}>お問い合わせ</h1>
        </div>

        <h2 className={contentStyles.heading}>お問い合わせについて</h2>
        <p className={contentStyles.text}>
          競馬データ.comをご利用いただき、ありがとうございます。
        </p>
        <p className={contentStyles.text}>
          サイトに関するご質問、ご意見、ご要望などがございましたら、以下のフォームからお問い合わせください。
        </p>
        <div style={{ marginTop: '1.5rem', marginBottom: '3rem', textAlign: 'center' }}>
          <a
            href="https://docs.google.com/forms/d/1Gp27xw-fd14nb9R7GAMIEEW7VsKQtQspf2DYSnbon64/"
            target="_blank"
            rel="noopener noreferrer"
            className={contentStyles.button}
          >
            お問い合わせフォームを開く
          </a>
        </div>

        <h2 className={contentStyles.heading}>個人情報の取り扱いについて</h2>
        <p className={contentStyles.text}>
          お問い合わせの際にご提供いただいた個人情報は、お問い合わせへの対応のみに使用し、適切に管理いたします。詳しくは
          <a href="/privacy" className={contentStyles.link}>
            プライバシーポリシー
          </a>
          をご確認ください。
        </p>

        <div className={contentStyles.note}>
          フォームが開かない場合は、下記のメールアドレスまでご連絡ください
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <a href="mailto:umadata.daichi@gmail.com" className={contentStyles.link}>
              umadata.daichi@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
