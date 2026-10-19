import { Metadata } from 'next';
import StaticPageLayout, { StaticSection, staticLink } from '@/components/StaticPageLayout';
import st from '@/components/datapage/static/static.module.css';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | 競馬データ.com',
  description: '競馬データ.comのプライバシーポリシーです。個人情報の取り扱いについてご説明します。',
};

export default function PrivacyPage() {
  return (
    <StaticPageLayout pageName="プライバシーポリシー" title="プライバシーポリシー">
      <StaticSection title="はじめに">
        <p>
          競馬データ.com（以下「当サイト」といいます）は、ユーザーの皆様の個人情報の保護を重要視しており、本プライバシーポリシー（以下「本ポリシー」といいます）に基づき、適切な取り扱いに努めます。
        </p>
      </StaticSection>

      <StaticSection title="収集する情報">
        <p>当サイトでは、以下の情報を収集する場合があります。</p>
        <ul>
          <li>アクセスログ情報（IPアドレス、ブラウザの種類、アクセス日時など）</li>
          <li>Cookie及び類似技術によって収集される情報</li>
          <li>お問い合わせの際にご提供いただく情報（氏名、メールアドレスなど）</li>
        </ul>
      </StaticSection>

      <StaticSection title="情報の利用目的">
        <p>収集した情報は、以下の目的で利用します。</p>
        <ul>
          <li>当サイトのサービス提供及び品質向上</li>
          <li>ユーザーの利用状況の分析</li>
          <li>お問い合わせへの対応</li>
          <li>新機能やサービスのご案内</li>
          <li>不正利用の防止及びセキュリティ対策</li>
        </ul>
      </StaticSection>

      <StaticSection title="Cookieについて">
        <p>
          当サイトでは、サービスの利便性向上のためにCookieを使用しています。Cookieは、ユーザーのブラウザに保存される小さなテキストファイルで、サイトの利用状況の分析や、より良いユーザー体験の提供に役立ちます。
        </p>
        <p>
          ブラウザの設定により、Cookieの受け入れを拒否することができますが、その場合、一部のサービスが正常に機能しない可能性があります。
        </p>
      </StaticSection>

      <StaticSection title="広告の配信について">
        <p>
          当サイトでは、第三者配信の広告サービス「Google AdSense（グーグルアドセンス）」を利用しています。
          Googleなどの第三者配信事業者は、ユーザーの興味に応じた広告を表示するためにCookie（クッキー）を使用することがあります。
          Cookieには氏名・住所・メールアドレス・電話番号などの個人を特定する情報は含まれません。
        </p>
        <p>
          パーソナライズ広告に使用されるCookieは、
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className={staticLink}>
            Googleの広告設定
          </a>
          から無効にすることができます。また、
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className={staticLink}>
            www.aboutads.info
          </a>
          にアクセスすれば、第三者配信事業者のパーソナライズ広告用Cookieを無効にできます。
          Googleによる広告配信の詳細は
          <a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" className={staticLink}>
            Googleのポリシーと規約（広告）
          </a>
          をご確認ください。
        </p>
      </StaticSection>

      <StaticSection title="アクセス解析ツール">
        <p>
          当サイトでは、Google Analytics等のアクセス解析ツールを使用しています。これらのツールはCookieを使用して、ユーザーの当サイトの訪問情報を収集します。収集される情報は匿名で処理され、個人を特定するものではありません。
        </p>
        <p>
          Google Analyticsの詳細については、
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className={staticLink}>
            Googleのプライバシーポリシー
          </a>
          をご確認ください。
        </p>
      </StaticSection>

      <StaticSection title="第三者への情報提供">
        <p>
          当サイトは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。
        </p>
        <ul>
          <li>ユーザーの同意がある場合</li>
          <li>法令に基づく場合</li>
          <li>人の生命、身体又は財産の保護のために必要がある場合であって、本人の同意を得ることが困難である場合</li>
          <li>国の機関若しくは地方公共団体又はその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
        </ul>
      </StaticSection>

      <StaticSection title="情報の安全管理">
        <p>
          当サイトは、収集した情報の漏洩、滅失又は毀損の防止その他の安全管理のために必要かつ適切な措置を講じます。
        </p>
      </StaticSection>

      <StaticSection title="プライバシーポリシーの変更">
        <p>
          当サイトは、必要に応じて本ポリシーの内容を変更することがあります。変更後のプライバシーポリシーは、本ページに掲載した時点から効力を生じるものとします。
        </p>
      </StaticSection>

      <StaticSection title="著作権について">
        <p>
          当サイトに掲載されているコンテンツ（文章、データ、画像など）の著作権は、競馬データ.comに帰属します。<br />
          無断転載・複製を禁じます。
        </p>
      </StaticSection>

      <StaticSection title="お問い合わせ">
        <p>
          本ポリシーに関するお問い合わせは、当サイトの
          <a href="/contact" className={staticLink}>お問い合わせページ</a>
          よりご連絡ください。
        </p>
        <p className={st.meta}>制定日：2025年1月1日／最終改定日：2026年10月18日</p>
      </StaticSection>
    </StaticPageLayout>
  );
}
