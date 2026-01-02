import styles from '@/components/article-content.module.css';

export default function Copyright() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>著作権について</h2>
      <p className={styles.text}>
        当サイトに掲載されているコンテンツ（文章、データ、画像など）の著作権は、競馬データ.comに帰属します。<br />
        無断転載・複製を禁じます🙅‍♀️
      </p>
    </section>
  );
}
