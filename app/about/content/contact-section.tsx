import styles from '@/components/article-content.module.css';

export default function ContactSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>お問い合わせ</h2>
      <p className={styles.text}>
        当サイトに関するご意見・ご要望は、
        <a href="/contact" className={styles.link}>お問い合わせページ</a>
        よりお気軽にご連絡ください！
      </p>
    </section>
  );
}
