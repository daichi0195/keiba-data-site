// 調教師詳細の見本（題材：杉山晴紀 https://keibadata.com/trainers/1157 ）
// データ：data/trainer-01157.json（GCS。lib/getTrainerDataFromGCS.ts と同じ取得元）
//         data/trainer-01157.derived.json（data/derive-entity-st.mjs が本番の lib から作る文章・リンク）
// 見た目は騎手詳細（pages/jockey.mjs）に揃える。部品は pages/_entity-st.mjs
import * as L from '../lib.mjs';
import * as E from './_entity-st.mjs';
const { esc, ad } = L;
const { R, fill, a, stats, sec, pn, H, Hno, subs, cond, ZERO, pct, int } = E;

const t = E.data('trainer-01157.json');
const d = E.data('trainer-01157.derived.json');
const n = t.name, W = `${n}調教師`, ST = `${n}厩舎`;
const year = +d.dateIso.slice(0, 4);
const years = [year - 2, year - 1, year];
const sd = (iso) => iso.slice(0, 10).split('-').map(Number).join('/');

/* ---------- 行（並び・件数は現行どおり） ---------- */
const ystat = years.map((y) => t.yearly_stats.find((r) => r.year === y) ?? { year: y, ...ZERO });
const lead = years.map((y) => t.yearly_leading.find((r) => r.year === y) ?? { year: y, wins: 0, ranking: 0 });
const classRows = ['G1', 'G2', 'G3', 'オープン', '3勝', '2勝', '1勝', '未勝利', '新馬'].map((c) => R(t.class_stats.find((x) => x.class_name === c) ?? ZERO, /^G\d$/.test(c) ? E.gTag(c) : c, c));
const POP = [['fav1', '1番人気'], ['fav2', '2番人気'], ['fav3', '3番人気'], ['fav4', '4番人気'], ['fav5', '5番人気'], ['fav6to9', '6〜9番人気'], ['fav10plus', '10番人気〜']];
const popRows = POP.filter(([k]) => t.popularity_stats?.[k]).map(([k, l]) => R(t.popularity_stats[k], l));
const distRows = t.distance_stats.map((r) => R(r, r.category));
const genderRows = t.gender_stats.map((r) => R(r, r.name));
const ageRows = (t.age_stats ?? []).map((r) => R(r, r.age));
// スマホの横棒の行には勝率も添える（表では勝率の列にある）
const intervalRows = fill(['連闘', '1-3週', '4-7週', '8-10週', '11週-'], t.interval_stats ?? [], (r) => r.interval).map((r) => ({ ...r, listSub: `勝率${pct(r.win_rate)}` }));
const SFEN = { 芝: 'turf', ダート: 'dirt', 障害: 'steeplechase' };
const surfRows = t.surface_stats.map((r) => R(r, SFEN[r.surface] ? E.sfTag(SFEN[r.surface]) : r.surface, r.surface));
const rcRows = E.RC.map(([en, ja]) => { const r = t.racecourse_stats.find((x) => x.racecourse_en === en || x.name === ja); return r ? R(r, ja) : null; }).filter(Boolean);
const rcSum = ['中央', 'ローカル'].map((nm) => t.racecourse_stats.find((r) => r.name === nm)).filter(Boolean).map((r) => R(r, `<b>${r.name}</b>`, r.name));
const courses = t.course_stats.filter((c) => c.surface_en !== 'obstacle');
const jockeyRows = t.jockey_stats.map((r) => R(r, d.jockeyUrl[r.name] ? a(esc(r.name)) : esc(r.name), r.name));
const ownerRows = t.owner_stats.map((r) => R(r, esc(r.name), r.name));
const turf = t.surface_stats.find((r) => r.surface === '芝'), dirt = t.surface_stats.find((r) => r.surface === 'ダート');
const md = (c) => d.mergedDistance.find((x) => x.category === c);
const horses = t.active_horses ?? [], wins = t.graded_wins ?? [];
const v = d.verdict, g = d.graded;
const hasS = v.surfacePos >= 1 && v.surfacePos <= 5, hasD = v.distancePos >= 1 && v.distancePos <= 5;
const ev = (pairs) => pairs.filter(([, r]) => r).map(([l, r]) => [`${l} 複勝率`, r.place_rate]);

/* ---------- 本体（節の並びは現行と同じ） ---------- */
const NAVS = [['profile-section', '基本情報'], ['summary-section', '概要'], ['leading', '年度別'], ...(horses.length ? [['active-horses-section', '管理馬']] : []), ...(wins.length ? [['graded-wins-section', '重賞勝ち']] : []),
  ['characteristics', '特徴'], ['highlights-section', '注目'], ['class-stats', 'クラス別'], ['popularity-stats', '人気別'], ['distance-stats', '距離別'], ['gender-stats', '性別'], ...(ageRows.length ? [['age-stats', '馬齢別']] : []),
  ['interval-stats', '間隔別'], ['surface-stats', '芝ダート別'], ['racecourse-stats', '競馬場別'], ['course-stats', 'コース別'], ['jockey-stats', '騎手'], ['owner-stats', '馬主'], ['faq-section', 'Q&amp;A']];
const body = `
${E.nav(NAVS)}
${E.hero({
  crumb: '調教師一覧', name: n, h1: ST, h1s: '（調教師）の傾向・成績データ',
  lead: `${W}${t.stable || t.debut_year ? `（${[t.stable, t.debut_year ? `${t.debut_year}年開業` : ''].filter(Boolean).join('・')}）` : ''}の成績・データをまとめたページです。独自のデータベースで直近3年間・${int(t.total_races)}レースのデータを集計し、毎週更新しています。`,
  kpi: [['出走数', t.total_stats.races, 0, ''], ['1着', t.total_stats.wins, 0, ''], ['勝率', t.total_stats.win_rate, 1, '%'], ['連対率', t.total_stats.quinella_rate, 1, '%'], ['複勝率', t.total_stats.place_rate, 1, '%']],
  races: t.total_races, period: d.periodText, updated: t.last_updated, iso: d.dateIso, verdictTitle: `${W}の傾向`,
  verdict: [...(hasS ? [['芝・ダート', v.surfacePos, v.surfaceText]] : []), ...(hasD ? [['距離', v.distancePos, v.distanceText]] : [])],
})}
${ad}
${sec('profile-section', Hno(ST, '基本情報'), E.tiles([
  ['所属', esc(t.stable ?? t.profile?.region ?? ''), ''], ['生年月日', d.profile.birth ?? '', d.profile.age !== null ? `${d.profile.age}歳` : ''],
  ['開業', t.debut_year ? `${t.debut_year}年` : '', d.profile.career ? `${d.profile.career}年目` : ''],
  [`${d.thisYear.year}年の勝利数`, `${E.cnt(d.thisYear.wins)}勝`, d.thisYear.ranking > 0 ? `リーディング${d.thisYear.ranking}位` : ''],
  // 冒頭のマスと大きな数字が重ならないよう、着度数を主に見せて勝率・複勝率は補足行に残す（騎手詳細と同じ）
  ['着度数（直近3年間）', `<span class="num">${t.total_stats.wins}-${t.total_stats.places_2}-${t.total_stats.places_3}-${t.total_stats.races - t.total_stats.wins - t.total_stats.places_2 - t.total_stats.places_3}</span>`, `<span class="nb">勝率${t.total_stats.win_rate.toFixed(1)}%／複勝${t.total_stats.place_rate.toFixed(1)}%</span>`],
  ['重賞勝ち（平地）', `${E.cnt(g.wins)}勝`, `直近3年間・G1 ${g.g1}勝`],
]))}
${sec('summary-section', Hno(W, 'データ概要'), E.summary(d.summary, { jockey: Object.keys(d.jockeyUrl), racecourse: courses.filter((c) => d.courseUrl[c.name]).map((c) => c.name) }))}
${sec('leading', H(W, '年度別成績', '勝利数とリーディング順位（直近3年）'), E.yearCharts(lead, ystat))}
${horses.length ? sec('active-horses-section', Hno(ST, '主な管理馬', '直近半年に出走した馬。集計期間の重賞勝ち→勝利数の順'), E.horseList({
  label: `${ST}の主な管理馬`, note: '成績は「1着-2着-3着-着外」。直近3年間・当厩舎での出走分',
  cols: [{ label: '馬名', m: 'm1' }, { label: '性齢', m: 'm1b' }, { label: '成績', m: 'm2', num: true }, { label: '主な勝ち鞍', m: 'm3' }, { label: '父', m: 'm4', ml: '父' }, { label: '最終出走', m: 'm4', ml: '最終出走' }],
  rows: horses.map((h) => [`<b>${esc(h.horse_name)}</b>`, `${h.sex}${h.age ?? ''}`, `<span class="num">${h.races}戦 ${h.wins}-${h.places_2 ?? 0}-${h.places_3 ?? 0}-${h.races - h.wins - (h.places_2 ?? 0) - (h.places_3 ?? 0)}</span>`, E.titles(d.horseTitles[h.horse_id]), esc(h.father ?? '—'), h.last_date ? `<span class="num">${sd(h.last_date)}</span>` : '—']),
})) : ''}
${wins.length ? sec('graded-wins-section', Hno(ST, '重賞勝ち', '直近3年間・平地・新しい順'), E.gradedWins(wins, t.class_stats, ['騎手', (w) => esc(w.jockey_name ?? '—')])) : ''}
${hasS || hasD ? sec('characteristics', Hno(W, '特徴', '判定と、その根拠になった数字'), E.meters([
  ...(hasS ? [{ label: '得意なコース傾向', pos: v.surfacePos, result: v.surfaceText, scale: ['芝が得意', '差分なし', 'ダートが得意'], ev: ev([['芝', turf], ['ダート', dirt]]) }] : []),
  ...(hasD ? [{ label: '得意な距離傾向', pos: v.distancePos, result: v.distanceText, scale: ['短距離が得意', '差分なし', '長距離が得意'], ev: ev([['短距離〜マイル', md('短〜マ')], ['中距離〜長距離', md('中〜長')]]) }] : []),
])) : ''}
${sec('highlights-section', Hno(W, '注目ポイント', '管理馬が得意・苦手なコース。コース名をタップすると詳細へ'), E.highlights(courses, d))}
${cond(W, 'class-stats', 'クラス別データ', classRows, { keyLabel: 'クラス' })}
${cond(W, 'popularity-stats', '人気別データ', popRows, { keyLabel: '人気' }, { note: false })}
${cond(W, 'distance-stats', '距離別データ', distRows, { keyLabel: '距離', hint: E.deflink('距離の定義') })}
${ad}
${cond(W, 'gender-stats', '性別データ', genderRows, { keyLabel: '性別' })}
${ageRows.length ? cond(ST, 'age-stats', '馬齢別データ', ageRows, { keyLabel: '馬齢' }, { sub: '2歳戦（新馬・未勝利が中心）の成績も確認できます' }) : ''}
${cond(W, 'interval-stats', 'レース間隔別データ', intervalRows, { keyLabel: '間隔' })}
${cond(W, 'surface-stats', 'コース区分別データ', surfRows, { keyLabel: '区分' }, { markRows: surfRows.filter((r) => r.text !== '障害') })}
${cond(W, 'racecourse-stats', '競馬場別成績', rcRows, { summaryRows: rcSum, keyLabel: '競馬場' })}
${sec('course-stats', H(W, 'コース別成績', '競馬場をタップすると、コースごとの13項目を表示'), E.courseAcc(courses, d))}
${E.rankSec(W, 'jockey-stats', '騎手別データ', jockeyRows, '騎手', '最大50件まで表示', '勝利数順')}
${E.rankSec(W, 'owner-stats', '馬主別データ', ownerRows, '馬主', '最大50件まで表示', '勝利数順')}
${ad}
${sec('faq-section', L.head('データQ&amp;A'), E.faq(d.faq))}
${E.about(d.periodText, t.last_updated)}`;

console.log('trainer', L.page({ title: `${ST}（調教師）の傾向・データ｜成績・得意条件と騎手相性【毎週更新】`, body, current: 'trainer', out: 'v6-trainer.html', css: E.css, js: E.js }));
