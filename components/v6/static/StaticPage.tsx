import { Children, Fragment, isValidElement } from 'react';
import Link from '@/components/HardLink';
import { FRAME_ICONS, FrameIcon } from '@/components/layout/icons';
import RailAiOff from '@/components/layout/RailAiOff';
import StaticToc from './StaticToc';
import { cx } from './cx';

/**
 * 固定ページ（読み物・案内）の組み立て（リデザイン v6）。
 * 見本：docs/redesign/src/pages/_static.mjs の staticBody()（＋ css/static.css・js/static.js）。
 * - 1ページ＝白い板1枚。節は罫で区切り、見出しは板の中
 * - PC（1100px以上）は右に列：追従する目次（長いページだけ）と、固定ページどうしの案内
 * - スマホ・タブレットは本文の上に開閉できる目次と、各節の末尾に「目次へ」
 * 右列（幅1800px以上）の AI 案内は出さない（RailAiOff）。
 */

export const ChevD = () => <FrameIcon icon={FRAME_ICONS.chevronDown} className={cx('ic')} />;
export const ChevR = () => <FrameIcon icon={FRAME_ICONS.chevronRight} className={cx('ic')} />;

/**
 * 段落・箇条書き・説明の末尾3文字を折り返さない塊にして、行末に1〜2文字だけ残るのを防ぐ（文章は変えない）。
 * 見本の tail() と同じく、要素の最後が3文字以上の文字列（空白なし）で終わるときだけ包む。
 */
function tail(children: React.ReactNode): React.ReactNode {
  const inner = isValidElement<{ children?: React.ReactNode }>(children) && children.type === Fragment ? children.props.children : children;
  const arr = Children.toArray(inner);
  const last = arr[arr.length - 1];
  if (typeof last !== 'string') return children;
  const m = last.match(/^([\s\S]*?)(\S{3})$/);
  if (!m) return children;
  return (
    <>
      {arr.slice(0, -1)}
      {m[1]}
      <span className={cx('nw')}>{m[2]}</span>
    </>
  );
}

export function P({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={className ? cx(className) : undefined}>{tail(children)}</p>;
}

/** 箇条書き */
export function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className={cx('st-ul')}>
      {items.map((x, i) => (
        <li key={i}>{tail(x)}</li>
      ))}
    </ul>
  );
}

/** 用語と説明の表。rows: [用語, 説明, 用語の補足]。mode: ''（縦積み）/ 'row'（常に横並び）/ 'row-pc'（PCだけ横並び）。tw: 用語の列幅 */
export function Df({ rows, mode = '', tw }: { rows: [React.ReactNode, React.ReactNode, string?][]; mode?: '' | 'row' | 'row-pc'; tw?: string }) {
  return (
    <dl className={cx('st-df', mode)} style={tw ? ({ '--tw': tw } as React.CSSProperties) : undefined}>
      {rows.map(([t, d, n], i) => (
        <div key={i}>
          <dt>
            {t}
            {n && <small>{n}</small>}
          </dt>
          <dd>{tail(d)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** サイト内のリンク（本文中） */
export function In({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link prefetch={false} href={href}>{children}</Link>;
}
/** 外部サイトへのリンク（別タブ） */
export function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export type Crumb = { label: string; href?: string };

/** パンくず。区切りの「/」は後ろの項目と一緒に折り返す */
export function StaticCrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className={cx('st-crumb')} aria-label="パンくず">
      <span className={cx('st-c')}>
        <Link prefetch={false} href="/">HOME</Link>
      </span>
      {crumbs.map((c, i) => (
        <Fragment key={i}>
          <wbr />
          <span className={cx('st-c')}>
            <i aria-hidden="true">/</i>
            {c.href ? <Link prefetch={false} href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
          </span>
        </Fragment>
      ))}
    </nav>
  );
}

// 固定ページどうしの行き来（PC の右列）
const SITE_NAV = [
  { key: 'about', href: '/about', label: 'サイト情報・運営者情報' },
  { key: 'about-data', href: '/about/data', label: 'データの出典と集計方法' },
  { key: 'contact', href: '/contact', label: 'お問い合わせ' },
  { key: 'privacy', href: '/privacy', label: 'プライバシーポリシー' },
  { key: 'disclaimer', href: '/disclaimer', label: '免責事項' },
] as const;

export type StaticKey = (typeof SITE_NAV)[number]['key'];

export type StaticSection = {
  id?: string;
  title: string;
  /** 本文の箱に足すクラス（見本の cls。'st-vids' など） */
  cls?: string;
  body: React.ReactNode;
};

/** 本文の板の中を見本と同じ並び（節ごとに h2＋.st-p）にする */
export default function StaticPage({
  pageKey,
  title,
  crumbs,
  lead,
  sections,
  toc,
}: {
  pageKey: StaticKey;
  title: string;
  crumbs: Crumb[];
  lead?: string;
  sections: StaticSection[];
  toc: boolean;
}) {
  const secs = sections.map((s, i) => ({ ...s, id: s.id || `sec-${i + 1}` }));
  const items = secs.map((s, i) => (
    <li key={s.id}>
      <a href={`#${s.id}`}>
        <span className={cx('n num')}>{i + 1}</span>
        <span>{s.title}</span>
      </a>
    </li>
  ));
  return (
    <main className={cx('root')}>
      <RailAiOff />
      <div className={cx('st', toc && 'has-toc')} id="st-top">
        <header className={cx('st-h')}>
          <StaticCrumb crumbs={crumbs} />
          <h1>{title}</h1>
          {lead && <P className="st-lead">{lead}</P>}
        </header>
        <aside className={cx('st-aside')}>
          {toc && (
            <>
              <details className={cx('st-pn st-toc-m')} id="st-toc-m" data-st-toc="m">
                <summary>
                  <b>目次</b>
                  <span>
                    <span className={cx('num')}>{secs.length}</span>項目
                  </span>
                  <ChevD />
                </summary>
                <ol>{items}</ol>
              </details>
              <div className={cx('st-toc-w')}>
                <nav className={cx('st-pn st-toc')} aria-label="目次" data-st-toc="pc">
                  <h2>目次</h2>
                  <ol>{items}</ol>
                </nav>
              </div>
            </>
          )}
          <nav className={cx('st-pn st-nav')} aria-label="サイト案内">
            <h2>サイト案内</h2>
            <ul>
              {SITE_NAV.map((l) => (
                <li key={l.key}>
                  <Link prefetch={false} href={l.href} className={l.key === pageKey ? cx('on') : undefined} aria-current={l.key === pageKey ? 'page' : undefined}>
                    <span>{l.label}</span>
                    <ChevR />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <article className={cx('st-pn st-art')}>
          {secs.map((s) => (
            <section key={s.id} id={s.id}>
              <h2>{s.title}</h2>
              <div className={cx('st-p', s.cls)}>{s.body}</div>
              {toc && (
                <p className={cx('st-back')} data-st-back="">
                  <a href="#st-toc-m">
                    <ChevD />
                    目次へ
                  </a>
                </p>
              )}
            </section>
          ))}
        </article>
        {toc && <StaticToc />}
      </div>
    </main>
  );
}
