import { Metadata } from 'next';
import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import AIXBanner from '@/components/AIXBanner';
import styles from './page.module.css';
import pageStyles from '@/app/static-page.module.css';

export const metadata: Metadata = {
  title: '過去の予測一覧 | 競馬AI 勝率予測 | 競馬データ.com',
  description: '競馬AI勝率予測の過去の予測結果一覧です。',
  robots: { index: false, follow: false },
};

const PER_PAGE = 20;

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

async function fetchPredictionIndex(): Promise<RaceSummary[]> {
  const url = `https://storage.googleapis.com/umadata/predictions/index.json?t=${Date.now()}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function PredictionListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const races = await fetchPredictionIndex();
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);
  const totalPages = Math.max(1, Math.ceil(races.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageRaces = races.slice(start, start + PER_PAGE);

  return (
    <StaticPageLayout
      pageName="過去の予測一覧"
      noLeftSidebar
      noToc
      bookmarkOnly
      breadcrumbs={[
        { label: '競馬AI 勝率予測', href: '/ai' },
        { label: '過去の予測一覧' },
      ]}
    >
      <div className={pageStyles.staticPageCard}>
        <div className={pageStyles.staticPageHeader}>
          <h1 className={pageStyles.staticPageTitle}>過去の予測一覧</h1>
        </div>

        {races.length === 0 ? (
          <p className={styles.empty}>まだ予測データがありません。</p>
        ) : (
          <>
            <table className={styles.raceTable}>
              <thead>
                <tr>
                  <th className={styles.thDate}>日付</th>
                  <th className={styles.thName}>レース名</th>
                </tr>
              </thead>
              <tbody>
                {pageRaces.map((race) => (
                  <tr key={race.slug}>
                    <td className={styles.tdDate}>{race.dateLabel}</td>
                    <td className={styles.tdName}>
                      <Link href={`/ai/races/${race.slug}`} className={styles.raceLink}>
                        {race.venueLabel}{race.raceNumber}R {race.raceName}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <nav className={styles.pagination}>
                {safePage > 1 ? (
                  <Link
                    href={safePage === 2 ? '/ai/races' : `/ai/races?page=${safePage - 1}`}
                    className={styles.pageLink}
                  >
                    前へ
                  </Link>
                ) : (
                  <span className={styles.pageLinkDisabled}>前へ</span>
                )}

                {generatePageNumbers(safePage, totalPages).map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>…</span>
                  ) : (
                    <Link
                      key={p}
                      href={p === 1 ? '/ai/races' : `/ai/races?page=${p}`}
                      className={p === safePage ? styles.pageLinkActive : styles.pageLink}
                    >
                      {p}
                    </Link>
                  )
                )}

                {safePage < totalPages ? (
                  <Link href={`/ai/races?page=${safePage + 1}`} className={styles.pageLink}>
                    次へ
                  </Link>
                ) : (
                  <span className={styles.pageLinkDisabled}>次へ</span>
                )}
              </nav>
            )}
          </>
        )}

        <AIXBanner />

        <div className={styles.backLink}>
          <Link href="/ai">← AI勝率予測トップへ</Link>
        </div>
      </div>
    </StaticPageLayout>
  );
}

function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}
