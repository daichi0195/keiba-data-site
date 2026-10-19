import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import AIXBanner from '@/components/AIXBanner';
import Mark, { normalizeMark } from '../../_components/Mark';
import RaceNav from '../../_components/RaceNav';
import s from '@/components/course/course.module.css';
import a from '../../_components/ai.module.css';

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
  /** 'honmei' | 'himo' | 'kiken'（旧形式）または '【本命】' | '【紐】' | '【危険】'（現行形式） */
  mark?: string;
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
  predictions: HorsePrediction[];
}

async function fetchPrediction(slug: string): Promise<RacePrediction | null> {
  const url = `https://storage.googleapis.com/umadata/predictions/${slug}.json?t=${Date.now()}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchPrediction(slug);
  if (!data) {
    return { title: '予測が見つかりません | 競馬データ.com' };
  }
  const title = `${data.dateLabel} ${data.venueLabel}${data.raceNumber}R ${data.raceName} AI勝率予測`;
  return {
    title: `${title} | 競馬データ.com`,
    description: `${data.raceName}（${data.venueLabel}${data.raceNumber}R）のAI勝率予測。`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${title} | 競馬データ.com`,
      description: `${data.raceName}（${data.venueLabel}${data.raceNumber}R）のAI勝率予測。`,
      type: 'website',
    },
  };
}

async function fetchPredictionIndex(): Promise<RaceIndexEntry[]> {
  const url = `https://storage.googleapis.com/umadata/predictions/index.json?t=${Date.now()}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function RacePredictionPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const [data, index] = await Promise.all([
    fetchPrediction(slug),
    fetchPredictionIndex(),
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
      pageName="AI勝率予測"
      title={pageTitle}
      noLeftSidebar
      noToc
      bookmarkOnly
      breadcrumbs={[
        { label: '競馬AI 勝率予測', href: '/ai' },
        { label: '予測一覧', href: '/ai/races' },
        { label: pageTitle },
      ]}
    >
      <section className={s.section} aria-label="AI勝率予測">
        <div className={`${s.card} ${a.tblCard}`}>
          <div className={`${s.tbl} ${a.tblWrap} ${a.rankRows}`}>
            <table>
              <thead>
                <tr>
                  <th className={`${s.key} ${a.center}`}>順位</th>
                  <th>予測勝率</th>
                  <th className={`${a.left} ${a.nameCol}`}>馬名</th>
                  <th className={a.center}>印</th>
                </tr>
              </thead>
              <tbody>
                {data.predictions.map((horse) => {
                  const mark = normalizeMark(horse.mark);
                  return (
                    <tr key={horse.rank}>
                      <td className={`${s.key} ${a.center}`}>
                        {horse.rank <= 3 ? (
                          <span className={`${s.rkb} ${s[`rk${horse.rank}`]}`}>{horse.rank}</span>
                        ) : (
                          horse.rank
                        )}
                      </td>
                      <td className={a.strong}>{horse.winRate}%</td>
                      <td className={`${a.left} ${a.nameCell}`}>{horse.name}</td>
                      <td className={a.center}>{mark && <Mark mark={mark} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className={a.foot}>
        <AIXBanner />
        <p className={a.back}>
          <Link href="/ai">← AI勝率予測トップへ</Link>
        </p>
      </div>

      <RaceNav basePath="/ai/races" prevRace={prevRace} nextRace={nextRace} />
    </StaticPageLayout>
  );
}
