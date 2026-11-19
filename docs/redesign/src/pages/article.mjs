// コラム記事の見本（現行 app/articles/[slug]/page.tsx。題材は content/articles/6.mdx『夏は牝馬を買え』）
// 本文は MDX をそのまま読み込んで組み立てる（文章・数値は書き写さない）
import fs from 'fs';
import * as L from '../lib.mjs';
import { ARTS, NEWEST, POPULAR, card } from './articles.mjs';
const { esc, img, b64, S, SITE, I } = L;

const SLUG = 6;
const art = ARTS.find((a) => a.n === SLUG);
const raw = fs.readFileSync(`${SITE}/content/articles/${SLUG}.mdx`, 'utf8');
const mdx = raw.slice(raw.indexOf('---', 3) + 3).replace(/^\s*# .*\n/, '');

// 執筆者（lib/authors.ts の daichi）
const A = (() => { const s = fs.readFileSync(SITE + '/lib/authors.ts', 'utf8'); const g = (k) => s.match(new RegExp(k + ": '([^']*)'"))[1]; return { name: g('name'), bio: g('bio'), twitter: g('twitter'), rss: g('rss'), about: g('aboutUrl') }; })();
const avatar = b64('author-daichi.jpg', 'image/jpeg');
const X_PATH = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';
const RSS_PATH = 'M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z';
const svg = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="${d}"/></svg>`;

/* ---------- MDX → HTML ---------- */
// 見出しのID（現行の generateId と同じ）
const hid = (t) => t.toLowerCase().replace(/[^\w぀-ゟ゠-ヿ一-龯\s-]/g, '').replace(/\s+/g, '-');
// 文中の書式：**太字**、[リンク](URL)。<strong> と <br /> は原文のまま通す
const inline = (s) => s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="#" data-inert data-href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/<br \/>/g, '<br>');

// 棒グラフ（現行 SeasonDualChart）。2系列＝牡馬と牝馬／夏以外と夏、1系列＝注目の棒だけ色を付ける
const TICK = (max) => (max <= 15 ? 5 : max <= 40 ? 10 : 25);
let chartNo = 0;
function chart(src) {
  const p = (k) => (src.match(new RegExp(k + '="([^"]*)"')) || [])[1];
  const n = (k) => +(src.match(new RegExp(k + '=\\{([\\d.]+)\\}')) || [])[1];
  const rows = [...src.matchAll(/\{ label: '([^']+)', male: ([\d.]+)(?:, female: ([\d.]+))? \}/g)].map((m) => ({ label: m[1], v: [m[2], m[3]].filter((x) => x !== undefined).map(Number) }));
  const title = p('title'), unit = p('unit') || '%', max = n('yMax') || 30, hl = p('highlightLabel');
  const single = rows.every((r) => r.v.length === 1);
  const season = !!p('color1'); // 色の指定があるのは「夏以外（灰）と夏（強調）」の比較
  const names = [p('label1') || '牡馬', p('label2') || '牝馬'];
  const cls = single ? ['mute'] : season ? ['mute', 'acc'] : ['male', 'female'];
  const ticks = []; for (let t = 0; t <= max; t += TICK(max)) ticks.push(t);
  if (ticks[ticks.length - 1] !== max) ticks.push(max); // 上端（yMax）には必ず線を引く（例：0/10/20/30＋35）
  const id = `ch-${++chartNo}`;
  return `<figure class="ch${single ? ' one' : ''}" style="--max:${max};--n:${rows.length}" aria-labelledby="${id}">
  <figcaption><b id="${id}">${esc(title)}</b>${single ? `<span class="ch-lg">${esc(names[0])}（${unit}）</span>` : `<span class="ch-lg">${names.map((nm, i) => `<span><i class="${cls[i]}"></i>${esc(nm)}</span>`).join('')}</span>`}</figcaption>
  <div class="ch-plot">
    <div class="ch-y" aria-hidden="true">${ticks.map((t) => `<span style="--t:${t}"><em class="num">${t}${unit}</em></span>`).join('')}</div>
    <div class="ch-g">${rows.map((r, gi) => `<div class="ch-grp" style="--i:${gi}"><div class="ch-bars">${r.v.map((v, i) => `<div class="ch-b ${single ? (r.label === hl ? 'acc' : 'mute') : cls[i]}" style="--v:${v}" title="${esc(r.label)}${single ? '' : '・' + esc(names[i])} ${v.toFixed(1)}${unit}"><span class="num" data-to="${v.toFixed(1)}"><b>${v.toFixed(1)}</b><small>${unit}</small></span><i></i></div>`).join('')}</div><span class="ch-x${single && r.label === hl ? ' on' : ''}">${esc(r.label)}</span></div>`).join('')}</div>
  </div>
  <table class="vh"><caption>${esc(title)}</caption><thead><tr><th></th>${(single ? [names[0]] : names).map((nm) => `<th>${esc(nm)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><th>${esc(r.label)}</th>${r.v.map((v) => `<td>${v.toFixed(1)}${unit}</td>`).join('')}</tr>`).join('')}</tbody></table>
</figure>`;
}

// 本文に直接書かれた表（体重帯ごとの複勝率差分）。数値の右に、0を中心に左右へ伸びる棒を添える
function diffTable(src) {
  const ths = [...src.matchAll(/<th[^>]*>([^<]+)<\/th>/g)].map((m) => m[1]);
  const rows = [...src.matchAll(/\['([^']+)', '([^']+)', '([^']+)'\]/g)].map((m) => m.slice(1, 4));
  const num = (s) => parseFloat(s.replace('−', '-'));
  const span = Math.ceil(Math.max(...rows.flatMap((r) => [r[1], r[2]].map((x) => Math.abs(num(x))))));
  const cell = (s, bold) => { const v = num(s); const m = s.match(/^([+−][\d.]+)(.*)$/); return `<td class="${v < 0 ? 'neg' : 'pos'}"><span class="df"><span class="df-v"><b class="num${bold ? '' : ' reg'}">${m[1]}</b><small>${m[2]}</small></span><span class="df-b" aria-hidden="true"><i style="--w:${(Math.abs(v) / span * 50).toFixed(1)}%"></i></span></span></td>`; };
  return `<div class="tb"><table><thead><tr>${ths.map((t) => `<th scope="col">${esc(t)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><th scope="row" class="num">${esc(r[0])}</th>${cell(r[1], true)}${cell(r[2], false)}</tr>`).join('')}</tbody></table></div>`;
}

const adSlot = `<div class="ar-ad" role="note" aria-label="広告枠"><span>スポンサーリンク</span><div>広告枠</div></div>`;
const heads = []; // 目次用（H2・H3）
function build(src) {
  const lines = src.split('\n'); const out = []; let h2 = 0, lastH2 = '', i = 0;
  const take = (end) => { const buf = []; for (; i < lines.length; i++) { buf.push(lines[i]); if (end(lines[i])) { i++; break; } } return buf.join('\n'); };
  while (i < lines.length) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }
    if (ln.startsWith('<SeasonDualChart')) { out.push(chart(take((l) => l.trim() === '/>'))); continue; }
    if (ln.startsWith('<div style={{ overflowX')) { out.push(diffTable(take((l) => l === '</div>'))); continue; }
    if (ln.startsWith('<div style={{ fontSize')) { const t = take((l) => l === '</div>').split('\n').slice(1, -1).join('\n'); out.push(`<p class="note">${inline(t.trim())}</p>`); continue; }
    if (ln.trim() === '---') { i++; continue; } // 区切り線：次のH2が罫を持つので重ねない
    let m;
    if ((m = ln.match(/^## (.+)$/))) {
      h2++; lastH2 = m[1]; heads.push({ lv: 2, t: m[1], id: hid(m[1]) });
      if (h2 === 1) out.push('__TOC__');           // 最初のH2の前に目次（現行と同じ）
      if (h2 === 2 || h2 === 4) out.push(adSlot);  // 2つ目と4つ目のH2の前に記事内広告（現行と同じ）
      out.push(`<h2 id="${hid(m[1])}">${inline(m[1])}</h2>`); i++; continue;
    }
    if ((m = ln.match(/^### (.+)$/))) { heads.push({ lv: 3, t: m[1], id: hid(m[1]) }); out.push(`<h3 id="${hid(m[1])}">${inline(m[1])}</h3>`); i++; continue; }
    if (ln.startsWith('- ')) {
      const items = []; for (; i < lines.length && lines[i].startsWith('- '); i++) items.push(lines[i].slice(2));
      const linkOnly = items.every((x) => /^\*\*\[[^\]]+\]\([^)]+\)\*\*$/.test(x));
      const defs = items.every((x) => /^\*\*[^*]{1,2}\*\*：/.test(x));
      if (linkOnly) out.push(`<ul class="lk">${items.map((x) => `<li>${inline(x.replace(/\*\*/g, '')).replace('</a>', `${I.chevR}</a>`)}</li>`).join('')}</ul>`);
      else if (defs) out.push(`<ul class="kv">${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`);
      else out.push(`<ul${lastH2 === 'まとめ' ? ' class="sum"' : ''}>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`);
      continue;
    }
    // 段落（空行まで。途中でグラフが始まったらそこで切る）
    const buf = []; for (; i < lines.length && lines[i].trim() && !/^(<SeasonDualChart|<div style|#{2,3} |- )/.test(lines[i]); i++) buf.push(lines[i]);
    out.push(`<p>${inline(buf.join('\n'))}</p>`);
  }
  return out.join('\n');
}
let content = build(mdx);

// 目次：本文の中（スマホ・タブレット。先に5件、残りは「すべて表示」）と、右に固定する列（PC）
const TOC_SHOW = 5;
const tocInline = `<nav class="toc" aria-label="目次"><p class="toc-h">目次</p><ol>${heads.map((h, i) => `<li class="l${h.lv}"${i >= TOC_SHOW ? ' data-more' : ''}><a href="#${h.id}">${esc(h.t)}</a></li>`).join('')}</ol><button type="button" class="toc-m" aria-expanded="false">すべて表示（全${heads.length}件）</button></nav>`;
content = content.replace('__TOC__', tocInline);
const tocSide = `<aside class="ts" aria-label="目次"><nav class="ts-in"><p class="ts-h">目次</p><ol>${heads.map((h) => `<li class="l${h.lv}"><a href="#${h.id}">${esc(h.t)}</a></li>`).join('')}</ol></nav></aside>`;

const share = (cls, label) => `<a class="sh ${cls}" href="#" data-inert aria-label="Xでシェア">${svg(X_PATH)}<span>${label}</span></a>`;
// 前後の記事（現行と同じ：前＝ひとつ古い記事、次＝ひとつ新しい記事）
const idx = NEWEST.indexOf(art), prev = NEWEST[idx + 1], next = NEWEST[idx - 1];
const navItem = (a, label, k) => `<a class="an-i ${k}" href="#" data-inert><span class="an-p">${img(a.n, false)}</span><span class="an-t"><small>${label}</small><b>${esc(a.title)}</b></span></a>`;

const body = `
<div class="ar"><div class="ar-in">
  <nav class="bc" aria-label="パンくず"><a href="#" data-inert>HOME</a><i aria-hidden="true">/</i><a href="#" data-inert>コラム</a><i aria-hidden="true">/</i><span>${esc(art.title)}</span></nav>
  <div class="ar-cols">
    <article class="ar-main">
      <header class="ar-hd">
        <div class="ar-ht">
          <div>
            <p class="ar-k">${art.category}</p>
            <h1${/^[『「【（]/.test(art.title) ? ' class="hang"' : ''}>${esc(art.title)}</h1>
          </div>
          <div class="ar-meta">
            <p class="ar-by"><img src="${avatar}" alt="" width="32" height="32"><b>${A.name}</b><time datetime="${art.date}">${art.dateJa}</time></p>
            ${share('sm', 'シェア')}
          </div>
        </div>
        <div class="ar-hero">${img(SLUG, true).replace('alt=""', `alt="${esc(art.title)}"`)}</div>
      </header>

      <div class="ar-sheet">
        <div class="ar-body">
${content}
        </div>

        <div class="ar-share"><p>この記事をシェア</p>${share('lg', 'Xでシェア')}</div>

        <footer class="au">
          <img src="${avatar}" alt="${A.name}" width="72" height="72">
          <div class="au-t">
            <p class="au-k">この記事を書いた人</p>
            <p class="au-n">${A.name}</p>
            <p class="au-b">${A.bio}</p>
            <p class="au-l"><a class="au-ic" href="#" data-inert aria-label="X (Twitter)" data-href="${A.twitter}">${svg(X_PATH)}</a><a class="au-ic" href="#" data-inert aria-label="RSS" data-href="${A.rss}">${svg(RSS_PATH)}</a><a class="au-a" href="#" data-inert data-href="${A.about}">サイト情報・運営者情報</a></p>
          </div>
        </footer>
      </div>

      <nav class="an${prev && next ? ' two' : ''}" aria-label="前後の記事">${prev ? navItem(prev, '前の記事', 'prev') : ''}${next ? navItem(next, '次の記事', 'next') : ''}</nav>
    </article>
    ${tocSide}
  </div>

  <section class="ar-pop" aria-labelledby="pop-h">
    <h2 id="pop-h">人気記事</h2>
    <div class="cl nodesc">${POPULAR.slice(0, 10).map((a) => card(a, false)).join('')}</div>
  </section>
</div></div>`;

console.log('article', L.page({ title: `${art.title} | 競馬データ.com（見本）`, body, current: 'col', out: 'v6-article.html', css: fs.readFileSync(S + 'css/articles.css', 'utf8') + fs.readFileSync(S + 'css/article.css', 'utf8'), js: fs.readFileSync(S + 'js/articles.js', 'utf8') + fs.readFileSync(S + 'js/article.js', 'utf8') }));
