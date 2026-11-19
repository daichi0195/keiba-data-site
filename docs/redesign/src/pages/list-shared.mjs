// 一覧4ページ（コース・騎手・種牡馬・調教師）で共通に使う部品
import fs from 'fs';
import * as L from '../lib.mjs';
const { I, esc, head, rank, ad, leading, all, J, SR, TR, VENUES } = L;

export const css = fs.readFileSync(L.S + 'css/list.css', 'utf8');
export const js = fs.readFileSync(L.S + 'js/list.js', 'utf8');
export const X = L.icon(L.fa.faXmark);

// データの更新日（現行と同じく leading.json の last_updated。日本時間）
const upd = new Date(new Date(leading.last_updated).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const [uy, um, ud] = upd.split('-').map(Number);
export const updated = `<time datetime="${upd}">${uy}年${um}月${ud}日</time>`;

// 絞り込み用の読み：カタカナはひらがなに、英字は小文字に、空白と記号は取り除く
export const yomi = (s) => String(s).normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/[\s.・]/g, '');

/** 冒頭：パンくず・h1・掲載件数と更新日・リード文 */
export const hero = ({ title, lead, count }) => `<div class="lh">
  <nav class="lh-c" aria-label="パンくず"><a href="#" data-inert>HOME</a><span aria-hidden="true">/</span><span>${title}</span></nav>
  <div class="lh-t"><h1>${title}</h1><p class="lh-m"><span>掲載 <b>${count}</b></span><span>更新 <b>${updated}</b></span></p></div>
  <p class="lh-l">${lead}</p>
</div>`;

/** ページ内の移動（見た目はトップと同じチップ。移動と現在地の判定は list.js が受け持つので、href は top.js に拾われない形にしている） */
export const chips = (items, label) => `<nav class="chips lj" aria-label="${label}"><div>${items.map(([id, l, n, dot]) => `<a href="#!${id}" data-to="${id}">${dot ? '<i class="lw-d"></i>' : ''}${l}${n ? `<span class="num">${n}</span>` : ''}</a>`).join('')}</div></nav>`;

/** 末尾：ほかの一覧への案内、AI予測の案内、ブックマークの案内（現行の左列にあるもの） */
const LISTS = [['course', 'コースデータ一覧', `${all.length}コース`], ['jockey', '騎手データ一覧', `${J.length}名`], ['sire', '血統（種牡馬）別データ一覧', `${SR.length}頭`], ['trainer', '調教師データ一覧', `${TR.length}名`]];
export const tail = (current) => `<section class="sc" id="others">
  ${head('ほかのデータ一覧', '', '')}
  <div class="lp lo">${LISTS.filter(([k]) => k !== current).map(([k, l, n]) => `<a href="#" data-inert>${I[k]}<b>${l}</b><span>${n}</span>${I.chevR}</a>`).join('')}</div>
  <div class="lp la"><div><p class="la-k">AI勝率予測</p><h2>出走馬ごとの勝率をAIで予測</h2><p class="la-p">独自のモデルで出走馬の勝率を算出し、対象レースの約5分前に無料で公開しています。</p></div><a class="la-b" href="#" data-inert>予測を見る</a></div>
  <p class="lb">毎週の予想に活用しよう！<kbd>Ctrl+D</kbd> / <kbd>⌘+D</kbd> でブックマークに登録！</p>
</section>
${ad}`;

/**
 * 騎手・種牡馬・調教師の一覧ページ
 * 冒頭 → 名前で絞り込む → ページ内の移動 → リーディング → 五十音順の全件 → ほかの一覧
 */
export function namePage({ current, out, pageTitle, title, lead, unit, noun, groups, leadTitle, rows, ridesLabel, placeholder, wide }) {
  const total = groups.reduce((s, g) => s + g.items.length, 0);
  // 長い名前は2マスぶん使って切らない（トップ見本の kana() と同じ w8／w11。文字の大きさは変えない）。p2 は700px以上でも1マスに収まらない名前（種牡馬の12文字以上。騎手・調教師は700px以上では全員1マスに収まる幅にしてある）
  const em = (n) => [...n].reduce((w, c) => w + (/[\x20-\x7e]/.test(c) ? 0.55 : 1), 0);
  const cls = (n) => [n.length >= 8 ? 'w8' : '', n.length >= 11 ? 'w11' : '', wide && em(n) >= 12 ? 'p2' : ''].filter(Boolean).join(' ');
  const cell = (x) => `<a href="#" data-inert data-k="${esc(yomi(x.kana || x.name))}"${cls(x.name) ? ` class="${cls(x.name)}"` : ''}>${esc(x.name)}</a>`;
  const body = `
${hero({ title, lead, count: `${total.toLocaleString('ja-JP')}${unit}` })}
<div class="lf" data-mode="name" data-unit="${unit}" data-noun="${noun}">
  <div class="lf-b"><label class="lf-i">${I.search}<span class="vh">${noun}名で絞り込む</span><input id="lf-q" type="text" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${placeholder}"><button class="lf-x" type="button" aria-label="入力を消す" hidden>${X}</button></label></div>
  <p class="lf-n" role="status" hidden></p>
</div>
${chips([['leading', 'リーディング'], ...groups.map((g, i) => [`g-${i}`, g.k, g.items.length])], `${noun}一覧の見出し`)}

<section class="sc l1 lx" id="leading">
  ${head(leadTitle, `<span>${leading.year}年・勝ち数の上位${rows.length}${unit}。</span><span>名前をタップすると詳細へ</span>`, '')}
  <div class="lp lk">${rank(rows, ridesLabel)}</div>
</section>

<div class="lx">${ad}</div>

<section class="sc" id="all">
  ${head(`全${noun}データ`, `五十音順・${total.toLocaleString('ja-JP')}${unit}`, '')}
  <div class="lp ln${wide ? ' wide' : ''}">${groups.map((g, i) => `<section class="ln-g" id="g-${i}" aria-label="${g.k}">
    <details class="ln-d"><summary><b>${g.k}</b><span><i class="num">${g.items.length}</i>${unit}</span>${I.chevD}</summary><div class="ln-a">${g.items.map(cell).join('')}</div></details>
    <div class="ln-r"><h3><b>${g.k}</b><span><i class="num">${g.items.length}</i>${unit}</span></h3><div class="ln-c">${g.items.map(cell).join('')}</div></div>
  </section>`).join('')}
    <div class="ln-f ln-a" aria-label="絞り込みの結果"></div>
    <p class="ln-0" hidden>一致する${noun}が見つかりませんでした。</p>
  </div>
</section>

${tail(current)}`;
  return L.page({ title: pageTitle, body, current, out, css, js });
}
