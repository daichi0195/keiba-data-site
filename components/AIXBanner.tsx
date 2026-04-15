import styles from './AIXBanner.module.css';

export default function AIXBanner() {
  return (
    <a
      href="https://x.com/aikeibadata"
      target="_blank"
      rel="noopener noreferrer"
      className={styles.banner}
    >
      <div className={styles.content}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        <div className={styles.textWrapper}>
          <span className={styles.mainText}>Xでも予測を配信中！</span>
          <span className={styles.subText}>対象レースの約10分前にポストしています。フォロー&amp;通知をオンにして最新情報を受け取ろう！</span>
        </div>
        <svg className={styles.arrow} width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </a>
  );
}
