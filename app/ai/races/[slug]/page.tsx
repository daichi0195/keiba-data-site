import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from '@/components/HardLink';
import PredictionGate from '../../_components/PredictionGate';
import { dateOf, dateY, fetchPrediction, fetchPredictionIndex, shortDate, VENUE_ORDER } from '@/components/v6/ai/data';
import Mark, { MARK_DESC, MARK_KEYS, normalizeMark } from '@/components/v6/ai/Mark';
import { ChevR, Crumb, Foot, Grade, RaceCard, Sf } from '@/components/v6/ai/Parts';
import RaceSwitch from '@/components/v6/ai/RaceSwitch';
import Reveal from '@/components/v6/ai/Reveal';
import s from '@/components/v6/ai/ai.module.css';

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

  // 前の予測・次の予測：index.json の並びの前後
  const currentIdx = index.findIndex((r) => r.slug === slug);
  const prevRace = currentIdx > 0 ? index[currentIdx - 1] : null;
  const nextRace = currentIdx >= 0 && currentIdx < index.length - 1 ? index[currentIdx + 1] : null;

  // 同じ日のレース（競馬場の切替と、同じ競馬場のレース番号）
  const sameDay = index.filter((r) => r.date === data.date);
  const dayVenues = VENUE_ORDER.filter((v) => sameDay.some((r) => r.venueLabel === v));
  const sameVenue = sameDay.filter((r) => r.venueLabel === data.venueLabel).sort((a, b) => a.raceNumber - b.raceNumber);
  // 競馬場の切替先：同じレース番号があればそれ、無ければいちばん近い番号
  const jump = (v: string) =>
    sameDay
      .filter((r) => r.venueLabel === v)
      .sort((a, b) => Math.abs(a.raceNumber - data.raceNumber) - Math.abs(b.raceNumber - data.raceNumber))[0];

  const P = data.predictions ?? [];
  const rates = P.map((h) => h.winRate);
  const max = rates.length ? Math.max(...rates) : 0;
  const min = rates.length ? Math.min(...rates) : 0;
  const pageTitle = `${data.dateLabel} ${data.venueLabel}${data.raceNumber}R ${data.raceName}`;

  return (
    <div className={s.root}>
      <Crumb items={[{ label: '競馬AI 勝率予測', href: '/ai' }, { label: '予測一覧', href: '/ai/races' }, { label: pageTitle }]} />
      <div className={`${s['p-top']} ${s['p-race']}`}>
        <span className={`${s['ac-v']} ${s['p-race-v']}`} aria-hidden="true">
          {data.venueLabel}
          <b className={s.num}>{data.raceNumber}</b>R
        </span>
        <h1 className={s['p-h1']}>
          <span className={s.vh}>{`${data.dateLabel} ${data.venueLabel}${data.raceNumber}R `}</span>
          <Grade raceName={data.raceName} />
          <span>{data.raceName}</span>
          <span className={s.vh}> AI勝率予測</span>
        </h1>
        <p className={s['p-race-m']}>
          <Sf surface={data.surface} sm />
          <span className={s.num}>{data.distance}m</span>
          <span>
            <b className={s.num}>{P.length}</b>頭
          </span>
          <span className={s['p-race-d']}>
            <span className={s.l}>{dateY(data.date)}</span>
            <span className={s.s}>{shortDate(data.date)}</span>
          </span>
        </p>
      </div>

      <div className={s['p-rgw']}>
        <div className={s['p-rg']}>
          {sameDay.length > 0 && (
            <RaceSwitch
              label={`${dateOf(data.date)}のレース`}
              venues={dayVenues.map((v) => {
                const t = jump(v);
                return { slug: t.slug, label: v, aria: `${v}${t.raceNumber}R ${t.raceName}`, on: v === data.venueLabel };
              })}
              races={sameVenue.map((r) => ({
                slug: r.slug,
                label: (
                  <>
                    <b className={s.num}>{r.raceNumber}</b>R
                  </>
                ),
                aria: `${r.venueLabel}${r.raceNumber}R ${r.raceName}`,
                on: r.slug === slug,
              }))}
            />
          )}

          <section className={`${s['p-pn']} ${s['p-pred']}`} aria-label="AI勝率予測">
            <div className={s['p-pred-h']}>
              <h2>AI勝率予測</h2>
              <small>予測勝率の高い順・全{P.length}頭</small>
            </div>
            {/* 表は PredictionGate（オファーウォール・広告ブロッカー検知）で隠す。隠している間も表の高さは保つ */}
            <PredictionGate>
              <Reveal as="table" className={s['p-tb']}>
                <thead>
                  <tr>
                    <th scope="col" className={s['c-n']}>順位</th>
                    <th scope="col" className={s['c-h']}>馬名</th>
                    <th scope="col" className={s['c-m']}>印</th>
                    <th scope="col" className={s['c-p']}>予測勝率</th>
                    <th scope="col" className={s['c-b']}>
                      <span className={s.vh}>予測勝率の棒</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {P.map((h, k) => {
                    const m = normalizeMark(h.mark);
                    const w = max > 0 ? (h.winRate / max) * 100 : 0;
                    const op = 0.55 + (0.45 * (h.winRate - min)) / (max - min || 1);
                    return (
                      <tr key={h.rank} style={{ '--i': k } as React.CSSProperties}>
                        <td className={s['c-n']}>
                          <span className={`${s['rk-n']} ${s.num}${h.rank <= 3 ? ` ${s.t3} ${s[`m${h.rank}`]}` : ''}`}>{h.rank}</span>
                        </td>
                        <th scope="row" className={s['c-h']}>{h.name}</th>
                        <td className={s['c-m']}>{m && <Mark mark={m} />}</td>
                        <td className={s['c-p']}>
                          <b className={s.num} data-to={h.winRate} data-dp="1">
                            {h.winRate.toFixed(1)}
                          </b>
                          %
                        </td>
                        <td className={s['c-b']}>
                          <span className={s['p-bar']}>
                            <i style={{ width: `${w.toFixed(1)}%`, opacity: Number(op.toFixed(2)) }} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Reveal>
            </PredictionGate>
          </section>

          <div className={`${s['p-pn']} ${s['p-lg']}`}>
            <h2>印の見方</h2>
            <ul className={s['p-lg-l']}>
              {MARK_KEYS.map((k) => (
                <li key={k}>
                  <Mark mark={k} />
                  <p>
                    {MARK_DESC[k][0]}
                    <span className={s.x}>{MARK_DESC[k][1]}</span>
                  </p>
                </li>
              ))}
            </ul>
            <ul className={s['p-notes']}>
              <li>予測は対象レースの約5分前に公開しています。</li>
              <li>予測は参考情報であり、的中や回収率を保証するものではありません。</li>
              <li>
                予測の仕組みと印の意味は<Link prefetch={false} href="/ai#marks">AI勝率予測のページ</Link>をご覧ください。
              </li>
            </ul>
          </div>

          {(prevRace || nextRace) && (
            <nav className={s['p-nav']} aria-label="前後の予測">
              {prevRace ? (
                <RaceCard race={prevRace} cls={s.prev} label={<><ChevR />前の予測</>} />
              ) : (
                <span aria-hidden="true" />
              )}
              {nextRace ? (
                <RaceCard race={nextRace} cls={s.next} label={<>次の予測<ChevR /></>} />
              ) : (
                <span aria-hidden="true" />
              )}
            </nav>
          )}
        </div>
      </div>

      <Foot back={[{ label: '予測一覧へ', href: '/ai/races' }, { label: 'AI勝率予測トップへ', href: '/ai' }]} />
    </div>
  );
}
