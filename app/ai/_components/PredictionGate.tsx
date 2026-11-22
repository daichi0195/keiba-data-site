'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './PredictionGate.module.css';

/**
 * AI予測の表を、オファーウォール（AdSense）が出ている間だけ隠す。
 *
 * 2026-11-22 からオファーウォールはサイト全体（3ページ目から・広告1本で5ページ）の1本だけになり、
 * AI予測ページでも出ないことの方が多いので、予測は最初から見せる。
 * ダイアログ（.fc-monetization-dialog-container）が出たら隠し、消えたら（広告を見終わったら）見せる。
 *
 * 広告ブロッカーで adsbygoogle.js が読み込めない場合は、予測を出さずに広告ブロッカーをオフにするよう案内する
 * （AdSense の広告ブロック回復メッセージはサイト全体用の「閉じられる」ものなので、ここは自前で止める）。
 */
export default function PredictionGate({ children }: { children: React.ReactNode }) {
  const isProd = process.env.NODE_ENV === 'production';
  const [open, setOpen] = useState(true);
  const [adBlocked, setAdBlocked] = useState(false);
  const seenWall = useRef(false);
  const blockedRef = useRef(false);

  useEffect(() => {
    if (!isProd) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const isWallVisible = () => {
      // オファーウォール、または広告ブロッカー利用者向けの「広告を許可してください」メッセージ
      const el = document.querySelector<HTMLElement>('.fc-monetization-dialog-container, .fc-ab-root .fc-dialog-container, .fc-ab-root');
      if (!el || !el.isConnected) return false;
      const rect = el.getBoundingClientRect();
      return getComputedStyle(el).display !== 'none' && rect.width > 0 && rect.height > 0;
    };

    const check = () => {
      if (isWallVisible()) {
        seenWall.current = true;
        setOpen(false);
      } else if (seenWall.current && !blockedRef.current) {
        setOpen(true);
      }
    };

    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    check();

    // ページの読み込み完了時点で adsbygoogle.js が動いていなければ広告ブロッカーとみなす
    // （async のスクリプトは load イベントより前に読み込まれる）
    const onLoad = () => {
      const ads = (window as unknown as { adsbygoogle?: { loaded?: boolean } }).adsbygoogle;
      if (!ads?.loaded && !seenWall.current) {
        blockedRef.current = true;
        setAdBlocked(true);
        setOpen(false);
      }
    };
    if (document.readyState === 'complete') {
      timers.push(setTimeout(onLoad, 500));
    } else {
      window.addEventListener('load', () => timers.push(setTimeout(onLoad, 500)), { once: true });
    }

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
      {!open && adBlocked && (
        <div className={styles.overlay}>
          <p className={styles.blockedTitle}>広告ブロッカーが有効になっています</p>
          <p>AI勝率予測は広告収入で無料公開しています。広告ブロッカーをオフにして、ページを再読み込みしてください。</p>
          <button type="button" className={styles.reload} onClick={() => window.location.reload()}>
            再読み込みする
          </button>
        </div>
      )}
      {!open && !adBlocked && (
        <div className={styles.overlay}>
          <span className={styles.spinner} aria-hidden="true" />
          <p>予測を準備しています…</p>
        </div>
      )}
    </div>
  );
}
