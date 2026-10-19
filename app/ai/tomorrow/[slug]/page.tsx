import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import AIXBanner from '@/components/AIXBanner';
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
  // 一時非表示: 前日予測ページ
  notFound();

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
      title={pageTitle}
      noLeftSidebar
      noToc
      bookmarkOnly
      breadcrumbs={[
        { label: '競馬AI 勝率予測', href: '/ai' },
        { label: '前日予測一覧', href: '/ai/tomorrow' },
        { label: pageTitle },
      ]}
    >
      <div className={s.badges}>
        <span className={`${s.badge} ${a.badgeSub}`}>前日予測</span>
      </div>

      <section className={s.section} aria-label="AI勝率予測（前日）">
        <div className={`${s.card} ${a.tblCard}`}>
          {data.trackCondition && (
            <p className={a.trackInfo}>
              予測馬場状態: <strong>{data.trackCondition}</strong>
            </p>
          )}
          <div className={`${s.tbl} ${a.tblWrap} ${a.rankRows}`}>
            <table>
              <thead>
                <tr>
                  <th className={`${s.key} ${a.center}`}>順位</th>
                  <th>予測勝率</th>
                  <th className={`${a.left} ${a.nameCol}`}>馬名</th>
                </tr>
              </thead>
              <tbody>
                {data.predictions.map((horse) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={a.notes}>
            <div className={a.noteItem}>前日予測のため印（本命・紐・危険）はつきません。印はレース当日の予測をご確認ください。</div>
            <div className={a.noteItem}>馬体重・増減など前日時点で未確定の情報は直近値を使用しているため、若干の誤差が生じる場合があります。</div>
            <div className={a.noteItem}>出走取消・除外・変更が生じる場合があります。</div>
          </div>
        </div>
      </section>

      <div className={a.foot}>
        <AIXBanner />
        <p className={a.back}>
          <Link href="/ai/tomorrow">← 前日予測一覧へ</Link>
        </p>
      </div>

      <RaceNav basePath="/ai/tomorrow" prevRace={prevRace} nextRace={nextRace} />
    </StaticPageLayout>
  );
}
