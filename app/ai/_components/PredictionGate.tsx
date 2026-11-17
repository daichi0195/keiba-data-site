'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './PredictionGate.module.css';

/**
 * オファーウォールのスクリプトが動き出してから、この時間内にダイアログが出なければ予測を見せる（リワード広告の在庫切れ対策）
 * 2026-11-17 の実測（PC・光回線、4 回）：スクリプト起動からダイアログ表示まで 1.5〜3.5 秒。
 * リワード広告の読み込みを待ってから出るためばらつきが大きいので、最大値に余裕を持たせる
 */
const WAIT_AFTER_SCRIPT_MS = 6000;
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
 * - 広告ブロッカーで adsbygoogle.js が読み込めない → 予測は出さず、広告ブロッカーをオフにするよう案内する
 *   （AdSense の広告ブロック回復メッセージはサイトに1つしか出せず、サイト全体用の「閉じられる」ものを使っているため、ここは自前で止める）
 * - スクリプトは動いた（googlefc の CONSENT_API_READY）のにダイアログが出ない → その数秒後に表示（リワード広告の在庫切れ）
 * - 後からダイアログが出てきた場合は隠し直す
 */
export default function PredictionGate({ children }: { children: React.ReactNode }) {
  const isProd = process.env.NODE_ENV === 'production';
  const [open, setOpen] = useState(!isProd);
  const [adBlocked, setAdBlocked] = useState(false);
  const seenWall = useRef(false);
  const blockedRef = useRef(false);

  useEffect(() => {
    if (!isProd) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const openIfNoWall = () => {
      if (!seenWall.current && !blockedRef.current) setOpen(true);
    };

    const isWallVisible = () => {
      // オファーウォール、または広告ブロッカー利用者向けの「広告を許可してください」メッセージ
      const el = document.querySelector<HTMLElement>('.fc-monetization-dialog-container, .fc-ab-root .fc-dialog-container, .fc-ab-root');
      if (!el || !el.isConnected) return false;
      const rect = el.getBoundingClientRect();
      return getComputedStyle(el).display !== 'none' && rect.width > 0 && rect.height > 0;
    };

    const check = () => {
      if (isWallVisible()) {
        if (!seenWall.current) performance.mark('offerwall-visible');
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
        // 待ち時間の調整用（performance.getEntriesByType('mark') で確認できる）
        performance.mark('offerwall-script-ready');
        timers.push(setTimeout(openIfNoWall, WAIT_AFTER_SCRIPT_MS));
      },
    });

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
