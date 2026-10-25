import Link from 'next/link';
import styles from './AIBanner.module.css';

export default function AIBanner({ bookmarkOnly = false, bannerOnly = false }: { bookmarkOnly?: boolean; bannerOnly?: boolean }) {
  return (
    <>
      {!bookmarkOnly && (
        // AdSense 審査を考え、成績を強調する表現（旧画像の「回収率130%達成」）は使わず内容の説明にとどめる
        <Link href="/ai" className={`${styles.banner} ${styles.textBanner}`}>
          <span className={styles.bannerLabel}>AI勝率予測</span>
          <span className={styles.bannerTitle}>出走馬ごとの勝率をAIで予測</span>
          <span className={styles.bannerText}>独自のモデルで出走馬の勝率を算出し、対象レースの約10分前に無料で公開しています。</span>
          <span className={styles.bannerMore}>予測を見る</span>
        </Link>
      )}
      {!bannerOnly && (
        <div className={`${styles.bookmarkBanner} ${bookmarkOnly ? styles.bookmarkBannerNoMargin : ''}`}>
          <div className={styles.bookmarkTitle}>毎週の予想に活用しよう！</div>
          <div className={styles.bookmarkCommand}>Ctrl+D / ⌘+D</div>
          <div className={styles.bookmarkSubtitle}>でブックマークに登録！</div>
        </div>
      )}
    </>
  );
}
