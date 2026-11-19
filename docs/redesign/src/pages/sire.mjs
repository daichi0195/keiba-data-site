// 種牡馬詳細の見本（題材：キズナ https://keibadata.com/sires/99556 ）
// データ：data/sire-99556.json（GCS。lib/getSireDataFromGCS.ts と同じ取得元）
//         data/sire-99556.derived.json（data/derive-entity-st.mjs が本番の lib から作る文章・リンク）
// 見た目は騎手詳細（pages/jockey.mjs）に揃える。部品は pages/_entity-st.mjs
import * as L from '../lib.mjs';
import * as E from './_entity-st.mjs';
const { esc, ad } = L;
const { R, fill, a, stats, sec, pn, H, Hno, subs, cond, ZERO, pct, int } = E;

const s = E.data('sire-99556.json');
const d = E.data('sire-99556.derived.json');
const n = s.name, W = `${n}産駒`;
const year = +d.dateIso.slice(0, 4);
const years = [year - 2, year - 1, year];

/* ---------- 行（並び・件数は現行どおり） ---------- */
const ystat = years.map((y) => s.yearly_stats.find((r) => r.year === y) ?? { year: y, ...ZERO });
const lead = years.map((y) => s.yearly_leading.find((r) => r.year === y) ?? { year: y, wins: 0, ranking: 0 });
const classRows = ['G1', 'G2', 'G3', 'オープン', '3勝', '2勝', '1勝', '未勝利', '新馬'].map((c) => R(s.class_stats.find((x) => x.class_name === c) ?? ZERO, /^G\d$/.test(c) ? E.gTag(c) : c, c));
const styleRows = fill(['escape', 'lead', 'pursue', 'close'], s.running_style_stats, (r) => r.style, (k) => ({ escape: '逃げ', lead: '先行', pursue: '差し', close: '追込' })[k]);
const GATE = ['#FFFFFF', '#222222', '#C62927', '#2573CD', '#E4CA3C', '#58AF4A', '#FAA727', '#DC6179'];
const gateRows = [1, 2, 3, 4, 5, 6, 7, 8].map((g) => R((s.gate_stats ?? []).find((x) => +x.gate === g) ?? ZERO, `<span class="jk-gate num${g === 1 ? ' w' : ''}" style="background:${GATE[g - 1]};color:${[1, 5, 7].includes(g) ? '#222222' : '#FFFFFF'}">${g}</span><span class="vh">枠</span>`, `${g}枠`));
const distRows = fill(['短距離', 'マイル', '中距離', '長距離'], s.distance_stats, (r) => r.category);
const ds = s.distance_surface_stats ?? {};
const band = (rows) => (rows ?? []).map((r) => R(r, `<span class="num">${r.category}</span>`, r.category));
const turfBand = band(ds.turf), dirtBand = band(ds.dirt);
const genderRows = fill(['牡馬', '牝馬', 'セン馬'], s.gender_stats, (r) => r.name);
const ageRows = fill(['2歳', '3歳', '4歳', '5歳', '6歳-'], s.age_stats, (r) => r.age);
const weightRows = fill(['400kg以下', '401-420kg', '421-440kg', '441-460kg', '461-480kg', '481-500kg', '501-520kg', '521-540kg', '541kg以上'], s.horse_weight_stats ?? [], (r) => r.weight_category, (k) => k.replace(/kg/g, ''));
const SF3 = [['芝', 'turf'], ['ダート', 'dirt'], ['障害', 'steeplechase']];
const surfRows = SF3.map(([ja, en]) => R(s.surface_stats.find((x) => x.surface === ja) ?? ZERO, E.sfTag(en), ja));
const sc = s.surface_change_stats;
const changeRows = sc ? [R(sc.turf_to_dirt ?? ZERO, '芝→ダ'), R(sc.dirt_to_turf ?? ZERO, 'ダ→芝')] : [];
const COND = [['good', '良'], ['yielding', '稍'], ['soft', '重'], ['heavy', '不']];
const tcOf = (ja, c) => s.track_condition_stats.find((r) => r.surface === ja && r.condition === c);
const trackRows = SF3.flatMap(([ja, en]) => COND.map(([c, cl]) => R(tcOf(ja, c) ?? ZERO, `${E.sfTag(en)}<span class="tc">${cl}</span>`, `${ja === 'ダート' ? 'ダ' : ja === '障害' ? '障' : ja}・${cl}`)));
const rcRows = E.RC.map(([en, ja]) => R(s.racecourse_stats.find((r) => r.racecourse_en === en) ?? ZERO, ja));
const rcSum = ['right_turn', 'left_turn', 'central', 'local'].map((en) => s.racecourse_stats.find((r) => r.racecourse_en === en)).filter(Boolean).map((r) => R(r, `<b>${r.name}</b>`, r.name));
// 母父別：勝利数の多い順（同数は出走数の多い順）に並べ直し、順位は表示のときに1から振り直す（オーナー指示。元データは出走数順）
const damRows = [...s.dam_sire_stats].sort((x, y) => y.wins - x.wins || y.races - x.races).map((r) => R(r, d.damSireUrl[r.name] ? a(esc(r.name)) : esc(r.name), r.name));
const turf = s.surface_stats.find((r) => r.surface === '芝'), dirt = s.surface_stats.find((r) => r.surface === 'ダート');
const md = (c) => d.mergedDistance.find((x) => x.category === c);
const CT = ['良馬場が得意', 'やや良馬場が得意', '差分なし', 'やや重馬場が得意', '重馬場が得意'];
const v = d.verdict, p = s.profile ?? {};
const ev = (pairs) => pairs.filter(([, r]) => r && r.races > 0).map(([l, r]) => [`${l} 複勝率`, r.place_rate]);
const flat = (rows) => rows.filter((r) => !/^障/.test(r.text)); // 「最も高い」の対象から障害を外す
const faqOf = (kw) => (d.faq.find((f) => f.q.includes(kw))?.a ?? '').split('\n');
// スマホでは棒の一覧を出さず、表は「全項目を見る」の中だけにする（上の図と同じ数字のため）
const noList = (html) => html.replace('class="jk-st', 'class="jk-st es-nol');

/* ---------- 図（現行にはない追加。同じJSONの数字だけを使う） ---------- */
const bands = [...new Set([...(ds.turf ?? []), ...(ds.dirt ?? [])].map((r) => r.category))];
const bOf = (rows, c) => (rows ?? []).find((r) => r.category === c);
const figBands = E.butterfly({
  title: '芝とダートの距離帯別 複勝率', label: `${W}の距離帯別の複勝率：${bands.map((c) => `${c} 芝${bOf(ds.turf, c) ? pct(bOf(ds.turf, c).place_rate) : 'なし'}・ダート${bOf(ds.dirt, c) ? pct(bOf(ds.dirt, c).place_rate) : 'なし'}`).join('、')}`,
  rows: bands.map((c) => ({ label: c, l: bOf(ds.turf, c)?.place_rate, ln: bOf(ds.turf, c)?.races, r: bOf(ds.dirt, c)?.place_rate, rn: bOf(ds.dirt, c)?.races })),
  foot: '棒が長いほど複勝率が高い距離帯。太字は芝とダートで高い方です',
});
const cg = (c) => [{ label: '良', v: c.good.place_rate, n: c.good.races }, { label: '稍重〜不良', v: c.bad.place_rate, n: c.bad.races }];
const figTrack = E.condBars({
  title: '良馬場と道悪（稍重〜不良）の複勝率',
  label: `${W}の複勝率：芝 良${pct(d.turfCondition.good.place_rate)}・稍重〜不良${pct(d.turfCondition.bad.place_rate)}、ダート 良${pct(d.dirtCondition.good.place_rate)}・稍重〜不良${pct(d.dirtCondition.bad.place_rate)}`,
  groups: [{ sf: 'turf', cls: 'tf', rows: cg(d.turfCondition) }, { sf: 'dirt', cls: 'dt', rows: cg(d.dirtCondition) }],
});
const gr = s.growth_rates ?? [];
const figGrowth = gr.length >= 2 ? E.lineChart({
  title: '成長曲線（馬齢別の複勝率）', x: gr.map((r) => [r.age, `${int(r.races)}戦`]),
  label: `${W}の馬齢別の複勝率（全出走馬との比較）：${gr.map((r) => `${r.age} ${pct(r.place_rate)}（全出走馬${pct(r.all_place_rate)}）`).join('、')}`,
  series: [{ name: W, cls: 'g', values: gr.map((r) => r.place_rate) }, { name: '全出走馬', cls: 's', values: gr.map((r) => r.all_place_rate) }],
}) : '';

/* ---------- 本体（節の並びは現行と同じ） ---------- */
const NAVS = [['profile-section', '基本情報'], ['summary-section', '概要'], ['leading', '年度別'], ['progeny-section', '代表産駒'], ['characteristics', '特徴'], ['highlights-section', '注目'],
  ['class-stats', 'クラス別'], ['running-style-stats', '脚質別'], ['gate-stats', '枠順別'], ['distance-stats', '距離別'], ['distance-surface-stats', '芝ダ距離'],
  ['gender-stats', '性別'], ['age-stats', '馬齢別'], ['horse-weight-stats', '馬体重別'], ['surface-stats', '芝・ダ別'], ...(changeRows.length ? [['surface-change-stats', '芝ダ変わり']] : []), ['track-condition-stats', '馬場状態'],
  ['racecourse-stats', '競馬場別'], ['course-stats', 'コース別'], ['dam-sire-stats', '母父別'], ['faq-section', 'Q&amp;A']];
const dl = '<span class="es-s">ダ</span><span class="es-lg">ダート</span>の馬場';
const body = `
${E.nav(NAVS)}
${E.hero({
  crumb: '種牡馬一覧', name: n, h1: W, h1s: 'の特徴・傾向',
  lead: `${W}の成績・データをまとめたページです。独自のデータベースで直近3年間・${int(s.total_races)}レースのデータを集計し、毎週更新しています。`,
  kpi: [['出走数', s.total_stats.races, 0, ''], ['1着', s.total_stats.wins, 0, ''], ['勝率', s.total_stats.win_rate, 1, '%'], ['連対率', s.total_stats.quinella_rate, 1, '%'], ['複勝率', s.total_stats.place_rate, 1, '%']],
  races: s.total_races, period: d.periodText, updated: s.last_updated, iso: d.dateIso, verdictTitle: `${W}の傾向`,
  verdict: [['芝・ダート', v.surfacePos, v.surfaceText], ['距離', v.distancePos, v.distanceText], ['芝の馬場', v.turfPos, CT[v.turfPos - 1]], [dl, v.dirtPos, CT[v.dirtPos - 1]]],
})}
${ad}
${sec('profile-section', Hno(n, '基本情報'), E.tiles([
  ['父', esc(p.father ?? ''), ''], ['母父', esc(p.damsire ?? ''), ''], ['生年', p.birth_year ? `${p.birth_year}年` : '', ''], ['生産', p.birthplace ? `${p.birthplace}${p.imported ? '（輸入）' : ''}` : '', ''],
  [`${d.thisYear.year}年の勝利数`, `${E.cnt(d.thisYear.wins)}勝`, d.thisYear.ranking > 0 ? `リーディング${d.thisYear.ranking}位` : ''],
  ['産駒の重賞勝ち', `${E.cnt(d.graded.wins)}勝`, `集計期間・G1 ${d.graded.g1}勝`],
]))}
${sec('summary-section', Hno(W, 'データ概要'), E.summary(d.summary, { racecourse: s.course_stats.filter((c) => d.courseUrl[c.name]).map((c) => c.name), damSire: Object.keys(d.damSireUrl) }))}
${sec('leading', H(W, '年度別成績', '勝利数とリーディング順位（直近3年）'), E.yearCharts(lead, ystat))}
${s.notable_progeny?.length ? sec('progeny-section', Hno(n, '代表産駒', '集計期間に勝ち星を挙げた産駒。重賞の勝利数→勝利数の順'), E.horseList({
  label: `${n}の代表産駒`, note: '集計期間外の実績は含みません',
  cols: [{ label: '馬名', m: 'm1' }, { label: '性齢', m: 'm1b' }, { label: '成績', m: 'm2', num: true }, { label: '主な勝ち鞍', m: 'm3' }, { label: '母父', m: 'm4', ml: '母父' }],
  rows: s.notable_progeny.map((h) => [`<b>${esc(h.horse_name)}</b>`, `${h.sex}${h.age ?? ''}`, `${h.races}戦${h.wins}勝`, E.titles(d.progenyTitles[h.horse_id]), esc(h.damsire ?? '—')]),
})) : ''}
${sec('characteristics', Hno(W, '特徴', '判定と、その根拠になった複勝率'), E.meters([
  { label: '得意なコース傾向', pos: v.surfacePos, result: v.surfaceText, scale: ['芝が得意', '差分なし', 'ダートが得意'], ev: ev([['芝', turf], ['ダート', dirt]]) },
  { label: '得意な距離傾向', pos: v.distancePos, result: v.distanceText, scale: ['短距離が得意', '差分なし', '長距離が得意'], ev: ev([['短距離〜マイル', md('短〜マ')], ['中距離〜長距離', md('中〜長')]]) },
  { label: '得意な馬場傾向 - 芝', pos: v.turfPos, result: CT[v.turfPos - 1], scale: ['良馬場が得意', '差分なし', '重馬場が得意'], ev: ev([['良', d.turfCondition.good], ['稍重〜不良', d.turfCondition.bad]]) },
  { label: '得意な馬場傾向 - ダート', pos: v.dirtPos, result: CT[v.dirtPos - 1], scale: ['良馬場が得意', '差分なし', '重馬場が得意'], ev: ev([['良', d.dirtCondition.good], ['稍重〜不良', d.dirtCondition.bad]]) },
]))}
${sec('highlights-section', Hno(W, '注目ポイント', '成績が目立つコース。コース名をタップすると詳細へ'), E.highlights(s.course_stats, d))}
${cond(W, 'class-stats', 'クラス別データ', classRows, { keyLabel: 'クラス' })}
${cond(W, 'running-style-stats', '脚質別データ', styleRows, { keyLabel: '脚質', hint: E.deflink('脚質の定義') })}
${cond(W, 'gate-stats', '枠順別データ', gateRows, { keyLabel: '枠番' })}
${cond(W, 'distance-stats', '距離別データ', distRows, { keyLabel: '距離', hint: E.deflink('距離の定義') })}
${turfBand.length || dirtBand.length ? sec('distance-surface-stats', Hno(W, '芝・ダート別の得意距離', subs('芝とダートそれぞれの距離帯別', '')), pn(`${figBands}
  ${turfBand.length ? `<p class="es-sub">${E.sfTag('turf')}<span>${E.bestNote(turfBand)}</span></p>${noList(stats({ rows: turfBand, keyLabel: '距離' }))}` : ''}
  ${dirtBand.length ? `<p class="es-sub">${E.sfTag('dirt')}<span>${E.bestNote(dirtBand)}</span></p>${noList(stats({ rows: dirtBand, keyLabel: '距離' }))}` : ''}`)) : ''}
${ad}
${cond(W, 'gender-stats', '性別データ', genderRows, { keyLabel: '性別' })}
${cond(W, 'age-stats', '馬齢別データ', ageRows, { keyLabel: '馬齢' }, { before: figGrowth ? E.figRow(figGrowth, faqOf('早熟')) : '' })}
${cond(W, 'horse-weight-stats', '馬体重別データ', weightRows, { keyLabel: '馬体重' }, { sub: '馬体重（kg）別' })}
${cond(W, 'surface-stats', '芝・ダート別データ', surfRows, { keyLabel: '馬場' }, { markRows: flat(surfRows) })}
${changeRows.length ? cond(W, 'surface-change-stats', '芝・ダート変わりデータ', changeRows, { keyLabel: '区分', hint: '※芝→ダ：芝デビュー後、初めてダートに挑戦した際の成績<br>※ダ→芝：ダートデビュー後、初めて芝に挑戦した際の成績' }, { note: false }) : ''}
${cond(W, 'track-condition-stats', '重馬場・道悪成績', trackRows, { keyLabel: '馬場状態' }, { own: true, sub: '馬場状態別：芝・ダート・障害 × 良・稍重・重・不良', markRows: flat(trackRows), before: E.figRow(figTrack, faqOf('馬場適性')) })}
${cond(W, 'racecourse-stats', '競馬場別データ', rcRows, { summaryRows: rcSum, keyLabel: '競馬場' }, { sub: '表の最後に右回り・左回り・中央・ローカルの集計' })}
${sec('course-stats', H(W, 'コース別データ', '競馬場をタップすると、コースごとの13項目を表示'), E.courseAcc(s.course_stats, d))}
${E.rankSec(W, 'dam-sire-stats', '母父別データ', damRows, '母父', '最大50件まで表示', '勝利数順')}
${ad}
${sec('faq-section', L.head('データQ&amp;A'), E.faq(d.faq))}
${E.about(d.periodText, s.last_updated)}`;

console.log('sire', L.page({ title: `${W}の特徴・傾向｜得意距離・コース・重馬場成績【毎週更新】`, body, current: 'sire', out: 'v6-sire.html', css: E.css, js: E.js }));
