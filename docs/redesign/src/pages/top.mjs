// トップページの見本
import * as L from '../lib.mjs';
const { I, esc, head, dists, rank, kana, people, ad, arts, img, counts, VENUES, SURF, of, dl, WEEK, WEEK_RC, latest, shortDate, short, leading, J, SR, TR, GJ, GS, GT, GRADE, dateOf } = L;
const CHIPS = [['ai', 'AI勝率予測'], ['week', '今週開催'], ['courses', 'コース'], ['jockeys', '騎手'], ['sires', '血統'], ['trainers', '調教師'], ['columns', 'コラム']];
const body = `
<h1 class="vh">競馬データ.com｜コース・騎手・血統の競馬データ分析</h1>
<nav class="chips" aria-label="トップの見出し"><div>${CHIPS.map(([id, l], i) => `<a href="#${id}">${l}</a>`).join('')}</div></nav>

<section class="feat" id="top" aria-label="おすすめ記事">
  <div class="vg car">${arts.map(([n, t, d]) => `<a class="vc" href="#" data-inert>${img(n, true)}<p class="vc-t">${esc(t)}</p><p class="vc-m">コラム・${d}</p></a>`).join('')}</div>
</section>

<section class="sc band" id="ai">
  ${head('AI勝率予測', '対象レースの約5分前に公開', 'もっとみる')}
  <div class="ai">${latest.map((e) => `<a class="ac" href="#" data-inert><p class="ac-h"><span class="ac-v">${e.venueLabel}<b class="num">${e.raceNumber}</b>R</span><span class="ac-d">${shortDate(e.date)}</span></p><p class="ac-n">${L.grade(e.raceName)}${esc(short(e.raceName))}</p><p class="ac-m"><i class="sf sm ${e.surface === '芝' ? 'turf' : 'dirt'}">${e.surface === '芝' ? '芝' : 'ダート'}</i><span class="num">${e.distance}m</span></p></a>`).join('')}</div>
</section>

<section class="sc" id="week">
  ${head('今週開催の競馬場', '', '')}
  <div class="wk">${WEEK_RC.map((rc, i) => `<div class="pn"><h3><a href="#" data-inert>${WEEK[i]}競馬場${I.chevR}</a></h3>${dists(rc)}</div>`).join('')}</div>
  <div class="pn wkt">${WEEK_RC.map((rc, i) => `<div class="wkt-r"><h3><a href="#" data-inert>${WEEK[i]}競馬場${I.chevR}</a></h3><div class="wkt-s">${SURF.filter(([sf]) => of(rc, sf).length).map(([sf, ja]) => `<div class="wkt-c"><span class="sf ${sf}">${ja}</span><div class="ds-c">${of(rc, sf).map((c) => `<a href="#" data-inert aria-label="${c.ja}${ja}${dl(c)}">${dl(c)}</a>`).join('')}</div></div>`).join('')}</div></div>`).join('')}</div>
</section>

${ad}

<section class="sc" id="courses">
  ${head('コース別データ', '10競馬場・133コース', 'コース一覧')}
  <div class="vl">${VENUES.map(([rc, ja]) => `<details><summary><b>${ja}競馬場</b><span class="vl-c">${counts(rc).map(([l, n, sf]) => `<span class="sf sm ${sf}">${l} ${n}</span>`).join('')}</span>${I.chevD}</summary>${dists(rc)}</details>`).join('')}</div>
</section>

${people('jockeys', '騎手別データ', '騎手リーディング', leading.jockey_leading, '騎乗', GJ, '名', J.length, '過去3年間に30レース以上出走している現役中央騎手のデータを集計しています。', '騎手一覧')}
${people('sires', '血統（種牡馬）別データ', '種牡馬リーディング', leading.sire_leading, '出走', GS, '頭', SR.length, '過去3年間に産駒が50レース以上出走し、かつ産駒が10頭以上いる種牡馬のデータを集計しています。', '種牡馬一覧')}
${people('trainers', '調教師別データ', '調教師リーディング', leading.trainer_leading, '出走', GT, '名', TR.length, '過去3年間に30レース以上出走している現役中央調教師のデータを集計しています。', '調教師一覧')}

${ad}

<section class="sc" id="columns">
  ${head('コラム', '', 'もっとみる')}
  <div class="vg lst">${arts.map(([n, t, d]) => `<a class="vc" href="#" data-inert>${img(n, true)}<div><p class="vc-t">${esc(t)}</p><p class="vc-m">コラム・${d}</p></div></a>`).join('')}</div>
</section>`;

console.log('top', L.page({ title: '競馬データ.com トップ見本', body, current: 'home', out: 'v6-looks.html' }));
