'use client';

// コース詳細の条件別・ランキングの表の描画（parts.tsx の Cond / Ranking がサーバーで詰めた数値の配列から描く）。
// 13項目のセルをクライアント部品の中で作るので、RSC ペイロードには数値の配列だけが載る（セルごとの要素の JSON にならない）。
// 描く HTML は従来のサーバー描画と同じ。
import Link from 'next/link';
import s from './course.module.css';
import { COLS, fmt } from './stats';
import TableScroll from './TableScroll';
import { CondPanel, RankPanel } from './Panels';

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

/** v＝13項目の数値（COLS の順）、h＝ハイライトする列のビット */
function StatCells({ v, h = 0 }: { v: (number | null)[]; h?: number }) {
  return (
    <>
      {COLS.map((c, j) => {
        const t = fmt(v[j], c.format);
        return <td key={c.key}>{h & (1 << j) ? <span className={s.hl}>{t}</span> : t}</td>;
      })}
    </>
  );
}

/* ---------- 条件別：横棒＋全13項目の表 ---------- */
const PR = COLS.findIndex((c) => c.key === 'place_rate');
const SHORT = 5; // 現行と同じ：1列目が5文字以下なら横に送っても縮めない

/** l＝1列目の文字、g＝枠番、kp＝縮めない、w/o＝棒の長さ・濃さ、f＝出走30未満の出走数、b＝「最も高い」 */
export type CondV = { l: string; g?: number; kp?: 1; v: (number | null)[]; h?: number; w: string; o?: string; f?: number; b?: 1 };

function CondKey({ r }: { r: CondV }) {
  if (r.g) return <GateBadge n={r.g} />;
  return <span className={`${s.num}${r.l.length > SHORT && !r.kp ? ` ${s.lg}` : ''}`}>{r.l}</span>;
}

export function CondView({ rows, keyLabel, lead, extra }: { rows: CondV[]; keyLabel: string; lead: React.ReactNode; extra?: React.ReactNode }) {
  const bar = (r: CondV) => (
    <span className={`${s.br}${r.f !== undefined ? ` ${s.few}` : ''}`}>
      <i style={{ width: `${r.w}%`, ...(r.o === undefined ? {} : { opacity: r.o }) }} />
    </span>
  );
  const bars = (
    <ol className={s.cb} aria-label="複勝率">
      {rows.map((r, i) => (
        <li key={`${r.l}-${i}`} style={{ ['--i' as string]: i }} className={r.b ? s.best : undefined}>
          <span className={s['cb-k']}>
            <CondKey r={r} />
            {r.f !== undefined && <small className={s.num}>{`出走${r.f}`}</small>}
          </span>
          {bar(r)}
          <b className={`${s['cb-v']} ${s.num}`}>{fmt(r.v[PR], 'pct')}</b>
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
            <tr key={`${r.l}-${i}`} style={{ ['--i' as string]: i }}>
              <th scope="row" className={s.k}>
                <CondKey r={r} />
              </th>
              <td className={s.bc}>{bar(r)}</td>
              <StatCells v={r.v} h={r.h} />
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
  return <CondPanel lead={lead} bars={bars} table={table} extra={extra} />;
}

/* ---------- ランキング：10件＋さらに表示で最大50件 ---------- */
/** n＝名前、u＝詳細ページの URL */
export type RankV = { n: string; u?: string; v: (number | null)[]; h?: number };

export function RankView({ rows, nameLabel, note }: { rows: RankV[]; nameLabel: string; note: string }) {
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
              <tr key={`${r.n}-${i}`} className={i >= 10 ? s.mr : undefined}>
                <th scope="row" className={s.k}>
                  <span className={`${s.rno} ${s.num}${i < 3 ? ` ${s.t3} ${s[`m${i + 1}`]}` : ''}`}>{i + 1}</span>
                  <span className={s.nm}>
                    {r.u ? (
                      <Link prefetch={false} href={r.u} title={r.n}>
                        {r.n}
                      </Link>
                    ) : (
                      <span title={r.n}>{r.n}</span>
                    )}
                  </span>
                </th>
                <StatCells v={r.v} h={r.h} />
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </RankPanel>
  );
}
