import { Metadata } from 'next';
import Link from 'next/link';
import styles from '../static-page.module.css';
import contentStyles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | 競馬データ.com',
  description: '競馬データ.comのプライバシーポリシーです。個人情報の取り扱いについてご説明します。',
};

export default function PrivacyPage() {
  return (
    <div className={styles.staticPageContainer}>
      {/* パンくずリスト */}
      <nav className={styles.staticPageBreadcrumb}>
        <Link href="/">HOME</Link>
        <span> &gt; </span>
        <span>プライバシーポリシー</span>
      </nav>

      {/* コンテンツカード */}
      <div className={styles.staticPageCard}>
        {/* ヘッダー */}
        <div className={styles.staticPageHeader}>
          <h1 className={styles.staticPageTitle}>プライバシーポリシー</h1>
        </div>
        <h2 className={contentStyles.heading}>はじめに</h2>
        <p className={contentStyles.text}>
          競馬データ.com（以下「当サイト」といいます）は、ユーザーの皆様の個人情報の保護を重要視しており、本プライバシーポリシー（以下「本ポリシー」といいます）に基づき、適切な取り扱いに努めます。
        </p>

        <h2 className={contentStyles.heading}>収集する情報</h2>
        <p className={contentStyles.text}>当サイトでは、以下の情報を収集する場合があります。</p>
        <ul className={contentStyles.list}>
          <li>アクセスログ情報（IPアドレス、ブラウザの種類、アクセス日時など）</li>
          <li>Cookie及び類似技術によって収集される情報</li>
          <li>お問い合わせの際にご提供いただく情報（氏名、メールアドレスなど）</li>
        </ul>

        <h2 className={contentStyles.heading}>情報の利用目的</h2>
        <p className={contentStyles.text}>収集した情報は、以下の目的で利用します。</p>
        <ul className={contentStyles.list}>
          <li>当サイトのサービス提供及び品質向上</li>
          <li>ユーザーの利用状況の分析</li>
          <li>お問い合わせへの対応</li>
          <li>新機能やサービスのご案内</li>
          <li>不正利用の防止及びセキュリティ対策</li>
        </ul>

        <h2 className={contentStyles.heading}>Cookieについて</h2>
        <p className={contentStyles.text}>
          当サイトでは、サービスの利便性向上のためにCookieを使用しています。Cookieは、ユーザーのブラウザに保存される小さなテキストファイルで、サイトの利用状況の分析や、より良いユーザー体験の提供に役立ちます。
        </p>
        <p className={contentStyles.text}>
          ブラウザの設定により、Cookieの受け入れを拒否することができますが、その場合、一部のサービスが正常に機能しない可能性があります。
        </p>

        <h2 className={contentStyles.heading}>アクセス解析ツール</h2>
        <p className={contentStyles.text}>
          当サイトでは、Google Analytics等のアクセス解析ツールを使用しています。これらのツールはCookieを使用して、ユーザーの当サイトの訪問情報を収集します。収集される情報は匿名で処理され、個人を特定するものではありません。
        </p>
        <p className={contentStyles.text}>
          Google Analyticsの詳細については、
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className={contentStyles.link}>
            Googleのプライバシーポリシー
          </a>
          をご確認ください。
        </p>

        <h2 className={contentStyles.heading}>第三者への情報提供</h2>
        <p className={contentStyles.text}>
          当サイトは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。
        </p>
        <ul className={contentStyles.list}>
          <li>ユーザーの同意がある場合</li>
          <li>法令に基づく場合</li>
          <li>人の生命、身体又は財産の保護のために必要がある場合であって、本人の同意を得ることが困難である場合</li>
          <li>国の機関若しくは地方公共団体又はその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
        </ul>

        <h2 className={contentStyles.heading}>情報の安全管理</h2>
        <p className={contentStyles.text}>
          当サイトは、収集した情報の漏洩、滅失又は毀損の防止その他の安全管理のために必要かつ適切な措置を講じます。
        </p>

        <h2 className={contentStyles.heading}>プライバシーポリシーの変更</h2>
        <p className={contentStyles.text}>
          当サイトは、必要に応じて本ポリシーの内容を変更することがあります。変更後のプライバシーポリシーは、本ページに掲載した時点から効力を生じるものとします。
        </p>

        <h2 className={contentStyles.heading}>著作権について</h2>
        <p className={contentStyles.text}>
          当サイトに掲載されているコンテンツ（文章、データ、画像など）の著作権は、競馬データ.comに帰属します。<br />
          無断転載・複製を禁じます。
        </p>

        <h2 className={contentStyles.heading}>お問い合わせ</h2>
        <p className={contentStyles.text}>
          本ポリシーに関するお問い合わせは、当サイトのお問い合わせフォームよりご連絡ください。
        </p>
      </div>
    </div>
  );
}
