// 記事の MDX で使う棒グラフ・差分の表・横棒の比較（サーバーで描く。画面に入ったときの動きは ArticleEffects が付ける）。
// 見本 docs/redesign/src/pages/article.mjs の chart()・diffTable() を React に移したもの。
import { cx } from '../cx';

type CSS = React.CSSProperties & Record<`--${string}`, string | number>;

/* ---------- 棒グラフ（現行 SeasonDualChart と同じ props） ----------
   2系列＝牡馬と牝馬（青・赤紫）、色の指定（color1・color2）がある2系列＝比較の相手（灰）と注目（テーマカラー）、
   1系列＝ highlightLabel の棒だけテーマカラー。accent={1} で1つ目の系列を注目にする。 */
type SeasonData = { label: string; male: number; female?: number };

const tickStep = (max: number) => (max <= 15 ? 5 : max <= 40 ? 10 : 25);

// 横軸の字：「400-419」「520以上」などは、狭いときに数字のまとまりで折り返す
function XLabel({ text }: { text: string }) {
  const m = text.match(/^(\d+-?)(.+)$/);
  if (!m) return <>{text}</>;
  return (
    <>
      <span>{m[1]}</span>
      <span>{m[2]}</span>
    </>
  );
}

let chartSeq = 0;

export function SeasonDualChart({
  title = '',
  data,
  yMax = 30,
  unit = '%',
  label1 = '牡馬',
  label2 = '牝馬',
  color1,
  highlightLabel,
  accent,
  note,
}: {
  title?: string;
  data: SeasonData[];
  yMax?: number;
  unit?: string;
  label1?: string;
  label2?: string;
  color1?: string;
  color2?: string;
  highlightLabel?: string;
  accent?: 1 | 2;
  note?: string;
}) {
  const rows = data.map((d) => ({ label: d.label, v: [d.male, d.female].filter((x): x is number => typeof x === 'number') }));
  const single = rows.every((r) => r.v.length === 1);
  const compare = !!color1 || !!accent;
  const names = [label1, label2];
  const cls = single ? ['mute'] : compare ? (accent === 1 ? ['acc', 'mute'] : ['mute', 'acc']) : ['male', 'female'];
  const ticks: number[] = [];
  for (let t = 0; t <= yMax; t += tickStep(yMax)) ticks.push(t);
  if (ticks[ticks.length - 1] !== yMax) ticks.push(yMax); // 上端（yMax）には必ず線を引く
  const many = rows.length >= 7;
  const id = `ch-${++chartSeq}`;

  return (
    <figure className={cx('ch', single && 'one', many && 'many')} style={{ '--max': yMax, '--n': rows.length } as CSS} aria-labelledby={id} data-reveal="">
      <figcaption>
        <b id={id}>{title}</b>
        {single ? (
          <span className={cx('ch-lg')}>
            {names[0]}（{unit}）
          </span>
        ) : (
          <span className={cx('ch-lg')}>
            {names.map((nm, i) => (
              <span key={i}>
                <i className={cx(cls[i])} />
                {nm}
              </span>
            ))}
          </span>
        )}
      </figcaption>
      <div className={cx('ch-plot')} aria-hidden="true">
        <div className={cx('ch-y')}>
          {ticks.map((t) => (
            <span key={t} style={{ '--t': t } as CSS}>
              <em className={cx('num')}>
                {t}
                {unit}
              </em>
            </span>
          ))}
        </div>
        <div className={cx('ch-g')}>
          {rows.map((r, gi) => (
            <div key={r.label} className={cx('ch-grp')} style={{ '--i': gi } as CSS}>
              <div className={cx('ch-bars')}>
                {r.v.map((v, i) => (
                  <div
                    key={i}
                    className={cx('ch-b', single ? (r.label === highlightLabel ? 'acc' : 'mute') : cls[i])}
                    style={{ '--v': v } as CSS}
                    title={`${r.label}${single ? '' : '・' + names[i]} ${v.toFixed(1)}${unit}`}
                  >
                    <span className={cx('num')} data-to={v.toFixed(1)}>
                      <b>{v.toFixed(1)}</b>
                      <small>{unit}</small>
                    </span>
                    <i />
                  </div>
                ))}
              </div>
              <span className={cx('ch-x')}>
                <XLabel text={r.label} />
              </span>
            </div>
          ))}
        </div>
      </div>
      <table className={cx('vh')}>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th />
            {(single ? [names[0]] : names).map((nm) => (
              <th key={nm}>{nm}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th>{r.label}</th>
              {r.v.map((v, i) => (
                <td key={i}>
                  {v.toFixed(1)}
                  {unit}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {note && <p className={cx('ch-n')}>{note}</p>}
    </figure>
  );
}

/* ---------- 差分の表（体重帯ごとの複勝率差分）：数値の右に、0を中心に左右へ伸びる棒 ----------
   head：見出し行、rows：[区分, 値1, 値2, …]（値は「+5.8ポイント」「−0.5ポイント」の形）。1列目の値だけ太字 */
export function DiffTable({ head, rows }: { head: string[]; rows: string[][] }) {
  const num = (s: string) => parseFloat(s.replace('−', '-'));
  const span = Math.ceil(Math.max(...rows.flatMap((r) => r.slice(1).map((x) => Math.abs(num(x))))));
  return (
    <div className={cx('tb')} data-reveal="">
      <table>
        <thead>
          <tr>
            {head.map((t) => (
              <th key={t} scope="col">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, ...vals]) => (
            <tr key={k}>
              <th scope="row" className={cx('num')}>
                {k}
              </th>
              {vals.map((s, i) => {
                const v = num(s);
                const m = s.match(/^([+−-][\d.]+)(.*)$/);
                return (
                  <td key={i} className={cx(v < 0 ? 'neg' : 'pos')}>
                    <span className={cx('df')}>
                      <span className={cx('df-v')}>
                        <b className={cx('num', i > 0 && 'reg')}>{m ? m[1] : s}</b>
                        {m && <small>{m[2]}</small>}
                      </span>
                      <span className={cx('df-b')} aria-hidden="true">
                        <i style={{ '--w': `${((Math.abs(v) / span) * 50).toFixed(1)}%` } as CSS} />
                      </span>
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- 横棒の比較（現行 BarCompareChart と同じ props） ----------
   highlight の棒はテーマカラー、それ以外は灰。baseline（全体平均など）は点線。数値の文字は濃い灰 */
type Item = { label: string; value: number; count?: number; color?: string; highlight?: boolean };

export function BarCompareChart({
  title,
  items,
  unit = '',
  max,
  baseline,
  decimals = 1,
}: {
  title?: string;
  items: Item[];
  unit?: string;
  max?: number;
  baseline?: { value: number; label?: string };
  decimals?: number;
}) {
  const dataMax = Math.max(...items.map((i) => i.value), baseline?.value ?? 0);
  const top = max ?? Math.ceil((dataMax * 1.1) / 10) * 10;
  const pct = (v: number) => `${Math.min(100, (v / top) * 100).toFixed(2)}%`;
  return (
    <figure className={cx('bx')} data-reveal="">
      <figcaption>
        {title && <b>{title}</b>}
        {baseline && (
          <span className={cx('bx-bl')}>
            <i aria-hidden="true" />
            {baseline.label ?? '全体平均'}（{baseline.value.toFixed(decimals)}
            {unit}）
          </span>
        )}
      </figcaption>
      <div className={cx('bx-c')}>
        {items.map((it, i) => {
          const w = (it.value / top) * 100;
          return (
            <div key={`${it.label}-${i}`} className={cx('bx-r', it.highlight && 'acc')} style={{ '--w': pct(it.value), '--i': i } as CSS}>
              <span className={cx('bx-k')}>
                <b>{it.label}</b>
                {it.count != null && <small className={cx('num')}>n={it.count.toLocaleString()}</small>}
              </span>
              <span className={cx('bx-t')}>
                <i />
                <span className={cx('bx-v', 'num', w > 82 && 'inb')} data-to={it.value.toFixed(decimals)}>
                  <b>{it.value.toFixed(decimals)}</b>
                  <small>{unit}</small>
                </span>
              </span>
            </div>
          );
        })}
        {baseline && (
          <span className={cx('bx-ln')} aria-hidden="true">
            <i style={{ '--b': pct(baseline.value) } as CSS} />
          </span>
        )}
      </div>
      <div className={cx('bx-s', 'num')} aria-hidden="true">
        <span>
          0{unit}
        </span>
        <span>
          {top}
          {unit}
        </span>
      </div>
    </figure>
  );
}
