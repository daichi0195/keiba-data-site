// AI予測の3ページ（ai / ai-races / ai-race）で共通に使う部品とデータ
import fs from 'fs';
import * as L from '../lib.mjs';
const { esc, I, short, shortDate } = L;

export const CSS = fs.readFileSync(L.S + 'css/ai.css', 'utf8');
export const JS = fs.readFileSync(L.S + 'js/ai.js', 'utf8');
export const preds = L.preds; // https://storage.googleapis.com/umadata/predictions/index.json の写し（並びは index.json のまま）

/* ---------- 表記 ---------- */
export const dateY = (s) => { const d = new Date(s + 'T00:00:00+09:00'); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`; };
export const sfKey = (s) => (s === '芝' ? 'turf' : s === '障害' ? 'steeplechase' : 'dirt');
export const sfJa = (s) => (s === '芝' ? '芝' : s === '障害' ? '障害' : 'ダート');
export const sf = (s, sm) => `<i class="sf${sm ? ' sm' : ''} ${sfKey(s)}">${sfJa(s)}</i>`;
// 狭い幅では「ダ」「障」に縮める札
export const sfShort = (s) => `<i class="sf sm ${sfKey(s)} p-sfs"><span class="l">${sfJa(s)}</span><span class="s">${sfJa(s).charAt(0)}</span></i>`;

/* ---------- 印（現行 Mark.tsx と同じ正規化。旧形式 honmei/himo/kiken と現行形式【本命】【紐】【危険】の両方） ---------- */
export const MARKS = {
  honmei: { sym: '◎', text: '本命' },
  himo: { sym: '△', text: '紐' },
  kiken: { sym: '×', text: '危険' },
};
export const normalizeMark = (m) => {
  if (!m) return null;
  if (m === 'honmei' || m.includes('本命')) return 'honmei';
  if (m === 'himo' || m.includes('紐')) return 'himo';
  if (m === 'kiken' || m.includes('危険')) return 'kiken';
  return null;
};
export const mark = (k) => (k ? `<span class="p-mk ${k}"><b aria-hidden="true">${MARKS[k].sym}</b>${MARKS[k].text}</span>` : '');

/* ---------- 部品 ---------- */
// パンくず：items = [[ラベル, リンクか否か], …]。先頭の HOME は自動で付く
export const crumb = (items) => `<nav class="p-crumb" aria-label="パンくず"><a href="#" data-inert>HOME</a>${items.map(([l, link]) => (link ? `<i aria-hidden="true">/</i><a href="#" data-inert>${esc(l)}</a>` : `<span class="cur"><i aria-hidden="true">/</i>${esc(l)}</span>`)).join('')}</nav>`;

// トップ見本の AI予測カード（.ac）と同じ部品（格付けの札はレース名の前）。label を渡すと上に小さな見出しを足す（前の予測・次の予測）
export const card = (e, label = '', cls = '') => `<a class="ac${cls ? ' ' + cls : ''}" href="#" data-inert>${label ? `<span class="p-nav-l">${label}</span>` : ''}<p class="ac-h"><span class="ac-v">${e.venueLabel}<b class="num">${e.raceNumber}</b>R</span><span class="ac-d">${shortDate(e.date)}</span></p><p class="ac-n">${L.grade(e.raceName)}${esc(short(e.raceName))}</p><p class="ac-m">${sf(e.surface, true)}<span class="num">${e.distance}m</span></p></a>`;

// Xでの予測配信の案内（現行 AIXBanner）
export const xBanner = `<a class="p-pn p-x" href="#" data-inert>
  <svg class="p-x-i" aria-hidden="true" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  <span class="p-x-t"><b>Xでも予測を配信中！</b><span>対象レースの約5分前にポストしています。フォロー&amp;通知をオンにして最新情報を受け取ろう！</span></span>${I.chevR}</a>`;

// 印の説明（現行 /ai「印について」の文面そのまま）
export const MARK_DESC = {
  honmei: ['予測勝率が高く、オッズとの乖離から期待値が高いと判定された馬です。単勝候補として推奨します。', '予測は参考情報であり、的中や回収率を保証するものではありません。'],
  himo: ['人気はないものの、予測勝率に対してオッズが高く、市場に過小評価されていると判定された馬です。', 'ワイドや3連系馬券の相手候補として推奨します。'],
  kiken: ['人気を集めているものの、予測勝率が低く過大評価されていると判定された馬です。', 'テスト期間では単勝回収率60%を下回っており、長期的に購入するとマイナスになる可能性が高いです。'],
};

// ブックマークの案内（現行は PC の右列に出る）
export const bookmark = `<p class="p-bm">毎週の予想に活用しよう！ <kbd>Ctrl+D</kbd> / <kbd>⌘+D</kbd> でブックマークに登録！</p>`;
