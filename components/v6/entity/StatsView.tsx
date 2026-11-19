'use client';

// 条件別・ランキングの表の描画（Stats.tsx がサーバーで詰めた数値の配列から、見本 stats() と同じ HTML を描く）。
// 13項目のセルをクライアント部品の中で作るので、RSC ペイロードには数値の配列だけが載る（要素の JSON にならない）。
// 開閉は Box（同じくクライアント）。動き・横スクロールの合図は EntityEffects が DOM にクラスを足す。
import type { CSSProperties, ReactNode } from 'react';
import Box from './Box';
import { cx } from './cx';
import { COLS, fmt } from './format';

/** 1行：k＝1列目の中身、v＝13項目の数値（COLS の順）、h＝ハイライトする列のビット、w/o＝棒の長さ・濃さ、
 *  f＝出走30未満の出走数（灰の棒と「出走n」）、ls＝スマホの棒の行に添える文字、t＝長い名前（縮める・title）、b＝「最も高い」 */
export type VRow = { k: ReactNode; v: (number | null)[]; h?: number; w?: string; o?: string; f?: number; ls?: string; t?: string; b?: 1 };
type Opt = {
  rank: boolean; medal: boolean; initial: number; bar: 'place_rate' | 'wins'; barLabel: string; tone: string; hint?: ReactNode;
  list: boolean; listAlways: boolean; sub: boolean; extra: string; lm: boolean; bcCol: boolean;
};

export const br = (text: string): ReactNode =>
  text.split('\n').flatMap((t, i) => (i === 0 ? [t] : [<br key={i} />, t]));
const iv = (i: number) => ({ '--i': i }) as CSSProperties;
const BI = COLS.findIndex((c) => c[0] === 'wins');
const RI = COLS.findIndex((c) => c[0] === 'races');

export default function StatsView({ rows, sums = [], keyLabel, o }: { rows: VRow[]; sums?: VRow[]; keyLabel: string; o: Opt }) {
  const { rank, medal, initial, bar, barLabel, tone, hint, list, listAlways, sub, extra, lm, bcCol } = o;
  const vi = COLS.findIndex((c) => c[0] === bar);
  const barEl = (r: VRow, sum: boolean) => (
    <span className={cx('jk-b', sum && 'sum', !sum && r.f !== undefined && 'few')}>
      <i style={r.o === undefined ? { width: `${r.w}%` } : { width: `${r.w}%`, opacity: r.o }} />
    </span>
  );
  const barFmt = (r: VRow) =>
    bar === 'wins' ? (
      <>
        <span className={cx('num')}>{fmt(r.v[BI], 'int')}</span>
        <small>勝</small>
      </>
    ) : (
      <span className={cx('num')}>{fmt(r.v[vi], 'pct')}</span>
    );
  const rk = (i: number) => (rank ? <span className={cx('jk-rk', 'num', medal && i < 3 && `m${i + 1}`)}>{i + 1}</span> : null);
  const few = (r: VRow) => (r.f !== undefined ? <small className={cx('num')}>出走{r.f}</small> : null);
  const ii = (i: number) => (initial ? i % initial : i);

  const listEl = list && listAlways ? (
    <ul className={cx('jk-bl', tone, rank && 'rkl', sub && 'has-sub')} data-anim="">
      {rows.map((r, i) => (
        <li key={i} className={initial && i >= initial ? cx('more') : undefined} style={iv(ii(i))}>
          {rk(i)}
          <span className={cx('l')}>
            {r.k}
            {r.ls ? <small className={cx('num')}>{r.ls}</small> : null}
            {few(r)}
          </span>
          {barEl(r, false)}
          <b className={cx('v', r.b && 'top')}>{barFmt(r)}</b>
          {sub ? <span className={cx('s', 'num')}>{fmt(r.v[RI], 'int')}戦</span> : null}
        </li>
      ))}
    </ul>
  ) : null;

  const tr = (r: VRow, i: number, sum: boolean) => (
    <tr key={`${sum ? 's' : 'r'}${i}`} className={cx(initial && i >= initial && !sum && 'more', sum && 'sum', sum && i === 0 && 'sum1') || undefined} style={iv(ii(i))}>
      {rank ? <td className={cx('n')}>{rk(i)}</td> : null}
      <td className={cx('k')}>
        {r.t !== undefined ? (
          <span className={cx('nm', 'lg')} title={r.t}>
            {r.k}
          </span>
        ) : (
          <span className={cx('nm')}>{r.k}</span>
        )}
        {lm && r.ls ? <small className={cx('num', 'lsub')}>{r.ls}</small> : null}
        {sum ? null : few(r)}
      </td>
      {bcCol ? <td className={cx('bc')}>{barEl(r, sum)}</td> : null}
      {COLS.map(([k, , f], j) => {
        const t = fmt(r.v[j], f);
        const c = r.h && r.h & (1 << j) ? <span className={cx('hl')}>{t}</span> : t;
        // 横棒の行の数値（.v。「最も高い」は太字の .top）。棒の一覧と同じく文字の書体の箱に数字の書体の span を入れる（行の中の高さを揃える）
        const vc = lm && j === vi ? cx('v', r.b && 'top') : undefined;
        return <td key={k} className={vc}>{vc ? <span className={cx('num')}>{c}</span> : c}</td>;
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
            {bcCol ? <th scope="col" className={cx('bc')}>{br(barLabel)}</th> : null}
            {COLS.map((c) => (
              <th key={c[0]} scope="col">{br(c[1])}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => tr(r, i, false))}
          {sums.map((r, i) => tr(r, i, true))}
        </tbody>
      </table>
    </div>
  );

  const rest = initial ? rows.length - initial : 0;
  const onlyT = !(rest > 0) && !listAlways;
  return (
    <Box
      className={cx('jk-st', listAlways && 'lst', !list && 'tbl', lm && 'lm', extra)}
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
