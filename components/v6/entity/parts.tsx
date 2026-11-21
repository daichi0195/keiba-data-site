// 騎手詳細・種牡馬詳細・調教師詳細の共通部品（見本 pages/jockey.mjs・pages/_entity-st.mjs の HTML と同じ形）。
// サーバーコンポーネント。開閉だけ Box（クライアント）、ページ全体の動きは EntityEffects（クライアント）。
import Link from '@/components/HardLink';
import type { CSSProperties, ReactNode } from 'react';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import AdSlot from '@/components/AdSlot';
import { FrameIcon } from '@/components/layout/icons';
import Box, { SyncGroup } from './Box';
import EntityEffects from './EntityEffects';
import Stats, { type StatsProps } from './Stats';
import { cx } from './cx';
import { MIN_BAR, bestOf, int, num, pct, R, slashDate, type Row, type Stat } from './format';

/* ---------- 小さな部品 ---------- */
export const ChevR = () => <FrameIcon icon={faChevronRight} className={cx('ic')} />;
export const ChevD = () => <FrameIcon icon={faChevronDown} className={cx('ic')} />;
const iv = (i: number) => ({ '--i': i }) as CSSProperties;

/** 語のまとまりで折り返す（語の途中で割らない） */
export const Nb = ({ children }: { children: ReactNode }) => <span className={cx('nb')}>{children}</span>;

/** 数え上げる数値 */
export const Cnt = ({ v, dp = 0 }: { v: number; dp?: number }) => (
  <span className={cx('num')} data-count={v} data-dp={dp}>
    {dp ? Number(v).toFixed(dp) : Number(v).toLocaleString('ja-JP')}
  </span>
);

export type SurfaceKey = 'turf' | 'dirt' | 'steeplechase';
const SF_LABEL: Record<SurfaceKey, string> = { turf: '芝', dirt: 'ダート', steeplechase: '障害' };
/** データの馬場表記（turf / dirt / obstacle / jump / 芝 / ダ / ダート / 障 / 障害）→ 札のクラス */
export const sfKey = (v: string): SurfaceKey =>
  v === 'turf' || v === '芝' ? 'turf' : v === 'dirt' || v === 'ダ' || v === 'ダート' ? 'dirt' : 'steeplechase';
export const SfTag = ({ sf }: { sf: SurfaceKey }) => <i className={cx('sf', 'sm', sf)}>{SF_LABEL[sf]}</i>;

/** 重賞の格付けの札（G1 / G2 / G3） */
export const GTag = ({ g }: { g?: string | null }) => (g ? <i className={cx('gr', String(g).toLowerCase())}>{g}</i> : null);

/** 枠番の札 */
const GATE = ['#FFFFFF', '#222222', '#C62927', '#2573CD', '#E4CA3C', '#58AF4A', '#FAA727', '#DC6179'];
export const GateTag = ({ n }: { n: number }) => (
  <>
    <span className={cx('jk-gate', 'num', n === 1 && 'w')} style={{ background: GATE[n - 1], color: [1, 5, 7].includes(n) ? '#222222' : '#FFFFFF' }}>
      {n}
    </span>
    <span className={cx('vh')}>枠</span>
  </>
);
/** 枠順別の8行（データがない枠は 0 で埋める） */
export const gateRows = (stats: { gate: number | string }[] | undefined): Row[] =>
  [1, 2, 3, 4, 5, 6, 7, 8].map((n) => R((stats ?? []).find((x) => Number(x.gate) === n) as Partial<Stat> | undefined, <GateTag n={n} />, `${n}枠`));

/** 詳細ページへのリンク（ページがなければ文字だけ） */
export const MaybeLink = ({ href, children }: { href?: string; children: ReactNode }) => (href ? <Link prefetch={false} href={href}>{children}</Link> : <>{children}</>);

/** 判定基準・用語の定義へのリンク（/about/data） */
const DEF_LABEL = { criteria: '判定の基準', 'running-style': '脚質の定義', distance: '距離の定義' } as const;
export const DefLink = ({ anchor }: { anchor: keyof typeof DEF_LABEL }) => <Link prefetch={false} href={`/about/data#${anchor}`}>{DEF_LABEL[anchor]}を見る</Link>;

/* ---------- ページの土台・節 ---------- */
/** ページの土台：共通の CSS 変数と、動き・表の横スクロールなどのクライアント処理 */
export function EntityRoot({ children }: { children: ReactNode }) {
  return (
    <div className={cx('root')}>
      {children}
      <EntityEffects />
    </div>
  );
}

/** 節の見出し（地の上） */
export const Head = ({ title, sub }: { title: ReactNode; sub?: ReactNode }) => (
  <div className={cx('hd')}>
    <h2>
      {title}
      {sub ? <small>{sub}</small> : null}
    </h2>
  </div>
);
/** 「〇〇 節名」（名前と節名を語のまとまりで折り返す） */
export const H = ({ w, title, sub }: { w: string; title: string; sub?: ReactNode }) => (
  <Head title={<><Nb>{w}</Nb> <Nb>{title}</Nb></>} sub={sub} />
);
/** 「〇〇の節名」 */
export const Hno = ({ w, title, sub }: { w: string; title: string; sub?: ReactNode }) => (
  <Head title={<><Nb>{w}の</Nb><Nb>{title}</Nb></>} sub={sub} />
);
/** 見出しの下の補足：従来の補足（jk-sb）と「出走30以上で…」（jk-nt） */
export const Subs = ({ sub, note }: { sub?: ReactNode; note?: ReactNode }) => (
  <>
    {sub ? <span className={cx('jk-sb')}>{sub}</span> : null}
    {note ? <span className={cx('jk-nt')}>{note}</span> : null}
  </>
);
/** 「出走30以上で複勝率が最も高いのは…」 */
export function BestNote({ rows }: { rows: Row[] }) {
  const b = bestOf(rows);
  if (!b) return <>出走数が少ないため、数値は参考程度にご覧ください</>;
  return (
    <>
      <Nb>出走{MIN_BAR}以上で</Nb>
      <Nb>複勝率が</Nb>
      <Nb>最も高いのは</Nb>
      <b className={cx('nb')}>
        {b.text}の<span className={cx('num')}>{pct(b.place_rate)}</span>
      </b>
    </>
  );
}

export const Sec = ({ id, head, children }: { id?: string; head?: ReactNode; children: ReactNode }) => (
  <section className={cx('sc')} id={id}>
    {head}
    {children}
  </section>
);
export const Pn = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={cx('jk-pn', className)}>{children}</div>
);

/** 広告（既存の AdSlot を見本の .ad の位置に置く） */
export const Ad = ({ unit }: { unit: 'dataTop' | 'dataMid' | 'dataBottom' }) => (
  <div className={cx('ad')}>
    <AdSlot unit={unit} />
  </div>
);

/** ページ内の移動（チップ） */
export const PageNav = ({ items, className = '' }: { items: { id: string; label: string }[]; className?: string }) => (
  <nav className={cx('chips', 'jk-nav', className)} aria-label="ページ内">
    <div>
      {items.map((it) => (
        <a key={it.id} href={`#${it.id}`}>
          {it.label}
        </a>
      ))}
    </div>
  </nav>
);

/* ---------- 冒頭：名前・主要な数字・傾向（5段階） ---------- */
const Seg = ({ v, big = false }: { v: number; big?: boolean }) => (
  <span className={cx('jk-seg', big && 'big')} aria-hidden="true">
    {[1, 2, 3, 4, 5].map((n) => (
      <i key={n} className={n === v ? cx('on') : undefined} />
    ))}
  </span>
);
export type Verdict = { label: ReactNode; pos: number; text: string };
export function Hero({
  crumb,
  name,
  h1,
  h1s,
  lead,
  kpi,
  races,
  period,
  updated,
  iso,
  verdictTitle,
  verdict,
  kpiTable = false,
}: {
  crumb: { label: string; href: string };
  name: string;
  h1: string;
  h1s: string;
  lead: ReactNode;
  kpi: [string, number, number, string][];
  races: number;
  period: string;
  updated: string;
  iso?: string;
  verdictTitle: string;
  /** 対象レース数が少ないページは null（傾向判定を出さない） */
  verdict: Verdict[] | null;
  /** 主要数値をカードではなく表で出す（種牡馬ページで試行中） */
  kpiTable?: boolean;
}) {
  return (
    <>
      <nav className={cx('jk-crumb')} aria-label="パンくず">
        <Link prefetch={false} href="/">HOME</Link>
        <span aria-hidden="true">/</span>
        <Link prefetch={false} href={crumb.href}>{crumb.label}</Link>
        <span aria-hidden="true">/</span>
        <span>{name}</span>
      </nav>
      <div className={cx('jk-pn', 'jk-hero')}>
        <div className={cx('jk-hl')}>
          <h1>
            <Nb>{h1}</Nb>
            <Nb>
              <small className={h1s.startsWith('（') ? cx('es-par') : undefined}>{h1s}</small>
            </Nb>
          </h1>
          <p className={cx('jk-lead')}>{lead}</p>
          {kpiTable ? (
            <table className={cx('jk-kt')}>
              <thead>
                <tr>
                  {kpi.map(([l]) => (
                    <th key={l} scope="col">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {kpi.map(([l, v, dp, u]) => (
                    <td key={l} className={cx('num')}>
                      {v.toLocaleString('ja-JP', { minimumFractionDigits: dp, maximumFractionDigits: dp })}
                      {u ? <small>{u}</small> : null}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          ) : (
            <ul className={cx('jk-kpi')} data-anim="">
              {kpi.map(([l, v, dp, u]) => (
                <li key={l}>
                  <span>{l}</span>
                  <b>
                    <Cnt v={v} dp={dp} />
                    {u ? <small>{u}</small> : null}
                  </b>
                </li>
              ))}
            </ul>
          )}
          <p className={cx('jk-meta')}>
            <span>
              集計 <b>{period}</b>
            </span>
            <span>
              対象 <b className={cx('num')}>{int(races)}レース</b>
            </span>
            <span>
              更新{' '}
              <b>
                <time dateTime={iso}>{updated}</time>
              </b>
            </span>
          </p>
        </div>
        {verdict && verdict.length > 0 ? (
          <div className={cx('jk-hv')}>
            <div className={cx('jk-h3')}>
              <h2>{verdictTitle}</h2>
              <small className={cx('num')}>{int(races)}レース</small>
            </div>
            <div className={cx('jk-vrs')}>
              {verdict.map((v, i) => (
                <a key={i} className={cx('jk-vr')} href="#characteristics">
                  <span className={cx('k')}>{v.label}</span>
                  <Seg v={v.pos} />
                  <b>{v.text}</b>
                  <ChevR />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

/** 対象レース数が少ないページの注意（現行の ThinDataNotice と同じ文） */
export function ThinNote({ totalRaces, minRaces, hiddenItems }: { totalRaces: number; minRaces: number; hiddenItems: string }) {
  return (
    <Sec>
      <Pn className="jk-art">
        <p className={cx('jk-thin')} role="note">
          <b>対象レース数が{totalRaces.toLocaleString('ja-JP')}レースと少ないページです。</b>
          統計的な傾向を判定するには{minRaces}レース以上が必要なため、{hiddenItems}は表示していません。表の数値は偶然の影響を強く受けるため、参考程度にご覧ください。
        </p>
      </Pn>
    </Sec>
  );
}

/** 基本情報の表（項目名｜値。補足は値の後ろに小さく）。スマホは1列、広い幅は2列 */
export const InfoTable = ({ items, label }: { items: [string, ReactNode, ReactNode?][]; label: string }) => {
  // 2列の幅では上から下へ読む順（左列→右列）に並べる。右列の先頭（c2）は上の罫線を消す
  const rows = Math.ceil(items.length / 2);
  return (
  <Pn>
    <dl className={cx('jk-it')} aria-label={label} style={{ '--rows': rows } as CSSProperties}>
      {items.map(([l, v, sm], i) => (
        <div key={l} className={i === rows ? cx('c2') : undefined}>
          <dt>{l}</dt>
          <dd>
            <b>{v}</b>
            {sm ? <small>{sm}</small> : null}
          </dd>
        </div>
      ))}
      {/* 2列の幅で行数が奇数のとき、右列の下端を左列にそろえる空行 */}
      {items.length % 2 === 1 ? <div className={cx('em')} aria-hidden="true" /> : null}
    </dl>
  </Pn>
  );
};

/** 基本情報のマス */
export const Tiles = ({ items, className = '' }: { items: [string, ReactNode, ReactNode?][]; className?: string }) => (
  <Pn>
    <dl className={cx('jk-tiles', className)} data-anim="">
      {items.map(([l, v, sm]) => (
        <div key={l}>
          <dt>{l}</dt>
          <dd>
            <b>{v}</b>
            {sm ? <small>{sm}</small> : null}
          </dd>
        </div>
      ))}
    </dl>
  </Pn>
);

/* ---------- 文章（**強調** と名前のリンク。現行の RichText と同じ規則） ---------- */
export type NameLink = { name: string; href: string };
function linkify(text: string, links: NameLink[], kp: string): ReactNode[] {
  if (!links.length) return [text];
  const sorted = [...links].sort((x, y) => y.name.length - x.name.length);
  const re = new RegExp(`(${sorted.map((l) => l.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const used = new Set<string>();
  return text.split(re).map((part, i) => {
    const l = sorted.find((x) => x.name === part);
    if (l && !used.has(l.name)) {
      used.add(l.name);
      return (
        <Link prefetch={false} key={`${kp}${i}`} href={l.href}>
          {part}
        </Link>
      );
    }
    return part;
  });
}
export const Rich = ({ text, links = [] }: { text: string; links?: NameLink[] }) => (
  <>
    {text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith('**') && p.endsWith('**') ? <b key={i}>{linkify(p.slice(2, -2), links, `b${i}-`)}</b> : <span key={i}>{linkify(p, links, `t${i}-`)}</span>,
    )}
  </>
);

/** データ概要：先頭の結論文＋見出しつきの段落 */
export type SummaryBlock = { key: string; title?: string | null; text: string };
export function Summary({ blocks, links, fallback = '全体成績' }: { blocks: SummaryBlock[]; links: Partial<Record<string, NameLink[]>>; fallback?: string }) {
  const lead = blocks[0]?.key === 'lead' ? blocks[0] : null;
  const rest = lead ? blocks.slice(1) : blocks;
  return (
    <Pn className="jk-art">
      {lead ? (
        <p className={cx('jk-art-lead')}>
          <Rich text={lead.text} links={links[lead.key] ?? []} />
        </p>
      ) : null}
      <div className={cx('jk-art-g')}>
        {rest.map((b, i) => (
          <div key={`${b.key}-${i}`}>
            <h3>{b.title ?? fallback}</h3>
            <p>
              <Rich text={b.text} links={links[b.key] ?? []} />
            </p>
          </div>
        ))}
      </div>
    </Pn>
  );
}

/** データQ&A（開閉。最初の1問は開く） */
export type FaqItem = { q: string; a: string; lead?: boolean; links?: NameLink[] };
export const Faq = ({ items }: { items: FaqItem[] }) => (
  <Pn className="jk-qa">
    {items.map((it, i) => (
      <details key={i} open={i === 0}>
        <summary>
          <b>{it.q}</b>
          <ChevD />
        </summary>
        <div className={cx('qa-a')}>
          {it.a
            .split('\n')
            .filter(Boolean)
            .map((line, k) => (
              <p key={k} className={line.startsWith('※') ? cx('note') : k === 0 && it.lead ? cx('lead') : undefined}>
                <Rich text={line} links={it.links ?? []} />
              </p>
            ))}
        </div>
      </details>
    ))}
  </Pn>
);

/** このデータについて（出典と集計方法） */
export const About = ({ period, updated }: { period?: string; updated?: string }) => (
  <aside className={cx('jk-about')} aria-label="データの出典と集計方法">
    <h2>このデータについて</h2>
    <p>
      中央競馬（JRA）のレース結果をもとに当サイトのデータベースで集計しています
      {period ? `（集計期間：${period}` : '（集計期間：直近3年間'}
      {updated ? `、${updated}時点）。` : '、毎週更新）。'}
      指標の定義と集計方法は<Link prefetch={false} href="/about/data">データの出典と集計方法</Link>をご覧ください。
    </p>
  </aside>
);

/* ---------- 特徴：5段階のメーターと根拠の横棒（比較対象の棒には ref を付ける） ---------- */
export type MeterItem = {
  label: string;
  pos: number;
  result: string;
  scale: [string, string, string];
  ev: [string, number | undefined, boolean?][];
  facts?: ReactNode;
};
export const Meter = ({ m }: { m: MeterItem }) => (
  <div className={cx('jk-mt')} data-anim="">
    <p className={cx('mh')}>
      <span>{m.label}</span>
      <b>{m.result}</b>
    </p>
    <Seg v={m.pos} big />
    <p className={cx('sc3')}>
      <span>{m.scale[0]}</span>
      <span>{m.scale[1]}</span>
      <span>{m.scale[2]}</span>
    </p>
    <ul className={cx('jk-ev')}>
      {m.ev
        .filter((e): e is [string, number, boolean?] => num(e[1]) !== undefined)
        .map(([l, v, ref], i) => (
          <li key={i} style={iv(i)}>
            <span>{l}</span>
            <span className={cx('jk-b', ref && 'ref')}>
              <i style={{ width: `${v}%` }} />
            </span>
            <b className={cx('num')}>{v.toFixed(1)}%</b>
          </li>
        ))}
    </ul>
    {m.facts}
  </div>
);
export const Meters = ({ items, note }: { items: MeterItem[]; note?: string }) => (
  <Pn>
    <div className={cx('jk-mts')}>
      {items.map((m) => (
        <Meter key={m.label} m={m} />
      ))}
    </div>
    <div className={cx('jk-ft')}>
      <span className={cx('jk-hint')}>
        {note ? `${note}　` : null}
        <DefLink anchor="criteria" />
      </span>
    </div>
  </Pn>
);

/* ---------- 注目ポイント：得意・苦手なコース TOP5（出走10回以上・複勝率順＝現行どおり） ---------- */
export type CourseRow = Stat & { name: string; racecourse: string; racecourse_en: string; surface_en: string; distance: number; variant?: string | null };
export function Highlights({ courses, urlOf, shortOf }: { courses: CourseRow[]; urlOf: (c: CourseRow) => string | undefined; shortOf: (c: CourseRow) => string }) {
  const pool = courses.filter((c) => c.races >= 10).sort((x, y) => y.place_rate - x.place_rate);
  const row = (c: CourseRow, i: number): Row => {
    const l = shortOf(c);
    return { ...R(c, <MaybeLink href={urlOf(c)}>{l}</MaybeLink>, l), rowKey: `${c.name}-${i}` };
  };
  const top = pool.slice(0, 5).map(row);
  const bottom = pool.slice(-5).reverse().map(row);
  const opt: Partial<StatsProps> = { keyLabel: 'コース', highlight: false, rank: true, sub: true, listAlways: true, abs: true };
  return (
    <>
      {pool.length ? (
        <SyncGroup className={cx('jk-two')}>
          <div className={cx('jk-pn')}>
            <div className={cx('jk-h3')}>
              <h3>得意なコース TOP5</h3>
              <small>10走以上・複勝率が高い順</small>
            </div>
            <Stats rows={top} keyLabel="コース" {...opt} />
          </div>
          <div className={cx('jk-pn')}>
            <div className={cx('jk-h3')}>
              <h3>苦手なコース TOP5</h3>
              <small>10走以上・複勝率が低い順</small>
            </div>
            <Stats rows={bottom} keyLabel="コース" {...opt} tone="weak" />
          </div>
        </SyncGroup>
      ) : (
        <Pn>
          <p className={cx('jk-note')}>出走回数10回以上のコースがありません。</p>
        </Pn>
      )}
      <p className={cx('jk-foot')}>※出走回数10回以上のコースを対象に、複勝率で評価しています</p>
    </>
  );
}

/* ---------- コース別：競馬場ごとに開く（最大値は競馬場ごとに判定＝現行どおり） ---------- */
export const RC: [string, string][] = [
  ['sapporo', '札幌'], ['hakodate', '函館'], ['fukushima', '福島'], ['niigata', '新潟'], ['tokyo', '東京'],
  ['nakayama', '中山'], ['chukyo', '中京'], ['kyoto', '京都'], ['hanshin', '阪神'], ['kokura', '小倉'],
];
export function CourseAcc({ courses, urlOf, labelOf }: { courses: CourseRow[]; urlOf: (c: CourseRow) => string | undefined; labelOf: (c: CourseRow) => string }) {
  const groups = RC.map(([en, ja]) => ({
    ja,
    rows: courses
      .filter((c) => c.racecourse_en === en)
      .sort((x, y) => (x.surface_en !== y.surface_en ? (x.surface_en === 'turf' ? -1 : 1) : x.distance - y.distance)),
  })).filter((g) => g.rows.length);
  if (!groups.length) return <Pn><p className={cx('jk-note')}>コース別のデータがありません。</p></Pn>;
  const racesOf = (g: (typeof groups)[number]) => g.rows.reduce((a, r) => a + r.races, 0);
  const busiest = groups.reduce((m, g) => (racesOf(g) > racesOf(m) ? g : m), groups[0]);
  const row = (c: CourseRow, i: number): Row => {
    const l = labelOf(c);
    return {
      ...R(
        c,
        <>
          <SfTag sf={sfKey(c.surface_en)} />
          <MaybeLink href={urlOf(c)}>
            <span className={cx('num')}>{l.replace(/^(芝|ダート|ダ|障害)/, '')}</span>
          </MaybeLink>
        </>,
        l,
      ),
      rowKey: `${c.name}-${i}`,
    };
  };
  const counts = (g: (typeof groups)[number]) =>
    ([['turf', '芝'], ['dirt', 'ダ'], ['steeplechase', '障']] as const).map(([cls, sl]) => {
      const k = g.rows.filter((r) => sfKey(r.surface_en) === cls).length;
      return k ? (
        <span key={cls} className={cx('sf', 'sm', cls)}>
          {sl} {k}
        </span>
      ) : null;
    });
  return (
    <Pn className="jk-acc">
      {groups.map((g) => (
        <details key={g.ja} open={g === busiest}>
          <summary>
            <b>{g.ja}競馬場</b>
            <span className={cx('ac-c')}>{counts(g)}</span>
            <span className={cx('ac-n', 'num')}>{int(racesOf(g))}戦</span>
            <ChevD />
          </summary>
          <div className={cx('ac-b')}>
            <Stats rows={g.rows.map(row)} keyLabel="コース" mark={false} closed={g !== busiest} />
          </div>
        </details>
      ))}
    </Pn>
  );
}

/* ---------- 重賞勝ち（勝利数のマス＋一覧。5件＋さらに表示） ---------- */
export type GradedWinRow = { date: string; race_name: string; grade: string; horse_name: string; popularity?: number | null };
export function GradedWins<T extends GradedWinRow>({
  wins,
  classStats,
  fourth,
}: {
  wins: T[];
  classStats: { class_name: string; wins: number; races: number }[];
  fourth: [string, (w: T) => ReactNode];
}) {
  const g = ['G1', 'G2', 'G3'].map((k) => classStats.find((c) => c.class_name === k) ?? { wins: 0, races: 0 });
  const rest = wins.length - 5;
  return (
    <Box
      className={cx('jk-pn')}
      hint={wins.length >= 30 ? <span key="hint" className={cx('jk-hint')}>最大30件まで表示</span> : undefined}
      more={rest > 0 ? { rest, initial: 5 } : undefined}
    >
      <>
      <ul className={cx('jk-gs')} data-anim="">
        <li className={cx('tot')}>
          <span>平地重賞</span>
          <b>
            <Cnt v={g.reduce((a, c) => a + c.wins, 0)} />
            <small>勝</small>
          </b>
          <em className={cx('num')}>{g.reduce((a, c) => a + c.races, 0)}戦</em>
        </li>
        {g.map((c, i) => (
          <li key={i}>
            <GTag g={`G${i + 1}`} />
            <b>
              <Cnt v={c.wins} />
              <small>勝</small>
            </b>
            <em className={cx('num')}>{c.races}戦</em>
          </li>
        ))}
      </ul>
      <div className={cx('jk-gw')} role="table" aria-label="重賞勝ちの一覧">
        <div className={cx('h')} role="row">
          <span role="columnheader">レース</span>
          <span role="columnheader">日付</span>
          <span role="columnheader">馬名</span>
          <span role="columnheader">{fourth[0]}</span>
          <span role="columnheader">人気</span>
        </div>
        {wins.map((w, i) => (
          <div key={i} className={cx('r', i >= 5 && 'more')} role="row">
            <span className={cx('rc')} role="cell">
              <GTag g={w.grade} />
              <b>{w.race_name}</b>
            </span>
            <span className={cx('dt', 'num')} role="cell">{slashDate(w.date)}</span>
            <span className={cx('hn')} role="cell">{w.horse_name}</span>
            <span className={cx('co')} role="cell">{fourth[1](w)}</span>
            <span className={cx('pp', 'num')} role="cell">
              {w.popularity ? (
                <>
                  {w.popularity}
                  <small>番人気</small>
                </>
              ) : (
                '—'
              )}
            </span>
          </div>
        ))}
      </div>
      </>
    </Box>
  );
}

/* ---------- 馬の一覧（代表産駒・主な管理馬）：PCは表、スマホは1頭2〜3行。5件＋さらに表示 ---------- */
export const Titles = ({ list }: { list: string[] }) =>
  list.length ? (
    <>
      {list.map((t, i) => {
        const m = t.match(/^(G[123])\s*(.+)$/);
        return (
          <span key={i} className={cx('tt')}>
            {m ? (
              <>
                <GTag g={m[1]} />
                {m[2]}
              </>
            ) : (
              t
            )}
          </span>
        );
      })}
    </>
  ) : (
    <span className={cx('none')}>—</span>
  );
/** cols: m＝スマホでの役割（m1 名前／m1b 名前の横／m2 右端／m3 2行目／m4 補足）, ml＝スマホで前に付ける項目名 */
export function HorseList({ cols, rows, initial = 5, note = '', label, className = '' }: { cols: { label: string; m: string; ml?: string; num?: boolean }[]; rows: ReactNode[][]; initial?: number; note?: string; label: string; className?: string }) {
  const rest = rows.length - initial;
  return (
    <Box className={cx('jk-pn', className)} hint={note ? <span key="hint" className={cx('jk-hint')}>{note}</span> : undefined} more={rest > 0 ? { rest, initial } : undefined}>
      <div className={cx('es-lt')} role="region" aria-label={label} tabIndex={0}>
        <table>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.label} scope="col" className={c.num ? cx('r') : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr key={i} className={i >= initial ? cx('more') : undefined}>
                {cells.map((cell, ci) => (
                  <td key={ci} className={cx(cols[ci].m, cols[ci].num && 'r', cols[ci].num && 'num')} data-l={cols[ci].ml}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Box>
  );
}

export { Stats, SyncGroup };
