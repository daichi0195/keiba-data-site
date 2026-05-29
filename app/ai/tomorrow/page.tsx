import { Metadata } from 'next';
import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import AIXBanner from '@/components/AIXBanner';
import styles from './page.module.css';
import pageStyles from '@/app/static-page.module.css';

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
  const races = (await fetchPrevPredictionIndex()).reverse();

  return (
    <StaticPageLayout
      pageName="前日予測一覧"
      noLeftSidebar
      noToc
      bookmarkOnly
      breadcrumbs={[
        { label: '競馬AI 勝率予測', href: '/ai' },
        { label: '前日予測一覧' },
      ]}
    >
      <div className={pageStyles.staticPageCard}>
        <div className={pageStyles.staticPageHeader}>
          <h1 className={pageStyles.staticPageTitle}>前日予測一覧</h1>
        </div>

        {races.length === 0 ? (
          <p className={styles.empty}>本日はまだ前日予測が公開されていません。</p>
        ) : (
          <table className={styles.raceTable}>
            <thead>
              <tr>
                <th className={styles.thDate}>日付</th>
                <th className={styles.thName}>レース名</th>
              </tr>
            </thead>
            <tbody>
              {races.map((race) => (
                <tr key={race.slug}>
                  <td className={styles.tdDate}>{race.dateLabel}</td>
                  <td className={styles.tdName}>
                    <Link href={`/ai/tomorrow/${race.slug}`} className={styles.raceLink}>
                      {race.venueLabel}{race.raceNumber}R {race.raceName}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className={styles.bannerWrap}>
          <AIXBanner />
        </div>

        <div className={styles.backLink}>
          <Link href="/ai">← AI勝率予測トップへ</Link>
        </div>
      </div>
    </StaticPageLayout>
  );
}
