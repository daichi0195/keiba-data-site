// 騎手詳細・種牡馬詳細・調教師詳細の図（見本 pages/_entity-st.mjs の yearCharts・lineChart・butterfly・condBars・figRow と同じ形）
import type { CSSProperties, ReactNode } from 'react';
import Stats from './Stats';
import { cx } from './cx';
import { int, num, pct, R, type Row, type Stat } from './format';
import { Cnt, Pn, Rich, SfTag } from './parts';

const iv = (i: number) => ({ '--i': i }) as CSSProperties;
const roundAxis = (m: number) => {
  const v = m * 1.15;
  return [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150].find((x) => v <= x) ?? Math.ceil(v / 50) * 50;
};
const xAt = (i: number, n: number) => ((i + 0.5) / n) * 100;
const shade = (v: number, lo: number, hi: number) => (hi === lo ? 1 : 0.55 + (0.45 * (v - lo)) / (hi - lo)).toFixed(2);
const Grid = ({ maxV, n, unit }: { maxV: number; n: number; unit: string }) => (
  <div className={cx('gl')}>
    {Array.from({ length: n + 1 }, (_, i) => (
      <i key={i} style={{ top: `${(i / n) * 100}%` }}>
        <em className={cx('num')}>
          {Math.round(maxV * (1 - i / n))}
          {unit}
        </em>
      </i>
    ))}
  </div>
);

/* ---------- 年度別：推移の図2つと表 ---------- */
export type LeadYear = { year: number; wins: number; ranking: number };
export type YearStat = Stat & { year: number };
export function YearCharts({ lead, ystat }: { lead: LeadYear[]; ystat: YearStat[] }) {
  const mx = roundAxis(Math.max(...lead.map((d) => d.wins)));
  const n = [4, 5, 3].find((k) => mx % k === 0) ?? 4;
  const ws = lead.map((d) => d.wins);
  const hi = Math.max(...ws);
  const lo = Math.min(...ws);
  const pts = lead.map((d, i) => ({ ...d, x: xAt(i, lead.length), y: ((Math.min(d.ranking, 50) - 1) / 49) * 100 })).filter((d) => d.ranking > 0);
  const rkl = (d: LeadYear) => (d.ranking > 50 ? '50位未満' : `${d.ranking}位`);
  const series: [keyof Stat & string, string, string][] = [['place_rate', '複勝率', 'g'], ['quinella_rate', '連対率', 'k'], ['win_rate', '勝率', 's']];
  const rm = Math.max(20, Math.ceil(Math.max(...ystat.map((d) => d.place_rate)) / 20) * 20);
  const rows: Row[] = [...ystat].reverse().map((y) => R(y, <span className={cx('num')}>{y.year}年</span>, `${y.year}年`));
  return (
    <Pn>
      <div className={cx('jk-chs')}>
        <figure className={cx('jk-ch')} data-anim="" role="img" aria-label={lead.map((d) => `${d.year}年 ${d.wins}勝${d.ranking > 0 ? `・リーディング${rkl(d)}` : ''}`).join('、')}>
          <figcaption>
            <b>勝利数とリーディング順位</b>
            <span className={cx('lg')}>
              <span>
                <i className={cx('sq')} />
                勝利数
              </span>
              <span>
                <i className={cx('ln', 'k')} />
                リーディング順位
              </span>
            </span>
          </figcaption>
          <div className={cx('jk-plot')}>
            <Grid maxV={mx} n={n} unit="" />
            <div className={cx('cl')}>
              {lead.map((d, i) => (
                <div key={d.year} style={iv(i)}>
                  <i style={{ height: `${((d.wins / mx) * 100).toFixed(1)}%`, opacity: shade(d.wins, lo, hi) }} />
                </div>
              ))}
            </div>
            {pts.length > 1 ? (
              <svg className={cx('ls')} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polyline className={cx('k')} points={pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')} />
              </svg>
            ) : null}
            {pts.map((p, i) => (
              <span key={p.year} className={cx('pt', 'k', 'tag')} style={{ left: `${p.x}%`, top: `${p.y}%`, ...iv(i) }}>
                <b className={cx('num')}>{rkl(p)}</b>
              </span>
            ))}
          </div>
          <div className={cx('xs')}>
            {lead.map((d) => (
              <div key={d.year}>
                <span className={cx('num')}>{d.year}年</span>
                <b>
                  <Cnt v={d.wins} />
                  <small>勝</small>
                </b>
              </div>
            ))}
          </div>
        </figure>
        <figure
          className={cx('jk-ch')}
          data-anim=""
          role="img"
          aria-label={ystat.map((d) => `${d.year}年 勝率${pct(d.win_rate)}・連対率${pct(d.quinella_rate)}・複勝率${pct(d.place_rate)}`).join('、')}
        >
          <figcaption>
            <b>勝率・連対率・複勝率の推移</b>
            <span className={cx('lg')}>
              {series.map(([k, l, cl]) => (
                <span key={k}>
                  <i className={cx('ln', cl)} />
                  {l}
                </span>
              ))}
            </span>
          </figcaption>
          <div className={cx('jk-plot')}>
            <Grid maxV={rm} n={rm / 20} unit="%" />
            <svg className={cx('ls')} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {series.map(([k, , cl]) => (
                <polyline key={k} className={cx(cl)} points={ystat.map((d, i) => `${xAt(i, ystat.length).toFixed(2)},${(100 - ((d[k] as number) / rm) * 100).toFixed(2)}`).join(' ')} />
              ))}
            </svg>
            {series.map(([k, , cl]) =>
              ystat.map((d, i) => (
                <span key={`${k}${i}`} className={cx('pt', cl)} style={{ left: `${xAt(i, ystat.length)}%`, top: `${(100 - ((d[k] as number) / rm) * 100).toFixed(2)}%`, ...iv(i) }}>
                  <b className={cx('num')}>{pct(d[k])}</b>
                </span>
              )),
            )}
          </div>
          <div className={cx('xs')}>
            {ystat.map((d) => (
              <div key={d.year}>
                <span className={cx('num')}>{d.year}年</span>
                <b>
                  <Cnt v={d.races} />
                  <small>戦</small>
                </b>
              </div>
            ))}
          </div>
        </figure>
      </div>
      <Stats rows={rows} keyLabel="年度" list={false} />
    </Pn>
  );
}

/* ---------- 図と説明を左右に置く枠（スマホは図→説明の順に積む） ---------- */
export const FigRow = ({ figure, lines }: { figure: ReactNode; lines: string[] }) => (
  <div className={cx('es-fx')}>
    {figure}
    <div className={cx('es-ex')}>
      {lines.filter(Boolean).map((l, i) => (
        <p key={i} className={l.startsWith('※') ? cx('note') : undefined}>
          <Rich text={l} />
        </p>
      ))}
    </div>
  </div>
);

/* ---------- 図：折れ線（縦軸は0始まり。線は2本まで、値が近い点は上下に振り分ける） ---------- */
export function LineChart({ title, x, series, label }: { title: string; x: [string, string][]; series: { name: string; cls: string; values: (number | null | undefined)[] }[]; label: string }) {
  const all = series.flatMap((s) => s.values).filter((v): v is number => num(v) !== undefined);
  const hi0 = Math.max(...all);
  const step = [5, 10, 20, 25, 50].find((s) => hi0 / s <= 5) ?? 50;
  const hi = Math.ceil(hi0 / step) * step;
  const ticks: number[] = [];
  for (let t = hi; t >= -1e-9; t -= step) ticks.push(t);
  const py = (v: number) => ((hi - v) / hi) * 100;
  return (
    <figure className={cx('jk-ch', 'es-lc')} data-anim="" role="img" aria-label={label}>
      <figcaption>
        <b>{title}</b>
        <span className={cx('lg')}>
          {series.map((s) => (
            <span key={s.name}>
              <i className={cx('ln', s.cls)} />
              {s.name}
            </span>
          ))}
        </span>
      </figcaption>
      <div className={cx('jk-plot')}>
        <div className={cx('gl')}>
          {ticks.map((t) => (
            <i key={t} style={{ top: `${py(t).toFixed(2)}%` }}>
              <em className={cx('num')}>{t}%</em>
            </i>
          ))}
        </div>
        <svg className={cx('ls')} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {series.map((s) => (
            <polyline
              key={s.name}
              className={cx(s.cls)}
              points={s.values
                .map((v, i) => (num(v) !== undefined ? `${xAt(i, x.length).toFixed(2)},${py(v as number).toFixed(2)}` : ''))
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </svg>
        {series.map((s, si) =>
          s.values.map((v, i) => {
            if (num(v) === undefined) return null;
            const other = series[1 - si]?.values[i];
            const up = num(other) === undefined || (v as number) > (other as number) || (v === other && si === 0);
            return (
              <span key={`${si}-${i}`} className={cx('pt', s.cls, !up && 'dn')} style={{ left: `${xAt(i, x.length)}%`, top: `${py(v as number).toFixed(2)}%`, ...iv(i) }}>
                <b className={cx('num')}>{pct(v)}</b>
              </span>
            );
          }),
        )}
      </div>
      <div className={cx('xs')}>
        {x.map(([l, sm]) => (
          <div key={l}>
            <span>{l}</span>
            {sm ? <small className={cx('num')}>{sm}</small> : null}
          </div>
        ))}
      </div>
    </figure>
  );
}

/* ---------- 図：芝とダートを距離帯ごとに比べる棒（PC・タブレットは左右に伸ばし、スマホは距離帯1行に上下2本）。0始まり ---------- */
export type BfRow = { label: string; l?: number; ln?: number; r?: number; rn?: number };
export function Butterfly({ title, rows, label, foot = '' }: { title: string; rows: BfRow[]; label: string; foot?: string }) {
  const vs = rows.flatMap((r) => [r.l, r.r]).filter((v): v is number => num(v) !== undefined);
  const mx = Math.max(...vs, 1);
  const side = (v: number | undefined, n: number | undefined, win: boolean, cls: string, tag: string) =>
    num(v) !== undefined ? (
      <span className={cx('es-bf-s', cls, win && 'win')}>
        <i className={cx('tg')}>{tag}</i>
        <b className={cx('num')}>{pct(v)}</b>
        <small className={cx('num')}>{int(n)}戦</small>
        <span className={cx('jk-b')}>
          <i style={{ width: `${(((v as number) / mx) * 100).toFixed(1)}%` }} />
        </span>
      </span>
    ) : (
      <span className={cx('es-bf-s', cls, 'na')}>
        <i className={cx('tg')}>{tag}</i>
        <b>-</b>
        <small />
        <span className={cx('jk-b')} />
      </span>
    );
  return (
    <figure className={cx('jk-ch', 'es-bf')} data-anim="" role="img" aria-label={label}>
      <figcaption>
        <b>{title}</b>
        <span className={cx('lg')}>
          <span>
            <i className={cx('sq', 'tf')} />芝
          </span>
          <span>
            <i className={cx('sq', 'dt')} />ダート
          </span>
        </span>
      </figcaption>
      <div className={cx('es-bf-h')}>
        <span>
          <SfTag sf="turf" />
        </span>
        <span>距離</span>
        <span>
          <SfTag sf="dirt" />
        </span>
      </div>
      {rows.map((r, i) => {
        const L = num(r.l);
        const Rr = num(r.r);
        return (
          <div key={r.label} className={cx('es-bf-row')} style={iv(i)}>
            <span className={cx('es-bf-k', 'num')}>{r.label}</span>
            {side(r.l, r.ln, L !== undefined && (Rr === undefined || L > Rr), 'l', '芝')}
            {side(r.r, r.rn, Rr !== undefined && (L === undefined || Rr > L), 'r', 'ダ')}
          </div>
        );
      })}
      {foot ? <p className={cx('es-fn')}>{foot}</p> : null}
    </figure>
  );
}

/* ---------- 図：良馬場と道悪（稍重〜不良）の複勝率を、芝・ダートで比べる横棒。0始まり・出走数つき ---------- */
export function CondBars({ title, groups, label }: { title: string; groups: { sf: 'turf' | 'dirt'; cls: string; rows: { label: string; v: number; n: number }[] }[]; label: string }) {
  const mx = Math.max(...groups.flatMap((g) => g.rows.map((r) => r.v)), 1);
  let i = 0;
  return (
    <figure className={cx('jk-ch', 'es-cb')} data-anim="" role="img" aria-label={label}>
      <figcaption>
        <b>{title}</b>
      </figcaption>
      <ul className={cx('es-cb-l')}>
        {groups.map((g) =>
          g.rows.map((r, k) => (
            <li key={`${g.sf}${k}`} className={cx(g.cls, k === 0 && 'g1')} style={iv(i++)}>
              <span className={cx('t')}>{k === 0 ? <SfTag sf={g.sf} /> : null}</span>
              <span className={cx('l')}>{r.label}</span>
              <span className={cx('jk-b')}>
                <i style={{ width: `${((r.v / mx) * 100).toFixed(1)}%` }} />
              </span>
              <b className={cx('num')}>{pct(r.v)}</b>
              <small className={cx('num')}>{int(r.n)}戦</small>
            </li>
          )),
        )}
      </ul>
    </figure>
  );
}
