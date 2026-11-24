// AI予測の3ページで共通の小さな部品（サーバーで描く）。見本：docs/redesign/src/pages/ai-shared.mjs
import { Fragment } from 'react';
import Link from '@/components/HardLink';
import { FRAME_ICONS, FrameIcon } from '@/components/layout/icons';
import { gradeOf, sfJa, sfKey, shortDate, shortName } from './format';
import type { RaceSummary } from './data';
import s from './ai.module.css';

export const ChevR = () => <FrameIcon icon={FRAME_ICONS.chevronRight} className={s.ic} />;

/** 馬場の札（sm＝小） */
export function Sf({ surface, sm }: { surface: string; sm?: boolean }) {
  return <i className={`${s.sf}${sm ? ` ${s.sm}` : ''} ${s[sfKey(surface)]}`}>{sfJa(surface)}</i>;
}

/** 重賞の格付けの札（G1 青・G2 赤・G3 緑） */
export function Grade({ raceName }: { raceName: string }) {
  const g = gradeOf(raceName);
  return g ? <i className={`${s.gr} ${s[g.toLowerCase()]}`}>{g}</i> : null;
}

/** パンくず（先頭の HOME は自動で付く） */
export function Crumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className={s['p-crumb']} aria-label="パンくず">
      <Link prefetch={false} href="/">HOME</Link>
      {items.map((it, i) =>
        it.href ? (
          <Fragment key={i}>
            <i aria-hidden="true">/</i>
            <Link prefetch={false} href={it.href}>{it.label}</Link>
          </Fragment>
        ) : (
          <span key={i} className={s.cur}>
            <i aria-hidden="true">/</i>
            {it.label}
          </span>
        ),
      )}
    </nav>
  );
}

/**
 * AI予測カード（トップの見本と同じ .ac。格付けの札はレース名の前）。label を渡すと上に小さな見出し（前の予測・次の予測）。
 * レース個別ページはオファーウォール（AdSense）の対象で、ページの読み込み時にしか表示されないため、Link ではなく通常の a で遷移させる
 */
export function RaceCard({ race, label, cls, index }: { race: RaceSummary; label?: React.ReactNode; cls?: string; index?: number }) {
  return (
    <a
      className={`${s.ac}${cls ? ` ${cls}` : ''}`}
      href={`/ai/races/${race.slug}`}
      style={index !== undefined ? ({ '--i': index } as React.CSSProperties) : undefined}
    >
      {label && <span className={s['p-nav-l']}>{label}</span>}
      <p className={s['ac-h']}>
        <span className={s['ac-v']}>
          {race.venueLabel}
          <b className={s.num}>{race.raceNumber}</b>R
        </span>
        <span className={s['ac-d']}>{shortDate(race.date)}</span>
      </p>
      <p className={s['ac-n']}>
        <Grade raceName={race.raceName} />
        {shortName(race.raceName)}
      </p>
      <p className={s['ac-m']}>
        <Sf surface={race.surface} sm />
        <span className={s.num}>{race.distance}m</span>
      </p>
    </a>
  );
}

/** Xでの予測配信の案内 */
export function XBanner() {
  return (
    <a className={`${s['p-pn']} ${s['p-x']}`} href="https://x.com/aikeibadata" target="_blank" rel="noopener noreferrer">
      <svg className={s['p-x-i']} aria-hidden="true" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      <span className={s['p-x-t']}>
        <b>Xでも予測を配信中！</b>
        <span>対象レースの約5分前にポストしています。フォロー&amp;通知をオンにして最新情報を受け取ろう！</span>
      </span>
      <ChevR />
    </a>
  );
}

/** ブックマークの案内（PC だけ） */
export function Bookmark() {
  return (
    <p className={s['p-bm']}>
      毎週の予想に活用しよう！ <kbd>Ctrl+D</kbd> / <kbd>⌘+D</kbd> でブックマークに登録！
    </p>
  );
}

/** ページ末尾：Xの案内・戻るボタン・ブックマークの案内 */
export function Foot({ back }: { back: { label: string; href: string }[] }) {
  return (
    <div className={s['p-foot']}>
      <div className={s['p-w']}>
        <XBanner />
      </div>
      <div className={`${s['p-w']} ${s['p-back']}`}>
        {back.map((b) => (
          <Link prefetch={false} key={b.href} className={s.pill} href={b.href}>
            {b.label}
          </Link>
        ))}
      </div>
      <Bookmark />
    </div>
  );
}
