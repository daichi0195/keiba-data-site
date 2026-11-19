// コラム一覧の見本（現行 app/articles/page.tsx ＋ components/ArticleList.tsx）
import fs from 'fs';
import * as L from '../lib.mjs';
const { esc, img, S, SITE } = L;

// 記事の題・説明・日付・人気順（priority）は content/articles/*.mdx の先頭から読む
export const ARTS = fs.readdirSync(SITE + '/content/articles').filter((f) => f.endsWith('.mdx')).map((f) => {
  const fm = fs.readFileSync(SITE + '/content/articles/' + f, 'utf8').split('---')[1];
  const g = (k) => (fm.match(new RegExp('^' + k + ':\\s*"?(.*?)"?\\s*$', 'm')) || [])[1];
  const d = new Date(g('date') + 'T00:00:00+09:00');
  return { n: +f.replace('.mdx', ''), title: g('title'), desc: g('description'), date: g('date'), dateJa: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`, category: g('category'), priority: g('priority') === undefined ? 999 : +g('priority') };
});
// 新着順：日付の新しい順
export const NEWEST = [...ARTS].sort((a, b) => b.date.localeCompare(a.date));
// 人気順：priority の小さい順（同じ値は新着順のまま。現行と同じ）
export const POPULAR = [...NEWEST].sort((a, b) => a.priority - b.priority);

export const card = (a, withDesc) => `<a class="cl-i" href="#" data-inert title="${esc(a.title)}" data-new="${NEWEST.indexOf(a)}" data-pop="${POPULAR.indexOf(a)}"><span class="cl-p">${img(a.n, true).replace('alt=""', 'alt="" loading="lazy"')}</span><p class="cl-m">コラム・<time datetime="${a.date}">${a.dateJa}</time></p><p class="cl-t">${esc(a.title)}</p>${withDesc ? `<p class="cl-d">${esc(a.desc)}</p>` : ''}</a>`;

if (import.meta.url === 'file://' + process.argv[1]) {
  const body = `
<div class="pg">
  <nav class="bc" aria-label="パンくず"><a href="#" data-inert>HOME</a><i aria-hidden="true">/</i><span>コラム</span></nav>
  <div class="pg-h">
    <div><h1>コラム</h1><p>データを活用した分析記事や一口馬主のコラムなどを掲載しています。</p></div>
    <div class="srt" role="group" aria-label="並び替え"><button type="button" data-sort="new" aria-pressed="true">新着順</button><button type="button" data-sort="pop" aria-pressed="false">人気順</button></div>
  </div>
</div>
<div class="cl" id="col-list">${NEWEST.map((a) => card(a, true)).join('')}</div>

<aside class="pr" aria-label="ご案内">
  <div class="pr-ai"><div><p class="pr-k">AI勝率予測</p><h2>出走馬ごとの勝率をAIで予測</h2><p>独自のモデルで出走馬の勝率を算出し、対象レースの約5分前に無料で公開しています。</p></div><a class="cta" href="#" data-inert>予測を見る</a></div>
  <div class="pr-bm"><b>毎週の予想に活用しよう！</b><kbd>Ctrl+D / ⌘+D</kbd><span>でブックマークに登録！</span></div>
</aside>`;

  console.log('articles', L.page({ title: 'コラム | 競馬データ.com（見本）', body, current: 'col', out: 'v6-articles.html', css: fs.readFileSync(S + 'css/articles.css', 'utf8'), js: fs.readFileSync(S + 'js/articles.js', 'utf8') }));
}
