import { Metadata } from 'next';
import StaticPage, { P, Ul, In, type StaticSection } from '@/components/v6/static/StaticPage';
import { cx } from '@/components/v6/static/cx';

export const metadata: Metadata = {
  title: 'お問い合わせ | 競馬データ.com',
  description: '競馬データ.comへのお問い合わせはこちらから。サイトに関するご質問やご要望をお寄せください。',
};

// 見本：docs/redesign/src/pages/contact.mjs。手段は Googleフォーム（別タブ）＋予備のメールアドレス
const sections: StaticSection[] = [
  {
    title: 'お問い合わせについて',
    body: (
      <>
        <P>競馬データ.comをご利用いただき、ありがとうございます。</P>
        <P>サイトに関するご質問、ご意見、ご要望などがございましたら、以下のフォームからお問い合わせください。</P>
        <p className={cx('st-act')}>
          <a className={cx('st-btn')} href="https://docs.google.com/forms/d/1Gp27xw-fd14nb9R7GAMIEEW7VsKQtQspf2DYSnbon64/" target="_blank" rel="noopener noreferrer">
            お問い合わせフォームを開く
          </a>
        </p>
      </>
    ),
  },
  {
    title: 'お問い合わせの例',
    body: (
      <>
        <Ul
          items={[
            'データの誤りや集計定義に関するご指摘',
            '追加してほしい集計項目・コース・騎手などのご要望',
            'コラムの内容に関するご質問',
            'データ引用・掲載に関するご相談',
          ]}
        />
        <P>個人運営のため返信までお時間をいただく場合があります。レース結果や馬券の予想に関する個別のご質問にはお答えしていません。</P>
      </>
    ),
  },
  {
    title: '個人情報の取り扱いについて',
    body: (
      <>
        <P>
          お問い合わせの際にご提供いただいた個人情報は、お問い合わせへの対応のみに使用し、適切に管理いたします。詳しくは<In href="/privacy">プライバシーポリシー</In>をご確認ください。
        </P>
        <div className={cx('st-sub')}>
          <P>フォームが開かない場合は、下記のメールアドレスまでご連絡ください</P>
          <p>
            <a href="mailto:umadata.daichi@gmail.com">umadata.daichi@gmail.com</a>
          </p>
        </div>
      </>
    ),
  },
];

export default function ContactPage() {
  return <StaticPage pageKey="contact" title="お問い合わせ" crumbs={[{ label: 'お問い合わせ' }]} sections={sections} toc={false} />;
}
