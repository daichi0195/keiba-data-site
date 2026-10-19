import { Metadata } from 'next';
import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import AIXBanner from '@/components/AIXBanner';
import CourseSectionNav from '@/components/course/CourseSectionNav';
import Mark from './_components/Mark';
import s from '@/components/course/course.module.css';
import a from './_components/ai.module.css';

export const metadata: Metadata = {
  title: '競馬予想AI｜無料で勝率予測を公開中！ | 競馬データ.com',
  description:
    '過去の中央競馬レースデータを機械学習で分析し、各馬の勝率を予測するAIです。予測勝率とオッズから期待値を算出し、市場が過小評価・過大評価している馬を見抜きます。',
  openGraph: {
    title: '競馬予想AI｜無料で勝率予測を公開中！ | 競馬データ.com',
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

function shortenSurface(surface: string): string {
  if (surface === 'ダート') return 'ダ';
  return surface;
}

const SECTIONS = [
  { id: 'latest', label: '最新のレース予測' },
  { id: 'about', label: 'このAIについて' },
  { id: 'model', label: '予測モデルについて' },
  { id: 'marks', label: '印について' },
  { id: 'backtest', label: 'バックテストの成績' },
];

const sectionTitle = (id: string) => SECTIONS.find((x) => x.id === id)!.label;

export default async function AIPage() {
  const allRaces = await fetchPredictionIndex();
  // index.json の並び順に依存せず、開催日の新しい順に並べる（同日内はデータの順）
  const latestRaces = [...allRaces].sort((x, y) => y.date.localeCompare(x.date)).slice(0, 10);
  return (
    <StaticPageLayout pageName="競馬AI 勝率予測" title="競馬AI 勝率予測" noLeftSidebar>
      {/* スマホ：ヘッダー直下に固定するページ内ナビ（PCは右の目次） */}
      <CourseSectionNav items={SECTIONS} />

      {/* 最新のレース予測 */}
      <section className={s.section}>
        <div className={s.sh}>
          <h2 id="latest" className={`${s.h2} ${a.h2Anchor}`}>{sectionTitle('latest')}</h2>
        </div>
        {latestRaces.length > 0 ? (
          <>
            <div className={a.raceRail}>
              {latestRaces.map((race) => {
                const surfaceClass =
                  race.surface === '芝' ? s.badgeTurf : race.surface === 'ダート' || race.surface === 'ダ' ? s.badgeDirt : a.badgeSub;
                return (
                  <Link key={race.slug} href={`/ai/races/${race.slug}`} className={a.raceCard}>
                    <span className={a.raceDate}>{race.dateLabel}</span>
                    <span className={a.raceName}>{race.raceName}</span>
                    <span className={a.raceMeta}>
                      <span className={`${s.badge} ${a.badgeSub}`}>
                        {race.venueLabel}
                        {race.raceNumber}R
                      </span>
                      <span className={`${s.badge} ${surfaceClass}`}>
                        {shortenSurface(race.surface)}
                        {race.distance}m
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <Link href="/ai/races" className={a.moreBtn}>
              予測一覧をみる
            </Link>
          </>
        ) : (
          <div className={`${s.card} ${a.empty}`}>
            <p>予測対象レースの約10分前に公開予定です。</p>
          </div>
        )}
      </section>

      {/* このAIについて */}
      <section className={s.section}>
        <div className={s.sh}>
          <h2 id="about" className={`${s.h2} ${a.h2Anchor}`}>{sectionTitle('about')}</h2>
        </div>
        <div className={`${s.card} ${a.prose}`}>
          <p>
            過去の中央競馬レースデータを機械学習で分析し、各馬の勝率を予測するAIです。<br />
            予測勝率とオッズから期待値を算出し、市場が過小評価・過大評価している馬を見抜きます。
          </p>
          <p>
            未勝利・新馬レース、障害レースは対象外です。
          </p>
          <p>
            予測は<strong>レース約10分前</strong>に公開しています。
          </p>
        </div>
        <AIXBanner />
      </section>

      {/* 予測モデルについて */}
      <section className={s.section}>
        <div className={s.sh}>
          <h2 id="model" className={`${s.h2} ${a.h2Anchor}`}>{sectionTitle('model')}</h2>
        </div>
        <div className={`${s.card} ${a.prose}`}>
          <p>
            過去成績・レーティング・騎手/調教師/血統スタッツ・コース適性・馬場適性など、<strong>100以上の要素</strong>から学習し予測しています。
          </p>
          <p>
            オッズは学習させていません。
          </p>
        </div>
      </section>

      {/* 印について */}
      <section className={s.section}>
        <div className={s.sh}>
          <h2 id="marks" className={`${s.h2} ${a.h2Anchor}`}>{sectionTitle('marks')}</h2>
        </div>
        <div className={`${s.card} ${a.markList}`}>
          <div className={a.markItem}>
            <div><Mark mark="honmei" /></div>
            <p>
              予測勝率が高く、オッズとの乖離から期待値が高いと判定された馬です。単勝候補として推奨します。<br />
              バックテスト期間では単勝回収率130%超でした（過去の検証結果であり、将来の成績を保証するものではありません）。
            </p>
          </div>
          <div className={a.markItem}>
            <div><Mark mark="himo" /></div>
            <p>
              人気はないものの、予測勝率に対してオッズが高く、市場に過小評価されていると判定された馬です。<br />
              ワイドや3連系馬券の相手候補として推奨します。
            </p>
          </div>
          <div className={a.markItem}>
            <div><Mark mark="kiken" /></div>
            <p>
              人気を集めているものの、予測勝率が低く過大評価されていると判定された馬です。<br />
              テスト期間では単勝回収率60%を下回っており、長期的に購入するとマイナスになる可能性が高いです。
            </p>
          </div>
        </div>
      </section>

      {/* バックテストの成績 */}
      <section className={s.section}>
        <div className={s.sh}>
          <h2 id="backtest" className={`${s.h2} ${a.h2Anchor}`}>{sectionTitle('backtest')}</h2>
        </div>
        <div className={`${s.card} ${a.tblCard}`}>
          <p className={s.note}>
            バックテスト（学習に使用していない期間のテスト）の結果は下記です。
            過去データに対する検証結果であり、将来の的中率や回収率を保証するものではありません。馬券の購入はご自身の判断と責任で行ってください。
          </p>
          <div className={`${s.tbl} ${a.tblWrap}`}>
            <table>
              <thead>
                <tr>
                  <th className={s.key}>印</th>
                  <th>的中率</th>
                  <th>回収率</th>
                  <th className={a.left}><span className={s.srOnly}>過去の結果</span></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={s.key}><Mark mark="honmei" /></td>
                  <td>16.7%</td>
                  <td className={a.strong}>136.4%</td>
                  <td className={a.left}><a href="https://docs.google.com/spreadsheets/d/1dZJW2Der108fv6kxTl84GsMD2xU8CKr_joNlvdWU4A0/edit?hl=ja&gid=0#gid=0" target="_blank" rel="noopener noreferrer" className={a.tblLink}>過去の結果をみる</a></td>
                </tr>
                <tr>
                  <td className={s.key}><Mark mark="kiken" /></td>
                  <td>18.2%</td>
                  <td>57.3%</td>
                  <td className={a.left}><a href="https://docs.google.com/spreadsheets/d/1dZJW2Der108fv6kxTl84GsMD2xU8CKr_joNlvdWU4A0/edit?hl=ja&gid=1187675975#gid=1187675975" target="_blank" rel="noopener noreferrer" className={a.tblLink}>過去の結果をみる</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
