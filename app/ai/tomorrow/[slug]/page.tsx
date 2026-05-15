import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import AIXBanner from '@/components/AIXBanner';
import styles from './page.module.css';
import pageStyles from '@/app/static-page.module.css';

interface RaceIndexEntry {
  slug: string;
  venueLabel: string;
  raceNumber: number;
  raceName: string;
}

interface HorsePrediction {
  rank: number;
  winRate: number;
  name: string;
  mark?: 'honmei' | 'himo' | 'kiken';
}

interface RacePrediction {
  slug: string;
  date: string;
  dateLabel: string;
  venue: string;
  venueLabel: string;
  raceNumber: number;
  raceName: string;
  surface: string;
  distance: number;
  trackCondition?: string;
  predictions: HorsePrediction[];
}

async function fetchPrevPrediction(slug: string): Promise<RacePrediction | null> {
  const url = `https://storage.googleapis.com/umadata/predictions_prev/${slug}.json?t=${Date.now()}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchPrevPredictionIndex(): Promise<RaceIndexEntry[]> {
  const url = `https://storage.googleapis.com/umadata/predictions_prev/index.json?t=${Date.now()}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchPrevPrediction(slug);
  if (!data) {
    return { title: '前日予測が見つかりません | 競馬データ.com' };
  }
  const title = `【前日予測】${data.dateLabel} ${data.venueLabel}${data.raceNumber}R ${data.raceName} AI勝率予測`;
  return {
    title: `${title} | 競馬データ.com`,
    description: `${data.raceName}（${data.venueLabel}${data.raceNumber}R）の前日AI勝率予測。レース前日に公開しています。`,
    openGraph: {
      title: `${title} | 競馬データ.com`,
      description: `${data.raceName}（${data.venueLabel}${data.raceNumber}R）の前日AI勝率予測。`,
      type: 'website',
    },
  };
}

export default async function TomorrowRacePredictionPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const [data, index] = await Promise.all([
    fetchPrevPrediction(slug),
    fetchPrevPredictionIndex(),
  ]);

  if (!data) {
    notFound();
  }

  const currentIdx = index.findIndex((r) => r.slug === slug);
  const prevRace = currentIdx > 0 ? index[currentIdx - 1] : null;
  const nextRace = currentIdx >= 0 && currentIdx < index.length - 1 ? index[currentIdx + 1] : null;

  const pageTitle = `${data.dateLabel} ${data.venueLabel}${data.raceNumber}R ${data.raceName}`;

  return (
    <StaticPageLayout
      pageName="AI勝率予測（前日）"
      noLeftSidebar
      noToc
      bookmarkOnly
      breadcrumbs={[
        { label: '競馬AI 勝率予測', href: '/ai' },
        { label: '前日予測一覧', href: '/ai/tomorrow' },
        { label: pageTitle },
      ]}
    >
      <div className={pageStyles.staticPageCard}>
        <div className={pageStyles.staticPageHeader}>
          <h1 className={pageStyles.staticPageTitle}>
            <span className={styles.prevBadge}>前日予測</span>
            {pageTitle}
          </h1>
        </div>

        <section className={styles.section}>
          {data.trackCondition && (
            <p className={styles.trackInfo}>
              予測馬場状態: <strong>{data.trackCondition}</strong>
            </p>
          )}
          <table className={styles.predictionTable}>
            <thead>
              <tr>
                <th className={styles.thRank}>順位</th>
                <th className={styles.thRate}>予測勝率</th>
                <th className={styles.thName}>馬名</th>
              </tr>
            </thead>
            <tbody>
              {data.predictions.map((horse) => (
                <tr key={horse.rank}>
                  <td className={styles.tdRank}>{horse.rank}</td>
                  <td className={styles.tdRate}>{horse.winRate}%</td>
                  <td className={styles.tdName}>{horse.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <ul className={styles.noteList}>
          <li>前日予測のため印（本命・紐・危険）はつきません。印はレース当日の予測をご確認ください。</li>
          <li>馬体重・増減など前日時点で未確定の情報は直近値を使用しているため、若干の誤差が生じる場合があります。</li>
          <li>出走取消・除外・変更が生じる場合があります。</li>
        </ul>

        <AIXBanner />

        <div className={styles.backLink}>
          <Link href="/ai/tomorrow">← 前日予測一覧へ</Link>
        </div>
      </div>

      {(prevRace || nextRace) && (
        <nav className={styles.raceNav}>
          <div className={styles.raceNavItem}>
            {prevRace && (
              <Link href={`/ai/tomorrow/${prevRace.slug}`} className={`${styles.raceNavLink} ${styles.raceNavPrev}`}>
                <span className={styles.raceNavLabel}>前の予測</span>
                <p className={styles.raceNavTitle}>
                  {prevRace.venueLabel}{prevRace.raceNumber}R {prevRace.raceName}
                </p>
              </Link>
            )}
          </div>
          <div className={styles.raceNavDivider} />
          <div className={styles.raceNavItem}>
            {nextRace && (
              <Link href={`/ai/tomorrow/${nextRace.slug}`} className={`${styles.raceNavLink} ${styles.raceNavNext}`}>
                <span className={styles.raceNavLabel}>次の予測</span>
                <p className={styles.raceNavTitle}>
                  {nextRace.venueLabel}{nextRace.raceNumber}R {nextRace.raceName}
                </p>
              </Link>
            )}
          </div>
        </nav>
      )}
    </StaticPageLayout>
  );
}
