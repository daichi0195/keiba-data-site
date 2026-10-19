import { StaticSection, staticLink } from '@/components/StaticPageLayout';

export default function ContactSection() {
  return (
    <StaticSection title="お問い合わせ">
      <p>
        当サイトに関するご意見・ご要望は、
        <a href="/contact" className={staticLink}>お問い合わせページ</a>
        よりお気軽にご連絡ください！
      </p>
    </StaticSection>
  );
}
