import type { Metadata } from 'next';
import Link from '@/components/HardLink';
import RailAiOff from '@/components/layout/RailAiOff';
import { RailAdOff } from '@/components/layout/RailAd';
import { FRAME_ICONS, FrameIcon, type FrameIconKey } from '@/components/layout/icons';
import { P, In, ChevR, StaticCrumb } from '@/components/v6/static/StaticPage';
import { cx } from '@/components/v6/static/cx';

export const metadata: Metadata = {
  title: 'ページが見つかりません | 競馬データ.com',
  robots: { index: false, follow: false },
};

// 現行の「主なページ」7件（ラベル・並びは現行どおり）。見本：docs/redesign/src/pages/notfound.mjs
const LINKS: { icon: FrameIconKey; href: string; label: string }[] = [
  { icon: 'home', href: '/', label: 'トップページ' },
  { icon: 'course', href: '/courses', label: 'コース別データ一覧' },
  { icon: 'jockey', href: '/jockeys', label: '騎手データ一覧' },
  { icon: 'sire', href: '/sires', label: '種牡馬（血統）データ一覧' },
  { icon: 'trainer', href: '/trainers', label: '調教師データ一覧' },
  { icon: 'col', href: '/articles', label: 'データ分析コラム' },
  { icon: 'ai', href: '/ai', label: '競馬AI 勝率予測' },
];

export default function NotFound() {
  return (
    <main className={cx('root')}>
      <RailAiOff />
      <RailAdOff />
      <div className={cx('st st-solo')} id="st-top">
        <header className={cx('st-h')}>
          <StaticCrumb crumbs={[{ label: 'ページが見つかりません' }]} />
          <p className={cx('nf-code num')} aria-hidden="true">
            404
          </p>
          <h1>ページが見つかりません</h1>
          <P className="st-lead">お探しのページは削除されたか、URLが変更された可能性があります。データページは対象の騎手・調教師・種牡馬・コースが集計対象外になると公開を終了することがあります。</P>
        </header>
        <section className={cx('st-pn nf')}>
          <h2>主なページ</h2>
          <ul className={cx('nf-g')}>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link prefetch={false} href={l.href}>
                  <FrameIcon icon={FRAME_ICONS[l.icon]} className={cx('ic')} />
                  <span>{l.label}</span>
                  <ChevR />
                </Link>
              </li>
            ))}
          </ul>
          <P className="nf-note">
            リンク切れを見つけた場合は<In href="/contact">お問い合わせ</In>からお知らせいただけると助かります。
          </P>
        </section>
      </div>
    </main>
  );
}

