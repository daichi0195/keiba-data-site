// 固定ページ（読み物・案内）6枚で共通の組み立て
import fs from 'fs';
import * as L from '../lib.mjs';
export { L };
const { I, S } = L;

export const css = fs.readFileSync(S + 'css/static.css', 'utf8');
export const js = fs.readFileSync(S + 'js/static.js', 'utf8');

/** 見本用のリンク（押しても動かない） */
export const a = (label) => `<a href="#" data-inert>${label}</a>`;
/** 箇条書き */
export const ul = (items) => `<ul class="st-ul">${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
/** 用語と説明の表。rows: [用語, 説明, 用語の補足]。mode: ''（縦積み）/ 'row'（常に横並び）/ 'row-pc'（PCだけ横並び）。tw: 用語の列幅 */
export const df = (rows, mode = '', tw = '') => `<dl class="st-df${mode ? ' ' + mode : ''}"${tw ? ` style="--tw:${tw}"` : ''}>${rows.map(([t, d, n]) => `<div><dt>${t}${n ? `<small>${n}</small>` : ''}</dt><dd>${d}</dd></div>`).join('')}</dl>`;

// 固定ページどうしの行き来（右列・スマホは本文の下）
const SITE_NAV = [['about', 'サイト情報・運営者情報'], ['about-data', 'データの出典と集計方法'], ['contact', 'お問い合わせ'], ['privacy', 'プライバシーポリシー'], ['disclaimer', '免責事項']];

/** 段落・箇条書き・説明の末尾3文字を折り返さない塊にして、行末に1〜2文字だけ残るのを防ぐ（文章は変えない） */
export const tail = (html) => html.replace(/([^<>\s]{3})(<\/(?:p|li|dd)>)/g, '<span class="nw">$1</span>$2');
/** パンくず。区切りの「/」は後ろの項目と一緒に折り返す */
export const crumb = (crumbs) => `<nav class="st-crumb" aria-label="パンくず"><span class="st-c"><a href="#" data-inert>HOME</a></span><wbr>${crumbs.map(([l, link]) => `<span class="st-c"><i aria-hidden="true">/</i>${link ? `<a href="#" data-inert>${l}</a>` : `<span aria-current="page">${l}</span>`}</span>`).join('<wbr>')}</nav>`;

/**
 * @param o.key      ページのキー（about / about-data / contact / privacy / disclaimer）
 * @param o.title    h1
 * @param o.crumbs   パンくず（HOME の後ろ）。[ラベル, リンクか] の配列
 * @param o.lead     リード文（任意）
 * @param o.sections [{ id, title, html, cls }]
 * @param o.toc      目次を出すか（長いページ）
 */
export function staticBody({ key, title, crumbs, lead, sections, toc }) {
  const secs = sections.map((s, i) => ({ ...s, id: s.id || `sec-${i + 1}` }));
  const items = secs.map((s, i) => `<li><a href="#${s.id}"><span class="n num">${i + 1}</span><span>${s.title}</span></a></li>`).join('');
  const back = toc ? `<p class="st-back"><a href="#st-toc-m">${I.chevD}目次へ</a></p>` : '';
  return tail(`<div class="st${toc ? ' has-toc' : ''}" id="st-top">
  <header class="st-h">
    ${crumb(crumbs)}
    <h1>${title}</h1>
    ${lead ? `<p class="st-lead">${lead}</p>` : ''}
  </header>
  <aside class="st-aside">
    ${toc ? `<details class="st-pn st-toc-m" id="st-toc-m"><summary><b>目次</b><span><span class="num">${secs.length}</span>項目</span>${I.chevD}</summary><ol>${items}</ol></details>
    <div class="st-toc-w"><nav class="st-pn st-toc" aria-label="目次"><h2>目次</h2><ol>${items}</ol></nav></div>` : ''}
    <nav class="st-pn st-nav" aria-label="サイト案内"><h2>サイト案内</h2><ul>${SITE_NAV.map(([k, l]) => `<li><a href="#" data-inert${k === key ? ' class="on" aria-current="page"' : ''}><span>${l}</span>${I.chevR}</a></li>`).join('')}</ul></nav>
  </aside>
  <article class="st-pn st-art">
    ${secs.map((s) => `<section id="${s.id}"><h2>${s.title}</h2><div class="st-p${s.cls ? ' ' + s.cls : ''}">${s.html}</div>${back}</section>`).join('\n    ')}
  </article>
</div>`);
}

export function staticPage({ out, pageTitle, ...o }) {
  return L.page({ title: pageTitle, body: staticBody(o), current: 'none', out, css, js });
}
