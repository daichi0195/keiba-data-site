// 騎手詳細ページの見本（題材：C.ルメール / id 5339）
// データ：data/jockey-05339.json（https://storage.googleapis.com/umadata/jockey/05339.json。lib/getJockeyDataFromGCS.ts と同じ取得元）
//         data/jockey-05339-text.json（データ概要とQ&Aの文。現行の生成関数の出力と同じ）
import fs from 'fs';
import * as L from '../lib.mjs';
const { I, esc, head, ad, icon, fa } = L;
const S = L.S;
const j = JSON.parse(fs.readFileSync(S + 'data/jockey-05339.json', 'utf8'));
const TXT = JSON.parse(fs.readFileSync(S + 'data/jockey-05339-text.json', 'utf8'));
const NAME = j.name;
const WHO = `${NAME}騎手`;

/* ---------- 13項目（現行 components/course/statColumns.ts と同じ） ---------- */
const COLS = [
  ['races', '出走数', 'int', true], ['wins', '1着', 'int', true], ['places_2', '2着', 'int', true], ['places_3', '3着', 'int', true],
  ['win_rate', '勝率', 'pct', true], ['quinella_rate', '連対率', 'pct', true], ['place_rate', '複勝率', 'pct', true],
  ['win_payback', '単勝<br>回収率', 'pct', true], ['place_payback', '複勝<br>回収率', 'pct', true],
  ['avg_popularity', '平均<br>人気', 'dec', false], ['avg_rank', '平均<br>着順', 'dec', false], ['median_popularity', '人気<br>中央値', 'int', false], ['median_rank', '着順<br>中央値', 'int', false],
];
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v !== '' && Number.isFinite(+v) ? +v : undefined);
const fmt = (v, f) => { v = num(v); if (v === undefined) return '-'; return f === 'pct' ? `${v.toFixed(1)}%` : f === 'dec' ? v.toFixed(1) : Math.round(v).toLocaleString('ja-JP'); };
const maxBy = (rows) => Object.fromEntries(COLS.filter((c) => c[3]).map(([k]) => [k, Math.max(...rows.map((r) => num(r[k])).filter((v) => v !== undefined), -Infinity)]));
const ZERO = { races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, quinella_rate: 0, place_rate: 0, win_payback: 0, place_payback: 0 };
const MIN_BAR = 30; // 横棒で「最も高い」を言うときの出走数の下限（現行どおり）
const a = (label) => `<a href="#" data-inert>${label}</a>`;

// 見出し・補足文は語のまとまりで折り返す（語の途中で割らない。コース詳細と同じ）
const nb = (parts, sep = '') => parts.map((p) => `<span class="nb">${p}</span>`).join(sep);
const H = (title, sub = '') => head(nb([esc(WHO), title], ' '), sub);
const Hno = (title, sub = '') => head(nb([`${esc(WHO)}の`, title]), sub);

/** 出走30以上の行（濃さ・長さ・「最も高い」の基準。コース詳細と同じ） */
const enoughOf = (rows) => rows.filter((r) => (r.races ?? 0) >= MIN_BAR);
const bestOf = (rows) => { const e = enoughOf(rows); return e.length ? e.reduce((m, r) => (r.place_rate > m.place_rate ? r : m)) : null; };
/** 見出しの下に置く補足文（板の外） */
const bestNote = (rows) => { const b = bestOf(rows); return b ? `${nb([`出走${MIN_BAR}以上で`, '複勝率が', '最も高いのは'])}<b class="nb">${b.text}の<span class="num">${fmt(b.place_rate, 'pct')}</span></b>` : '出走数が少ないため、数値は参考程度にご覧ください'; };

/**
 * 条件別・ランキングの共通部品。
 * 条件別　　：スマホ〜899pxは1件1行の横棒（名前｜棒｜数値）＋「全項目を見る」で13項目の表。900px以上は横棒の列を持つ表1枚
 * ランキング：どの幅でも最初から13項目の表（10件＋さらに表示。CSS が .rkt の表を見て切り替える）
 * 表は1列目固定・最大値ハイライト。出走30未満の行は灰色の棒＋「出走n」の小札
 */
function stats({ rows, keyLabel, summaryRows = [], highlight = true, rank = false, initial = 0, bar = 'place_rate', barLabel = '複勝率<br>（横棒）', tone = '', mark = true, hint = '', list = true, listAlways = false, sub = false, shrink = false, abs = false }) {
  const max = maxBy(rows);
  const cond = bar === 'place_rate' && !abs; // 条件別の横棒：基準は出走30以上の行だけ
  const barFmt = (r) => (bar === 'wins' ? `<span class="num">${fmt(r.wins, 'int')}</span><small>勝</small>` : `<span class="num">${fmt(r[bar], 'pct')}</span>`);
  const enough = enoughOf(rows);
  // 長さ：全行の最大値が基準（数値の比＝棒の長さの比）。濃さ：灰の棒（出走30未満）を除いた緑の行の中で決める
  const all = rows.map((r) => num(r[bar]) ?? 0);
  const base = (cond && enough.length ? enough : rows).map((r) => num(r[bar]) ?? 0);
  const hi = Math.max(...base, 0), low = Math.min(...base), top = abs ? 100 : Math.max(...all, 0) || 1;
  const isFew = (r) => cond && (r.races ?? 0) < MIN_BAR;
  const w = (r) => Math.min(100, ((num(r[bar]) ?? 0) / top) * 100).toFixed(2);
  const op = (r) => (hi === low ? 1 : Math.min(1, Math.max(0.55, 0.55 + (0.45 * ((num(r[bar]) ?? 0) - low)) / (hi - low)))).toFixed(2);
  const barHtml = (r, sum) => `<span class="jk-b${sum ? ' sum' : ''}${!sum && isFew(r) ? ' few' : ''}"><i style="width:${w(r)}%${sum || isFew(r) ? '' : `;opacity:${op(r)}`}"></i></span>`;
  const best = cond && mark ? bestOf(rows) : null;
  const more = (i) => (initial && i >= initial ? ' class="more"' : '');
  const rk = (i) => (rank ? `<span class="jk-rk num${i < 3 ? ` m${i + 1}` : ''}">${i + 1}</span>` : '');
  const few = (r) => (isFew(r) ? `<small class="num">出走${r.races ?? 0}</small>` : '');
  const listHtml = list ? `<ul class="jk-bl${tone ? ' ' + tone : ''}${rank ? ' rkl' : ''}${sub ? ' has-sub' : ''}" data-anim>${rows.map((r, i) => `<li${more(i)} style="--i:${initial ? i % initial : i}">${rk(i)}<span class="l">${r.key}${few(r)}</span>${barHtml(r)}<b class="v${best === r ? ' top' : ''}">${barFmt(r)}</b>${sub ? `<span class="s num">${fmt(r.races, 'int')}戦</span>` : ''}</li>`).join('')}</ul>` : '';
  const tr = (r, i, sum) => `<tr class="${[initial && i >= initial && !sum ? 'more' : '', sum ? 'sum' : '', sum && i === 0 ? 'sum1' : ''].filter(Boolean).join(' ')}" style="--i:${initial ? i % initial : i}">${rank ? `<td class="n">${rk(i)}</td>` : ''}<td class="k"><span class="nm${shrink && String(r.text).length > 5 ? ` lg" title="${esc(r.text)}` : ''}">${r.key}</span>${sum ? '' : few(r)}</td>${list ? `<td class="bc">${barHtml(r, sum)}</td>` : ''}${COLS.map(([k, , f, hl]) => { const v = num(r[k]); const t = fmt(v, f); return `<td>${highlight && !sum && hl && v !== undefined && v > 0 && v === max[k] ? `<span class="hl">${t}</span>` : t}</td>`; }).join('')}</tr>`;
  const table = `<div class="jk-tw"><table class="jk-t${rank ? ' rkt' : ''}${tone ? ' ' + tone : ''}" data-anim><thead><tr>${rank ? '<th scope="col" class="n">順位</th>' : ''}<th scope="col" class="k">${keyLabel}</th>${list ? `<th scope="col" class="bc">${barLabel}</th>` : ''}${COLS.map((c) => `<th scope="col">${c[1]}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => tr(r, i, false)).join('')}${summaryRows.map((r, i) => tr(r, i, true)).join('')}</tbody></table></div>`;
  const rest = initial ? rows.length - initial : 0;
  const onlyT = !(rest > 0) && !listAlways;
  const foot = list || rest > 0 || hint ? `<div class="jk-ft${!hint && onlyT ? ' only-t' : ''}">${hint ? `<span class="jk-hint">${hint}</span>` : ''}<span class="jk-bs${onlyT ? ' only-t' : ''}">${rest > 0 ? `<button type="button" class="jk-btn" data-tg="open-m" aria-expanded="false" data-open="さらに表示（残り${rest}件）" data-close="${initial}件までにする">さらに表示（残り${rest}件）</button>` : ''}${list ? `<button type="button" class="jk-btn tg-t" data-tg="open-t" aria-expanded="false" data-open="全項目を見る（13項目）" data-close="表を閉じる">全項目を見る（13項目）</button>` : ''}</span></div>` : '';
  return `<div class="jk-st${listAlways ? ' lst' : ''}${!list ? ' tbl' : ''}" data-box>${listHtml}<div class="jk-full">${table}</div>${foot}</div>`;
}
const R = (r, key, text) => ({ ...r, key, text: text ?? String(key).replace(/<[^>]+>/g, '') });
const deflink = (t) => a(`${t}を見る`);
const sfTag = (ja) => `<i class="sf sm ${ja === '芝' ? 'turf' : ja === '障' || ja === '障害' ? 'steeplechase' : 'dirt'}">${ja === 'ダ' ? 'ダート' : ja === '障' ? '障害' : ja}</i>`;

/* ---------- 冒頭・基本情報 ---------- */
const period = j.data_period.match(/（([^）]+)）/)[1].replace(/^(\d{4}年\d{1,2}月)\d{1,2}日(\s*〜)/, '$1$2');
const asOf = j.last_updated.match(/(\d+)年(\d+)月(\d+)日/).slice(1).map(Number);
const [by, bm, bd] = j.profile.birth_date.split('-').map(Number);
const age = asOf[0] - by - (asOf[1] < bm || (asOf[1] === bm && asOf[2] < bd) ? 1 : 0);
const graded = ['G1', 'G2', 'G3'].map((g) => j.class_stats.find((c) => c.class_name === g) ?? { wins: 0, races: 0 });
const gWins = graded.reduce((s, c) => s + c.wins, 0), gRaces = graded.reduce((s, c) => s + c.races, 0);
const thisYear = [...j.yearly_leading].sort((x, y) => y.year - x.year)[0];
const c = j.characteristics;
const LBL = {
  rel: ['低い', 'やや低い', '標準', 'やや高い', '高い'],
  sf: ['芝が得意', 'やや芝が得意', '差分なし', 'ややダートが得意', 'ダートが得意'],
  st: ['逃げ・先行が得意', 'やや逃げ・先行が得意', '差分なし', 'やや差し・追込が得意', '差し・追込が得意'],
  ds: ['短距離が得意', 'やや短距離が得意', '差分なし', 'やや長距離が得意', '長距離が得意'],
};
const POS = { rel: c.volatility, sf: 6 - (c.surface_trend_position ?? 3), st: c.running_style_trend_position ?? 3, ds: c.distance_trend_position ?? 3 };
const seg = (v) => `<span class="jk-seg" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => `<i${n === v ? ' class="on"' : ''}></i>`).join('')}</span>`;
const verdict = [['信頼度', 'rel'], ['芝・ダート', 'sf'], ['脚質', 'st'], ['距離', 'ds']].map(([l, k]) => `<a class="jk-vr" href="#characteristics"><span class="k">${l}</span>${seg(POS[k])}<b>${LBL[k][POS[k] - 1]}</b>${I.chevR}</a>`).join('');
const t = j.total_stats;
// 冒頭のマスは主指標（勝率・連対率・複勝率）。基本情報の同じ項目は着度数を主に見せて、大きな数字の重複を避ける
const kpi = [['出走数', t.races, 0, ''], ['1着', t.wins, 0, ''], ['勝率', t.win_rate, 1, '%'], ['連対率', t.quinella_rate, 1, '%'], ['複勝率', t.place_rate, 1, '%']];
const cnt = (v, dp = 0) => `<span class="num" data-count="${v}" data-dp="${dp}">${dp ? Number(v).toFixed(dp) : Number(v).toLocaleString('ja-JP')}</span>`;

const hero = `
<nav class="jk-crumb" aria-label="パンくず">${a('HOME')}<span aria-hidden="true">/</span>${a('騎手一覧')}<span aria-hidden="true">/</span><span>${esc(NAME)}</span></nav>
<div class="jk-pn jk-hero">
  <div class="jk-hl">
    <h1>${nb([esc(WHO), '<small>の傾向・成績データ</small>'])}</h1>
    <p class="jk-lead">${esc(WHO)}（${j.affiliation}所属・${j.debut_year}年デビュー）の成績・データをまとめたページです。独自のデータベースで直近3年間・${j.total_races.toLocaleString('ja-JP')}レースのデータを集計し、毎週更新しています。</p>
    <ul class="jk-kpi" data-anim>${kpi.map(([l, v, dp, u]) => `<li><span>${l}</span><b>${cnt(v, dp)}${u ? `<small>${u}</small>` : ''}</b></li>`).join('')}</ul>
    <p class="jk-meta"><span>集計 <b>${period}</b></span><span>対象 <b class="num">${j.total_races.toLocaleString('ja-JP')}レース</b></span><span>更新 <b><time datetime="${asOf[0]}-${asOf[1]}-${asOf[2]}">${j.last_updated}</time></b></span></p>
  </div>
  <div class="jk-hv">
    <div class="jk-h3"><h2>${esc(WHO)}の傾向</h2><small class="num">${j.total_races.toLocaleString('ja-JP')}レース</small></div>
    <div class="jk-vrs">${verdict}</div>
  </div>
</div>`;

const tiles = [
  ['所属', j.affiliation, ''],
  ['生年月日', `${by}年${bm}月${bd}日`, `${age}歳`],
  ['デビュー', `${j.debut_year}年`, `${asOf[0] - j.debut_year + 1}年目`],
  [`${thisYear.year}年の勝利数`, `${cnt(thisYear.wins)}勝`, thisYear.ranking > 0 ? `リーディング${thisYear.ranking}位` : ''],
  ['着度数（直近3年間）', `<span class="num">${t.wins}-${t.places_2}-${t.places_3}-${t.races - t.wins - t.places_2 - t.places_3}</span>`, nb([`勝率${t.win_rate.toFixed(1)}%・`, `複勝率${t.place_rate.toFixed(1)}%`])],
  ['重賞勝ち（平地）', `${cnt(gWins)}勝`, `直近3年間・G1 ${graded[0].wins}勝`],
];
const profile = `<section class="sc" id="profile-section">${Hno('基本情報')}
  <div class="jk-pn"><dl class="jk-tiles" data-anim>${tiles.map(([l, v, s]) => `<div><dt>${l}</dt><dd><b>${v}</b>${s ? `<small>${s}</small>` : ''}</dd></div>`).join('')}</dl></div></section>`;

const summary = `<section class="sc" id="summary-section">${Hno('データ概要')}
  <div class="jk-pn jk-art"><p class="jk-art-lead">${TXT.summary[0].html}</p><div class="jk-art-g">${TXT.summary.slice(1).map((b) => `<div><h3>${b.title}</h3><p>${b.html}</p></div>`).join('')}</div></div></section>`;

/* ---------- 年度別成績：推移の図（勝利数＋リーディング順位／率の推移）と表 ---------- */
const YEAR = asOf[0];
const years = [YEAR - 2, YEAR - 1, YEAR];
const lead = years.map((y) => j.yearly_leading.find((s) => s.year === y) ?? { year: y, wins: 0, ranking: 0 });
const ystat = years.map((y) => j.yearly_stats.find((s) => s.year === y) ?? { year: y, ...ZERO });
const roundAxis = (m) => { const v = m * 1.15; return [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150].find((x) => v <= x) ?? Math.ceil(v / 50) * 50; };
const xAt = (i, n) => ((i + 0.5) / n) * 100;
const grid = (maxV, n, unit) => Array.from({ length: n + 1 }, (_, i) => `<i style="top:${(i / n) * 100}%"><em class="num">${Math.round(maxV * (1 - i / n))}${unit}</em></i>`).join('');
const chartWins = (() => {
  const mx = roundAxis(Math.max(...lead.map((d) => d.wins)));
  const n = [4, 5, 3].find((k) => mx % k === 0) ?? 4;
  const ws = lead.map((d) => d.wins), hi = Math.max(...ws), lo = Math.min(...ws);
  const pts = lead.map((d, i) => ({ ...d, x: xAt(i, lead.length), y: ((Math.min(d.ranking, 50) - 1) / 49) * 100 })).filter((d) => d.ranking > 0);
  const label = `${lead.map((d) => `${d.year}年 ${d.wins}勝${d.ranking > 0 ? `・リーディング${d.ranking > 50 ? '50位未満' : `${d.ranking}位`}` : ''}`).join('、')}`;
  return `<figure class="jk-ch" data-anim role="img" aria-label="${label}">
    <figcaption><b>勝利数とリーディング順位</b><span class="lg"><span><i class="sq"></i>勝利数</span><span><i class="ln k"></i>リーディング順位</span></span></figcaption>
    <div class="jk-plot">
      <div class="gr">${grid(mx, n, '')}</div>
      <div class="cl">${lead.map((d, i) => `<div style="--i:${i}"><i style="height:${((d.wins / mx) * 100).toFixed(1)}%;opacity:${(hi === lo ? 1 : 0.55 + (0.45 * (d.wins - lo)) / (hi - lo)).toFixed(2)}"></i></div>`).join('')}</div>
      ${pts.length > 1 ? `<svg class="ls" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline class="k" points="${pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}"/></svg>` : ''}
      ${pts.map((p, i) => `<span class="pt k tag" style="left:${p.x}%;top:${p.y}%;--i:${i}"><b class="num">${p.ranking > 50 ? '50位未満' : `${p.ranking}位`}</b></span>`).join('')}
    </div>
    <div class="xs">${lead.map((d) => `<div><span class="num">${d.year}年</span><b>${cnt(d.wins)}<small>勝</small></b></div>`).join('')}</div>
  </figure>`;
})();
const chartRates = (() => {
  const series = [['place_rate', '複勝率', 'g'], ['quinella_rate', '連対率', 'k'], ['win_rate', '勝率', 's']];
  const mx = Math.max(20, Math.ceil(Math.max(...ystat.map((d) => d.place_rate)) / 20) * 20);
  const n = mx / 20;
  const label = ystat.map((d) => `${d.year}年 勝率${fmt(d.win_rate, 'pct')}・連対率${fmt(d.quinella_rate, 'pct')}・複勝率${fmt(d.place_rate, 'pct')}`).join('、');
  return `<figure class="jk-ch" data-anim role="img" aria-label="${label}">
    <figcaption><b>勝率・連対率・複勝率の推移</b><span class="lg">${series.map(([, l, cl]) => `<span><i class="ln ${cl}"></i>${l}</span>`).join('')}</span></figcaption>
    <div class="jk-plot">
      <div class="gr">${grid(mx, n, '%')}</div>
      <svg class="ls" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${series.map(([k, , cl]) => `<polyline class="${cl}" points="${ystat.map((d, i) => `${xAt(i, ystat.length).toFixed(2)},${(100 - (d[k] / mx) * 100).toFixed(2)}`).join(' ')}"/>`).join('')}</svg>
      ${series.map(([k, , cl]) => ystat.map((d, i) => `<span class="pt ${cl}" style="left:${xAt(i, ystat.length)}%;top:${(100 - (d[k] / mx) * 100).toFixed(2)}%;--i:${i}"><b class="num">${fmt(d[k], 'pct')}</b></span>`).join('')).join('')}
    </div>
    <div class="xs">${ystat.map((d) => `<div><span class="num">${d.year}年</span><b>${cnt(d.races)}<small>戦</small></b></div>`).join('')}</div>
  </figure>`;
})();
const yearlyRows = [...ystat].reverse().map((y) => R(y, `<span class="num">${y.year}年</span>`, `${y.year}年`));
const leading = `<section class="sc" id="leading">${H('年度別成績', '勝利数とリーディング順位（直近3年）')}
  <div class="jk-pn"><div class="jk-chs">${chartWins}${chartRates}</div>${stats({ rows: yearlyRows, keyLabel: '年度', list: false })}</div></section>`;

/* ---------- 重賞勝ち（5件＋さらに表示。最大30件） ---------- */
const gw = j.graded_wins ?? [];
const sd = (iso) => iso.split('-').map(Number).join('/');
const gradedSec = gw.length ? `<section class="sc" id="graded-wins-section">${Hno('重賞勝ち', '直近3年間・平地・新しい順')}
  <div class="jk-pn" data-box>
    <ul class="jk-gs" data-anim><li class="tot"><span>平地重賞</span><b>${cnt(gWins)}<small>勝</small></b><em class="num">${gRaces}戦</em></li>${graded.map((g, i) => `<li>${L.gradeBadge(`G${i + 1}`)}<b>${cnt(g.wins)}<small>勝</small></b><em class="num">${g.races}戦</em></li>`).join('')}</ul>
    <div class="jk-gw" role="table" aria-label="重賞勝ちの一覧">
      <div class="h" role="row"><span role="columnheader">レース</span><span role="columnheader">日付</span><span role="columnheader">馬名</span><span role="columnheader">コース</span><span role="columnheader">人気</span></div>
      ${gw.map((w, i) => `<div class="r${i >= 5 ? ' more' : ''}" role="row"><span class="rc" role="cell">${L.gradeBadge(w.grade)}<b>${esc(w.race_name)}</b></span><span class="dt num" role="cell">${sd(w.date)}</span><span class="hn" role="cell">${esc(w.horse_name)}</span><span class="co" role="cell">${w.venue}${w.surface === 'ダート' ? 'ダ' : w.surface}<span class="num">${w.distance}m</span></span><span class="pp num" role="cell">${w.popularity ? `${w.popularity}<small>番人気</small>` : '—'}</span></div>`).join('')}
    </div>
    <div class="jk-ft">${gw.length >= 30 ? '<span class="jk-hint">最大30件まで表示</span>' : ''}<span class="jk-bs">${gw.length > 5 ? `<button type="button" class="jk-btn" data-tg="open-m" aria-expanded="false" data-open="さらに表示（残り${gw.length - 5}件）" data-close="5件までにする">さらに表示（残り${gw.length - 5}件）</button>` : ''}</span></div>
  </div></section>` : '';

/* ---------- 特徴（判定と根拠の数字） ---------- */
const merge = (x, y, text) => { const r = x.races + y.races; const w1 = x.wins + y.wins, w2 = x.places_2 + y.places_2, w3 = x.places_3 + y.places_3; return { text, place_rate: r ? ((w1 + w2 + w3) / r) * 100 : 0 }; };
const dOf = (k) => j.distance_stats.find((s) => s.category === k) ?? ZERO;
const sOf = (k) => j.running_style_stats.find((s) => s.style === k) ?? ZERO;
const pairBars = (items) => `<ul class="jk-ev">${items.map(([l, v, ref], i) => `<li style="--i:${i}"><span>${l}</span><span class="jk-b${ref ? ' ref' : ''}"><i style="width:${v}%"></i></span><b class="num">${v.toFixed(1)}%</b></li>`).join('')}</ul>`;
const meter = (label, key, scale, ev, facts = '') => `<div class="jk-mt" data-anim><p class="mh"><span>${label}</span><b>${LBL[key][POS[key] - 1]}</b></p><div class="jk-seg big" aria-hidden="true">${[1, 2, 3, 4, 5].map((n) => `<i${n === POS[key] ? ' class="on"' : ''}></i>`).join('')}</div><p class="sc3"><span>${scale[0]}</span><span>${scale[1]}</span><span>${scale[2]}</span></p>${pairBars(ev)}${facts}</div>`;
const sfSorted = [...j.surface_stats].sort((x, y) => (x.surface === '芝' ? -1 : y.surface === '芝' ? 1 : 0));
const characteristics = `<section class="sc" id="characteristics">${Hno('特徴', '判定と、その根拠になった数字')}
  <div class="jk-pn"><div class="jk-mts">
    ${meter('人気時の信頼度', 'rel', ['低い', '標準', '高い'], [['1番人気の複勝率', c.fav1_place_rate], ['全騎手の平均', c.all_fav1_place_rate, 1]], `<p class="fx"><span>複勝率ランキング <b class="num">${c.fav1_ranking}位/${c.total_jockeys}人</b></span><span>1番人気の騎乗数 <b class="num">${c.fav1_races.toLocaleString('ja-JP')}回</b></span></p>`)}
    ${meter('得意なコース傾向', 'sf', ['芝が得意', '差分なし', 'ダートが得意'], sfSorted.map((s) => [`${s.surface} 複勝率`, s.place_rate]))}
    ${meter('得意な脚質傾向', 'st', ['逃げ・先行が得意', '差分なし', '差し・追込が得意'], [merge(sOf('escape'), sOf('lead'), '逃げ・先行'), merge(sOf('pursue'), sOf('close'), '差し・追込')].map((m) => [`${m.text} 複勝率`, m.place_rate]))}
    ${meter('得意な距離傾向', 'ds', ['短距離が得意', '差分なし', '長距離が得意'], [merge(dOf('短距離'), dOf('マイル'), '短距離〜マイル'), merge(dOf('中距離'), dOf('長距離'), '中距離〜長距離')].map((m) => [`${m.text} 複勝率`, m.place_rate]))}
  </div><div class="jk-ft"><span class="jk-hint">※複勝率ランキングは1番人気が10走以上の騎手を対象　${deflink('判定の基準')}</span></div></div></section>`;

/* ---------- コース（リンクは実在するコースページだけ＝現行 lib/courseLinks.ts と同じ考え方） ---------- */
const variantOf = (r) => { const v = r.variant ?? ''; if (/^(inner|内)/.test(v)) return 'inner'; if (/^(outer|外)/.test(v)) return 'outer'; const m = String(r.name).match(/m(内|外)/); return m ? (m[1] === '内' ? 'inner' : 'outer') : undefined; };
const hasPage = (r) => { const cs = L.all.filter((x) => x.rc === r.racecourse_en && x.sf === r.surface_en && x.d === r.distance); const v = variantOf(r); return cs.some((x) => x.v === v) || cs.some((x) => !x.v); };
const cLabel = (r, withRc, shortDirt) => { let l = String(r.name).replace(/[^\s]*競馬場/, '').replace(/\s+/g, '').replace(/（外回り）/g, '外').replace(/（内回り）/g, '内'); if (shortDirt) l = l.replace(/ダート/g, 'ダ'); return withRc ? `${r.racecourse.replace(/競馬場$/, '')}${l}` : l; };
const courses = j.course_stats.filter((s) => s.surface_en !== 'obstacle');
const MIN_HL = 10;
const hlSorted = courses.filter((s) => s.races >= MIN_HL).sort((x, y) => y.place_rate - x.place_rate);
const hlRow = (r) => { const l = cLabel(r, true, true); return R(r, hasPage(r) ? a(l) : l, l); };
const hlTop = hlSorted.slice(0, 5).map(hlRow), hlBottom = hlSorted.slice(-5).reverse().map(hlRow);
const highlights = `<section class="sc" id="highlights-section">${Hno('注目ポイント', '成績が目立つコース。コース名をタップすると詳細へ')}
  <div class="jk-two" data-sync>
    <div class="jk-pn"><div class="jk-h3"><h3>得意なコース TOP5</h3><small>${MIN_HL}走以上・複勝率が高い順</small></div>${stats({ rows: hlTop, keyLabel: 'コース', highlight: false, rank: true, sub: true, listAlways: true, abs: true })}</div>
    <div class="jk-pn"><div class="jk-h3"><h3>苦手なコース TOP5</h3><small>${MIN_HL}走以上・複勝率が低い順</small></div>${stats({ rows: hlBottom, keyLabel: 'コース', highlight: false, rank: true, sub: true, listAlways: true, abs: true, tone: 'weak' })}</div>
  </div>
  <p class="jk-foot">※出走回数${MIN_HL}回以上のコースを対象に、複勝率で評価しています</p></section>`;

/* ---------- 条件別 ---------- */
// 補足文（「出走30以上で…」）は板の外、見出しの下に置く
const cond = (id, title, rows, opt, sub = '') => `<section class="sc" id="${id}">${H(title, `${sub ? `<span class="jk-sb">${sub}</span>` : ''}<span class="jk-nt">${bestNote(rows)}</span>`)}<div class="jk-pn">${stats({ rows, ...opt })}</div></section>`;
const classRows = ['G1', 'G2', 'G3', 'オープン', '3勝', '2勝', '1勝', '未勝利', '新馬'].map((n) => R(j.class_stats.find((x) => x.class_name === n) ?? ZERO, /^G\d$/.test(n) ? L.gradeBadge(n) : n, n));
const popRows = [['fav1', '1番人気'], ['fav2', '2番人気'], ['fav3', '3番人気'], ['fav4', '4番人気'], ['fav5', '5番人気'], ['fav6to9', '6〜9番人気'], ['fav10plus', '10番人気〜']].map(([k, l]) => R(j.popularity_stats[k] ?? ZERO, l));
const styleRows = [['escape', '逃げ'], ['lead', '先行'], ['pursue', '差し'], ['close', '追込']].map(([k, l]) => R(j.running_style_stats.find((x) => x.style === k) ?? ZERO, l));
const GATE = ['#FFFFFF', '#222222', '#C62927', '#2573CD', '#E4CA3C', '#58AF4A', '#FAA727', '#DC6179'];
const gateRows = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => R(j.gate_stats.find((x) => +x.gate === n) ?? ZERO, `<span class="jk-gate num${n === 1 ? ' w' : ''}" style="background:${GATE[n - 1]};color:${[1, 5, 7].includes(n) ? '#222222' : '#FFFFFF'}">${n}</span><span class="vh">枠</span>`, `${n}枠`));
const distRows = ['短距離', 'マイル', '中距離', '長距離'].map((n) => R(j.distance_stats.find((x) => x.category === n) ?? ZERO, n));
const genderRows = ['牡馬', '牝馬', 'セン馬'].map((n) => R(j.gender_stats.find((x) => x.name === n) ?? ZERO, n));
const surfRows = ['芝', 'ダート', '障害'].map((n) => R(j.surface_stats.find((x) => x.surface === n) ?? ZERO, `<i class="sf sm ${n === '芝' ? 'turf' : n === 'ダート' ? 'dirt' : 'steeplechase'}">${n}</i>`, n));
const trackRows = ['芝', 'ダ', '障'].flatMap((s) => ['良', '稍', '重', '不'].map((cd) => R(j.track_condition_stats.find((x) => x.surface === s && x.condition === cd) ?? ZERO, `${sfTag(s)}<span class="tc">${cd}</span>`, `${s}・${cd}`)));
const RC = [['札幌', 'sapporo'], ['函館', 'hakodate'], ['福島', 'fukushima'], ['新潟', 'niigata'], ['東京', 'tokyo'], ['中山', 'nakayama'], ['中京', 'chukyo'], ['京都', 'kyoto'], ['阪神', 'hanshin'], ['小倉', 'kokura']];
const rcRows = RC.map(([ja, en]) => R(j.racecourse_stats.find((x) => x.racecourse_en === en || x.name === ja) ?? ZERO, ja));
const rcSum = ['中央', 'ローカル'].map((n) => j.racecourse_stats.find((x) => x.name === n)).filter(Boolean).map((r) => R(r, `<b>${r.name}</b>`, r.name));

const groups = RC.map(([ja, en]) => ({ ja, rows: courses.filter((x) => x.racecourse_en === en).sort((x, y) => (x.surface_en !== y.surface_en ? (x.surface_en === 'turf' ? -1 : 1) : x.distance - y.distance)) })).filter((g) => g.rows.length);
const cRow = (r) => { const l = cLabel(r, false, false); const tail = l.replace(/^(芝|ダート|ダ)/, ''); const body = `<span class="num">${tail}</span>`; return R(r, `${sfTag(r.surface_en === 'turf' ? '芝' : 'ダ')}${hasPage(r) ? a(body) : body}`, l); };
const busiest = groups.reduce((m, g) => { const n = g.rows.reduce((s, r) => s + r.races, 0); return n > m.n ? { ja: g.ja, n } : m; }, { ja: '', n: -1 }).ja;
const courseSec = `<section class="sc" id="course-stats">${H('コース別成績', '競馬場をタップすると、コースごとの13項目を表示')}
  <div class="jk-pn jk-acc">${groups.map((g) => { const tf = g.rows.filter((r) => r.surface_en === 'turf').length, dt = g.rows.length - tf; const rs = g.rows.reduce((s, r) => s + r.races, 0); return `<details${g.ja === busiest ? ' open' : ''}><summary><b>${g.ja}競馬場</b><span class="ac-c">${tf ? `<span class="sf sm turf">芝 ${tf}</span>` : ''}${dt ? `<span class="sf sm dirt">ダ ${dt}</span>` : ''}</span><span class="ac-n num">${rs.toLocaleString('ja-JP')}戦</span>${I.chevD}</summary><div class="ac-b">${stats({ rows: g.rows.map(cRow), keyLabel: 'コース', mark: false })}</div></details>`; }).join('')}</div></section>`;

/* ---------- 調教師・種牡馬・馬主（10件＋さらに表示で最大50件） ---------- */
const trainers = j.trainer_stats.map((s) => R(s, L.TR.some((x) => x.name === s.name) ? a(esc(s.name)) : esc(s.name), s.name));
const sires = (j.sire_stats ?? []).map((s) => R(s, L.SR.some((x) => x.name === s.name) ? a(esc(s.name)) : esc(s.name), s.name));
const owners = j.owner_stats.map((s) => R(s, esc(s.name), s.name));
const rankSec = (id, title, rows, keyLabel, hint, sub = '') => `<section class="sc" id="${id}">${H(title, sub)}<div class="jk-pn">${stats({ rows, keyLabel, rank: true, initial: 10, bar: 'wins', barLabel: '勝利数<br>（横棒）', hint, shrink: true })}</div></section>`;

/* ---------- Q&A・出典 ---------- */
const faq = `<section class="sc" id="faq-section">${head('データQ&amp;A')}
  <div class="jk-pn jk-qa">${TXT.faq.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary><b>${esc(f.q)}</b>${I.chevD}</summary><div class="qa-a">${f.a.map((p) => `<p${p.kind ? ` class="${p.kind}"` : ''}>${p.html}</p>`).join('')}</div></details>`).join('')}</div></section>`;
const about = `<aside class="jk-about" aria-label="データの出典と集計方法"><h2>このデータについて</h2><p>中央競馬（JRA）のレース結果をもとに当サイトのデータベースで集計しています（集計期間：${period}、${j.last_updated}時点）。指標の定義と集計方法は${a('データの出典と集計方法')}をご覧ください。</p></aside>`;

/* ---------- ページ内の移動（現行の表示名・並びと同じ） ---------- */
const NAVS = [['profile-section', '基本情報'], ['summary-section', '概要'], ['leading', '年度別'], ...(gw.length ? [['graded-wins-section', '重賞勝ち']] : []), ['characteristics', '特徴'], ['highlights-section', '注目'], ['class-stats', 'クラス別'], ['popularity-stats', '人気別'], ['running-style-stats', '脚質別'], ['gate-stats', '枠順別'], ['distance-stats', '距離別'], ['gender-stats', '性別'], ['surface-stats', '芝・ダート'], ['track-condition-stats', '馬場状態'], ['racecourse-stats', '競馬場別'], ['course-stats', 'コース別'], ['trainer-stats', '調教師'], ...(sires.length ? [['sire-stats', '種牡馬']] : []), ['owner-stats', '馬主'], ['faq-section', 'Q&amp;A']];
const nav = `<nav class="chips jk-nav" aria-label="ページ内"><div>${NAVS.map(([id, l]) => `<a href="#${id}">${l}</a>`).join('')}</div></nav>`;

const body = `
${nav}
${hero}
${ad}
${profile}
${summary}
${leading}
${gradedSec}
${characteristics}
${highlights}
${cond('class-stats', 'クラス別データ', classRows, { keyLabel: 'クラス' })}
${cond('popularity-stats', '人気別データ', popRows, { keyLabel: '人気' })}
${cond('running-style-stats', '脚質別データ', styleRows, { keyLabel: '脚質', hint: deflink('脚質の定義') })}
${cond('gate-stats', '枠順別データ', gateRows, { keyLabel: '枠番' })}
${ad}
${cond('distance-stats', '距離別データ', distRows, { keyLabel: '距離', hint: deflink('距離の定義') })}
${cond('gender-stats', '性別データ', genderRows, { keyLabel: '性別' })}
${cond('surface-stats', 'コース区分別データ', surfRows, { keyLabel: '区分' })}
${cond('track-condition-stats', '馬場状態別データ', trackRows, { keyLabel: '馬場' }, '芝・ダート・障害 × 良・稍重・重・不良')}
${cond('racecourse-stats', '競馬場別成績', rcRows, { summaryRows: rcSum, keyLabel: '競馬場' })}
${courseSec}
${rankSec('trainer-stats', '調教師別データ', trainers, '調教師', '※現役調教師のみ')}
${sires.length ? rankSec('sire-stats', '種牡馬別データ', sires, '種牡馬', '最大50件まで表示', '騎乗馬の父（種牡馬）別・勝利数順') : ''}
${rankSec('owner-stats', '馬主別データ', owners, '馬主', '最大50件まで表示')}
${ad}
${faq}
${about}`;

console.log('jockey', L.page({
  title: `${NAME}騎手の傾向・データ｜特徴・得意コース・距離と回収率【毎週更新】`,
  body, current: 'jockey', out: 'v6-jockey.html',
  css: fs.readFileSync(S + 'css/jockey.css', 'utf8'),
  js: fs.readFileSync(S + 'js/jockey.js', 'utf8'),
}));
