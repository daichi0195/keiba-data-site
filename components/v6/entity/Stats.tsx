// 条件別・ランキングの共通部品（見本 pages/jockey.mjs・pages/_entity-st.mjs の stats() と同じ出力）。
// 条件別　　：スマホ〜899pxは1件1行の横棒（名前｜棒｜数値）＋「全項目を見る」で13項目の表。900px以上は横棒の列を持つ表1枚
// ランキング：どの幅でも最初から13項目の表（10件＋さらに表示。CSS が .rkt の表を見て切り替える）
// 表は1列目固定・最大値ハイライト。出走30未満の行は灰色の棒＋「出走n」の小札
import type { CSSProperties, ReactNode } from 'react';
import Box from './Box';
import { cx } from './cx';
import { COLS, MIN_BAR, bestOf, enoughOf, fmt, num, type Row } from './format';

export const br = (text: string): ReactNode =>
  text.split('\n').flatMap((t, i) => (i === 0 ? [t] : [<br key={i} />, t]));

export type StatsProps = {
  rows: Row[];
  keyLabel: string;
  summaryRows?: Row[];
  highlight?: boolean;
  rank?: boolean;
  /** 順位の金銀銅を付けるか */
  medal?: boolean;
  initial?: number;
  bar?: 'place_rate' | 'wins';
  barLabel?: string;
  tone?: string;
  mark?: boolean;
  /** 「最も高い」の対象にする行（障害を外すなど） */
  markRows?: Row[] | null;
  hint?: ReactNode;
  list?: boolean;
  listAlways?: boolean;
  sub?: boolean;
  shrink?: boolean;
  abs?: boolean;
  /** jk-st に足すクラス（es-nol など） */
  extra?: string;
};

const iv = (i: number) => ({ '--i': i }) as CSSProperties;

export default function Stats({
  rows,
  keyLabel,
  summaryRows = [],
  highlight = true,
  rank = false,
  medal = true,
  initial = 0,
  bar = 'place_rate',
  barLabel = '複勝率\n（横棒）',
  tone = '',
  mark = true,
  markRows = null,
  hint,
  list = true,
  listAlways = false,
  sub = false,
  shrink = false,
  abs = false,
  extra = '',
}: StatsProps) {
  const max: Record<string, number> = Object.fromEntries(
    COLS.filter((c) => c[3]).map(([k]) => [k, Math.max(...rows.map((r) => num(r[k])).filter((v): v is number => v !== undefined), -Infinity)]),
  );
  const cond = bar === 'place_rate' && !abs; // 条件別の横棒：基準は出走30以上の行だけ
  const enough = enoughOf(rows);
  // 長さ：全行の最大値が基準（数値の比＝棒の長さの比）。濃さ：灰の棒（出走30未満）を除いた緑の行の中で決める
  const all = rows.map((r) => num(r[bar]) ?? 0);
  const base = (cond && enough.length ? enough : rows).map((r) => num(r[bar]) ?? 0);
  const hi = Math.max(...base, 0);
  const low = Math.min(...base);
  const top = abs ? 100 : Math.max(...all, 0) || 1;
  const isFew = (r: Row) => cond && (r.races ?? 0) < MIN_BAR;
  const w = (r: Row) => Math.min(100, ((num(r[bar]) ?? 0) / top) * 100).toFixed(2);
  const op = (r: Row) => (hi === low ? 1 : Math.min(1, Math.max(0.55, 0.55 + (0.45 * ((num(r[bar]) ?? 0) - low)) / (hi - low)))).toFixed(2);
  const barEl = (r: Row, sum: boolean) => (
    <span className={cx('jk-b', sum && 'sum', !sum && isFew(r) && 'few')}>
      <i style={sum || isFew(r) ? { width: `${w(r)}%` } : { width: `${w(r)}%`, opacity: op(r) }} />
    </span>
  );
  const barFmt = (r: Row) =>
    bar === 'wins' ? (
      <>
        <span className={cx('num')}>{fmt(r.wins, 'int')}</span>
        <small>勝</small>
      </>
    ) : (
      <span className={cx('num')}>{fmt(r[bar], 'pct')}</span>
    );
  const best = cond && mark ? bestOf(markRows ?? rows) : null;
  const rk = (i: number) => (rank ? <span className={cx('jk-rk', 'num', medal && i < 3 && `m${i + 1}`)}>{i + 1}</span> : null);
  const few = (r: Row) => (isFew(r) ? <small className={cx('num')}>出走{r.races ?? 0}</small> : null);
  const ii = (i: number) => (initial ? i % initial : i);

  const listEl = list ? (
    <ul className={cx('jk-bl', tone, rank && 'rkl', sub && 'has-sub')} data-anim="">
      {rows.map((r, i) => (
        <li key={r.rowKey ?? i} className={initial && i >= initial ? cx('more') : undefined} style={iv(ii(i))}>
          {rk(i)}
          <span className={cx('l')}>
            {r.key}
            {r.listSub ? <small className={cx('num')}>{r.listSub}</small> : null}
            {few(r)}
          </span>
          {barEl(r, false)}
          <b className={cx('v', best === r && 'top')}>{barFmt(r)}</b>
          {sub ? <span className={cx('s', 'num')}>{fmt(r.races, 'int')}戦</span> : null}
        </li>
      ))}
    </ul>
  ) : null;

  const tr = (r: Row, i: number, sum: boolean) => (
    <tr key={`${sum ? 's' : 'r'}${r.rowKey ?? i}`} className={cx(initial && i >= initial && !sum && 'more', sum && 'sum', sum && i === 0 && 'sum1') || undefined} style={iv(ii(i))}>
      {rank ? <td className={cx('n')}>{rk(i)}</td> : null}
      <td className={cx('k')}>
        {shrink && r.text.length > 5 ? (
          <span className={cx('nm', 'lg')} title={r.text}>
            {r.key}
          </span>
        ) : (
          <span className={cx('nm')}>{r.key}</span>
        )}
        {sum ? null : few(r)}
      </td>
      {list ? <td className={cx('bc')}>{barEl(r, sum)}</td> : null}
      {COLS.map(([k, , f, hl]) => {
        const v = num(r[k]);
        const t = fmt(v, f);
        return <td key={k}>{highlight && !sum && hl && v !== undefined && v > 0 && v === max[k] ? <span className={cx('hl')}>{t}</span> : t}</td>;
      })}
    </tr>
  );

  const table = (
    <div className={cx('jk-tw')}>
      <table className={cx('jk-t', rank && 'rkt', tone)} data-anim="">
        <thead>
          <tr>
            {rank ? <th scope="col" className={cx('n')}>順位</th> : null}
            <th scope="col" className={cx('k')}>{keyLabel}</th>
            {list ? <th scope="col" className={cx('bc')}>{br(barLabel)}</th> : null}
            {COLS.map((c) => (
              <th key={c[0]} scope="col">{br(c[1])}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => tr(r, i, false))}
          {summaryRows.map((r, i) => tr(r, i, true))}
        </tbody>
      </table>
    </div>
  );

  const rest = initial ? rows.length - initial : 0;
  const onlyT = !(rest > 0) && !listAlways;
  return (
    <Box
      className={cx('jk-st', listAlways && 'lst', !list && 'tbl', extra)}
      foot={Boolean(list || rest > 0 || hint)}
      ftClass={cx('jk-ft', !hint && onlyT && 'only-t')}
      bsClass={cx('jk-bs', onlyT && 'only-t')}
      hint={hint ? <span key="hint" className={cx('jk-hint')}>{hint}</span> : undefined}
      more={rest > 0 ? { rest, initial } : undefined}
      table={list}
    >
      <>
        {listEl}
        <div className={cx('jk-full')}>{table}</div>
      </>
    </Box>
  );
}
