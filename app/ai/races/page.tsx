import { Metadata } from 'next';
import Link from 'next/link';
import { fetchPredictionIndex, VENUE_ORDER } from '@/components/v6/ai/data';
import { Crumb, Foot } from '@/components/v6/ai/Parts';
import RaceList from '@/components/v6/ai/RaceList';
import s from '@/components/v6/ai/ai.module.css';

export const metadata: Metadata = {
  title: '予測一覧 | 競馬AI 勝率予測 | 競馬データ.com',
  description: '競馬データ.comの競馬AIが公開した直近のレース別勝率予測の一覧です。',
  robots: { index: false, follow: true },
};

const PER_PAGE = 20;
// 一覧に表示する期間（日数）
const RECENT_DAYS = 14;

export default async function PredictionListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // 直近RECENT_DAYS日分の予測のみ一覧表示（古い予測ページへの大量リンクを避ける）
  const allRaces = await fetchPredictionIndex();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const races = allRaces.filter((r) => !r.date || r.date >= cutoffStr);
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);

  return (
    <div className={s.root}>
      <Crumb items={[{ label: '競馬AI 勝率予測', href: '/ai' }, { label: '予測一覧' }]} />
      <div className={s['p-top']}>
        <h1 className={s['p-h1']}>予測一覧</h1>
        <p className={s['p-lead']}>
          直近{RECENT_DAYS}日間に公開した予測を掲載しています。予測は対象レースの約5分前に公開しています。予測の仕組みと印の意味は
          <Link href="/ai#marks">AI勝率予測のページ</Link>
          をご覧ください。
        </p>
      </div>

      <RaceList
        races={races}
        venueOrder={VENUE_ORDER}
        perPage={PER_PAGE}
        initialPage={currentPage}
        emptyText={`直近${RECENT_DAYS}日間の予測データはありません。`}
      />

      <Foot back={[{ label: 'AI勝率予測トップへ', href: '/ai' }]} />
    </div>
  );
}
