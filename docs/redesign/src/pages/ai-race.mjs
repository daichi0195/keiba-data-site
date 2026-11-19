// レースごとの予測（現行 app/ai/races/[slug]/page.tsx）
import fs from 'fs';
import * as L from '../lib.mjs';
import * as A from './ai-shared.mjs';
const { esc, ad, I } = L;

const SLUG = '20261115-kyoto-11';
// 取得元（現行ページと app/api/predictions/[slug]/route.ts と同じ）：https://storage.googleapis.com/umadata/predictions/<slug>.json
const data = JSON.parse(fs.readFileSync(L.S + `data/pred-${SLUG}.json`, 'utf8'));
const index = A.preds;

// 前の予測・次の予測：現行と同じく index.json の並びの前後
const i = index.findIndex((r) => r.slug === SLUG);
const prev = i > 0 ? index[i - 1] : null;
const next = i >= 0 && i < index.length - 1 ? index[i + 1] : null;

// 同じ日のレース（競馬場の切替と、同じ競馬場のレース番号）
const sameDay = index.filter((r) => r.date === data.date);
const dayVenues = L.VENUES.map(([, ja]) => ja).filter((v) => sameDay.some((r) => r.venueLabel === v));
const sameVenue = sameDay.filter((r) => r.venueLabel === data.venueLabel).sort((a, b) => a.raceNumber - b.raceNumber);
// 競馬場の切替先：同じレース番号があればそれ、無ければいちばん近い番号
const jump = (v) => sameDay.filter((r) => r.venueLabel === v).sort((a, b) => Math.abs(a.raceNumber - data.raceNumber) - Math.abs(b.raceNumber - data.raceNumber))[0];

const P = data.predictions;
const max = Math.max(...P.map((h) => h.winRate)), min = Math.min(...P.map((h) => h.winRate));
const pageTitle = `${data.dateLabel} ${data.venueLabel}${data.raceNumber}R ${data.raceName}`;

const row = (h, k) => {
  const m = A.normalizeMark(h.mark);
  return `<tr style="--i:${k}"><td class="c-n"><span class="rk-n num${h.rank <= 3 ? ` t3 m${h.rank}` : ''}">${h.rank}</span></td><th scope="row" class="c-h">${esc(h.name)}</th><td class="c-m">${A.mark(m)}</td><td class="c-p"><b class="num" data-to="${h.winRate}" data-dp="1">${h.winRate.toFixed(1)}</b>%</td><td class="c-b"><span class="p-bar"><i style="width:${((h.winRate / max) * 100).toFixed(1)}%;opacity:${(0.55 + (0.45 * (h.winRate - min)) / (max - min || 1)).toFixed(2)}"></i></span></td></tr>`;
};

const body = `
${A.crumb([['競馬AI 勝率予測', true], ['予測一覧', true], [pageTitle, false]])}
<div class="p-top p-race" id="p-top">
  <span class="ac-v p-race-v" aria-hidden="true">${data.venueLabel}<b class="num">${data.raceNumber}</b>R</span>
  <h1 class="p-h1"><span class="vh">${data.dateLabel} ${data.venueLabel}${data.raceNumber}R </span>${L.grade(data.raceName)}<span>${esc(data.raceName)}</span><span class="vh"> AI勝率予測</span></h1>
  <p class="p-race-m">${A.sf(data.surface, true)}<span class="num">${data.distance}m</span><span><b class="num">${P.length}</b>頭</span><span class="p-race-d"><span class="l">${A.dateY(data.date)}</span><span class="s">${L.shortDate(data.date)}</span></span></p>
</div>

<div class="p-rgw"><div class="p-rg">
  <nav class="p-rs" aria-label="${L.dateOf(data.date)}のレース">
    <div class="p-rs-v">${dayVenues.map((v) => { const t = jump(v); return `<a href="#" data-inert${v === data.venueLabel ? ' class="on" aria-current="true"' : ''} aria-label="${v}${t.raceNumber}R ${esc(t.raceName)}">${v}</a>`; }).join('')}</div>
    <div class="p-rs-r">${sameVenue.map((r) => `<a href="#" data-inert${r.slug === SLUG ? ' class="on" aria-current="page"' : ''} aria-label="${r.venueLabel}${r.raceNumber}R ${esc(r.raceName)}"><b class="num">${r.raceNumber}</b>R</a>`).join('')}</div>
  </nav>

  <section class="p-pn p-pred" data-state="open" aria-label="AI勝率予測">
    <div class="p-pred-h"><h2>AI勝率予測</h2><small>予測勝率の高い順・全${P.length}頭</small></div>
    <div class="p-gate-in">
      <table class="p-tb">
        <thead><tr><th scope="col" class="c-n">順位</th><th scope="col" class="c-h">馬名</th><th scope="col" class="c-m">印</th><th scope="col" class="c-p">予測勝率</th><th scope="col" class="c-b"><span class="vh">予測勝率の棒</span></th></tr></thead>
        <tbody>${P.map(row).join('')}</tbody>
      </table>
    </div>
    <div class="p-gate" data-gate="loading" hidden><span class="p-spin" aria-hidden="true"></span><p>予測を準備しています…</p></div>
    <div class="p-gate" data-gate="blocked" hidden><p class="p-gate-t">広告ブロッカーが有効になっています</p><p>AI勝率予測は広告収入で無料公開しています。広告ブロッカーをオフにして、ページを再読み込みしてください。</p><button type="button" class="p-btn">再読み込みする</button></div>
  </section>

  <div class="p-pn p-lg">
    <h2>印の見方</h2>
    <ul class="p-lg-l">${Object.keys(A.MARKS).map((k) => `<li>${A.mark(k)}<p>${A.MARK_DESC[k][0]}<span class="x">${A.MARK_DESC[k][1]}</span></p></li>`).join('')}</ul>
    <ul class="p-notes">
      <li>予測は対象レースの約5分前に公開しています。</li>
      <li>予測は参考情報であり、的中や回収率を保証するものではありません。</li>
      <li>予測の仕組みと印の意味は<a href="#" data-inert>AI勝率予測のページ</a>をご覧ください。</li>
    </ul>
  </div>

  <nav class="p-nav" aria-label="前後の予測">${prev ? A.card(prev, `${I.chevR}前の予測`, 'prev') : '<span aria-hidden="true"></span>'}${next ? A.card(next, `次の予測${I.chevR}`, 'next') : '<span aria-hidden="true"></span>'}</nav>
</div></div>

${ad}

<div class="p-foot">
  <div class="p-w">${A.xBanner}</div>
  <div class="p-w p-back"><a class="pill" href="#" data-inert>予測一覧へ</a><a class="pill" href="#" data-inert>AI勝率予測トップへ</a></div>
  ${A.bookmark}
</div>

<div class="p-w"><div class="p-demo" role="group" aria-label="見本用：予測の表の状態の切替">
  <p><b>見本用</b>予測の表の状態を切り替えます（現行 PredictionGate）。押すと表の位置に、表の高さを保ったまま表示します。</p>
  <div><button type="button" data-gate="open" aria-pressed="true">予測を表示</button><button type="button" data-gate="loading" aria-pressed="false">準備中</button><button type="button" data-gate="blocked" aria-pressed="false">広告ブロッカー検知</button></div>
</div></div>`;

console.log('ai-race', L.page({ title: `${pageTitle} AI勝率予測 | 競馬データ.com`, body, current: 'ai', out: 'v6-ai-race.html', css: A.CSS, js: A.JS, railAi: false }));
