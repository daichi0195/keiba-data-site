import type { Metadata } from 'next';
import Link from 'next/link';
import StaticPageLayout, { StaticSection, staticLink } from '@/components/StaticPageLayout';

export const metadata: Metadata = {
  title: 'ページが見つかりません | 競馬データ.com',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <StaticPageLayout
      pageName="ページが見つかりません"
      title="ページが見つかりません"
      lead={
        <>
          お探しのページは削除されたか、URLが変更された可能性があります。
          データページは対象の騎手・調教師・種牡馬・コースが集計対象外になると公開を終了することがあります。
        </>
      }
      noToc
      noLeftSidebar
    >
      <StaticSection title="主なページ">
        <ul>
          <li><Link href="/" className={staticLink}>トップページ</Link></li>
          <li><Link href="/courses" className={staticLink}>コース別データ一覧</Link></li>
          <li><Link href="/jockeys" className={staticLink}>騎手データ一覧</Link></li>
          <li><Link href="/sires" className={staticLink}>種牡馬（血統）データ一覧</Link></li>
          <li><Link href="/trainers" className={staticLink}>調教師データ一覧</Link></li>
          <li><Link href="/articles" className={staticLink}>データ分析コラム</Link></li>
          <li><Link href="/ai" className={staticLink}>競馬AI 勝率予測</Link></li>
        </ul>
        <p>
          リンク切れを見つけた場合は
          <Link href="/contact" className={staticLink}>お問い合わせ</Link>
          からお知らせいただけると助かります。
        </p>
      </StaticSection>
    </StaticPageLayout>
  );
}
