import { Metadata } from 'next';
import Link from 'next/link';
import { fetchPredictionIndex, monthLabel } from '@/components/v6/ai/data';
import Mark, { MARK_DESC, MARK_KEYS } from '@/components/v6/ai/Mark';
import { Crumb, RaceCard, XBanner } from '@/components/v6/ai/Parts';
import Reveal from '@/components/v6/ai/Reveal';
import SectionChips from '@/components/v6/ai/SectionChips';
import s from '@/components/v6/ai/ai.module.css';

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

const SECTIONS = [
  { id: 'latest', label: '最新のレース予測' },
  { id: 'about', label: 'このAIについて' },
  { id: 'model', label: '予測モデルについて' },
  { id: 'marks', label: '印について' },
];

/** 印の位置関係の図（横軸＝人気、縦軸＝AIの予測勝率）。数値の目盛りは置かない（印の定義文の位置関係だけを描く） */
function MarkChart() {
  return (
    <Reveal
      as="svg"
      className={s['p-mc']}
      viewBox="0 0 400 300"
      role="img"
      aria-label="印の位置関係の図。横軸は人気、縦軸はAIの予測勝率。本命は予測勝率が高く人気より評価が高い位置、紐は人気がなく人気より評価が高い位置、危険は人気を集めていて予測勝率が低い位置。"
    >
      <path className={s['p-mc-up']} d="M46 16H392V258Z" />
      <path className={s['p-mc-ax']} d="M46 16V258H392" />
      <path className={s['p-mc-dg']} d="M46 16L392 258" />
      <text className={s['p-mc-t']} x="384" y="38" textAnchor="end">市場が過小評価</text>
      <text className={s['p-mc-t']} x="56" y="248">市場が過大評価</text>
      <text className={`${s['p-mc-t']} ${s.d}`} x="300" y="212" transform="rotate(35 300 212)" textAnchor="middle">人気どおりの評価</text>
      <g className={`${s['p-mc-m']} ${s.honmei}`} style={{ '--i': 0 } as React.CSSProperties}>
        <rect x="134" y="50" width="124" height="46" rx="23" />
        <text x="196" y="80" textAnchor="middle">◎ 本命</text>
      </g>
      <g className={`${s['p-mc-m']} ${s.himo}`} style={{ '--i': 1 } as React.CSSProperties}>
        <rect x="272" y="104" width="104" height="46" rx="23" />
        <text x="324" y="134" textAnchor="middle">△ 紐</text>
      </g>
      <g className={`${s['p-mc-m']} ${s.kiken}`} style={{ '--i': 2 } as React.CSSProperties}>
        <rect x="64" y="166" width="124" height="46" rx="23" />
        <text x="126" y="196" textAnchor="middle">× 危険</text>
      </g>
      <text className={s['p-mc-a']} x="46" y="280">人気が高い</text>
      <text className={s['p-mc-a']} x="392" y="280" textAnchor="end">人気が低い</text>
      <text className={`${s['p-mc-a']} ${s.b}`} x="219" y="298" textAnchor="middle">人気（オッズ）</text>
      <text className={s['p-mc-a']} x="36" y="18" textAnchor="end" transform="rotate(-90 36 18)">高い</text>
      <text className={s['p-mc-a']} x="36" y="258" transform="rotate(-90 36 258)">低い</text>
      <text className={`${s['p-mc-a']} ${s.b}`} x="16" y="137" textAnchor="middle" transform="rotate(-90 16 137)">AIの予測勝率</text>
    </Reveal>
  );
}

export default async function AIPage() {
  const allRaces = await fetchPredictionIndex();
  // index.json の並び順に依存せず、開催日の新しい順に並べる（同日内はデータの順）
  const latestRaces = [...allRaces].sort((x, y) => y.date.localeCompare(x.date)).slice(0, 10);
  // 公開した予測の数と、最初の予測の月
  const first = allRaces.reduce((m, e) => (e.date && e.date < m ? e.date : m), '9999');

  return (
    <div className={s.root}>
      <SectionChips items={SECTIONS} />
      <Crumb items={[{ label: '競馬AI 勝率予測' }]} />
      <div className={s['p-top']}>
        <h1 className={s['p-h1']}>競馬AI 勝率予測</h1>
        <p className={s['p-lead']}>過去の中央競馬レースデータを機械学習で分析し、各馬の勝率を予測するAIです。</p>
      </div>
      <div className={`${s['p-w']} ${s['p-facts-w']}`}>
        <Reveal as="dl" className={`${s['p-pn']} ${s['p-facts']}`}>
          {allRaces.length > 0 && (
            <div>
              <dt>
                公開した予測<small>{monthLabel(first)}〜</small>
              </dt>
              <dd>
                <b className={s.num} data-to={allRaces.length}>
                  {allRaces.length.toLocaleString('ja-JP')}
                </b>
                レース
              </dd>
            </div>
          )}
          <div>
            <dt>学習に使う要素</dt>
            <dd>
              <b className={s.num}>100</b>以上
            </dd>
          </div>
          <div className={s.t}>
            <dt>公開</dt>
            <dd>
              レース約5分前に<wbr />無料で公開
            </dd>
          </div>
        </Reveal>
      </div>

      <section className={s.sc} id="latest">
        <div className={s.hd}>
          <h2>最新のレース予測</h2>
          <Link className={s.pill} href="/ai/races">
            予測一覧をみる
          </Link>
        </div>
        {latestRaces.length > 0 ? (
          <Reveal className={s.ai}>
            {latestRaces.map((race, i) => (
              <RaceCard key={race.slug} race={race} index={i} />
            ))}
          </Reveal>
        ) : (
          <div className={s['p-w']}>
            <p className={`${s['p-pn']} ${s['p-empty']}`}>予測対象レースの約5分前に公開予定です。</p>
          </div>
        )}
      </section>

      <div className={`${s['p-w']} ${s['p-duo-w']}`}>
        <div className={`${s['p-pn']} ${s['p-duo']}`}>
          <section id="about">
            <h2>このAIについて</h2>
            <div className={s['p-prose']}>
              <p>
                過去の中央競馬レースデータを機械学習で分析し、各馬の勝率を予測するAIです。
                <br />
                予測勝率とオッズから期待値を算出し、市場が過小評価・過大評価している馬を見抜きます。
              </p>
              <p>新馬レース・障害レースは対象外です。</p>
              <p>
                予測は<strong>レース約5分前</strong>に公開しています。
              </p>
            </div>
          </section>
          <section id="model">
            <h2>予測モデルについて</h2>
            <div className={s['p-prose']}>
              <p>
                過去成績・レーティング・騎手/調教師/血統スタッツ・コース適性・馬場適性など、<strong>100以上の要素</strong>から学習し予測しています。
              </p>
              <p>オッズは学習させていません。</p>
            </div>
          </section>
        </div>
        <XBanner />
      </div>

      <section className={s.sc} id="marks">
        <div className={s.hd}>
          <h2>印について</h2>
        </div>
        <div className={s['p-w']}>
          <div className={`${s['p-pn']} ${s['p-marks']}`}>
            <figure className={s['p-marks-f']}>
              <MarkChart />
              <figcaption>
                <b>印は予測勝率の順位ではなく、人気との差で付きます</b>印の位置関係（目盛りのない概念図）
              </figcaption>
            </figure>
            <div className={s['p-marks-l']}>
              {MARK_KEYS.map((k) => (
                <div key={k} className={s['p-marks-r']}>
                  <div>
                    <Mark mark={k} />
                  </div>
                  <p>
                    {MARK_DESC[k][0]}
                    <br />
                    {MARK_DESC[k][1]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
