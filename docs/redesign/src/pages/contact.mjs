// お問い合わせ（現行：app/contact/page.tsx）。手段は Googleフォーム（別タブ）＋予備のメールアドレス
import { a, ul, staticPage } from './_static.mjs';

const sections = [
  { title: 'お問い合わせについて', html: `
    <p>競馬データ.comをご利用いただき、ありがとうございます。</p>
    <p>サイトに関するご質問、ご意見、ご要望などがございましたら、以下のフォームからお問い合わせください。</p>
    <p class="st-act"><a class="st-btn" href="#" data-inert>お問い合わせフォームを開く</a></p>` },
  { title: 'お問い合わせの例', html: `
    ${ul([
      'データの誤りや集計定義に関するご指摘',
      '追加してほしい集計項目・コース・騎手などのご要望',
      'コラムの内容に関するご質問',
      'データ引用・掲載に関するご相談',
    ])}
    <p>個人運営のため返信までお時間をいただく場合があります。レース結果や馬券の予想に関する個別のご質問にはお答えしていません。</p>` },
  { title: '個人情報の取り扱いについて', html: `
    <p>お問い合わせの際にご提供いただいた個人情報は、お問い合わせへの対応のみに使用し、適切に管理いたします。詳しくは${a('プライバシーポリシー')}をご確認ください。</p>
    <div class="st-sub"><p>フォームが開かない場合は、下記のメールアドレスまでご連絡ください</p><p>${a('umadata.daichi@gmail.com')}</p></div>` },
];

console.log('contact', staticPage({ key: 'contact', out: 'v6-contact.html', pageTitle: 'お問い合わせ | 競馬データ.com（見本）', title: 'お問い合わせ', crumbs: [['お問い合わせ']], sections, toc: false }));
