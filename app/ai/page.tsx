import { Metadata } from 'next';
import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import AIXBanner from '@/components/AIXBanner';
import styles from './page.module.css';
import pageStyles from '@/app/static-page.module.css';

export const metadata: Metadata = {
  title: '競馬AI 勝率予測 | 競馬データ.com',
  description:
    '過去の中央競馬レースデータを機械学習で分析し、各馬の勝率を予測するAIです。予測勝率とオッズから期待値を算出し、市場が過小評価・過大評価している馬を見抜きます。',
  openGraph: {
    title: '競馬AI 勝率予測 | 競馬データ.com',
    description:
      '過去の中央競馬レースデータを機械学習で分析し、各馬の勝率を予測するAIです。',
    type: 'website',
  },
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

function getToday(): string {
  const now = new Date();
  now.setHours(now.getHours() + 9); // JST
  return now.toISOString().slice(0, 10);
}

export default async function AIPage() {
  const allRaces = await fetchPredictionIndex();
  const today = getToday();
  const todayRaces = allRaces.filter((r) => r.date === today);
  const pastRaces = allRaces.filter((r) => r.date !== today).slice(0, 10);
  return (
    <StaticPageLayout pageName="競馬AI 勝率予測" noLeftSidebar>
      <div className={pageStyles.staticPageCard}>
        <div className={pageStyles.staticPageHeader}>
          <h1 className={pageStyles.staticPageTitle}>競馬AI 勝率予測</h1>
        </div>

        {/* 今日の予測 */}
        <section className={styles.section}>
          <h2 id="today">今日の予測</h2>
          {todayRaces.length > 0 ? (
            <div className={styles.raceGrid}>
              {todayRaces.map((race) => (
                <Link
                  key={race.slug}
                  href={`/ai/races/${race.slug}`}
                  className={styles.raceCard}
                >
                  <div className={styles.raceDate}>{race.dateLabel}</div>
                  <div className={styles.raceName}>{race.raceName}</div>
                  <div className={styles.raceMetaRow}>
                    <span className={styles.raceVenueChip}>{race.venueLabel}{race.raceNumber}R</span>
                    <span className={styles.raceMeta}>{race.surface}{race.distance}m</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.subNote}>予測対象レースの約10分前に公開予定です。</p>
          )}
        </section>

        {/* 過去の予測 */}
        <section className={styles.section}>
          <h2 id="past">過去の予測</h2>
          {pastRaces.length > 0 ? (
            <>
              <div className={styles.raceGrid}>
                {pastRaces.map((race) => (
                  <Link
                    key={race.slug}
                    href={`/ai/races/${race.slug}`}
                    className={styles.raceCard}
                  >
                    <div className={styles.raceDate}>{race.dateLabel}</div>
                    <div className={styles.raceName}>{race.raceName}</div>
                    <div className={styles.raceMetaRow}>
                      <span className={styles.raceVenueChip}>{race.venueLabel}{race.raceNumber}R</span>
                      <span className={styles.raceMeta}>{race.surface}{race.distance}m</span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/ai/races" className={styles.moreButton}>
                予測一覧をみる
              </Link>
            </>
          ) : (
            <p className={styles.subNote}>まだ過去の予測データがありません。</p>
          )}
        </section>

        {/* このAIについて */}
        <section className={styles.section}>
          <h2 id="about">このAIについて</h2>
          <p>
            過去の中央競馬レースデータを機械学習で分析し、各馬の勝率を予測するAIです。<br />
            予測勝率とオッズから期待値を算出し、市場が過小評価・過大評価している馬を見抜きます。
          </p>
          <p>
            未勝利・新馬・障害レースは対象外です。（鋭意開発中）
          </p>
          <p>
            対象レースの約10分前に予測を公開する予定です。
          </p>
          <AIXBanner />
        </section>

        {/* 予測モデルについて */}
        <section className={styles.section}>
          <h2 id="model">予測モデルについて</h2>
          <p>
            過去成績・レーティング・騎手/調教師/血統スタッツ・コース適性・馬場適性など、<strong>100以上の要素</strong>から学習し予測しています。
          </p>
          <p>
            オッズは学習させていません。
          </p>
        </section>

        {/* 印について */}
        <section className={styles.section}>
          <h2 id="marks">印について</h2>
          <div className={styles.markTable}>
            <div className={styles.markHeader}>
              <span className={styles.markIcon} style={{ background: '#16a34a' }} />
              <span className={styles.markHeaderText}>本命（勝率が高く、かつオッズ妙味のある馬）</span>
            </div>
            <div className={styles.markBody}>
              予測勝率が高く、オッズとの乖離から期待値が高いと判定された馬です。単勝候補として推奨します。<br />
              テスト期間では回収率130%超を達成しています。
            </div>

            <div className={styles.markHeader}>
              <span className={styles.markIcon} style={{ background: '#0ea5e9' }} />
              <span className={styles.markHeaderText}>紐（過小評価されている穴馬）</span>
            </div>
            <div className={styles.markBody}>
              人気はないものの、予測勝率に対してオッズが高く、市場に過小評価されていると判定された馬です。<br />
              ワイドや3連系馬券の相手候補として推奨します。
            </div>

            <div className={styles.markHeader}>
              <span className={styles.markIcon} style={{ background: '#dc2626' }} />
              <span className={styles.markHeaderText}>危険（人気しているが、予測勝率が低い馬）</span>
            </div>
            <div className={`${styles.markBody} ${styles.markBodyLast}`}>
              人気を集めているものの、予測勝率が低く過大評価されていると判定された馬です。<br />
              テスト期間では単勝回収率60%を下回っており、長期的に購入するとマイナスになる可能性が高いです。
            </div>
          </div>
        </section>

        {/* バックテストの成績 */}
        <section className={styles.section}>
          <h2 id="backtest">バックテストの成績</h2>
          <p>
            バックテスト（学習に使用していない期間のテスト）の結果は下記です。
          </p>
          <table className={styles.backtestTable}>
            <thead>
              <tr>
                <th>印</th>
                <th>的中率</th>
                <th>回収率</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className={styles.backtestLabel}><span className={styles.markIcon} style={{ background: '#16a34a' }} />本命</span></td>
                <td>16.7%</td>
                <td className={styles.backtestPositive}>136.4%</td>
                <td><a href="https://docs.google.com/spreadsheets/d/1dZJW2Der108fv6kxTl84GsMD2xU8CKr_joNlvdWU4A0/edit?hl=ja&gid=0#gid=0" target="_blank" rel="noopener noreferrer" className={styles.backtestLink}>過去の結果をみる</a></td>
              </tr>
              <tr>
                <td><span className={styles.backtestLabel}><span className={styles.markIcon} style={{ background: '#dc2626' }} />危険</span></td>
                <td>18.2%</td>
                <td className={styles.backtestNegative}>57.3%</td>
                <td><a href="https://docs.google.com/spreadsheets/d/1dZJW2Der108fv6kxTl84GsMD2xU8CKr_joNlvdWU4A0/edit?hl=ja&gid=1187675975#gid=1187675975" target="_blank" rel="noopener noreferrer" className={styles.backtestLink}>過去の結果をみる</a></td>
              </tr>
            </tbody>
          </table>
        </section>

      </div>
    </StaticPageLayout>
  );
}
