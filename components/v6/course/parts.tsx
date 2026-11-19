import Link from 'next/link';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FrameIcon } from '@/components/layout/icons';
import s from './course.module.css';
import { COLS, fmt, maxOf, type StatRow } from './stats';
import { Reveal } from './motion';
import TableScroll from './TableScroll';
import { CondPanel, RankPanel } from './Panels';

/* ---------- 小物 ---------- */

/** 見出しを語のまとまりで折り返す（語の途中で割らない） */
export function Nb({ parts, sep = '' }: { parts: string[]; sep?: string }) {
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && sep}
          <span className={s.nb}>{p}</span>
        </span>
      ))}
    </>
  );
}

/** 節の見出し（地の上） */
export function Head({ title, sub }: { title: React.ReactNode; sub?: string }) {
  return (
    <div className={s.hd}>
      <h2>
        {title}
        {sub && <small>{sub}</small>}
      </h2>
    </div>
  );
}

/** 判定基準・用語の定義へのリンク（/about/data に1か所でまとめた説明へ） */
export function More({ anchor, label }: { anchor: string; label: string }) {
  return (
    <Link className={s['c-def']} href={`/about/data#${anchor}`}>
      {label}
      <FrameIcon icon={faChevronRight} className={s.ic} />
    </Link>
  );
}

const GATE_BG: Record<number, string> = { 1: '#FFFFFF', 2: '#222222', 3: '#C62927', 4: '#2573CD', 5: '#E4CA3C', 6: '#58AF4A', 7: '#FAA727', 8: '#DC6179' };
const GATE_FG: Record<number, string> = { 1: '#222222', 5: '#222222', 7: '#222222' };

export function GateBadge({ n }: { n: number }) {
  return (
    <span
      className={`${s.gt} ${s.num}${n === 1 ? ` ${s.g1b}` : ''}`}
      style={{ background: GATE_BG[n], color: GATE_FG[n] ?? '#FFFFFF' }}
      aria-label={`${n}枠`}
    >
      {n}
    </span>
  );
}

/* ---------- 全13項目の表 ---------- */

function StatHeads() {
  return (
    <>
      {COLS.map((c) => (
        <th key={c.key} scope="col" className={s[`c-${c.key}`]}>
          {c.label.map((l, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {l}
            </span>
          ))}
        </th>
      ))}
    </>
  );
}

function StatCells({ row, max }: { row: StatRow; max: ReturnType<typeof maxOf> }) {
  return (
    <>
      {COLS.map((c) => {
        const v = row[c.key];
        const t = fmt(v, c.format);
        const hl = c.hl && typeof v === 'number' && v > 0 && v === max[c.key];
        return <td key={c.key}>{hl ? <span className={s.hl}>{t}</span> : t}</td>;
      })}
    </>
  );
}

/* ---------- コースの特徴（メーター） ---------- */

export type MeterPair = { label: string; value: number; dec: number; suf: string; ref?: boolean };

export function Meter({ label, result, value, scale, pair, i }: { label: string; result: string; value: number; scale: string[]; pair?: MeterPair[]; i: number }) {
  const max = pair && pair.length ? Math.max(...pair.map((p) => p.value)) : 0;
  return (
    <Reveal className={`${s['mt-c']} ${s.an}`} style={{ ['--i' as string]: i }}>
      <div className={s['mt-h']}>
        <h3>{label}</h3>
        <b>{result}</b>
      </div>
      <div className={s['mt-t']} style={{ ['--p' as string]: `${(value - 1) * 20 + 10}%` }} role="img" aria-label={`${label}は5段階の${value}番目（${result}）`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <i key={n} className={n === value ? s.on : undefined} />
        ))}
        <span className={s['mt-k']} />
      </div>
      <div className={s['mt-s']} aria-hidden="true">
        {scale.map((t) =>
          t.includes('・') ? (
            <span key={t}>
              <span className={s.lf}>{t}</span>
              <span className={s.sh}>{t.replace('有利', '')}</span>
            </span>
          ) : (
            <span key={t}>{t}</span>
          )
        )}
      </div>
      {pair && pair.length > 0 && (
        <dl className={s['mt-p']}>
          {pair.map((p) => {
            const text = `${p.dec ? p.value.toFixed(p.dec) : Math.round(p.value).toLocaleString('ja-JP')}${p.suf}`;
            return (
              <div key={p.label}>
                <dt>{p.label}</dt>
                <dd>
                  <span className={`${s['mt-b']}${p.ref ? ` ${s.ref}` : ''}`}>
                    <i style={{ width: `${max > 0 ? ((p.value / max) * 100).toFixed(1) : 0}%` }} />
                  </span>
                  <b className={s.num} data-count={p.value} data-dec={p.dec} data-suf={p.suf}>
                    {text}
                  </b>
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </Reveal>
  );
}

/* ---------- 条件別（人気・枠順・脚質・性別・馬体重）：横棒＋全13項目の表 ---------- */

export interface CondRow extends StatRow {
  label: string;
  gate?: number;
  /** 1列目を横に送っても縮めない（馬体重の「400〜419」など） */
  keep?: boolean;
}

const MIN = 30; // 現行と同じ：出走30未満は「最も高い」の対象外
const SHORT = 5; // 現行と同じ：1列目が5文字以下なら横に送っても縮めない

function CondKey({ r }: { r: CondRow }) {
  if (r.gate) return <GateBadge n={r.gate} />;
  return <span className={`${s.num}${r.label.length > SHORT && !r.keep ? ` ${s.lg}` : ''}`}>{r.label}</span>;
}

export function Cond({ rows: all, keyLabel, extra }: { rows: CondRow[]; keyLabel: string; extra?: React.ReactNode }) {
  const rows = all.filter((r) => typeof r.races === 'number');
  if (rows.length === 0) {
    return (
      <div className={s.cp}>
        <p className={s.empty}>該当データがありません。</p>
      </div>
    );
  }
  const max = maxOf(rows);
  const rate = (r: CondRow) => r.place_rate ?? 0;
  const races = (r: CondRow) => r.races ?? 0;
  const hi = Math.max(...rows.map(rate)) || 1;
  // 濃さは出走30以上の行の中で決める。出走30未満の行は灰色の棒にする
  const enough = rows.filter((r) => races(r) >= MIN);
  const eh = enough.length ? Math.max(...enough.map(rate)) : null;
  const el = enough.length ? Math.min(...enough.map(rate)) : null;
  const best = rows.find((r) => races(r) >= MIN && rate(r) === eh);
  const bar = (r: CondRow) => {
    const few = races(r) < MIN;
    const op = eh === null || el === null ? 1 : 0.55 + 0.45 * (eh === el ? 1 : (rate(r) - el) / (eh - el));
    return (
      <span className={`${s.br}${few ? ` ${s.few}` : ''}`}>
        <i style={{ width: `${((rate(r) / hi) * 100).toFixed(1)}%`, ...(few ? {} : { opacity: op.toFixed(2) }) }} />
      </span>
    );
  };

  const lead = (
    <p className={s['cd-b']}>
      {best ? (
        <>
          <Nb parts={[`出走${MIN}以上で`, '複勝率が', '最も高いのは']} />
          <b className={s.nb}>
            {best.gate ? `${best.gate}枠` : <span className={s.num}>{best.label}</span>}の<span className={s.num}>{fmt(best.place_rate, 'pct')}</span>
          </b>
        </>
      ) : (
        '出走数が少ないため、数値は参考程度にご覧ください'
      )}
    </p>
  );
  const bars = (
    <ol className={s.cb} aria-label="複勝率">
      {rows.map((r, i) => (
        <li key={`${r.label}-${i}`} style={{ ['--i' as string]: i }} className={races(r) >= MIN && rate(r) === eh ? s.best : undefined}>
          <span className={s['cb-k']}>
            <CondKey r={r} />
            {races(r) < MIN && <small className={s.num}>{`出走${races(r)}`}</small>}
          </span>
          {bar(r)}
          <b className={`${s['cb-v']} ${s.num}`}>{fmt(r.place_rate, 'pct')}</b>
        </li>
      ))}
    </ol>
  );
  const table = (
    <TableScroll>
      <table className={`${s.st} ${s.ct}`}>
        <thead>
          <tr>
            <th scope="col" className={s.k}>{keyLabel}</th>
            <th scope="col" className={s.bc}>複勝率</th>
            <StatHeads />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.label}-${i}`} style={{ ['--i' as string]: i }}>
              <th scope="row" className={s.k}>
                <CondKey r={r} />
              </th>
              <td className={s.bc}>{bar(r)}</td>
              <StatCells row={r} max={max} />
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
  return <CondPanel lead={lead} bars={bars} table={table} extra={extra} />;
}

/* ---------- ランキング（騎手・種牡馬・母父・調教師）：10件＋さらに表示で最大50件 ---------- */

export interface RankRow extends StatRow {
  name: string;
  link?: string;
}

export function Ranking({ rows, nameLabel, note }: { rows: RankRow[]; nameLabel: string; note: string }) {
  if (rows.length === 0) {
    return (
      <div className={s.cp}>
        <p className={s.empty}>該当データがありません。</p>
      </div>
    );
  }
  const max = maxOf(rows);
  return (
    <RankPanel rest={Math.max(0, rows.length - 10)} note={note}>
      <TableScroll>
        <table className={s.st}>
          <thead>
            <tr>
              <th scope="col" className={s.k}>
                <span className={s.rno}>順位</span>
                <span className={s.nm}>{nameLabel}</span>
              </th>
              <StatHeads />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.name}-${i}`} className={i >= 10 ? s.mr : undefined}>
                <th scope="row" className={s.k}>
                  <span className={`${s.rno} ${s.num}${i < 3 ? ` ${s.t3} ${s[`m${i + 1}`]}` : ''}`}>{i + 1}</span>
                  <span className={s.nm}>
                    {r.link ? (
                      <Link href={r.link} title={r.name}>
                        {r.name}
                      </Link>
                    ) : (
                      <span title={r.name}>{r.name}</span>
                    )}
                  </span>
                </th>
                <StatCells row={r} max={max} />
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </RankPanel>
  );
}

/* ---------- 本文（**強調** と名前のリンク） ---------- */

export interface NameLink {
  name: string;
  href: string;
}

function linkify(text: string, links: NameLink[], key: string): React.ReactNode[] {
  if (!links.length) return [text];
  // 長い名前から順に照合し、同じ名前の重複リンクは最初の1回だけにする（現行の RichText と同じ規則）
  const sorted = [...links].sort((a, b) => b.name.length - a.name.length);
  const pattern = new RegExp(`(${sorted.map((l) => l.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const used = new Set<string>();
  return text.split(pattern).map((part, i) => {
    const link = sorted.find((l) => l.name === part);
    if (link && !used.has(link.name)) {
      used.add(link.name);
      return (
        <Link key={`${key}-${i}`} href={link.href}>
          {part}
        </Link>
      );
    }
    return part;
  });
}

export function RichText({ text, links = [] }: { text: string; links?: NameLink[] }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <b key={i}>{linkify(part.slice(2, -2), links, `b${i}`)}</b>
        ) : (
          <span key={i}>{linkify(part, links, `t${i}`)}</span>
        )
      )}
    </>
  );
}

/* ---------- データQ&A ---------- */

interface FaqLink {
  text: string;
  href: string;
}
export interface FaqItem {
  question: string;
  answer?: string;
  links?: FaqLink[];
  boldFirstLine?: boolean;
}

// **テキスト** を強調に、links の名前を詳細ページへのリンクに置き換える（現行 CourseFaq と同じ規則）
function faqLine(text: string, links: FaqLink[] | undefined, key: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).flatMap((part, i): React.ReactNode[] => {
    if (part.startsWith('**') && part.endsWith('**')) return [<b key={`${key}-b${i}`}>{part.slice(2, -2)}</b>];
    if (!links || links.length === 0) return [part];
    const out: React.ReactNode[] = [];
    let rest = part;
    links.forEach((link, j) => {
      const idx = rest.indexOf(link.text);
      if (idx === -1) return;
      if (idx > 0) out.push(rest.slice(0, idx));
      out.push(
        <Link key={`${key}-l${i}-${j}`} href={link.href}>
          {link.text}
        </Link>
      );
      rest = rest.slice(idx + link.text.length);
    });
    out.push(rest);
    return out;
  });
}

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className={`${s.cp} ${s.qa}`}>
      {items.map((item, n) => (
        <details key={n}>
          <summary>
            <span>{item.question}</span>
            <FrameIcon icon={faChevronDown} className={s.ic} />
          </summary>
          {item.answer && (
            <div className={s['qa-a']}>
              {item.answer.split('\n').map((line, i) => {
                if (line === '') return null;
                const cls = line.startsWith('※') ? s.note : i === 0 && item.boldFirstLine ? s.lead : undefined;
                return (
                  <p key={i} className={cls}>
                    {faqLine(line, item.links, `${n}-${i}`)}
                  </p>
                );
              })}
            </div>
          )}
        </details>
      ))}
    </div>
  );
}
