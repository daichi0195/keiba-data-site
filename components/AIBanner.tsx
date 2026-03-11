import styles from './AIBanner.module.css';

export default function AIBanner() {
  return (
    <>
      <div className={styles.banner}>
        <div className={styles.title}>競馬AI製作中！</div>
        <div className={styles.subtitle}>COMING SOON</div>
      </div>
      <div className={styles.bookmarkBanner}>
        <div className={styles.bookmarkIcon}>🔖</div>
        <div className={styles.bookmarkTitle}>ブックマーク登録</div>
        <div className={styles.bookmarkSubtitle}>毎週の予想に活用！</div>
      </div>
    </>
  );
}
