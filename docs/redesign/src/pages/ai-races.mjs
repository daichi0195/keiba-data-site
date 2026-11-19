// 予測レース一覧（現行 app/ai/races/page.tsx）
import * as L from '../lib.mjs';
import * as A from './ai-shared.mjs';
const { esc, ad, shortDate } = L;

const PER_PAGE = 20; // 現行と同じ
const RECENT_DAYS = 14; // 現行と同じ（直近14日分だけを一覧にする）
// 見本の「今日」は 2026-11-19（index.json を写した週）。現行と同じ式で切り捨て日を出す
const cutoff = new Date('2026-11-19T00:00:00Z'); cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
const cutoffStr = cutoff.toISOString().slice(0, 10);
const races = A.preds.filter((r) => !r.date || r.date >= cutoffStr); // 並びは index.json のまま（現行と同じ）

const dates = [...new Set(races.map((r) => r.date))];
const venues = L.VENUES.map(([, ja]) => ja).filter((v) => races.some((r) => r.venueLabel === v));
const chip = (f, v, label, n, on) => `<button type="button" data-f="${f}" data-v="${v}" aria-pressed="${on}">${label}<span class="num">${n}</span></button>`;
const name = (r) => `<a href="#" data-inert>${L.grade(r.raceName)}${esc(L.short(r.raceName))}</a>`;

// スマホ・タブレット：1件＝1行（20件ずつのページ送り）
const rows = dates.map((d) => {
  const rs = races.filter((r) => r.date === d);
  return `<tr class="p-ls-d" data-date="${d}"><th colspan="3" scope="colgroup">${A.dateY(d)}<i></i><span><b class="num">${rs.length}</b>レース</span></th></tr>` +
    rs.map((r) => `<tr data-date="${r.date}" data-venue="${r.venueLabel}"><td class="c-v">${r.venueLabel}<b class="num">${r.raceNumber}</b>R</td><td class="c-c">${A.sfShort(r.surface)}<span class="num">${r.distance}m</span></td><td class="c-n">${name(r)}</td></tr>`).join('');
}).join('');

// PC：日付ごとに「レース番号（行）×競馬場（列）」の表（全件を出すのでページ送りは無い）
const matrix = dates.map((d) => {
  const rs = races.filter((r) => r.date === d);
  const vs = venues.filter((v) => rs.some((r) => r.venueLabel === v));
  const nums = [...new Set(rs.map((r) => r.raceNumber))].sort((a, b) => b - a); // 現行と同じくレース番号の大きい順
  return `<section class="p-pn p-mx" data-kind="date" data-date="${d}"><h2>${A.dateY(d)}<span><b class="num">${rs.length}</b>レース</span></h2>
    <table><thead><tr><th scope="col" class="c-r">R</th>${vs.map((v) => `<th scope="col" data-venue="${v}" data-date="${d}">${v}</th>`).join('')}</tr></thead>
    <tbody>${nums.map((n) => `<tr><th scope="row" class="c-r"><b class="num">${n}</b>R</th>${vs.map((v) => { const r = rs.find((x) => x.venueLabel === v && x.raceNumber === n); return r ? `<td data-venue="${v}" data-date="${d}" data-race>${name(r)}<span class="p-mx-m">${A.sf(r.surface, true)}<span class="num">${r.distance}m</span></span></td>` : `<td data-venue="${v}" data-date="${d}" class="none"><span aria-label="予測なし">—</span></td>`; }).join('')}</tr>`).join('')}</tbody></table></section>`;
}).join('');

// PC（1280px以上）で競馬場を選んだとき：「レース番号（行）×開催日（列）」の表
const byVenue = venues.map((v) => {
  const rs = races.filter((r) => r.venueLabel === v);
  const ds = dates.filter((d) => rs.some((r) => r.date === d));
  const nums = [...new Set(rs.map((r) => r.raceNumber))].sort((a, b) => b - a);
  return `<section class="p-pn p-mx" data-kind="venue" data-venue="${v}" hidden><h2>${v}<span><b class="num">${rs.length}</b>レース</span></h2>
    <table><thead><tr><th scope="col" class="c-r">R</th>${ds.map((d) => `<th scope="col" data-venue="${v}" data-date="${d}">${L.shortDate(d)}</th>`).join('')}</tr></thead>
    <tbody>${nums.map((n) => `<tr><th scope="row" class="c-r"><b class="num">${n}</b>R</th>${ds.map((d) => { const r = rs.find((x) => x.date === d && x.raceNumber === n); return r ? `<td data-venue="${v}" data-date="${d}" data-race>${name(r)}<span class="p-mx-m">${A.sf(r.surface, true)}<span class="num">${r.distance}m</span></span></td>` : `<td data-venue="${v}" data-date="${d}" class="none"><span aria-label="予測なし">—</span></td>`; }).join('')}</tr>`).join('')}</tbody></table></section>`;
}).join('');

const body = `
${A.crumb([['競馬AI 勝率予測', true], ['予測一覧', false]])}
<div class="p-top" id="p-top">
  <h1 class="p-h1">予測一覧</h1>
  <p class="p-lead">直近${RECENT_DAYS}日間に公開した予測を掲載しています。予測は対象レースの約5分前に公開しています。予測の仕組みと印の意味は<a href="#" data-inert>AI勝率予測のページ</a>をご覧ください。</p>
</div>

<section class="p-sec" aria-label="予測一覧">
  <div class="p-w"><div class="p-pn p-flt" data-per="${PER_PAGE}">
    <div class="p-flt-r"><span class="p-flt-k" id="f-date">開催日</span><div class="p-flt-c" role="group" aria-labelledby="f-date">${chip('date', '', 'すべて', races.length, true)}${dates.map((d) => chip('date', d, shortDate(d), races.filter((r) => r.date === d).length, false)).join('')}</div></div>
    <div class="p-flt-r"><span class="p-flt-k" id="f-venue">競馬場</span><div class="p-flt-c" role="group" aria-labelledby="f-venue">${chip('venue', '', 'すべて', races.length, true)}${venues.map((v) => chip('venue', v, v, races.filter((r) => r.venueLabel === v).length, false)).join('')}</div></div>
  </div></div>
  <div class="p-w"><div class="p-mxw">${matrix}${byVenue}</div></div>
  <div class="p-w p-lsw"><div class="p-pn">
    <table class="p-ls">
      <thead><tr><th scope="col" class="c-v">競馬場・R</th><th scope="col" class="c-c">コース</th><th scope="col" class="c-n">レース名</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div></div>
  <p class="p-ls-0" hidden>直近${RECENT_DAYS}日間の予測データはありません。</p>
  <nav class="p-pg" aria-label="ページ送り"></nav>
</section>

${ad}

<div class="p-foot">
  <div class="p-w">${A.xBanner}</div>
  <div class="p-w p-back"><a class="pill" href="#" data-inert>AI勝率予測トップへ</a></div>
  ${A.bookmark}
</div>`;

console.log('ai-races', L.page({ title: '予測一覧 | 競馬AI 勝率予測 | 競馬データ.com', body, current: 'ai', out: 'v6-ai-races.html', css: A.CSS, js: A.JS, railAi: false }));
