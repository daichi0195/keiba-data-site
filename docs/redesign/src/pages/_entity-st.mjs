// 種牡馬詳細・調教師詳細の見本で共通に使う部品。
// 同じ種類のページである騎手詳細（pages/jockey.mjs・css/jockey.css・js/jockey.js。別の作業者の作）に見た目を揃えるため、
// 板・表・横棒・メーター・ページ内ナビは騎手詳細と同じ HTML（jk- で始まるクラス）を出し、CSS と JS も騎手詳細のものを読み込んで使う。
// このページだけの部品（左右に伸びる棒・折れ線・馬の一覧）は css/entity-st.css に書く（es- で始まるクラス）。
import fs from 'fs';
import * as L from '../lib.mjs';
const { esc, I, head, icon, fa } = L;

export const css = fs.readFileSync(L.S + 'css/jockey.css', 'utf8') + '\n' + fs.readFileSync(L.S + 'css/entity-st.css', 'utf8');
export const js = fs.readFileSync(L.S + 'js/jockey.js', 'utf8') + '\n' + fs.readFileSync(L.S + 'js/entity-st.js', 'utf8');
export const data = (f) => JSON.parse(fs.readFileSync(L.S + 'data/' + f, 'utf8'));

/* ---------- 13項目（現行 components/course/statColumns.ts と同じ並び・書式・ハイライト対象。見出しは騎手詳細と同じ2行） ---------- */
export const COLS = [
  ['races', '出走数', 'int', true], ['wins', '1着', 'int', true], ['places_2', '2着', 'int', true], ['places_3', '3着', 'int', true],
  ['win_rate', '勝率', 'pct', true], ['quinella_rate', '連対率', 'pct', true], ['place_rate', '複勝率', 'pct', true],
  ['win_payback', '単勝<br>回収率', 'pct', true], ['place_payback', '複勝<br>回収率', 'pct', true],
  ['avg_popularity', '平均<br>人気', 'dec', false], ['avg_rank', '平均<br>着順', 'dec', false], ['median_popularity', '人気<br>中央値', 'int', false], ['median_rank', '着順<br>中央値', 'int', false],
];
export const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v !== '' && Number.isFinite(+v) ? +v : undefined);
export const fmt = (v, f) => { v = num(v); if (v === undefined) return '-'; return f === 'pct' ? `${v.toFixed(1)}%` : f === 'dec' ? v.toFixed(1) : Math.round(v).toLocaleString('ja-JP'); };
export const pct = (v) => fmt(v, 'pct');
export const int = (v) => fmt(v, 'int');
const maxBy = (rows) => Object.fromEntries(COLS.filter((c) => c[3]).map(([k]) => [k, Math.max(...rows.map((r) => num(r[k])).filter((v) => v !== undefined), -Infinity)]));
export const ZERO = { races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, quinella_rate: 0, place_rate: 0, win_payback: 0, place_payback: 0 };
const MIN_BAR = 30; // 横棒で「最も高い」を言うときの出走数の下限（現行どおり）
export const a = (label) => `<a href="#" data-inert>${label}</a>`;
/** 行：key＝1列目のHTML、text＝文字だけの名前 */
export const R = (r, key, text) => ({ ...r, key, text: text ?? String(key).replace(/<[^>]+>/g, '') });
/** 並びを固定して、データがない区分は 0 で埋める（現行どおり） */
export const fill = (order, rows, keyOf, labelOf = (k) => k) => order.map((k) => R(rows.find((r) => keyOf(r) === k) ?? ZERO, labelOf(k)));
const shade = (v, lo, hi) => (hi === lo ? 1 : 0.55 + (0.45 * (v - lo)) / (hi - lo)).toFixed(2);
// 見出し・補足文は語のまとまりで折り返す（騎手詳細と同じ）
export const nb = (parts, sep = '') => parts.map((p) => `<span class="nb">${p}</span>`).join(sep);
const enoughOf = (rows) => rows.filter((r) => (r.races ?? 0) >= MIN_BAR);
const bestOf = (rows) => { const e = enoughOf(rows); return e.length ? e.reduce((m, r) => (r.place_rate > m.place_rate ? r : m)) : null; };
/** 見出しの下に置く補足文（板の外）「出走30以上で複勝率が最も高いのは…」 */
export const bestNote = (rows) => { const b = bestOf(rows); return b ? `${nb([`出走${MIN_BAR}以上で`, '複勝率が', '最も高いのは'])}<b class="nb">${b.text}の<span class="num">${fmt(b.place_rate, 'pct')}</span></b>` : '出走数が少ないため、数値は参考程度にご覧ください'; };

/**
 * 条件別・ランキングの共通部品（騎手詳細 pages/jockey.mjs の stats と同じ出力）。
 * 条件別　　：スマホ〜899pxは1件1行の横棒（名前｜棒｜数値）＋「全項目を見る」で13項目の表。900px以上は横棒の列を持つ表1枚
 * ランキング：どの幅でも最初から13項目の表（10件＋さらに表示）
 * 表は1列目固定・最大値ハイライト。出走30未満の行は灰色の棒＋「出走n」の小札
 * このページで足した指定：medal（順位の金銀銅を付けるか）、markRows（「最も高い」の対象にする行）、listSub（スマホの棒の行に添える数字）
 */
export function stats({ rows, keyLabel, summaryRows = [], highlight = true, rank = false, medal = true, initial = 0, bar = 'place_rate', barLabel = '複勝率<br>（横棒）', tone = '', mark = true, markRows = null, hint = '', list = true, listAlways = false, sub = false, shrink = false, abs = false }) {
  const max = maxBy(rows);
  const cond = bar === 'place_rate' && !abs; // 条件別の横棒：基準は出走30以上の行だけ
  const barFmt = (r) => (bar === 'wins' ? `<span class="num">${fmt(r.wins, 'int')}</span><small>勝</small>` : `<span class="num">${fmt(r[bar], 'pct')}</span>`);
  const enough = enoughOf(rows);
  const base = (cond && enough.length ? enough : rows).map((r) => num(r[bar]) ?? 0);
  // 長さ：全行の最大値が基準（数値の比＝棒の長さの比）。濃さ：灰の棒（出走30未満）を除いた緑の行の中で決める（騎手詳細と同じ）
  const all = rows.map((r) => num(r[bar]) ?? 0);
  const hi = Math.max(...base, 0), low = Math.min(...base), top = abs ? 100 : Math.max(...all, 0) || 1;
  const isFew = (r) => cond && (r.races ?? 0) < MIN_BAR;
  const w = (r) => Math.min(100, ((num(r[bar]) ?? 0) / top) * 100).toFixed(2);
  const op = (r) => (hi === low ? 1 : Math.min(1, Math.max(0.55, 0.55 + (0.45 * ((num(r[bar]) ?? 0) - low)) / (hi - low)))).toFixed(2);
  const barHtml = (r, sum) => `<span class="jk-b${sum ? ' sum' : ''}${!sum && isFew(r) ? ' few' : ''}"><i style="width:${w(r)}%${sum || isFew(r) ? '' : `;opacity:${op(r)}`}"></i></span>`;
  const best = cond && mark ? bestOf(markRows ?? rows) : null;
  const more = (i) => (initial && i >= initial ? ' class="more"' : '');
  const rk = (i) => (rank ? `<span class="jk-rk num${medal && i < 3 ? ` m${i + 1}` : ''}">${i + 1}</span>` : '');
  const few = (r) => (isFew(r) ? `<small class="num">出走${r.races ?? 0}</small>` : '');
  const listHtml = list ? `<ul class="jk-bl${tone ? ' ' + tone : ''}${rank ? ' rkl' : ''}${sub ? ' has-sub' : ''}" data-anim>${rows.map((r, i) => `<li${more(i)} style="--i:${initial ? i % initial : i}">${rk(i)}<span class="l">${r.key}${r.listSub ? `<small class="num">${r.listSub}</small>` : ''}${few(r)}</span>${barHtml(r)}<b class="v${best === r ? ' top' : ''}">${barFmt(r)}</b>${sub ? `<span class="s num">${fmt(r.races, 'int')}戦</span>` : ''}</li>`).join('')}</ul>` : '';
  const tr = (r, i, sum) => `<tr class="${[initial && i >= initial && !sum ? 'more' : '', sum ? 'sum' : '', sum && i === 0 ? 'sum1' : ''].filter(Boolean).join(' ')}" style="--i:${initial ? i % initial : i}">${rank ? `<td class="n">${rk(i)}</td>` : ''}<td class="k"><span class="nm${shrink && String(r.text).length > 5 ? ` lg" title="${esc(r.text)}` : ''}">${r.key}</span>${sum ? '' : few(r)}</td>${list ? `<td class="bc">${barHtml(r, sum)}</td>` : ''}${COLS.map(([k, , f, hl]) => { const v = num(r[k]); const t = fmt(v, f); return `<td>${highlight && !sum && hl && v !== undefined && v > 0 && v === max[k] ? `<span class="hl">${t}</span>` : t}</td>`; }).join('')}</tr>`;
  const table = `<div class="jk-tw"><table class="jk-t${rank ? ' rkt' : ''}${tone ? ' ' + tone : ''}" data-anim><thead><tr>${rank ? '<th scope="col" class="n">順位</th>' : ''}<th scope="col" class="k">${keyLabel}</th>${list ? `<th scope="col" class="bc">${barLabel}</th>` : ''}${COLS.map((c) => `<th scope="col">${c[1]}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => tr(r, i, false)).join('')}${summaryRows.map((r, i) => tr(r, i, true)).join('')}</tbody></table></div>`;
  const rest = initial ? rows.length - initial : 0;
  const onlyT = !(rest > 0) && !listAlways;
  const foot = list || rest > 0 || hint ? `<div class="jk-ft${!hint && onlyT ? ' only-t' : ''}">${hint ? `<span class="jk-hint">${hint}</span>` : ''}<span class="jk-bs${onlyT ? ' only-t' : ''}">${rest > 0 ? `<button type="button" class="jk-btn" data-tg="open-m" aria-expanded="false" data-open="さらに表示（残り${rest}件）" data-close="${initial}件までにする">さらに表示（残り${rest}件）</button>` : ''}${list ? `<button type="button" class="jk-btn tg-t" data-tg="open-t" aria-expanded="false" data-open="全項目を見る（13項目）" data-close="表を閉じる">全項目を見る（13項目）</button>` : ''}</span></div>` : '';
  return `<div class="jk-st${listAlways ? ' lst' : ''}${!list ? ' tbl' : ''}" data-box>${listHtml}<div class="jk-full">${table}</div>${foot}</div>`;
}
export const deflink = (t) => a(`${t}を見る`);
const SFJ = { turf: ['turf', '芝'], dirt: ['dirt', 'ダート'], jump: ['steeplechase', '障害'], obstacle: ['steeplechase', '障害'], steeplechase: ['steeplechase', '障害'] };
export const sfTag = (en) => `<i class="sf sm ${SFJ[en][0]}">${SFJ[en][1]}</i>`;
export const gTag = (g) => L.gradeBadge(g);
export const cnt = (v, dp = 0) => `<span class="num" data-count="${v}" data-dp="${dp}">${dp ? Number(v).toFixed(dp) : Number(v).toLocaleString('ja-JP')}</span>`;

/* ---------- 節（見出しは騎手詳細と同じ：名前と節名を語のまとまりで折り返す） ---------- */
export const H = (w, title, sub = '') => head(nb([esc(w), title], ' '), sub);
export const Hno = (w, title, sub = '') => head(nb([`${esc(w)}の`, title]), sub);
export const sec = (id, hd, inner) => `<section class="sc" id="${id}">${hd}${inner}</section>`;
export const pn = (inner, cls = '', attr = '') => `<div class="jk-pn${cls ? ' ' + cls : ''}"${attr ? ' ' + attr : ''}>${inner}</div>`;
/** 見出しの下の補足：従来の補足（jk-sb）と「出走30以上で…」（jk-nt） */
export const subs = (sub, note) => `${sub ? `<span class="jk-sb">${sub}</span>` : ''}${note ? `<span class="jk-nt">${note}</span>` : ''}`;

/* ---------- ページ内の移動（騎手詳細と同じ） ---------- */
export const nav = (list) => `<nav class="chips jk-nav" aria-label="ページ内"><div>${list.map(([id, l]) => `<a href="#${id}">${l}</a>`).join('')}</div></nav>`;

/* ---------- 冒頭：名前・主要な数字・傾向（5段階） ---------- */
const seg = (v) => `<span class="jk-seg" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => `<i${n === v ? ' class="on"' : ''}></i>`).join('')}</span>`;
export function hero({ crumb, name, h1, h1s, lead, kpi, races, period, updated, iso, verdictTitle, verdict }) {
  return `<nav class="jk-crumb" aria-label="パンくず">${a('HOME')}<span aria-hidden="true">/</span>${a(crumb)}<span aria-hidden="true">/</span><span>${esc(name)}</span></nav>
<div class="jk-pn jk-hero">
  <div class="jk-hl">
    <h1>${nb([esc(h1), `<small${h1s.startsWith('（') ? ' class="es-par"' : ''}>${h1s}</small>`])}</h1>
    <p class="jk-lead">${lead}</p>
    <ul class="jk-kpi" data-anim>${kpi.map(([l, v, dp, u]) => `<li><span>${l}</span><b>${cnt(v, dp)}${u ? `<small>${u}</small>` : ''}</b></li>`).join('')}</ul>
    <p class="jk-meta"><span>集計 <b>${period}</b></span><span>対象 <b class="num">${int(races)}レース</b></span><span>更新 <b><time datetime="${iso}">${updated}</time></b></span></p>
  </div>
  <div class="jk-hv">
    <div class="jk-h3"><h2>${verdictTitle}</h2><small class="num">${int(races)}レース</small></div>
    <div class="jk-vrs">${verdict.map(([l, pos, text]) => `<a class="jk-vr" href="#characteristics"><span class="k">${l}</span>${seg(pos)}<b>${text}</b>${I.chevR}</a>`).join('')}</div>
  </div>
</div>`;
}
export const tiles = (items) => pn(`<dl class="jk-tiles es-tl" data-anim>${items.filter((x) => x[1]).map(([l, v, s]) => `<div><dt>${l}</dt><dd><b>${v}</b>${s ? `<small>${s}</small>` : ''}</dd></div>`).join('')}</dl>`);

/* ---------- 文章（**強調** と名前のリンク。現行の RichText と同じ規則） ---------- */
function linkify(text, links) {
  if (!links.length) return esc(text);
  const sorted = [...links].sort((x, y) => y.length - x.length);
  const re = new RegExp(`(${sorted.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const used = new Set();
  return text.split(re).map((part) => (sorted.includes(part) && !used.has(part) ? (used.add(part), a(esc(part))) : esc(part))).join('');
}
export const rich = (text, links = []) => text.split(/(\*\*[^*]+\*\*)/g).map((p) => (p.startsWith('**') && p.endsWith('**') ? `<b>${linkify(p.slice(2, -2), links)}</b>` : linkify(p, links))).join('');
/** データ概要：先頭の結論文＋見出しつきの段落（見出しのない段落は title を補う） */
export const summary = (blocks, links, fallback = '全体成績') => pn(`<p class="jk-art-lead">${rich(blocks[0].text, links[blocks[0].key] ?? [])}</p><div class="jk-art-g">${blocks.slice(1).map((b) => `<div><h3>${b.title ?? fallback}</h3><p>${rich(b.text, links[b.key] ?? [])}</p></div>`).join('')}</div>`, 'jk-art');
export const faq = (items) => pn(items.map((it, i) => `<details${i === 0 ? ' open' : ''}><summary><b>${esc(it.q)}</b>${I.chevD}</summary><div class="qa-a">${it.a.split('\n').filter(Boolean).map((line, k) => `<p${line.startsWith('※') ? ' class="note"' : k === 0 && it.lead ? ' class="lead"' : ''}>${rich(line)}</p>`).join('')}</div></details>`).join(''), 'jk-qa');
export const about = (period, updated) => `<aside class="jk-about" aria-label="データの出典と集計方法"><h2>このデータについて</h2><p>中央競馬（JRA）のレース結果をもとに当サイトのデータベースで集計しています（集計期間：${period}、${updated}時点）。指標の定義と集計方法は${a('データの出典と集計方法')}をご覧ください。</p></aside>`;

/* ---------- 年度別：推移の図2つ（騎手詳細と同じ）と表 ---------- */
const roundAxis = (m) => { const v = m * 1.15; return [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150].find((x) => v <= x) ?? Math.ceil(v / 50) * 50; };
const xAt = (i, n) => ((i + 0.5) / n) * 100;
const grid = (maxV, n, unit) => Array.from({ length: n + 1 }, (_, i) => `<i style="top:${(i / n) * 100}%"><em class="num">${Math.round(maxV * (1 - i / n))}${unit}</em></i>`).join('');
export function yearCharts(lead, ystat) {
  const mx = roundAxis(Math.max(...lead.map((d) => d.wins)));
  const n = [4, 5, 3].find((k) => mx % k === 0) ?? 4;
  const ws = lead.map((d) => d.wins), hi = Math.max(...ws), lo = Math.min(...ws);
  const pts = lead.map((d, i) => ({ ...d, x: xAt(i, lead.length), y: ((Math.min(d.ranking, 50) - 1) / 49) * 100 })).filter((d) => d.ranking > 0);
  const rkl = (d) => (d.ranking > 50 ? '50位未満' : `${d.ranking}位`);
  const wins = `<figure class="jk-ch" data-anim role="img" aria-label="${lead.map((d) => `${d.year}年 ${d.wins}勝${d.ranking > 0 ? `・リーディング${rkl(d)}` : ''}`).join('、')}">
    <figcaption><b>勝利数とリーディング順位</b><span class="lg"><span><i class="sq"></i>勝利数</span><span><i class="ln k"></i>リーディング順位</span></span></figcaption>
    <div class="jk-plot">
      <div class="gr">${grid(mx, n, '')}</div>
      <div class="cl">${lead.map((d, i) => `<div style="--i:${i}"><i style="height:${((d.wins / mx) * 100).toFixed(1)}%;opacity:${shade(d.wins, lo, hi)}"></i></div>`).join('')}</div>
      ${pts.length > 1 ? `<svg class="ls" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline class="k" points="${pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}"/></svg>` : ''}
      ${pts.map((p, i) => `<span class="pt k tag" style="left:${p.x}%;top:${p.y}%;--i:${i}"><b class="num">${rkl(p)}</b></span>`).join('')}
    </div>
    <div class="xs">${lead.map((d) => `<div><span class="num">${d.year}年</span><b>${cnt(d.wins)}<small>勝</small></b></div>`).join('')}</div>
  </figure>`;
  const series = [['place_rate', '複勝率', 'g'], ['quinella_rate', '連対率', 'k'], ['win_rate', '勝率', 's']];
  const rm = Math.max(20, Math.ceil(Math.max(...ystat.map((d) => d.place_rate)) / 20) * 20);
  const rates = `<figure class="jk-ch" data-anim role="img" aria-label="${ystat.map((d) => `${d.year}年 勝率${pct(d.win_rate)}・連対率${pct(d.quinella_rate)}・複勝率${pct(d.place_rate)}`).join('、')}">
    <figcaption><b>勝率・連対率・複勝率の推移</b><span class="lg">${series.map(([, l, cl]) => `<span><i class="ln ${cl}"></i>${l}</span>`).join('')}</span></figcaption>
    <div class="jk-plot">
      <div class="gr">${grid(rm, rm / 20, '%')}</div>
      <svg class="ls" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${series.map(([k, , cl]) => `<polyline class="${cl}" points="${ystat.map((d, i) => `${xAt(i, ystat.length).toFixed(2)},${(100 - (d[k] / rm) * 100).toFixed(2)}`).join(' ')}"/>`).join('')}</svg>
      ${series.map(([k, , cl]) => ystat.map((d, i) => `<span class="pt ${cl}" style="left:${xAt(i, ystat.length)}%;top:${(100 - (d[k] / rm) * 100).toFixed(2)}%;--i:${i}"><b class="num">${pct(d[k])}</b></span>`).join('')).join('')}
    </div>
    <div class="xs">${ystat.map((d) => `<div><span class="num">${d.year}年</span><b>${cnt(d.races)}<small>戦</small></b></div>`).join('')}</div>
  </figure>`;
  const rows = [...ystat].reverse().map((y) => R(y, `<span class="num">${y.year}年</span>`, `${y.year}年`));
  return pn(`<div class="jk-chs">${wins}${rates}</div>${stats({ rows, keyLabel: '年度', list: false })}`);
}

/* ---------- 図と説明を左右に置く枠（1100px以上。図は最大640px。スマホは図→説明の順に積む） ---------- */
export const figRow = (figure, lines) => `<div class="es-fx">${figure}<div class="es-ex">${lines.filter(Boolean).map((l) => `<p${l.startsWith('※') ? ' class="note"' : ''}>${rich(l)}</p>`).join('')}</div></div>`;
/* ---------- 図：折れ線（騎手詳細の推移の図と同じ作り。縦軸は0始まり。線は2本まで、値が近い点は上下に振り分ける） ---------- */
export function lineChart({ title, x, series, label }) {
  const all = series.flatMap((s) => s.values).filter((v) => num(v) !== undefined);
  const hi0 = Math.max(...all);
  const step = [5, 10, 20, 25, 50].find((s) => hi0 / s <= 5) ?? 50;
  const hi = Math.ceil(hi0 / step) * step;
  const ticks = []; for (let t = hi; t >= -1e-9; t -= step) ticks.push(t);
  const py = (v) => ((hi - v) / hi) * 100;
  return `<figure class="jk-ch es-lc" data-anim role="img" aria-label="${esc(label)}">
    <figcaption><b>${title}</b><span class="lg">${series.map((s) => `<span><i class="ln ${s.cls}"></i>${s.name}</span>`).join('')}</span></figcaption>
    <div class="jk-plot">
      <div class="gr">${ticks.map((t) => `<i style="top:${py(t).toFixed(2)}%"><em class="num">${t}%</em></i>`).join('')}</div>
      <svg class="ls" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${series.map((s) => `<polyline class="${s.cls}" points="${s.values.map((v, i) => (num(v) !== undefined ? `${xAt(i, x.length).toFixed(2)},${py(v).toFixed(2)}` : '')).filter(Boolean).join(' ')}"/>`).join('')}</svg>
      ${series.map((s, si) => s.values.map((v, i) => {
        if (num(v) === undefined) return '';
        const other = series[1 - si]?.values[i];
        const up = num(other) === undefined || v > other || (v === other && si === 0);
        return `<span class="pt ${s.cls}${up ? '' : ' dn'}" style="left:${xAt(i, x.length)}%;top:${py(v).toFixed(2)}%;--i:${i}"><b class="num">${pct(v)}</b></span>`;
      }).join('')).join('')}
    </div>
    <div class="xs">${x.map(([l, s]) => `<div><span>${l}</span>${s ? `<small class="num">${s}</small>` : ''}</div>`).join('')}</div>
  </figure>`;
}
/* ---------- 図：芝とダートを距離帯ごとに比べる棒。PC・タブレットは左右に伸ばし、スマホは距離帯1行に上下2本 ----------
   棒は芝・ダートの札と同じ色で、濃淡は付けない（長さだけで比べる）。0始まり */
export function butterfly({ title, rows, label, foot = '' }) {
  const vs = rows.flatMap((r) => [r.l, r.r]).filter((v) => num(v) !== undefined);
  const mx = Math.max(...vs, 1);
  const side = (v, n, win, cls, tag) => (num(v) !== undefined
    ? `<span class="es-bf-s ${cls}${win ? ' win' : ''}"><i class="tg">${tag}</i><b class="num">${pct(v)}</b><small class="num">${int(n)}戦</small><span class="jk-b"><i style="width:${((v / mx) * 100).toFixed(1)}%"></i></span></span>`
    : `<span class="es-bf-s ${cls} na"><i class="tg">${tag}</i><b>-</b><small></small><span class="jk-b"></span></span>`);
  return `<figure class="jk-ch es-bf" data-anim role="img" aria-label="${esc(label)}">
    <figcaption><b>${title}</b><span class="lg"><span><i class="sq tf"></i>芝</span><span><i class="sq dt"></i>ダート</span></span></figcaption>
    <div class="es-bf-h"><span>${sfTag('turf')}</span><span>距離</span><span>${sfTag('dirt')}</span></div>
    ${rows.map((r, i) => `<div class="es-bf-row" style="--i:${i}"><span class="es-bf-k num">${r.label}</span>${side(r.l, r.ln, num(r.l) !== undefined && (num(r.r) === undefined || r.l > r.r), 'l', '芝')}${side(r.r, r.rn, num(r.r) !== undefined && (num(r.l) === undefined || r.r > r.l), 'r', 'ダ')}</div>`).join('')}
    ${foot ? `<p class="es-fn">${foot}</p>` : ''}
  </figure>`;
}
/* ---------- 図：良馬場と道悪（稍重〜不良）の複勝率を、芝・ダートで比べる横棒。0始まり・出走数つき ---------- */
export function condBars({ title, groups, label }) {
  const mx = Math.max(...groups.flatMap((g) => g.rows.map((r) => r.v)), 1);
  let i = 0;
  return `<figure class="jk-ch es-cb" data-anim role="img" aria-label="${esc(label)}">
    <figcaption><b>${title}</b></figcaption>
    <ul class="es-cb-l">${groups.map((g) => g.rows.map((r, k) => `<li class="${g.cls}${k === 0 ? ' g1' : ''}" style="--i:${i++}"><span class="t">${k === 0 ? sfTag(g.sf) : ''}</span><span class="l">${r.label}</span><span class="jk-b"><i style="width:${((r.v / mx) * 100).toFixed(1)}%"></i></span><b class="num">${pct(r.v)}</b><small class="num">${int(r.n)}戦</small></li>`).join('')).join('')}</ul>
  </figure>`;
}

/* ---------- 特徴：5段階のメーターと根拠の横棒（騎手詳細と同じ。比較対象の棒には ref を付ける） ---------- */
const pairBars = (items) => `<ul class="jk-ev">${items.map(([l, v, ref], i) => `<li style="--i:${i}"><span>${l}</span><span class="jk-b${ref ? ' ref' : ''}"><i style="width:${v}%"></i></span><b class="num">${v.toFixed(1)}%</b></li>`).join('')}</ul>`;
export const meter = ({ label, pos, result, scale, ev }) => `<div class="jk-mt" data-anim><p class="mh"><span>${label}</span><b>${result}</b></p><div class="jk-seg big" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => `<i${n === pos ? ' class="on"' : ''}></i>`).join('')}</div><p class="sc3"><span>${scale[0]}</span><span>${scale[1]}</span><span>${scale[2]}</span></p>${pairBars(ev.filter((e) => num(e[1]) !== undefined))}</div>`;
export const meters = (list) => pn(`<div class="jk-mts">${list.map(meter).join('')}</div><div class="jk-ft"><span class="jk-hint">${deflink('判定の基準')}</span></div>`);

/* ---------- 注目ポイント：得意・苦手なコース TOP5（出走10回以上・複勝率順＝現行どおり） ---------- */
export function highlights(courses, d) {
  const pool = courses.filter((c) => c.races >= 10).sort((x, y) => y.place_rate - x.place_rate);
  const row = (c) => { const l = d.courseShort[c.name]; return R(c, d.courseUrl[c.name] ? a(l) : l, l); };
  const top = pool.slice(0, 5).map(row), bottom = pool.slice(-5).reverse().map(row);
  const opt = { keyLabel: 'コース', highlight: false, rank: true, sub: true, listAlways: true, abs: true };
  return `<div class="jk-two" data-sync>
    <div class="jk-pn"><div class="jk-h3"><h3>得意なコース TOP5</h3><small>10走以上・複勝率が高い順</small></div>${stats({ rows: top, ...opt })}</div>
    <div class="jk-pn"><div class="jk-h3"><h3>苦手なコース TOP5</h3><small>10走以上・複勝率が低い順</small></div>${stats({ rows: bottom, ...opt, tone: 'weak' })}</div>
  </div>
  <p class="jk-foot">※出走回数10回以上のコースを対象に、複勝率で評価しています</p>`;
}

/* ---------- コース別：競馬場ごとに開く（最大値は競馬場ごとに判定＝現行どおり） ---------- */
export const RC = [['sapporo', '札幌'], ['hakodate', '函館'], ['fukushima', '福島'], ['niigata', '新潟'], ['tokyo', '東京'], ['nakayama', '中山'], ['chukyo', '中京'], ['kyoto', '京都'], ['hanshin', '阪神'], ['kokura', '小倉']];
export function courseAcc(courses, d) {
  const groups = RC.map(([en, ja]) => ({ ja, rows: courses.filter((c) => c.racecourse_en === en).sort((x, y) => (x.surface_en !== y.surface_en ? (x.surface_en === 'turf' ? -1 : 1) : x.distance - y.distance)) })).filter((g) => g.rows.length);
  const racesOf = (g) => g.rows.reduce((s, r) => s + r.races, 0);
  const busiest = groups.reduce((m, g) => (racesOf(g) > racesOf(m) ? g : m), groups[0]);
  const row = (c) => { const l = d.courseLabel[c.name]; const body = `<span class="num">${l.replace(/^(芝|ダート|ダ|障害)/, '')}</span>`; return R(c, `${sfTag(c.surface_en)}${d.courseUrl[c.name] ? a(body) : body}`, l); };
  const cnts = (g) => [['turf', '芝'], ['dirt', 'ダ'], ['steeplechase', '障']].map(([cls, s]) => { const k = g.rows.filter((r) => SFJ[r.surface_en][0] === cls).length; return k ? `<span class="sf sm ${cls}">${s} ${k}</span>` : ''; }).join('');
  return pn(groups.map((g) => `<details${g === busiest ? ' open' : ''}><summary><b>${g.ja}競馬場</b><span class="ac-c">${cnts(g)}</span><span class="ac-n num">${int(racesOf(g))}戦</span>${I.chevD}</summary><div class="ac-b">${stats({ rows: g.rows.map(row), keyLabel: 'コース', mark: false })}</div></details>`).join(''), 'jk-acc');
}

/* ---------- 重賞勝ち（騎手詳細と同じ：勝利数のマス＋一覧。5件＋さらに表示） ---------- */
export function gradedWins(wins, classStats, fourth) {
  const g = ['G1', 'G2', 'G3'].map((k) => classStats.find((c) => c.class_name === k) ?? { wins: 0, races: 0 });
  const sd = (iso) => iso.slice(0, 10).split('-').map(Number).join('/');
  return pn(`<ul class="jk-gs" data-anim><li class="tot"><span>平地重賞</span><b>${cnt(g.reduce((s, c) => s + c.wins, 0))}<small>勝</small></b><em class="num">${g.reduce((s, c) => s + c.races, 0)}戦</em></li>${g.map((c, i) => `<li>${gTag(`G${i + 1}`)}<b>${cnt(c.wins)}<small>勝</small></b><em class="num">${c.races}戦</em></li>`).join('')}</ul>
    <div class="jk-gw" role="table" aria-label="重賞勝ちの一覧">
      <div class="h" role="row"><span role="columnheader">レース</span><span role="columnheader">日付</span><span role="columnheader">馬名</span><span role="columnheader">${fourth[0]}</span><span role="columnheader">人気</span></div>
      ${wins.map((w, i) => `<div class="r${i >= 5 ? ' more' : ''}" role="row"><span class="rc" role="cell">${gTag(w.grade)}<b>${esc(w.race_name)}</b></span><span class="dt num" role="cell">${sd(w.date)}</span><span class="hn" role="cell">${esc(w.horse_name)}</span><span class="co" role="cell">${fourth[1](w)}</span><span class="pp num" role="cell">${w.popularity ? `${w.popularity}<small>番人気</small>` : '—'}</span></div>`).join('')}
    </div>
    <div class="jk-ft">${wins.length >= 30 ? '<span class="jk-hint">最大30件まで表示</span>' : ''}<span class="jk-bs">${wins.length > 5 ? `<button type="button" class="jk-btn" data-tg="open-m" aria-expanded="false" data-open="さらに表示（残り${wins.length - 5}件）" data-close="5件までにする">さらに表示（残り${wins.length - 5}件）</button>` : ''}</span></div>`, '', 'data-box');
}
/* ---------- 馬の一覧（代表産駒・主な管理馬）：PCは表、スマホは1頭2〜3行。5件＋さらに表示 ---------- */
export const titles = (list) => (list.length ? list.map((t) => { const m = t.match(/^(G[123])\s*(.+)$/); return `<span class="tt">${m ? `${gTag(m[1])}${esc(m[2])}` : esc(t)}</span>`; }).join('') : '<span class="none">—</span>');
/** cols: [{ label, m: スマホでの役割（m1 名前／m1b 名前の横／m2 右端／m3 2行目／m4 補足）, ml: スマホで前に付ける項目名, num }] */
export function horseList({ cols, rows, initial = 5, note = '', label }) {
  const rest = rows.length - initial;
  return pn(`<div class="es-lt" role="region" aria-label="${label}" tabindex="0"><table>
  <thead><tr>${cols.map((c) => `<th scope="col"${c.num ? ' class="r"' : ''}>${c.label}</th>`).join('')}</tr></thead>
  <tbody>${rows.map((cells, i) => `<tr${i >= initial ? ' class="more"' : ''}>${cells.map((cell, ci) => `<td class="${cols[ci].m}${cols[ci].num ? ' r num' : ''}"${cols[ci].ml ? ` data-l="${cols[ci].ml}"` : ''}>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <div class="jk-ft">${note ? `<span class="jk-hint">${note}</span>` : ''}<span class="jk-bs">${rest > 0 ? `<button type="button" class="jk-btn" data-tg="open-m" aria-expanded="false" data-open="さらに表示（残り${rest}件）" data-close="${initial}件までにする">さらに表示（残り${rest}件）</button>` : ''}</span></div>`, '', 'data-box');
}
/** 条件別の節（騎手詳細と同じ：節の見出しは地の上、補足は見出しの下、板1枚）。
 *  note: false で「出走30以上で…」を出さない。markRows でその対象の行を絞る（障害を外すなど）。before は表の上に置く図 */
export const cond = (w, id, title, rows, opt = {}, { sub = '', note = true, markRows = null, before = '', own = false } = {}) => sec(id, (own ? Hno : H)(w, title, subs(sub, note ? bestNote(markRows ?? rows) : '')), pn(`${before}${stats({ rows, mark: note, markRows, ...opt })}`));
export const rankSec = (w, id, title, rows, keyLabel, hint, sub = '', opt = {}) => sec(id, H(w, title, subs(sub, '')), pn(stats({ rows, keyLabel, rank: true, initial: 10, bar: 'wins', barLabel: '勝利数<br>（横棒）', hint, shrink: true, ...opt })));
