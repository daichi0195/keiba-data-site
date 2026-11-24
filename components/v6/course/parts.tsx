import Link from '@/components/HardLink';
import { FRAME_ICONS, FrameIcon } from '@/components/layout/icons';
import s from './course.module.css';
import TableScroll from './TableScroll';
import { COLS, fmt, maxOf, type StatRow } from './stats';
import { Reveal } from './motion';
import { CondView, RankView, type CondV, type RankV } from './Tables';

export { GateBadge } from './Tables';

/** 13項目の数値（COLS の順）と、列ごとの最大値に当たる列のビット（クライアントの表に渡す形） */
function pack(row: StatRow, max: ReturnType<typeof maxOf>) {
  const v = COLS.map((c) => {
    const x = row[c.key];
    return typeof x === 'number' && Number.isFinite(x) ? x : null;
  });
  let h = 0;
  COLS.forEach((c, j) => {
    const x = v[j];
    if (c.hl && x !== null && x > 0 && x === max[c.key]) h |= 1 << j;
  });
  return h ? { v, h } : { v };
}

/* ---------- 小物 ---------- */

/** 見出しの文字列をつなぐ。意味の区切りで改行させず、行末で普通に折り返す（オーナー指示 2026-11-20：見出しの改行は読みづらい） */
export function Nb({ parts, sep = '' }: { parts: string[]; sep?: string }) {
  return <>{parts.join(sep)}</>;
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
    <Link prefetch={false} className={s['c-def']} href={`/about/data#${anchor}`}>
      {label}
      <FrameIcon icon={FRAME_ICONS.chevronRight} className={s.ic} />
    </Link>
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

const MIN_DEFAULT = 30; // 現行と同じ：出走30未満は「最も高い」の対象外

/** min：「最も高い」の対象と棒の濃さを決める出走数の下限（レース別ページは母数が少ないので10） */
export function Cond({ rows: all, keyLabel, extra, min: MIN = MIN_DEFAULT }: { rows: CondRow[]; keyLabel: string; extra?: React.ReactNode; min?: number }) {
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
  // 行を数値の配列に詰めてクライアントの表（Tables.tsx の CondView）に渡す
  const packed: CondV[] = rows.map((r) => {
    const few = races(r) < MIN;
    const op = eh === null || el === null ? 1 : 0.55 + 0.45 * (eh === el ? 1 : (rate(r) - el) / (eh - el));
    const o: CondV = { l: r.label, ...pack(r, max), w: ((rate(r) / hi) * 100).toFixed(1) };
    if (r.gate) o.g = r.gate;
    if (r.keep) o.kp = 1;
    if (few) o.f = races(r);
    else o.o = op.toFixed(2);
    if (races(r) >= MIN && rate(r) === eh) o.b = 1;
    return o;
  });
  return <CondView rows={packed} keyLabel={keyLabel} lead={lead} extra={extra} />;
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
  // 行を数値の配列に詰めてクライアントの表（Tables.tsx の RankView）に渡す
  const packed: RankV[] = rows.map((r) => (r.link ? { n: r.name, u: r.link, ...pack(r, max) } : { n: r.name, ...pack(r, max) }));
  return <RankView rows={packed} nameLabel={nameLabel} note={note} />;
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
        <Link prefetch={false} key={`${key}-${i}`} href={link.href}>
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
        <Link prefetch={false} key={`${key}-l${i}-${j}`} href={link.href}>
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
            <FrameIcon icon={FRAME_ICONS.chevronDown} className={s.ic} />
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

/* ---------- 一覧の表（標準タイム・馬場状態別・重賞の勝ち馬・狙い目） ---------- */
export function ListTable({ cols, rows, label, note, className = '', table = false }: {
  /** ml＝スマホで数値の前に付ける短いラベル（2列目より後ろの列）。table のときはスマホの見出しに使う */
  cols: { label: string; num?: boolean; key?: boolean; ml?: string }[];
  rows: React.ReactNode[][];
  label: string;
  note?: React.ReactNode;
  className?: string;
  /** スマホでも行を崩さず表のまま見せる（横に送れる。1列目は固定、右に続きがあるあいだは右端に影）。列が同じ行が続く表向け */
  table?: boolean;
}) {
  const body = (
    <table>
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c.label} scope="col" className={c.num ? s.r : undefined}>
              {table && c.ml ? (
                <>
                  <span className={s['lt-l']}>{c.label}</span>
                  <span className={s['lt-m']}>{c.ml}</span>
                </>
              ) : (
                c.label
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, i) => (
          <tr key={i}>
            {cells.map((cell, j) => (
              <td key={j} data-l={!table && j >= 2 ? (cols[j].ml ?? cols[j].label) : undefined} className={[cols[j].num ? s.r : '', cols[j].key ? s.k : ''].filter(Boolean).join(' ') || undefined}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <div className={`${s.cp} ${s.lt}${table ? ` ${s.ltt}` : ''} ${className}`}>
      {table ? (
        <TableScroll label={label}>{body}</TableScroll>
      ) : (
        <div className={s['lt-w']} role="region" aria-label={label} tabIndex={0}>
          {body}
        </div>
      )}
      {note ? <p className={s['cp-n']}>{note}</p> : null}
    </div>
  );
}
