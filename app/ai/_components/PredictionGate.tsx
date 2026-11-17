'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './PredictionGate.module.css';

/** オファーウォールのスクリプトが動き出してから、この時間内にダイアログが出なければ予測を見せる（リワード広告の在庫切れ対策） */
const WAIT_AFTER_SCRIPT_MS = 3000;
/** スクリプトの合図がいつまでも来ない場合の上限 */
const MAX_WAIT_MS = 15000;

declare global {
  interface Window {
    googlefc?: { callbackQueue?: unknown[] } & Record<string, unknown>;
  }
}

/**
 * AI予測の表を、オファーウォール（AdSense）で広告を見終わるまで隠す。
 *
 * AdSense にはリワード広告の視聴完了を知らせる API がないため、
 * オファーウォールのダイアログ（.fc-monetization-dialog-container）が「出て、消えた」ことで判定する。
 * 読み込み直後はオファーウォールのスクリプトより先に本文が描画されるので、最初から隠しておく。
 *
 * ダイアログが出ない場合の扱い:
 * - 広告ブロッカーなどで adsbygoogle.js が読み込めない → ページの読み込み完了時に表示
 * - スクリプトは動いた（googlefc の CONSENT_API_READY）のにダイアログが出ない → その 3 秒後に表示
 * - 後からダイアログが出てきた場合は隠し直す
 */
export default function PredictionGate({ children }: { children: React.ReactNode }) {
  const isProd = process.env.NODE_ENV === 'production';
  const [open, setOpen] = useState(!isProd);
  const seenWall = useRef(false);

  useEffect(() => {
    if (!isProd) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const openIfNoWall = () => {
      if (!seenWall.current) setOpen(true);
    };

    const isWallVisible = () => {
      const el = document.querySelector<HTMLElement>('.fc-monetization-dialog-container');
      if (!el || !el.isConnected) return false;
      const rect = el.getBoundingClientRect();
      return getComputedStyle(el).display !== 'none' && rect.width > 0 && rect.height > 0;
    };

    const check = () => {
      if (isWallVisible()) {
        seenWall.current = true;
        setOpen(false);
      } else if (seenWall.current) {
        setOpen(true);
      }
    };

    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    check();

    // オファーウォールのスクリプトが動き出したら、そこから待つ
    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    window.googlefc.callbackQueue.push({
      CONSENT_API_READY: () => {
        timers.push(setTimeout(openIfNoWall, WAIT_AFTER_SCRIPT_MS));
      },
    });

    // 広告ブロッカーで adsbygoogle.js が読み込めなかった場合は、ページの読み込み完了時に表示
    const onLoad = () => {
      const ads = (window as unknown as { adsbygoogle?: { loaded?: boolean } }).adsbygoogle;
      if (!ads?.loaded) openIfNoWall();
    };
    if (document.readyState === 'complete') {
      timers.push(setTimeout(onLoad, 500));
    } else {
      window.addEventListener('load', () => timers.push(setTimeout(onLoad, 500)), { once: true });
    }

    timers.push(setTimeout(openIfNoWall, MAX_WAIT_MS));

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
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
