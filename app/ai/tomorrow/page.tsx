import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import AIXBanner from '@/components/AIXBanner';
import s from '@/components/course/course.module.css';
import a from '../_components/ai.module.css';

export const metadata: Metadata = {
  title: '前日予測一覧 | 競馬AI 勝率予測 | 競馬データ.com',
  description: '競馬AI勝率予測の前日予測一覧です。翌日のレースをレース前日17時頃に公開しています。',
};

interface RaceSummary {
  slug: string;
  date: string;
  dateLabel: string;
  venueLabel: string;
  raceNumber: number;
  raceName: string;
  surface: string;
  distance: number;
}

async function fetchPrevPredictionIndex(): Promise<RaceSummary[]> {
  const url = `https://storage.googleapis.com/umadata/predictions_prev/index.json?t=${Date.now()}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function TomorrowPredictionPage() {
  // 一時非表示: 前日予測ページ
  notFound();

  const races = (await fetchPrevPredictionIndex()).reverse();

  return (
    <StaticPageLayout
      pageName="前日予測一覧"
      title="前日予測一覧"
      noLeftSidebar
      noToc
      bookmarkOnly
      breadcrumbs={[
        { label: '競馬AI 勝率予測', href: '/ai' },
        { label: '前日予測一覧' },
      ]}
    >
      <section className={s.section} aria-label="前日予測一覧">
        {races.length === 0 ? (
          <div className={`${s.card} ${a.empty}`}>
            <p>本日はまだ前日予測が公開されていません。</p>
          </div>
        ) : (
          <div className={s.card}>
            <div className={`${s.tbl} ${a.tblWrap}`}>
              <table>
                <thead>
                  <tr>
                    <th className={s.key}>日付</th>
                    <th className={a.left}>レース名</th>
                  </tr>
                </thead>
                <tbody>
                  {races.map((race) => (
                    <tr key={race.slug}>
                      <td className={`${s.key} ${a.dateCell}`}>{race.dateLabel}</td>
                      <td className={a.left}>
                        <Link href={`/ai/tomorrow/${race.slug}`} className={a.tblLink}>
                          {race.venueLabel}{race.raceNumber}R {race.raceName}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <div className={a.foot}>
        <AIXBanner />
        <p className={a.back}>
          <Link href="/ai">← AI勝率予測トップへ</Link>
        </p>
      </div>
    </StaticPageLayout>
  );
}
