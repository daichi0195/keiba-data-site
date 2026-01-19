'use client';

import { useState } from 'react';
import styles from './FixedShareButton.module.css';

interface FixedShareButtonProps {
  title: string;
  url: string;
}

export default function FixedShareButton({ title, url }: FixedShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;

  const handleShare = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={handleShare}
        className={styles.fixedShareButton}
        aria-label="Xでシェア"
      >
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <path
            fill="currentColor"
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
      </button>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={handleCloseModal}>
              ×
            </button>
            <iframe
              src={twitterUrl}
              className={styles.twitterIframe}
              title="Xでシェア"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
        </div>
      )}
    </>
  );
}
