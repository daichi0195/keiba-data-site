// 条件別・ランキングの共通部品（見本 pages/jockey.mjs・pages/_entity-st.mjs の stats() と同じ出力）。
// 条件別　　：スマホ〜899pxは1件1行の横棒（名前｜棒｜数値）＋「全項目を見る」で13項目の表。900px以上は横棒の列を持つ表1枚
// 　　　　　　横棒と表は同じ <table> 1つで描き、〜899pxで閉じているあいだは CSS（.lm）が「名前｜棒｜複勝率」の3列だけを1件1行に並べる
// 　　　　　　（同じデータを棒の一覧と表で2回描かない。HTML・RSC ペイロード・DOM を軽くするため）
// ランキング：どの幅でも最初から13項目の表（10件＋さらに表示）。棒の一覧・横棒の列は描かない
// 得意・苦手（listAlways）：どの幅でも棒の一覧＋「全項目を見る」で一覧の下に表を足す（両方を同時に見せるので2つ描く）
// 表は1列目固定・最大値ハイライト。出走30未満の行は灰色の棒＋「出走n」の小札
// ここ（サーバー）では棒の長さ・濃さ・ハイライト・「最も高い」を決めて、行を数値の配列に詰めて StatsView（クライアント）に渡す。
// 13項目のセルを RSC ペイロードの要素として送らず、数値だけを送って HTML はクライアント部品の SSR で描く（ペイロードを軽くするため）
import type { ReactNode } from 'react';
import StatsView, { type VRow } from './StatsView';
import { COLS, MIN_BAR, bestOf, enoughOf, num, type Row } from './format';

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
  /** 閉じた開閉（details）の中に置く表：開くまで13項目と棒を描かない */
  closed?: boolean;
};

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
  closed = false,
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
  const best = cond && mark ? bestOf(markRows ?? rows) : null;
  // 〜899pxで表を1件1行の横棒として見せる（.lm）。上の図と同じ数字の表（es-nol）は棒を見せない
  const lm = list && !rank && !listAlways && !extra.split(' ').includes('es-nol');
  // 横棒の列（900px以上の条件別の表）。順位つきの表（.rkt）では見せないので描かない（ランキングは棒の一覧も描かない）
  const bcCol = list && !rank;
  const bars = bcCol || (list && listAlways);
  const pack = (r: Row, sum: boolean): VRow => {
    const v = COLS.map(([k]) => num(r[k]) ?? null);
    let h = 0;
    if (highlight && !sum) COLS.forEach(([k, , , hl], j) => { const x = v[j]; if (hl && x !== null && x > 0 && x === max[k]) h |= 1 << j; });
    const out: VRow = { k: r.key, v };
    if (h) out.h = h;
    if (bars) {
      out.w = w(r);
      if (!sum && !isFew(r)) out.o = op(r);
    }
    if (!sum && isFew(r)) out.f = r.races ?? 0;
    if (r.listSub && (lm || listAlways) && !sum) out.ls = r.listSub;
    if (shrink && r.text.length > 5) out.t = r.text;
    if (best === r) out.b = 1;
    return out;
  };
  return (
    <StatsView
      rows={rows.map((r) => pack(r, false))}
      sums={summaryRows.length ? summaryRows.map((r) => pack(r, true)) : undefined}
      keyLabel={keyLabel}
      o={{ rank, medal, initial, bar, barLabel, tone, hint, list, listAlways, sub, extra, lm, bcCol, deferMore: rank && !listAlways && initial > 0, closed }}
    />
  );
}
