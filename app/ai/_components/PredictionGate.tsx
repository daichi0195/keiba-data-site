'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './PredictionGate.module.css';

/** オファーウォールがこの時間内に出なければ、そのまま予測を見せる（広告ブロッカー・リワード広告の在庫切れ対策） */
const FALLBACK_MS = 3000;

/**
 * AI予測の表を、オファーウォール（AdSense）で広告を見終わるまで隠す。
 *
 * AdSense にはリワード広告の視聴完了を知らせる API がないため、
 * オファーウォールのダイアログ（.fc-monetization-dialog-container）が「出て、消えた」ことで判定する。
 * 読み込み直後はオファーウォールのスクリプトより先に本文が描画されるので、最初から隠しておく。
 */
export default function PredictionGate({ children }: { children: React.ReactNode }) {
  const isProd = process.env.NODE_ENV === 'production';
  const [open, setOpen] = useState(!isProd);
  const seenWall = useRef(false);

  useEffect(() => {
    if (!isProd) return;

    const isWallVisible = () => {
      const el = document.querySelector<HTMLElement>('.fc-monetization-dialog-container');
      if (!el || !el.isConnected) return false;
      const rect = el.getBoundingClientRect();
      return getComputedStyle(el).display !== 'none' && rect.width > 0 && rect.height > 0;
    };

    const check = () => {
      if (isWallVisible()) {
        // 3秒の待ち時間を過ぎてから出てきた場合も、もう一度隠す
        seenWall.current = true;
        setOpen(false);
      } else if (seenWall.current) {
        setOpen(true);
      }
    };

    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    check();

    const timer = setTimeout(() => {
      if (!seenWall.current) setOpen(true);
    }, FALLBACK_MS);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [isProd]);

  return (
    <div className={styles.gate} aria-busy={!open}>
      <div className={open ? undefined : styles.hidden} aria-hidden={!open}>
        {children}
      </div>
      {!open && (
        <div className={styles.overlay}>
          <span className={styles.spinner} aria-hidden="true" />
          <p>予測を準備しています…</p>
        </div>
      )}
    </div>
  );
}
