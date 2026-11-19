import Link from 'next/link';
import Image from 'next/image';
import RailAd from './RailAd';
import WeekVenues from './WeekVenues';
import { getCoursesByRacecourse } from '@/lib/courses';
import { MainNav, MenuButton, TabBar, MENU_ID } from './FrameNav';
import s from './SiteFrame.module.css';

/** 競馬場の並び（北から南）と、コースデータ一覧の各競馬場の節へのリンク */
const VENUES = getCoursesByRacecourse().map((g) => ({
  id: g.racecourse,
  name: g.racecourse_ja.replace('競馬場', ''),
}));
const venueHref = (id: string) => `/courses#rc-${id}`;

const FOOTER_LINKS = [
  { href: '/about', label: 'サイト情報・運営者情報' },
  { href: '/about/data', label: 'データの出典と集計方法' },
  { href: '/disclaimer', label: '免責事項' },
  { href: '/privacy', label: 'プライバシーポリシー' },
  { href: '/contact', label: 'お問い合わせ' },
];

export type WeekVenue = { id: string; name: string };

/**
 * 全ページ共通の枠（リデザイン v6。見本 docs/redesign/src/lib.mjs の page()）。
 * - ヘッダー：メニューボタンとロゴだけ（緑、スマホ52px・PC56px）
 * - PC（1100px以上）：左にメニュー240px。幅1800px以上で右に「AI勝率予測の案内＋広告」の列300px
 * - スマホ・タブレット：下部メニュー、メニューボタンで左メニューを引き出す
 * 右列の AI 案内は、ページ側に <RailAiOff /> を置くと出なくなる（見本の railAi: false）。
 */
export default function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className={s.hdr}>
        <div className={s.hdrL}>
          <MenuButton />
          <Link href="/" className={s.logo}>
            <Image src="/logo.png" alt="" width={30} height={30} priority />
            競馬データ.com
          </Link>
        </div>
      </header>

      <div className={s.shell}>
        <aside id={MENU_ID} className={s.side} aria-label="メニュー">
          <MainNav />
          <WeekVenues />
          <h2>競馬場</h2>
          <nav className={`${s.nav} ${s.navCols}`} aria-label="競馬場">
            {VENUES.map((v) => (
              <Link key={v.id} href={venueHref(v.id)}>
                <span>{v.name}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className={s.main}>
          <div className={s.cols}>
            <div className={s.body}>{children}</div>
            <aside className={s.rail} aria-label="お知らせと広告">
              <div className={s.railIn}>
                <div className={s.railAi}>
                  <p className={s.railK}>AI勝率予測</p>
                  <h2>出走馬ごとの勝率をAIで予測</h2>
                  <p className={s.railP}>独自のモデルで出走馬の勝率を算出し、対象レースの約5分前に無料で公開しています。</p>
                  <Link className={s.cta} href="/ai">
                    予測を見る
                  </Link>
                </div>
                <RailAd />
              </div>
            </aside>
          </div>

          <footer className={s.ftr}>
            <p className={s.fLogo}>競馬データ.com</p>
            <nav aria-label="サイト情報">
              {FOOTER_LINKS.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <p className={s.fNote}>馬券の購入は20歳になってから。掲載しているデータは参考情報であり、的中を保証するものではありません。</p>
            <p className={s.fNote}>© {new Date().getFullYear()} 競馬データ.com</p>
          </footer>
        </div>
      </div>

      <TabBar />
    </>
  );
}
