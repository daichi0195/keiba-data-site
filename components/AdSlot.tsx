'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import styles from './AdSlot.module.css';

const AD_CLIENT = 'ca-pub-5897385083912635';

/** AdSense の広告ユニット（管理画面「広告 → 広告ユニットごと」で作成したもの） */
export const AD_UNITS = {
  dataTop: '5620767308', // データページ：結論カードの下
  dataMid: '8055358951', // データページ：中盤
  dataBottom: '6742277280', // データページ：データQ&Aの前
  sidebar: '5429195618', // PC 左サイドバー
  list: '2660221188', // 一覧ページ・トップページ
  articleIn: '2968564139', // コラムの記事内広告
} as const;

type Unit = keyof typeof AD_UNITS;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * 手動配置の AdSense 広告枠。
 * - inline: 本文の幅いっぱいのレスポンシブ広告
 * - sidebar: PC 左サイドバー用の固定サイズ広告（幅 240px の中画面でも収まるサイズ）
 * - article: コラム本文中の記事内広告（ネイティブ）
 * App Router のページ遷移でも新しい広告が入るよう、パスが変わるたびに ins を作り直して push する。
 */
export default function AdSlot({ unit, variant = 'inline' }: { unit: Unit; variant?: 'inline' | 'sidebar' | 'article' }) {
  const pathname = usePathname();
  return <AdSlotInner key={pathname} slot={AD_UNITS[unit]} variant={variant} />;
}

function AdSlotInner({ slot, variant }: { slot: string; variant: 'inline' | 'sidebar' | 'article' }) {
  const ref = useRef<HTMLModElement>(null);
  const isProd = process.env.NODE_ENV === 'production';

  useEffect(() => {
    const el = ref.current;
    if (!isProd || !el) return;
    // 非表示（モバイルでのサイドバーなど）の枠は push するとエラーになるので飛ばす
    if (el.offsetWidth === 0) return;
    if (el.getAttribute('data-adsbygoogle-status')) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 広告ブロッカーなどで失敗してもページは壊さない
    }
  }, [isProd]);

  const wrapClass = `${styles.wrap} ${styles[variant]}`;

  // 開発環境では枠の位置だけ確認できるようにする
  if (!isProd) {
    return (
      <div className={wrapClass}>
        <span className={styles.label}>スポンサーリンク</span>
        <div className={`${styles.placeholder} ${styles[`${variant}Box`]}`}>広告枠（{slot}）</div>
      </div>
    );
  }

  return (
    <div className={wrapClass}>
      <span className={styles.label}>スポンサーリンク</span>
      {variant === 'article' ? (
        <ins
          ref={ref}
          className={`adsbygoogle ${styles.ins}`}
          style={{ display: 'block', textAlign: 'center' }}
          data-ad-layout="in-article"
          data-ad-format="fluid"
          data-ad-client={AD_CLIENT}
          data-ad-slot={slot}
        />
      ) : variant === 'sidebar' ? (
        <ins
          ref={ref}
          className={`adsbygoogle ${styles.ins} ${styles.sidebarBox}`}
          data-ad-client={AD_CLIENT}
          data-ad-slot={slot}
        />
      ) : (
        <ins
          ref={ref}
          className={`adsbygoogle ${styles.ins}`}
          style={{ display: 'block' }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}
