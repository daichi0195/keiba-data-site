import { Metadata } from 'next';
import StaticPage, { P, Ul, In, Ext, type StaticSection } from '@/components/v6/static/StaticPage';
import { cx } from '@/components/v6/static/cx';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | 競馬データ.com',
  description: '競馬データ.comのプライバシーポリシーです。個人情報の取り扱いについてご説明します。',
};

// 見本：docs/redesign/src/pages/privacy.mjs
const sections: StaticSection[] = [
  {
    title: 'はじめに',
    body: <P>競馬データ.com（以下「当サイト」といいます）は、ユーザーの皆様の個人情報の保護を重要視しており、本プライバシーポリシー（以下「本ポリシー」といいます）に基づき、適切な取り扱いに努めます。</P>,
  },
  {
    title: '収集する情報',
    body: (
      <>
        <P>当サイトでは、以下の情報を収集する場合があります。</P>
        <Ul
          items={[
            'アクセスログ情報（IPアドレス、ブラウザの種類、アクセス日時など）',
            'Cookie及び類似技術によって収集される情報',
            'お問い合わせの際にご提供いただく情報（氏名、メールアドレスなど）',
          ]}
        />
      </>
    ),
  },
  {
    title: '情報の利用目的',
    body: (
      <>
        <P>収集した情報は、以下の目的で利用します。</P>
        <Ul
          items={[
            '当サイトのサービス提供及び品質向上',
            'ユーザーの利用状況の分析',
            'お問い合わせへの対応',
            '新機能やサービスのご案内',
            '不正利用の防止及びセキュリティ対策',
          ]}
        />
      </>
    ),
  },
  {
    title: 'Cookieについて',
    body: (
      <>
        <P>当サイトでは、サービスの利便性向上のためにCookieを使用しています。Cookieは、ユーザーのブラウザに保存される小さなテキストファイルで、サイトの利用状況の分析や、より良いユーザー体験の提供に役立ちます。</P>
        <P>ブラウザの設定により、Cookieの受け入れを拒否することができますが、その場合、一部のサービスが正常に機能しない可能性があります。</P>
      </>
    ),
  },
  {
    title: '広告の配信について',
    body: (
      <>
        <P>当サイトでは、第三者配信の広告サービス「Google AdSense（グーグルアドセンス）」を利用しています。Googleなどの第三者配信事業者は、ユーザーの興味に応じた広告を表示するためにCookie（クッキー）を使用することがあります。Cookieには氏名・住所・メールアドレス・電話番号などの個人を特定する情報は含まれません。</P>
        <P>
          パーソナライズ広告に使用されるCookieは、<Ext href="https://www.google.com/settings/ads">Googleの広告設定</Ext>から無効にすることができます。また、<Ext href="https://www.aboutads.info/choices/">www.aboutads.info</Ext>にアクセスすれば、第三者配信事業者のパーソナライズ広告用Cookieを無効にできます。Googleによる広告配信の詳細は<Ext href="https://policies.google.com/technologies/ads?hl=ja">Googleのポリシーと規約（広告）</Ext>をご確認ください。
        </P>
      </>
    ),
  },
  {
    title: 'アクセス解析ツール',
    body: (
      <>
        <P>当サイトでは、Google Analytics等のアクセス解析ツールを使用しています。これらのツールはCookieを使用して、ユーザーの当サイトの訪問情報を収集します。収集される情報は匿名で処理され、個人を特定するものではありません。</P>
        <P>
          Google Analyticsの詳細については、<Ext href="https://policies.google.com/technologies/partner-sites">Googleのプライバシーポリシー</Ext>をご確認ください。
        </P>
      </>
    ),
  },
  {
    title: '第三者への情報提供',
    body: (
      <>
        <P>当サイトは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。</P>
        <Ul
          items={[
            'ユーザーの同意がある場合',
            '法令に基づく場合',
            '人の生命、身体又は財産の保護のために必要がある場合であって、本人の同意を得ることが困難である場合',
            '国の機関若しくは地方公共団体又はその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合',
          ]}
        />
      </>
    ),
  },
  {
    title: '情報の安全管理',
    body: <P>当サイトは、収集した情報の漏洩、滅失又は毀損の防止その他の安全管理のために必要かつ適切な措置を講じます。</P>,
  },
  {
    title: 'プライバシーポリシーの変更',
    body: <P>当サイトは、必要に応じて本ポリシーの内容を変更することがあります。変更後のプライバシーポリシーは、本ページに掲載した時点から効力を生じるものとします。</P>,
  },
  {
    title: '著作権について',
    body: (
      <P>
        当サイトに掲載されているコンテンツ（文章、データ、画像など）の著作権は、競馬データ.comに帰属します。
        <br />
        無断転載・複製を禁じます。
      </P>
    ),
  },
  {
    title: 'お問い合わせ',
    body: (
      <>
        <P>
          本ポリシーに関するお問い合わせは、当サイトの<In href="/contact">お問い合わせページ</In>よりご連絡ください。
        </P>
        <p className={cx('st-meta')}>
          <span className={cx('nw')}>制定日：2025年1月1日</span>／<span className={cx('nw')}>最終改定日：2026年10月18日</span>
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return <StaticPage pageKey="privacy" title="プライバシーポリシー" crumbs={[{ label: 'プライバシーポリシー' }]} sections={sections} toc />;
}
