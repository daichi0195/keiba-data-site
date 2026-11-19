// トップの見本（第5版）：手本4サイトの実測値をもとに組む
import fs from 'fs';
import { createRequire } from 'module';
export const SITE = '/Users/kubotataichi/keiba-data-site';
export const S = new URL('.', import.meta.url).pathname;
export const T = new URL('.', import.meta.url).pathname;
export const require = createRequire(SITE + '/package.json');
export const fa = require('@fortawesome/free-solid-svg-icons');

export const preds = JSON.parse(fs.readFileSync(S + 'data/preds.json'));
export const GRADE = JSON.parse(fs.readFileSync(S + 'data/grades.json'));
export const leading = JSON.parse(fs.readFileSync(SITE + '/public/data/leading.json'));
export const b64 = (f, mime) => `data:${mime};base64,${fs.readFileSync(S + 'assets/' + f).toString('base64')}`;
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
export const icon = (def) => { const [w, h, , , p] = def.icon; return `<svg class="ic" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false"><path d="${Array.isArray(p) ? p.join(' ') : p}"/></svg>`; };
export const I = { home: icon(fa.faHouse), course: icon(fa.faFlag), jockey: icon(fa.faHelmetSafety), sire: icon(fa.faHorse), trainer: icon(fa.faUser), ai: icon(fa.faRobot), col: icon(fa.faPenToSquare), search: icon(fa.faMagnifyingGlass), menu: icon(fa.faBars), chevR: icon(fa.faChevronRight), chevD: icon(fa.faChevronDown) };

/* ---------- データ ---------- */
export const src = fs.readFileSync(SITE + '/lib/courses.ts', 'utf8');
export const all = [...src.matchAll(/racecourse: '(\w+)', racecourse_ja: '([^']+)', surface: '(\w+)', surface_ja: '([^']+)', distance: (\d+)(?:, variant: '(\w+)')?/g)].map((m) => ({ rc: m[1], ja: m[2].replace('競馬場', ''), sf: m[3], d: +m[5], v: m[6] }));
export const VENUES = [...new Map(all.map((c) => [c.rc, c.ja])).entries()];
export const SURF = [['turf', '芝'], ['dirt', 'ダート'], ['steeplechase', '障害']];
export const of = (rc, sf) => all.filter((c) => c.rc === rc && c.sf === sf).sort((a, b) => a.d - b.d || (a.v || '').localeCompare(b.v || ''));
export const dl = (c) => `${c.d}m${c.v === 'inner' ? '内' : c.v === 'outer' ? '外' : ''}`;
export const SHORT = { turf: '芝', dirt: 'ダ', steeplechase: '障' };
export const dlh = (c) => `${c.d}<span class="u">m</span>${c.v === 'inner' ? '内' : c.v === 'outer' ? '外' : ''}`;
export const dists = (rc) => `<div class="ds">${SURF.filter(([sf]) => of(rc, sf).length).map(([sf, ja]) => `<div class="ds-r"><span class="sf ${sf}" data-short="${SHORT[sf]}"><span>${ja}</span></span><div class="ds-c">${of(rc, sf).map((c) => `<a href="#" data-inert${c.v ? ' class="v"' : ''} aria-label="${c.ja}${ja}${dl(c)}">${dlh(c)}</a>`).join('')}</div></div>`).join('')}</div>`;

export const day = preds.reduce((m, e) => (e.date > m ? e.date : m), '');
export const today = preds.filter((e) => e.date === day);
export const dlabel = (() => { const d = new Date(day + 'T00:00:00+09:00'); return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`; })();
// 並びは現行と同じ（北から南）
export const dateOf = (s) => { const d = new Date(s + 'T00:00:00+09:00'); return `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`; };
export const shortDate = (s) => { const d = new Date(s + 'T00:00:00+09:00'); return `${d.getMonth() + 1}/${d.getDate()}（${'日月火水木金土'[d.getDay()]}）`; };
export const latest = [...preds].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, 10);
export const WEEK = VENUES.map(([, ja]) => ja).filter((v) => today.some((e) => e.venueLabel === v));
export const WEEK_RC = WEEK.map((ja) => VENUES.find(([, j]) => j === ja)[0]);
export const short = (n) => n.replace(/^(\d歳(以上)?)/, '$1 ');
export const racePanel = (v) => { const rs = today.filter((e) => e.venueLabel === v).sort((a, b) => b.raceNumber - a.raceNumber); return `<div class="rp"><div class="rp-h"><h3>${v}</h3><span>${rs.length}レース</span></div><ul>${rs.map((e, i) => `<li${i >= 5 ? ' data-more' : ''}><a href="#" data-inert><span class="rn"><b class="num">${e.raceNumber}</b>R</span><span class="rt"><b>${esc(short(e.raceName))}</b><span><i class="sf sm ${e.surface === '芝' ? 'turf' : 'dirt'}">${e.surface === '芝' ? '芝' : 'ダート'}</i>${e.distance}m</span></span>${I.chevR}</a></li>`).join('')}</ul><button class="rp-m" type="button" aria-expanded="false" data-open="${v}の全レースを表示" data-close="閉じる">${v}の全レースを表示</button></div>`; };

export const parse = (file) => [...fs.readFileSync(SITE + '/lib/' + file, 'utf8').matchAll(/\{ id: (\d+), name: (?:'([^']+)'|"([^"]+)")(?:, kana: '([^']+)')? \}/g)].map((m) => ({ id: +m[1], name: m[2] ?? m[3], kana: m[4] }));
export const ROWS = [/[あいうえおアイウエオヴ]/, /[かきくけこがぎぐげごカキクケコガギグゲゴ]/, /[さしすせそざじずぜぞサシスセソザジズゼゾ]/, /[たちつてとだぢづでどタチツテトダヂヅデド]/, /[なにぬねのナニヌネノ]/, /[はひふへほばびぶべぼぱぴぷぺぽハヒフヘホバビブベボパピプペポ]/, /[まみむめもマミムメモ]/, /[やゆよヤユヨ]/, /[らりるれろラリルレロ]/, /[わをんワヲン]/];
export function groups(list, keyOf, kata, strict) {
  const b = ROWS.map(() => []), other = [];
  list.forEach((it) => { const f = (keyOf(it) || '').charAt(0); const i = ROWS.findIndex((re, k) => (strict && k === 0 ? /[あいうえおアイウエオ]/.test(f) : re.test(f))); if (i >= 0) b[i].push(it); else other.push(it); });
  const srt = (a, c) => keyOf(a).localeCompare(keyOf(c), 'ja');
  const g = b.map((items, i) => ({ k: (kata ? 'アカサタナハマヤラワ' : 'あかさたなはまやらわ')[i] + '行', items: items.sort(srt) })).filter((x) => x.items.length);
  if (other.length) g.push({ k: 'その他', items: other.sort(srt) });
  return g;
}
export const J = parse('jockeys.ts'), SR = parse('sires.ts'), TR = parse('trainers.ts');
export const GJ = groups(J, (x) => x.kana, false, true), GS = groups(SR, (x) => x.name, true, false), GT = groups(TR, (x) => x.kana, false, true);

/* ---------- 部品 ---------- */
export const head = (title, sub, more) => `<div class="hd"><h2>${title}${sub ? `<small>${sub}</small>` : ''}</h2>${more ? `<a class="pill" href="#" data-inert>${more}</a>` : ''}</div>`;
export const rank = (rows, unit) => { const max = rows[0].wins; const min = rows[9].wins; return `<ol class="rk">${rows.slice(0, 10).map((x, i) => `<li${i >= 5 ? ' data-more' : ''}><a href="#" data-inert><span class="rk-n num${i < 3 ? ` t3 m${i + 1}` : ''}">${i + 1}</span><span class="rk-t"><b>${esc(x.name)}</b><span>勝率 ${x.winRate.toFixed(1)}%・${x.rides.toLocaleString('ja-JP')}${unit}</span></span><span class="rk-b"><i style="width:${((x.wins / max) * 100).toFixed(1)}%;opacity:${(0.55 + 0.45 * (x.wins - min) / (max - min)).toFixed(2)}"></i></span><span class="rk-w"><b class="num">${x.wins}</b>勝</span></a></li>`).join('')}</ol><button class="rk-m" type="button" aria-expanded="false" data-open="6〜10位を表示" data-close="5位までにする">6〜10位を表示</button>`; };
export const kana = (gs, unit, label) => `<div class="kn"><div class="kn-g" role="group" aria-label="${label}を五十音から探す">${gs.map((g, i) => `<button type="button" aria-expanded="${i === 0}" data-i="${i}">${g.k}<span>${g.items.length}</span></button>`).join('')}</div>
  <div class="kn-acc">${gs.map((g, i) => `<details><summary><b>${g.k}</b><span>${g.items.length}${unit}</span>${I.chevD}</summary><div class="kn-a">${g.items.map((x) => `<a href="#" data-inert${x.name.length >= 11 ? ' class="w8 w11"' : x.name.length >= 8 ? ' class="w8"' : ''}>${esc(x.name)}</a>`).join('')}</div></details>`).join('')}</div>
  ${gs.map((g, i) => `<div class="kn-p" data-p="${i}"${i === 0 ? '' : ' hidden'}>${g.items.map((x) => `<a href="#" data-inert>${esc(x.name)}</a>`).join('')}</div>`).join('')}</div>`;
export const people = (id, title, lt, rows, ridesLabel, gs, unit, total, desc, list) => `<section class="sc" id="${id}">${head(title, '', list)}
  <div class="two">
    <div class="pn"><h3>${lt}<small>${leading.year}年・勝ち数順</small></h3>${rank(rows, ridesLabel)}</div>
    <div class="pn"><h3>全${title.replace('別データ', '')}データ<small>${total}${unit}</small></h3><p class="de">${desc}</p>${kana(gs, unit, title.replace('別データ', ''))}</div>
  </div></section>`;
/** 重賞の格付けの札（G1・G2・G3）。レース名から引く。該当なしは空文字 */
export const grade = (raceName) => (GRADE[raceName] ? `<i class="gr ${GRADE[raceName].toLowerCase()}">${GRADE[raceName]}</i>` : '');
export const gradeBadge = (g) => (g ? `<i class="gr ${String(g).toLowerCase()}">${g}</i>` : '');
export const ad = `<div class="ad" role="note" aria-label="広告枠"><span>スポンサーリンク</span><div>広告枠</div></div>`;

export const arts = [[6, '『夏は牝馬を買え』の理由をデータで徹底検証してみた', '2026年5月16日'], [5, '「二頭出し・多頭出しは人気薄」の格言は本当か？同一馬主・同一厩舎で検証してみた', '2026年4月20日'], [4, '【競馬検証】血統の早熟・晩成をデータから分析してみた｜「エピファネイア産駒は早熟」「ハーツクライ産駒は晩成」ってほんと？', '2026年4月13日'], [3, '新馬戦の予想のポイントは？騎手や調教師、血統などのデータを分析！', '2026年1月22日'], [2, '「初仔（はつご）は走らない」「初仔の牝馬は避けるべき」は本当か？3年分のデータから分析', '2026年1月21日'], [1, '初ダート（ダート替わり）の馬は買うべき？勝率や回収率、狙いたい血統を徹底分析', '2026年1月20日']];
export const img = (n, big) => `<img src="${b64(`${big ? 'b' : 'a'}${n}.jpg`, 'image/jpeg')}" alt="" width="${big ? 960 : 480}" height="${big ? 540 : 270}">`;
export const counts = (rc) => SURF.map(([sf, ja]) => [ja === 'ダート' ? 'ダ' : ja === '障害' ? '障' : ja, of(rc, sf).length, sf]).filter((x) => x[1]);

/* ---------- ページの組み立て（全ページ共通の枠：ヘッダー・左メニュー・右列・フッター・下部メニュー） ---------- */
export const NAV = [['home', 'ホーム'], ['ai', 'AI予測'], ['course', 'コースデータ'], ['jockey', '騎手データ'], ['sire', '血統データ'], ['trainer', '調教師データ'], ['col', 'コラム']];
export const TABS = [['course', 'コース'], ['jockey', '騎手'], ['sire', '血統'], ['trainer', '調教師'], ['ai', 'AI予測']];
export const searchIndex = [...J.map((x) => [x.name, '騎手', x.kana]), ...TR.map((x) => [x.name, '調教師', x.kana]), ...SR.map((x) => [x.name, '種牡馬', ''])];
export const logo = b64('logo.png', 'image/png');
/**
 * @param o.title   <title>
 * @param o.body    <main> の中身（HTML文字列）
 * @param o.current 現在地（NAV / TABS のキー：home, ai, course, jockey, sire, trainer, col）
 * @param o.out     出力ファイル名（docs/redesign/ 直下。例 v6-top.html）
 * @param o.css     ページ固有のCSS（共通CSSの後ろに足す）
 * @param o.js      ページ固有のJS（共通JSの後ろに足す）
 * @param o.railAi  右列（幅1800px以上）にAI予測の案内を出すか。AI予測のページ自身では false にする
 */
export function page({ title, body, current = 'home', out, css = '', js = '', railAi = true }) {
  const html = `<title>${title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${fs.readFileSync(S + 'top.css', 'utf8')}
${fs.readFileSync(S + 'themes.css', 'utf8')}
${css}
</style>
<header class="hdr">
  <div class="hdr-l"><button class="hbtn" type="button" aria-label="メニュー">${I.menu}</button><a class="logo" href="#" data-inert><img src="${logo}" alt="" width="30" height="30">競馬データ.com</a></div>
</header>
<div class="shell">
  <aside class="side" aria-label="メニュー">
    <nav>${NAV.map(([k, l]) => `<a href="#" data-inert${k === current ? ' class="on" aria-current="page"' : ''}>${I[k]}<span>${l}</span></a>`).join('')}</nav>
    <h2>今週開催</h2>
    <nav>${WEEK.map((v) => `<a href="#" data-inert><i class="vd"></i><span>${v}競馬場</span></a>`).join('')}</nav>
    <h2>競馬場</h2>
    <nav class="cols">${VENUES.map(([, ja]) => `<a href="#" data-inert><span>${ja}</span></a>`).join('')}</nav>
  </aside>
  <div class="main">
    <div class="cols">
      <main>${body}</main>
      <aside class="rail" aria-label="お知らせと広告">
        <div class="rail-in">
          ${railAi ? `<div class="pn rail-ai"><p class="rail-k">AI勝率予測</p><h2>出走馬ごとの勝率をAIで予測</h2><p>独自のモデルで出走馬の勝率を算出し、対象レースの約5分前に無料で公開しています。</p><a class="cta" href="#" data-inert>予測を見る</a></div>` : ''}
          <div class="ad rail-ad" role="note" aria-label="広告枠"><span>スポンサーリンク</span><div>広告枠<br>300×600</div></div>
        </div>
      </aside>
    </div>
    <footer class="ftr">
      <p class="f-logo">競馬データ.com</p>
      <nav aria-label="サイト情報"><a href="#" data-inert>サイト情報・運営者情報</a><a href="#" data-inert>データの出典と集計方法</a><a href="#" data-inert>免責事項</a><a href="#" data-inert>プライバシーポリシー</a><a href="#" data-inert>お問い合わせ</a></nav>
      <p class="f-note">馬券の購入は20歳になってから。掲載しているデータは参考情報であり、的中を保証するものではありません。</p>
      <p class="f-note">© 2026 競馬データ.com</p>
    </footer>
  </div>
</div>
<nav class="tabbar" aria-label="メインメニュー">${TABS.map(([k, l]) => `<a href="#" data-inert${k === current ? ' class="on" aria-current="page"' : ''}>${I[k]}<span>${l}</span></a>`).join('')}</nav>
<script>
${fs.readFileSync(S + 'top.js', 'utf8').replace('__INDEX__', JSON.stringify(searchIndex))}
${js}
</script>
`;
  fs.writeFileSync(SITE + '/docs/redesign/' + out, html);
  // ブラウザで直接開ける確認用（公開時の枠を再現）
  fs.writeFileSync(S + '.preview/' + out, `<!doctype html><html lang="ja" data-look="m"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${html}</body></html>`);
  return html.length;
}
