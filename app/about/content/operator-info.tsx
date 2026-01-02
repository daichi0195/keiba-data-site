import styles from '@/components/article-content.module.css';

export default function OperatorInfo() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>運営者情報</h2>
      <p className={styles.text}>
        <strong>サイト名：</strong>競馬データ.com
      </p>
      <p className={styles.text}>
        <strong>URL：</strong>https://www.keibadata.com
      </p>
      <p className={styles.text}>
        <strong>運営開始：</strong>2025年1月
      </p>
    </section>
  );
}
