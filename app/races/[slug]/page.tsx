import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AdSlot from '@/components/AdSlot';
import Link from '@/components/HardLink';
import { FRAME_ICONS, FrameIcon } from '@/components/layout/icons';
import { ALL_JOCKEYS } from '@/lib/jockeys';
import { ALL_SIRES } from '@/lib/sires';
import { ALL_TRAINERS } from '@/lib/trainers';
import { RACES, getRaceData, getRaceDef, type RaceStat, type RaceRunner, type RaceEdition, type StatKey } from '@/lib/races';
import { buildConditions, buildRaceFaq, buildRaceSummary, courseLabel, periodLabel, rec, winners } from '@/lib/raceText';
import { formatRaceTime } from '@/lib/courseOverview';
import { getDataUpdatedAt, formatJaDate, toIsoDate, buildWebPageJsonLd } from '@/lib/dataDate';
import s from '@/components/v6/course/course.module.css';
import r from '@/components/v6/race/race.module.css';
import CourseChips from '@/components/v6/course/CourseChips';
import { CourseMotion } from '@/components/v6/course/motion';
import { Cond, Faq, Head, ListTable, Ranking, RichText, type CondRow, type RankRow } from '@/components/v6/course/parts';

export const revalidate = 604800;
export const dynamicParams = false;

export async function generateStaticParams() {
  return RACES.map((x) => ({ slug: x.slug }));
}

type Props = { params: Promise<{ slug: string }> };

const SURF: Record<string, string> = { turf: '芝', dirt: 'ダート' };
const BASE = 'https://www.keibadata.com';
const MIN = 10; // 10回分のデータなので「出走10以上」を判定の下限にする

function jaDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const w = '日月火水木金土'[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}年${m}月${d}日（${w}）`;
}

function titleOf(name: string, from: number, to: number) {
  return `${name} 過去10年のデータと傾向｜人気・枠順・前走・血統【${from}〜${to}年】`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = getRaceData(slug);
  const def = getRaceDef(slug);
  if (!d || !def) return {};
  const sum = buildRaceSummary(d);
  const title = titleOf(d.name, d.period.from, d.period.to);
  const description = sum.lead.replace(/\*\*/g, '').slice(0, 120);
  const url = `${BASE}/races/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    // 公開前のテストページは検索結果に出さない
    robots: def.test ? { index: false, follow: false } : undefined,
    openGraph: { title, description, url, siteName: '競馬データ.com', locale: 'ja_JP', type: 'website' },
    twitter: { card: 'summary', title, description },
  };
}

function link<T extends { id: number; name: string }>(list: T[], base: string, name?: string | null) {
  if (!name) return undefined;
  const x = list.find((e) => e.name === name);
  return x ? `${base}/${x.id}` : undefined;
}

const condRows = (rows: RaceStat[], keep = false): CondRow[] => rows.map((x) => ({ ...x, label: x.label ?? '', keep }) as unknown as CondRow);

function Results({ e }: { e: RaceEdition }) {
  const cols: { label: string; num?: boolean }[] = [
    { label: '着順・馬名' }, { label: '人気', num: true }, { label: '馬番', num: true }, { label: '性齢' }, { label: '騎手' },
    { label: 'タイム', num: true }, { label: '通過' }, { label: '上がり', num: true }, { label: '前走' },
  ];
  const time = (x: RaceRunner) => (x.fin === 1 ? formatRaceTime(x.time) ?? '—' : x.diff !== null ? `+${x.diff.toFixed(1)}` : '—');
  return (
    <div className={`${s.lt} ${r.tb}`}>
      <div className={s['lt-w']} role="region" aria-label={`${e.year}年の結果`} tabIndex={0}>
        <table>
          <thead>
            <tr>{cols.map((c) => <th key={c.label} scope="col" className={c.num ? s.r : undefined}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {e.results.map((x) => (
              <tr key={`${x.num}-${x.horse}`}>
                <td className={s.k}><span className={r.fin}>{x.fin < 99 ? x.fin : '中止'}</span>{x.horse}</td>
                <td className={s.r}>{x.pop ? `${x.pop}番人気` : '—'}</td>
                <td data-l="馬番" className={s.r}>{x.num ?? '—'}</td>
                <td data-l="性齢">{x.sex}{x.age}{x.affil === '外国' ? '・外国' : x.affil === '地方' ? '・地方' : ''}</td>
                <td data-l="騎手">{x.jockey ?? '—'}</td>
                <td data-l="タイム" className={s.r}>{time(x)}</td>
                <td data-l="通過">{x.corners.length ? x.corners.join('-') : '—'}</td>
                <td data-l="上がり" className={s.r}>{l3Text(x.last3f, x.last3f_rank)}</td>
                <td data-l="前走">{prevText(x)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 前走：レース名・着順・上がり順位（「天皇賞(秋) 1着・上がり1位」） */
const prevText = (x: RaceRunner) =>
  x.prev ? `${x.prev.name ?? x.prev.kind}${x.prev.finish ? ` ${x.prev.finish}着` : ''}${x.prev.last3f_rank ? `・上がり${x.prev.last3f_rank}位` : ''}` : '—';

/** 上がり3F：「33.2（1位）」 */
const l3Text = (t: number | null, rank: number | null) => (t ? `${t.toFixed(1)}${rank ? `（${rank}位）` : ''}` : '—');

export default async function RacePage({ params }: Props) {
  const { slug } = await params;
  const d = getRaceData(slug);
  const def = getRaceDef(slug);
  if (!d || !def) notFound();

  const S = d.stats;
  const NAME = d.name;
  const sum = buildRaceSummary(d);
  const conds = buildConditions(d, MIN);
  const faq = buildRaceFaq(d, sum);
  const ws = winners(d);
  const excluded = d.editions.filter((e) => !e.included);
  const updatedAt = getDataUpdatedAt() ?? new Date();
  const surf = SURF[d.surface] ?? '';
  const url = `${BASE}/races/${slug}`;

  const withLink = (rows: RaceStat[], list: { id: number; name: string }[], base: string): RankRow[] =>
    rows.map((x) => ({ ...x, name: x.name ?? '', link: link(list, base, x.name) }) as unknown as RankRow);
  const jockeys = withLink(S.jockey, ALL_JOCKEYS, '/jockeys');
  const trainers = withLink(S.trainer, ALL_TRAINERS, '/trainers');
  const sires = withLink(S.sire, ALL_SIRES, '/sires');
  const damsires = withLink(S.damsire, ALL_SIRES, '/sires');

  const condSections: { id: string; chip: string; title: string; sub?: string; key: StatKey; label: string; gate?: boolean }[] = [
    { id: 'popularity', chip: '人気', title: '人気別データ', key: 'popularity', label: '人気' },
    { id: 'frame', chip: '枠順', title: '枠順別データ', key: 'frame', label: '枠番', gate: true },
    { id: 'number', chip: '馬番', title: '馬番別データ', key: 'number', label: '馬番' },
    { id: 'style', chip: '脚質', title: '脚質別データ', sub: '逃げ＝1〜3コーナーで先頭、先行＝最終コーナー1/3以内、差し＝2/3以内、追込＝それより後ろ', key: 'style', label: '脚質' },
    { id: 'last3f', chip: '上がり', title: '上がり順位別データ', sub: 'このレースでの上がり3F（最後の600m）のタイム順', key: 'last3f', label: '上がり' },
    { id: 'age', chip: '年齢', title: '年齢別データ', key: 'age', label: '年齢' },
    { id: 'sex', chip: '性別', title: '性別データ', key: 'sex', label: '性別' },
    { id: 'affil', chip: '所属', title: '所属別データ', sub: '美浦（関東）・栗東（関西）・地方・外国', key: 'affil', label: '所属' },
    { id: 'prev-class', chip: '前走の格', title: '前走クラス別データ', sub: '前走は中央・地方・海外のうち直近の1走', key: 'prev_class', label: '前走' },
    { id: 'prev-finish', chip: '前走着順', title: '前走着順別データ', key: 'prev_finish', label: '前走着順' },
    { id: 'prev-pop', chip: '前走人気', title: '前走人気別データ', sub: '前走が中央のレースの馬', key: 'prev_pop', label: '前走人気' },
    { id: 'prev-last3f', chip: '前走上がり', title: '前走の上がり順位別データ', sub: '前走での上がり3Fのタイム順。前走が中央のレースの馬', key: 'prev_last3f', label: '前走上がり' },
    { id: 'interval', chip: '間隔', title: 'レース間隔別データ', key: 'interval', label: '間隔' },
    { id: 'jockey-change', chip: '乗り替わり', title: '継続騎乗・乗り替わり別データ', sub: '前走が中央のレースの馬', key: 'jockey_change', label: '騎乗' },
    { id: 'body-weight', chip: '馬体重', title: '馬体重別データ', sub: '馬体重（kg）別', key: 'body_weight', label: '馬体重' },
  ];

  const chips = [
    { id: 'points', label: '傾向' },
    { id: 'winners', label: '勝ち馬' },
    { id: 'conditions', label: '消去法' },
    ...condSections.flatMap((c) => (c.id === 'prev-class' ? [{ id: c.id, label: c.chip }, { id: 'prev-race', label: '前走レース' }] : [{ id: c.id, label: c.chip }])),
    { id: 'jockey', label: '騎手' },
    { id: 'sire', label: '種牡馬' },
    { id: 'damsire', label: '母父' },
    { id: 'trainer', label: '調教師' },
    { id: 'payout', label: '配当' },
    { id: 'results', label: '年度別' },
    { id: 'faq', label: 'Q&A' },
  ];

  const stripBold = (t: string) => t.replace(/\*\*([^*]+)\*\*/g, '$1');
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: stripBold(a) } })),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: BASE },
      { '@type': 'ListItem', position: 2, name: `${NAME} 過去10年データ`, item: url },
    ],
  };
  const webPageJsonLd = buildWebPageJsonLd({
    url,
    name: `${NAME} 過去10年のデータと傾向`,
    description: `${NAME}（${courseLabel(d)}）の${periodLabel(d)}の結果から、人気・枠順・脚質・年齢・前走・血統・騎手別の成績を集計したデータページ`,
    dateModified: toIsoDate(updatedAt),
  });

  const pay = (e: RaceEdition, k: keyof RaceEdition['payouts']) => {
    const ps = e.payouts[k];
    if (!ps.length) return '—';
    return ps.map((p) => `${p.yen.toLocaleString('ja-JP')}円`).join(' / ');
  };
  const ad = (unit: 'dataTop' | 'dataMid' | 'dataBottom') => (
    <div className={s.ad}>
      <AdSlot unit={unit} />
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div key={slug} className={s.pg} data-course-page="">
        <CourseMotion />
        <CourseChips items={chips} />

        {/* 冒頭：AI による概要に載る1〜2文 */}
        <div className={s.hero}>
          <nav className={s.crumb} aria-label="パンくず">
            <Link prefetch={false} href="/">HOME</Link>
            <span aria-hidden="true">/</span>
            <span>{NAME}</span>
          </nav>
          <div className={s['hero-t']}>
            {d.grade && <i className={`${s.gr} ${s[d.grade.toLowerCase()] ?? s.gx}`}>{d.grade}</i>}
            <span className={`${s.sf} ${s[d.surface]}`}>{surf}</span>
            <span className={s['hero-v']}>{d.venue}競馬場・{d.distance}m{d.weight_type ? `・${d.weight_type}` : ''}</span>
          </div>
          <h1>{NAME} 過去10年のデータと傾向</h1>
          <p className={r.lead}><RichText text={sum.lead} /></p>
          <dl className={s['hero-m']}>
            <div><dt>集計</dt><dd>{d.period.from}〜{d.period.to}年の{d.period.count}回（{courseLabel(d)}の回のみ）</dd></div>
            <div><dt>出走</dt><dd>{d.total_runners}頭</dd></div>
            {d.next_date && <div><dt>次回</dt><dd>{jaDate(d.next_date)}</dd></div>}
            <div><dt>更新</dt><dd><time dateTime={toIsoDate(updatedAt)}>{formatJaDate(updatedAt)}</time></dd></div>
          </dl>
        </div>

        {/* 傾向のポイント */}
        <section id="points" className={`${s.sc} ${s.first}`} aria-label="傾向のポイント">
          <Head title={`${NAME}の傾向のポイント`} sub={`${periodLabel(d)}のデータから`} />
          <div className={s.cp}>
            <ol className={r.pt}>
              {sum.points.map((p) => (
                <li key={p.key}>
                  <h3>{p.title}</h3>
                  <p><RichText text={p.text} /></p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 過去10年の勝ち馬 */}
        <section id="winners" className={s.sc} aria-label="過去10年の勝ち馬">
          <Head title={`${NAME} 過去10年の勝ち馬`} sub="新しい順" />
          <ListTable
            label={`${NAME}の過去10年の勝ち馬`}
            cols={[{ label: '年・勝ち馬', key: true }, { label: '人気', num: true }, { label: '性齢' }, { label: '騎手' }, { label: 'タイム', num: true }, { label: '上がり', num: true }, { label: '前走' }]}
            rows={[...ws.map(({ e, w }) => ({ e, w })), ...excluded.map((e) => ({ e, w: e.results.find((x) => x.fin === 1) ?? e.results[0] }))]
              .sort((a, b) => b.e.year - a.e.year)
              .map(({ e, w }) => [
                <><span className={r.y}>{e.year}</span>{w.horse}{!e.included && <span className={r.ex}>{e.venue}{surf}{e.distance}m・対象外</span>}</>,
                w.pop ? `${w.pop}番人気` : '—',
                `${w.sex}${w.age}${w.affil === '外国' ? '・外国' : ''}`,
                w.jockey ?? '—',
                `${formatRaceTime(w.time) ?? '—'}${e.going && e.going !== '良' ? `（${e.going}）` : ''}`,
                l3Text(w.last3f, w.last3f_rank),
                prevText(w),
              ])}
            note={excluded.length
              ? `${courseLabel(d)}以外で行われた年（代替開催など）は「対象外」とし、ページ内の集計には含めていません`
              : `${d.period.count}回とも${courseLabel(d)}で行われています。良馬場以外の年はタイムに馬場を表示`}
          />
        </section>

        {ad('dataTop')}

        {/* 消去法・好走データ */}
        <section id="conditions" className={s.sc} aria-label="消去法・好走データ">
          <Head title={`${NAME}の消去法データ・好走データ`} sub={`出走${MIN}頭以上の条件のうち、3着以内がない条件と複勝率が高い条件`} />
          <ListTable
            label={`${NAME}の消去法データ・好走データ`}
            cols={[{ label: '条件', key: true }, { label: '成績', num: true }, { label: '複勝率', num: true }, { label: '複勝回収率', num: true, ml: '複回' }]}
            rows={[...conds.good.map((x) => ['好走', x] as const), ...conds.zero.map((x) => ['消し', x] as const)].map(([k, x]) => [
              <><i className={`${s['lt-tg']} ${k === '消し' ? s.x : ''}`}>{k}</i>{x.label}</>,
              rec(x),
              `${x.place_rate.toFixed(1)}%`,
              `${x.place_payback.toFixed(0)}%`,
            ])}
            note="条件：人気・枠・馬番・脚質・年齢・性別・所属・前走（格・レース・着順・人気・上がり順位）・間隔・乗り替わり・馬体重。脚質は結果の通過順から分類するため、予想では過去の走りから見込みを立てて使ってください"
          />
        </section>

        {/* 条件別 */}
        {condSections.map((c) => (
          <div key={c.id}>
            <section id={c.id} className={s.sc} aria-label={c.title}>
              <Head title={`${NAME} ${c.title}`} sub={c.sub} />
              <Cond rows={condRows(S[c.key], c.key === 'body_weight')} keyLabel={c.label} min={MIN} />
            </section>
            {c.id === 'prev-class' && (
              <>
                {/* 前走レース（名前が長いので棒グラフではなく表） */}
                <section id="prev-race" className={s.sc} aria-label="前走レース別データ">
                  <Head title={`${NAME} 前走レース別データ（ステップレース）`} sub="出走5頭以上の前走レース・勝利数順。残りは「その他」" />
                  <ListTable
                    label={`${NAME}の前走レース別データ`}
                    cols={[{ label: '前走レース', key: true }, { label: '成績', num: true }, { label: '勝率', num: true }, { label: '複勝率', num: true }, { label: '単勝回収率', num: true, ml: '単回' }, { label: '複勝回収率', num: true, ml: '複回' }]}
                    rows={S.prev_race.map((x) => [
                      x.label ?? '', rec(x), `${x.win_rate.toFixed(1)}%`, `${x.place_rate.toFixed(1)}%`, `${x.win_payback.toFixed(0)}%`, `${x.place_payback.toFixed(0)}%`,
                    ])}
                  />
                </section>
              </>
            )}
            {c.id === 'affil' && ad('dataMid')}
          </div>
        ))}

        {/* 騎手・血統・調教師 */}
        <section id="jockey" className={s.sc} aria-label="騎手別データ">
          <Head title={`${NAME}で好成績の騎手`} sub="騎手別データ・勝利数順" />
          <Ranking rows={jockeys} nameLabel="騎手" note={`${periodLabel(d)}に3着以内に入った騎手（最大30人）`} />
        </section>
        <section id="sire" className={s.sc} aria-label="種牡馬別データ">
          <Head title={`${NAME}で好成績の血統（種牡馬）`} sub="種牡馬別データ・勝利数順" />
          <Ranking rows={sires} nameLabel="種牡馬" note={`${periodLabel(d)}に3着以内に入った馬の父（最大30頭）`} />
        </section>
        <section id="damsire" className={s.sc} aria-label="母父別データ">
          <Head title={`${NAME}で好成績の血統（母父）`} sub="母父別データ・勝利数順" />
          <Ranking rows={damsires} nameLabel="母父" note={`${periodLabel(d)}に3着以内に入った馬の母の父（最大30頭）`} />
        </section>
        <section id="trainer" className={s.sc} aria-label="調教師別データ">
          <Head title={`${NAME}で好成績の調教師`} sub="調教師別データ・勝利数順" />
          <Ranking rows={trainers} nameLabel="調教師" note={`${periodLabel(d)}に3着以内に入った調教師（最大30人）`} />
        </section>

        {/* 配当 */}
        <section id="payout" className={s.sc} aria-label="過去10年の配当">
          <Head title={`${NAME} 過去10年の配当`} sub="100円あたりの払戻" />
          <ListTable
            label={`${NAME}の過去10年の配当`}
            cols={[{ label: '年', key: true }, { label: '単勝', num: true }, { label: '馬連', num: true }, { label: '3連複', num: true }, { label: '3連単', num: true }]}
            rows={d.editions.filter((e) => e.included).map((e) => [
              `${e.year}`, pay(e, 'win'), pay(e, 'quinella'), pay(e, 'trio'),
              e.payouts.trifecta.map((p) => `${p.yen.toLocaleString('ja-JP')}円${p.pop ? `（${p.pop}番人気）` : ''}`).join(' / ') || '—',
            ])}
            note={`3連単の中央値は${sum.tri.median.toLocaleString('ja-JP')}円、10万円を超えたのは${sum.tri.over100k}回。同着の年は払戻を「/」で並べています`}
          />
        </section>

        {ad('dataBottom')}

        {/* 年度別の結果 */}
        <section id="results" className={s.sc} aria-label="年度別の結果">
          <Head title={`${NAME} 年度別の結果`} sub="年を押すと全出走馬の着順・通過順・上がり（順位）・前走を表示" />
          <div className={`${s.cp} ${r.yr}`}>
            {d.editions.map((e, i) => {
              const w = e.results.find((x) => x.fin === 1) ?? e.results[0];
              return (
                <details key={e.race_id} open={i === 0}>
                  <summary>
                    <span className={r.y}>{e.year}</span>
                    <span className={r.w}>{w.horse}<small>{w.jockey}・{w.pop}番人気</small></span>
                    <span className={r.m}>{!e.included && `${e.venue}${surf}${e.distance}m・対象外・`}{e.going ?? '—'}・{e.runners}頭</span>
                    <FrameIcon icon={FRAME_ICONS.chevronDown} className={r.ic} />
                  </summary>
                  <Results e={e} />
                  <p className={r.pay}>
                    <span><b>単勝</b>{pay(e, 'win')}</span>
                    <span><b>複勝</b>{pay(e, 'place')}</span>
                    <span><b>馬連</b>{pay(e, 'quinella')}</span>
                    <span><b>ワイド</b>{pay(e, 'wide')}</span>
                    <span><b>馬単</b>{pay(e, 'exacta')}</span>
                    <span><b>3連複</b>{pay(e, 'trio')}</span>
                    <span><b>3連単</b>{pay(e, 'trifecta')}</span>
                  </p>
                </details>
              );
            })}
          </div>
        </section>

        {/* コースページへ */}
        {d.course && (
          <section className={s.sc} aria-label="コースデータ">
            <Head title={`${courseLabel(d)}のコースデータ`} sub="このレース以外も含めた直近3年間の傾向" />
            <div className={`${s.cp} ${r.go}`}>
              <Link prefetch={false} href={d.course}>
                <span>
                  <b>{courseLabel(d)}の傾向と特徴</b>
                  <small>枠順・脚質・血統・騎手・平均タイム</small>
                </span>
                <FrameIcon icon={FRAME_ICONS.chevronRight} className={r.ic} />
              </Link>
            </div>
          </section>
        )}

        {/* Q&A */}
        <section id="faq" className={s.sc} aria-label="データQ&A">
          <Head title="データQ&A" />
          <Faq items={faq.map(({ q, a }) => ({ question: q, answer: a }))} />
        </section>

        <aside className={`${s.cp} ${s.src}`} aria-label="データの出典と集計方法">
          <h2>このデータについて</h2>
          <p>
            中央競馬（JRA）の公式データをもとに当サイトのデータベースで集計しています（{d.period.from}〜{d.period.to}年の{NAME}のうち、{courseLabel(d)}で行われた{d.period.count}回・出走{d.total_runners}頭）。
            回収率は100円ずつ買った場合の払戻の割合です。前走は中央・地方・海外のうち直近の1走です。
            指標の定義は<Link prefetch={false} href="/about/data">データの出典と集計方法</Link>をご覧ください。
          </p>
        </aside>
      </div>
    </>
  );
}
