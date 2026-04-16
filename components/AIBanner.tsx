import Image from 'next/image';
import Link from 'next/link';
import styles from './AIBanner.module.css';

export default function AIBanner({ bookmarkOnly = false, bannerOnly = false }: { bookmarkOnly?: boolean; bannerOnly?: boolean }) {
  return (
    <>
      {!bookmarkOnly && (
        <Link href="/ai" className={styles.banner}>
          <Image
            src="/ai.png"
            alt="回収率130%達成 AI勝率予測 無料で公開中！"
            width={400}
            height={400}
            className={styles.bannerImage}
            priority
          />
        </Link>
      )}
      {!bannerOnly && (
        <div className={`${styles.bookmarkBanner} ${bookmarkOnly ? styles.bookmarkBannerNoMargin : ''}`}>
          <div className={styles.bookmarkIcon}>🔖</div>
          <div className={styles.bookmarkTitle}>毎週の予想に活用しよう！</div>
          <div className={styles.bookmarkCommand}>Ctrl+D / ⌘+D</div>
          <div className={styles.bookmarkSubtitle}>でブックマークに登録！</div>
        </div>
      )}
    </>
  );
}
