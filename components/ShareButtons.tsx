'use client';

import styles from './ShareButtons.module.css';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    line: `https://line.me/R/msg/text/?${encodedTitle}%20${encodedUrl}`,
    hatena: `https://b.hatena.ne.jp/add?mode=confirm&url=${encodedUrl}&title=${encodedTitle}`,
  };

  const handleShare = (platform: keyof typeof shareUrls) => {
    const width = 600;
    const height = 400;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      shareUrls[platform],
      'share',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('URLをコピーしました');
    } catch (err) {
      console.error('URLのコピーに失敗しました', err);
    }
  };

  return (
    <div className={styles.shareButtons}>
      <p className={styles.shareTitle}>この記事をシェア</p>
      <div className={styles.buttonGroup}>
        <button
          onClick={() => handleShare('twitter')}
          className={`${styles.shareButton} ${styles.twitter}`}
          aria-label="Xでシェア"
        >
          <svg viewBox="0 0 24 24" className={styles.icon}>
            <path
              fill="currentColor"
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            />
          </svg>
          X
        </button>

        <button
          onClick={() => handleShare('facebook')}
          className={`${styles.shareButton} ${styles.facebook}`}
          aria-label="Facebookでシェア"
        >
          <svg viewBox="0 0 24 24" className={styles.icon}>
            <path
              fill="currentColor"
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
          Facebook
        </button>

        <button
          onClick={() => handleShare('line')}
          className={`${styles.shareButton} ${styles.line}`}
          aria-label="LINEでシェア"
        >
          <svg viewBox="0 0 24 24" className={styles.icon}>
            <path
              fill="currentColor"
              d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
            />
          </svg>
          LINE
        </button>

        <button
          onClick={() => handleShare('hatena')}
          className={`${styles.shareButton} ${styles.hatena}`}
          aria-label="はてなブックマークでシェア"
        >
          <svg viewBox="0 0 24 24" className={styles.icon}>
            <path
              fill="currentColor"
              d="M20.47 0C22.42 0 24 1.58 24 3.53v16.94c0 1.95-1.58 3.53-3.53 3.53H3.53C1.58 24 0 22.42 0 20.47V3.53C0 1.58 1.58 0 3.53 0h16.94zM8.09 17.62H5.55V6.38h2.54v11.24zm10.21-5.15c.01-1.8-1.02-2.75-2.48-2.75-1.47 0-2.49.95-2.49 2.75 0 1.8 1.02 2.75 2.49 2.75 1.46 0 2.48-.95 2.48-2.75zm-.99-7.46c-.96 0-1.81.79-1.81 1.79s.85 1.79 1.81 1.79c.96 0 1.81-.79 1.81-1.79s-.85-1.79-1.81-1.79zM8.34 11.16c-.95 0-1.76-.84-1.76-1.76s.81-1.76 1.76-1.76c.95 0 1.76.84 1.76 1.76s-.81 1.76-1.76 1.76z"
            />
          </svg>
          はてな
        </button>

        <button
          onClick={handleCopyUrl}
          className={`${styles.shareButton} ${styles.copy}`}
          aria-label="URLをコピー"
        >
          <svg viewBox="0 0 24 24" className={styles.icon}>
            <path
              fill="currentColor"
              d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
            />
          </svg>
          コピー
        </button>
      </div>
    </div>
  );
}
