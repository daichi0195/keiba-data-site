import styles from './AIBanner.module.css';

export default function AIBanner({ bookmarkOnly = false }: { bookmarkOnly?: boolean }) {
  return (
    <>
      {!bookmarkOnly && (
        <div className={styles.banner}>
          <div className={styles.title}>競馬AI製作中！</div>
          <div className={styles.subtitle}>COMING SOON</div>
        </div>
      )}
      <div className={`${styles.bookmarkBanner} ${bookmarkOnly ? styles.bookmarkBannerNoMargin : ''}`}>
        <div className={styles.bookmarkIcon}>🔖</div>
        <div className={styles.bookmarkTitle}>毎週の予想に活用しよう！</div>
        <div className={styles.bookmarkCommand}>Ctrl+D / ⌘+D</div>
        <div className={styles.bookmarkSubtitle}>でブックマークに登録！</div>
      </div>
    </>
  );
}
