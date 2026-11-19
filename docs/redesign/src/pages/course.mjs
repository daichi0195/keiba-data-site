// コース詳細の見本（題材：東京・芝1600m）
// 数値は本番の実データ（data/t1600.json）。文章・リンクの有無は本番ページから取得（data/t1600-text.json）
import fs from 'fs';
import * as L from '../lib.mjs';
const { I, esc, head, ad, SURF, of, dl } = L;

const d = JSON.parse(fs.readFileSync(L.S + 'data/t1600.json'));
const tx = JSON.parse(fs.readFileSync(L.S + 'data/t1600-text.json'));
const NAME = '東京芝1600m';
const RC = 'tokyo', SF = 'turf', DIST = 1600;

/* ---------- 共通の小物 ---------- */
const inert = (html) => html.replace(/<!-- -->/g, '').replace(/href="[^"]*"/g, 'href="#" data-inert');
const int = (v) => Math.round(v).toLocaleString('ja-JP');
const pct = (v) => `${v.toFixed(1)}%`;
const fmt = (v, f) => (typeof v !== 'number' || !Number.isFinite(v) ? '-' : f === 'pct' ? pct(v) : f === 'dec' ? v.toFixed(1) : int(v));
const link = (name) => (tx.nolink.includes(name) ? `<span title="${esc(name)}">${esc(name)}</span>` : `<a href="#" data-inert title="${esc(name)}">${esc(name)}</a>`);
// 見出しは語のまとまりで折り返す（語の途中で割らない）
const nb = (parts, sep = '') => parts.map((p) => `<span class="nb">${p}</span>`).join(sep);
const more = (label) => `<a class="c-def" href="#" data-inert>${label}${I.chevR}</a>`;

// 現行と同じ13項目。hl＝最大値をハイライトする列（出走数〜複勝回収率の9列）
const COLS = [
  ['races', '出走数', 'int', 1], ['wins', '1着', 'int', 1], ['places_2', '2着', 'int', 1], ['places_3', '3着', 'int', 1],
  ['win_rate', '勝率', 'pct', 1], ['quinella_rate', '連対率', 'pct', 1], ['place_rate', '複勝率', 'pct', 1],
  ['win_payback', '単勝<br>回収率', 'pct', 1], ['place_payback', '複勝<br>回収率', 'pct', 1],
  ['avg_popularity', '平均<br>人気', 'dec', 0], ['avg_rank', '平均<br>着順', 'dec', 0], ['median_popularity', '人気<br>中央値', 'int', 0], ['median_rank', '着順<br>中央値', 'int', 0],
];
const maxOf = (rows) => Object.fromEntries(COLS.filter((c) => c[3]).map(([k]) => [k, Math.max(...rows.map((r) => r[k]).filter((v) => typeof v === 'number'))]));
const cells = (r, max) => COLS.map(([k, , f, hl]) => { const v = r[k]; const t = fmt(v, f); return `<td class="c-${k}">${hl && typeof v === 'number' && v > 0 && v === max[k] ? `<span class="hl">${t}</span>` : t}</td>`; }).join('');
const ths = COLS.map(([k, l]) => `<th scope="col" class="c-${k}">${l}</th>`).join('');

/* ---------- コースの特徴（メーター） ---------- */
const ch = d.characteristics;
const VOL = { 1: '堅い', 2: 'やや堅い', 3: '標準', 4: 'やや荒れやすい', 5: '荒れやすい' };
const GATE = { 1: '内枠有利', 2: 'やや内枠有利', 3: '互角', 4: 'やや外枠有利', 5: '外枠有利' };
const STYLE = { 1: '逃げ・先行有利', 2: 'やや逃げ・先行有利', 3: '互角', 4: 'やや差し・追込有利', 5: '差し・追込有利' };
const pool = (rows) => { const n = rows.reduce((a, r) => a + r.races, 0); return ((rows.reduce((a, r) => a + r.wins + r.places_2 + r.places_3, 0) / n) * 100); };
const inner = pool(d.gate_stats.filter((g) => g.gate <= 4)), outer = pool(d.gate_stats.filter((g) => g.gate >= 5));
const front = pool(d.running_style_stats.filter((s) => ['逃げ', '先行'].includes(s.style_label))), closer = pool(d.running_style_stats.filter((s) => ['差し', '追込'].includes(s.style_label)));

const meter = (label, result, value, scale, pair, i) => {
  const max = Math.max(...pair.map((p) => p[1]));
  return `<div class="mt-c an" style="--i:${i}">
    <div class="mt-h"><h3>${label}</h3><b>${result}</b></div>
    <div class="mt-t" style="--p:${(value - 1) * 20 + 10}%" role="img" aria-label="${label}は5段階の${value}番目（${result}）">${[1, 2, 3, 4, 5].map((n) => `<i${n === value ? ' class="on"' : ''}></i>`).join('')}<span class="mt-k"></span></div>
    <div class="mt-s" aria-hidden="true">${scale.map((t) => (t.includes('・') ? `<span><span class="lf">${t}</span><span class="sh">${t.replace('有利', '')}</span></span>` : `<span>${t}</span>`)).join('')}</div>
    <dl class="mt-p">${pair.map(([k, v, dec, suf, ref]) => `<div><dt>${k}</dt><dd><span class="mt-b${ref ? ' ref' : ''}"><i style="width:${((v / max) * 100).toFixed(1)}%"></i></span><b class="num" data-count="${v}" data-dec="${dec}" data-suf="${suf}">${dec ? v.toFixed(dec) : int(v)}${suf}</b></dd></div>`).join('')}</dl>
  </div>`;
};
const meters = `<section class="sc" id="characteristics">
  ${head(nb([`${NAME}の`, '特徴']), '判定と、その根拠になった数字')}
  <div class="cp mt">
    <div class="mt-g">
      ${meter('荒れやすさ', VOL[ch.volatility], ch.volatility, ['堅い', '標準', '荒れやすい'], [['三連単中央値', ch.trifecta_median_payback, 0, '円'], ['全コースの中央値', ch.trifecta_all_median_payback, 0, '円', 1]], 0)}
      ${meter('枠順傾向', GATE[ch.gate_position], ch.gate_position, ['内枠有利', '互角', '外枠有利'], [['内枠（1〜4枠）複勝率', +inner.toFixed(1), 1, '%'], ['外枠（5〜8枠）複勝率', +outer.toFixed(1), 1, '%']], 1)}
      ${meter('脚質傾向', STYLE[ch.running_style_trend_position], ch.running_style_trend_position, ['逃げ・先行有利', '互角', '差し・追込有利'], [['逃げ・先行 複勝率', +front.toFixed(1), 1, '%'], ['差し・追込 複勝率', +closer.toFixed(1), 1, '%']], 2)}
    </div>
    <p class="cp-f"><span>三連単配当の中央値は全${ch.total_courses}コース中${ch.trifecta_avg_payback_rank}位（配当の高い順）</span>${more('判定の基準を見る')}</p>
  </div>
</section>`;

/* ---------- コース概要 ---------- */
const ovNote = inert(tx.ovNote).split('<br>')[1];
const overview = `<section class="sc" id="course-overview">
  ${head(nb([`${NAME}の`, 'コース概要']), 'コースの形状と、勝ち馬の決め手')}
  <div class="cp ov">
    <dl class="ov-g">${tx.overview.map((it) => `<div${it.value.length > 12 ? ' class="w"' : ''}><dt>${it.label}</dt><dd><b${/^[\d,.:]+/.test(it.value) ? ' class="num"' : ''}>${esc(it.value)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</dd></div>`).join('')}</dl>
    <div class="ov-r"><h3>直近${d.period_years}年間に行われた重賞</h3><ul>${d.course_profile.graded_races.map((g) => `<li>${L.gradeBadge(g.grade)}${esc(g.race_name)}</li>`).join('')}</ul></div>
    <p class="cp-n">${ovNote}</p>
  </div>
</section>`;

/* ---------- データ概要 ---------- */
const [lead, intro, ...topics] = tx.sum;
const summary = `<section class="sc" id="summary">
  ${head(nb([`${NAME}の`, 'データ概要']), '')}
  <div class="cp sm">
    <p class="sm-l">${inert(lead.html)}</p>
    <p class="sm-i">${inert(intro.html)}</p>
    <div class="sm-g">${topics.map((b) => `<div><h3>${b.title}</h3><p>${inert(b.html)}</p></div>`).join('')}</div>
  </div>
</section>`;

/* ---------- 注目ポイント ---------- */
const kindOf = (label) => (label.includes('得意') ? ['good', '得意'] : label.includes('穴') ? ['hole', '穴'] : ['bad', '苦手']);
const picks = `<section class="sc" id="highlights">
  ${head(nb([`${NAME}の`, '注目ポイント']), 'このコースで成績が目立つ騎手・血統・厩舎。名前をタップすると詳細へ')}
  <div class="cp pk">
    <p class="pk-lg"><span><i class="tg good">得意</i>このコースが得意</span><span><i class="tg hole">穴</i>よく穴をあける</span><span><i class="tg bad">苦手</i>このコースが苦手</span></p>
    <div class="pk-g">${tx.picks.map((c) => `<div class="pk-c"><h3>${c.title}</h3>${c.groups.map((g) => { const [k, t] = kindOf(g.label); return `<div class="pk-r"><span class="tg ${k}" aria-label="${g.label}">${t}</span>${g.names.length ? `<div class="pk-n">${g.names.map((n) => `<a href="#" data-inert>${esc(n.name)}</a>`).join('')}</div>` : '<span class="pk-0">該当なし</span>'}</div>`; }).join('')}</div>`).join('')}</div>
    <p class="cp-f">${more('得意・苦手の基準を見る')}</p>
  </div>
</section>`;

/* ---------- 条件別（人気・枠順・脚質・性別・馬体重）：横棒＋全13項目の表 ---------- */
const GATE_BG = { 1: '#FFFFFF', 2: '#222222', 3: '#C62927', 4: '#2573CD', 5: '#E4CA3C', 6: '#58AF4A', 7: '#FAA727', 8: '#DC6179' };
const GATE_FG = { 1: '#222222', 5: '#222222', 7: '#222222' };
const gateBadge = (n) => `<span class="gt num${n === 1 ? ' g1' : ''}" style="background:${GATE_BG[n]};color:${GATE_FG[n] || '#FFFFFF'}" aria-label="${n}枠">${n}</span>`;
const MIN = 30; // 現行と同じ：出走30未満は「最も高い」の対象外
const SHORT = 5; // 現行（components/course/keyCell.ts）と同じ：1列目が5文字以下なら横に送っても縮めない
const cond = (id, title, sub, rows, keyLabel, extra = '') => {
  const max = maxOf(rows);
  const hi = Math.max(...rows.map((r) => r.place_rate));
  // 濃さは出走30以上の行の中で決める。出走30未満の行は灰色の棒にする
  const enough = rows.filter((r) => r.races >= MIN);
  const eh = enough.length ? Math.max(...enough.map((r) => r.place_rate)) : null, el = enough.length ? Math.min(...enough.map((r) => r.place_rate)) : null;
  const best = rows.find((r) => r.races >= MIN && r.place_rate === eh);
  const bar = (r) => `<span class="br${r.races < MIN ? ' few' : ''}"><i style="width:${((r.place_rate / hi) * 100).toFixed(1)}%${r.races < MIN ? '' : `;opacity:${(0.55 + 0.45 * (eh === el ? 1 : (r.place_rate - el) / (eh - el))).toFixed(2)}`}"></i></span>`;
  const key = (r) => (r.gate ? gateBadge(r.gate) : `<span class="num${r.label.length > SHORT && !r.keep ? ' lg' : ''}">${esc(r.label)}</span>`);
  const table = (cls) => `<div class="tbw ${cls}"><div class="tb"><table class="st ct">
      <thead><tr><th scope="col" class="k">${keyLabel}</th><th scope="col" class="bc">複勝率</th>${ths}</tr></thead>
      <tbody>${rows.map((r, i) => `<tr style="--i:${i}"><th scope="row" class="k">${key(r)}</th><td class="bc">${bar(r)}</td>${cells(r, max)}</tr>`).join('')}</tbody>
    </table></div></div>`;
  return `<section class="sc" id="${id}">
  ${head(title, sub)}
  <div class="cp cd an">
    <p class="cd-b">${best ? `${nb([`出走${MIN}以上で`, '複勝率が', '最も高いのは'])}<b class="nb">${best.gate ? best.gate + '枠' : `<span class="num">${best.label}</span>`}の<span class="num">${pct(best.place_rate)}</span></b>` : '出走数が少ないため、数値は参考程度にご覧ください'}</p>
    <ol class="cb" aria-label="複勝率">${rows.map((r, i) => `<li style="--i:${i}"${r.races >= MIN && r.place_rate === eh ? ' class="best"' : ''}><span class="cb-k">${key(r)}${r.races < MIN ? `<small class="num">出走${r.races}</small>` : ''}</span>${bar(r)}<b class="cb-v num">${pct(r.place_rate)}</b></li>`).join('')}</ol>
    <button class="cd-m" type="button" aria-expanded="false" data-open="全項目を見る（13項目）" data-close="表を閉じる">全項目を見る（13項目）</button>
    ${table('')}
    ${extra}
  </div>
</section>`;
};
const POP = { fav1: '1番人気', fav2: '2番人気', fav3: '3番人気', fav4: '4番人気', fav5: '5番人気', fav6to9: '6〜9番人気', fav10plus: '10番人気〜' };
const popRows = d.popularity_stats.map((r) => ({ ...r, label: POP[r.popularity_group] }));
const gateRows = d.gate_stats.map((r) => ({ ...r, label: `${r.gate}枠` }));
const badRows = d.gate_stats_by_condition.bad.map((r) => ({ ...r, label: `${r.gate}枠` }));
const badRuns = badRows.reduce((a, r) => a + r.races, 0);
const styleRows = d.running_style_stats.map((r) => ({ ...r, label: r.style_label }));
const genderRows = d.gender_stats.map((r) => ({ ...r, label: r.name }));
const weightRows = d.horse_weight_stats.map((r) => ({ ...r, label: r.weight_category.replace(/kg/g, '').replace('-', '〜'), keep: true }));

/* ---------- ランキング（騎手・種牡馬・母父・調教師）：10件＋さらに表示で最大50件 ---------- */
const ranking = (id, title, sub, rows, nameLabel, note) => {
  const max = maxOf(rows), rest = rows.length - 10;
  return `<section class="sc" id="${id}">
  ${head(title, sub)}
  <div class="cp rkt">
    <div class="tbw"><div class="tb"><table class="st">
      <thead><tr><th scope="col" class="k"><span class="rno">順位</span><span class="nm">${nameLabel}</span></th>${ths}</tr></thead>
      <tbody>${rows.map((r, i) => `<tr${i >= 10 ? ' class="mr"' : ''}><th scope="row" class="k"><span class="rno num${i < 3 ? ` t3 m${i + 1}` : ''}">${i + 1}</span><span class="nm">${link(r.name)}</span></th>${cells(r, max)}</tr>`).join('')}</tbody>
    </table></div></div>
    <div class="rkt-f"><span>${note}</span><button class="rkt-m" type="button" aria-expanded="false" data-open="さらに表示（残り${rest}件）" data-close="10件までにする">さらに表示（残り${rest}件）</button></div>
  </div>
</section>`;
};

/* ---------- 同じ競馬場の他コース ---------- */
const others = `<section class="sc" id="other-courses">
  ${head(nb(['東京競馬場の', 'コースデータ一覧']), '')}
  <div class="cp oc">${SURF.filter(([sf]) => of(RC, sf).length).map(([sf, ja]) => `<div class="oc-r"><span class="sf ${sf}">${ja}</span><div class="oc-c">${of(RC, sf).map((c) => { const on = sf === SF && c.d === DIST; return `<a href="#" data-inert${on ? ' class="on" aria-current="page"' : ''} aria-label="東京${ja}${dl(c)}">${dl(c)}</a>`; }).join('')}</div></div>`).join('')}</div>
</section>`;

/* ---------- データQ&A ---------- */
const faq = `<section class="sc" id="faq">
  ${head('データQ&amp;A', '')}
  <div class="cp qa">${tx.faq.map((f) => `<details><summary><span>${esc(f.q)}</span>${I.chevD}</summary><div class="qa-a">${f.a.map((p) => `<p${p.cls ? ` class="${p.cls}"` : ''}>${inert(p.html)}</p>`).join('')}</div></details>`).join('')}</div>
</section>`;

/* ---------- ページ内の移動（チップ） ---------- */
const CHIPS = [['characteristics', '特徴'], ['course-overview', 'コース'], ['summary', '概要'], ['highlights', '注目'], ['popularity', '人気別'], ['gate', '枠順別'], ['gate-bad', '道悪の枠'], ['running-style', '脚質別'], ['gender', '性別'], ['horse-weight', '馬体重別'], ['jockey', '騎手'], ['bloodline', '種牡馬'], ['dam-sire', '母父'], ['trainer', '調教師'], ['other-courses', '他コース'], ['faq', 'Q&amp;A']];

const [m1, m2, m3] = tx.hero.meta.map((s) => s.split(' '));
const body = `
<nav class="chips" aria-label="ページ内"><div>${CHIPS.map(([id, l]) => `<a href="#${id}">${l}</a>`).join('')}</div></nav>

<div class="hero">
  <nav class="crumb" aria-label="パンくず"><a href="#" data-inert>HOME</a><span aria-hidden="true">/</span><a href="#" data-inert>コース一覧</a><span aria-hidden="true">/</span><span>東京競馬場 芝1600m</span></nav>
  <div class="hero-t"><span class="sf turf">芝</span><span class="hero-v">東京競馬場</span></div>
  <h1>${NAME}の傾向と特徴</h1>
  <p class="hero-l">${esc(tx.hero.lead)}</p>
  <dl class="hero-m"><div><dt>${m1[0]}</dt><dd>${m1[1]}</dd></div><div><dt>${m2[0]}</dt><dd>${m2[1]}</dd></div><div><dt>${m3[0]}</dt><dd><time datetime="2026-11-17">${m3[1]}</time></dd></div></dl>
</div>

${meters}
${ad}
${overview}
${summary}
${picks}
${cond('popularity', nb([NAME, '人気別データ'], ' '), '', popRows, '人気')}
${cond('gate', nb([NAME, '枠順別データ'], ' '), '', gateRows, '枠番')}
${cond('gate-bad', nb([NAME, '道悪（重馬場）の', '枠順別データ'], ' ').replace('</span> <span class="nb">枠', '</span><span class="nb">枠'), `稍重・重・不良の${int(badRuns)}走`, badRows, '枠番')}
${cond('running-style', nb([NAME, '脚質別データ'], ' '), '', styleRows, '脚質', `<p class="cp-f">${more('脚質の定義を見る')}</p>`)}
${ad}
${cond('gender', nb([NAME, '性別データ'], ' '), '', genderRows, '性別')}
${cond('horse-weight', nb([NAME, '馬体重別データ'], ' '), '馬体重（kg）別', weightRows, '馬体重')}
${ranking('jockey', nb([`${NAME}が`, '得意な騎手']), '騎手別データ・勝利数順', d.jockey_stats, '騎手', '最大50件まで表示/引退騎手を除く')}
${ranking('bloodline', nb([`${NAME}が`, '得意な血統', '（種牡馬）']), '種牡馬別データ・勝利数順', d.pedigree_stats, '種牡馬', '最大50件まで表示')}
${ranking('dam-sire', nb([`${NAME}が`, '得意な血統', '（母父）']), '母父別データ・勝利数順', d.dam_sire_stats, '母父', '最大50件まで表示')}
${ranking('trainer', nb([`${NAME}が`, '得意な調教師']), '調教師別データ・勝利数順', d.trainer_stats, '調教師', '最大50件まで表示/引退調教師を除く')}
${others}
${ad}
${faq}
<aside class="cp src" aria-label="データの出典と集計方法"><h2>このデータについて</h2><p>${inert(tx.about)}</p></aside>`;

console.log('course', L.page({
  title: `${NAME}の傾向と特徴｜コース詳細の見本`, body, current: 'course', out: 'v6-course.html',
  css: fs.readFileSync(L.S + 'css/course.css', 'utf8'), js: fs.readFileSync(L.S + 'js/course.js', 'utf8'),
}));
