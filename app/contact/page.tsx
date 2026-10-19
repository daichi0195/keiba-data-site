import { Metadata } from 'next';
import StaticPageLayout, { StaticSection, staticLink } from '@/components/StaticPageLayout';
import st from '@/components/datapage/static/static.module.css';

export const metadata: Metadata = {
  title: 'お問い合わせ | 競馬データ.com',
  description: '競馬データ.comへのお問い合わせはこちらから。サイトに関するご質問やご要望をお寄せください。',
};

export default function ContactPage() {
  return (
    <StaticPageLayout pageName="お問い合わせ" title="お問い合わせ">
      <StaticSection title="お問い合わせについて">
        <p>
          競馬データ.comをご利用いただき、ありがとうございます。
        </p>
        <p>
          サイトに関するご質問、ご意見、ご要望などがございましたら、以下のフォームからお問い合わせください。
        </p>
        <div className={st.actions}>
          <a
            href="https://docs.google.com/forms/d/1Gp27xw-fd14nb9R7GAMIEEW7VsKQtQspf2DYSnbon64/"
            target="_blank"
            rel="noopener noreferrer"
            className={st.btnPrimary}
          >
            お問い合わせフォームを開く
          </a>
        </div>
      </StaticSection>

      <StaticSection title="お問い合わせの例">
        <ul>
          <li>データの誤りや集計定義に関するご指摘</li>
          <li>追加してほしい集計項目・コース・騎手などのご要望</li>
          <li>コラムの内容に関するご質問</li>
          <li>データ引用・掲載に関するご相談</li>
        </ul>
        <p>
          個人運営のため返信までお時間をいただく場合があります。レース結果や馬券の予想に関する個別のご質問にはお答えしていません。
        </p>
      </StaticSection>

      <StaticSection title="個人情報の取り扱いについて">
        <p>
          お問い合わせの際にご提供いただいた個人情報は、お問い合わせへの対応のみに使用し、適切に管理いたします。詳しくは
          <a href="/privacy" className={staticLink}>
            プライバシーポリシー
          </a>
          をご確認ください。
        </p>

        <div className={st.subtle}>
          フォームが開かない場合は、下記のメールアドレスまでご連絡ください
          <div>
            <a href="mailto:umadata.daichi@gmail.com" className={staticLink}>
              umadata.daichi@gmail.com
            </a>
          </div>
        </div>
      </StaticSection>
    </StaticPageLayout>
  );
}
