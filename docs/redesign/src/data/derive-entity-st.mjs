// 種牡馬詳細・調教師詳細の見本用：本番と同じ文章・リンクを、本番のコード（lib/*.ts）から作って JSON に保存する
// 使い方: node docs/redesign/src/data/derive-entity-st.mjs
//   入力  data/sire-99556.json（https://storage.googleapis.com/umadata/sires/99556.json）
//         data/trainer-01157.json（https://storage.googleapis.com/umadata/trainer/01157.json）
//   出力  data/sire-99556.derived.json / data/trainer-01157.derived.json
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const SITE = '/Users/kubotataichi/keiba-data-site';
const D = new URL('.', import.meta.url).pathname;
const require = createRequire(SITE + '/package.json');
const esbuild = require('esbuild');

// 本番の lib をそのまま束ねて読み込む（文言・リンクの規則を写し間違えないため）
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'entity-st-'));
const entry = path.join(tmp, 'entry.ts');
fs.writeFileSync(entry, `
export { buildSireSummaryKeyed, buildTrainerSummaryKeyed } from '@/lib/dataPageText';
export { buildSireSummaryBlocks } from '@/lib/sireSummaryBlocks';
export { toTrainerSummaryBlocks } from '@/lib/trainerPageData';
export { resolveCourseUrl, courseLabel } from '@/lib/courseLinks';
export { periodFromDataPeriod, jaDateToIso } from '@/lib/dataDate';
export { hasEnoughRaces } from '@/lib/dataPageRules';
export * as X from '@/lib/entityExtras';
export { ALL_SIRES } from '@/lib/sires';
export { ALL_JOCKEYS } from '@/lib/jockeys';
`);
const out = path.join(tmp, 'lib.mjs');
esbuild.buildSync({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: out, alias: { '@': SITE }, logLevel: 'error' });
const lib = await import(pathToFileURL(out).href);
const { X } = lib;

const read = (f) => JSON.parse(fs.readFileSync(D + f, 'utf8'));
const pct = (v) => Number(v).toFixed(1);

// ---- Q&A（app/sires/[id]/page.tsx・app/trainers/[id]/page.tsx と同じ規則） ----
const courseName = (c) => {
  const rc = c.racecourse.replace('競馬場', '');
  const surf = c.surface_en === 'turf' ? '芝' : c.surface_en === 'dirt' ? 'ダート' : '障害';
  const variant = c.variant === 'inner' || c.variant === '内' ? '内回り' : c.variant === 'outer' || c.variant === '外' ? '外回り' : '';
  return `${rc}${surf}${c.distance}m${variant}`;
};
const rcName = (r) => (r.name.endsWith('競馬場') ? r.name : `${r.name}競馬場`);
const top3 = (rows, key, dir, nameOf) => [...rows].sort((a, b) => dir * (b[key] - a[key])).slice(0, 3).map((r) => `${nameOf(r)}（**${pct(r[key])}%**）`).join('、');
function rcAnswer(rows, good) {
  if (rows.length === 0) return '対象となる競馬場が存在しません。\n※直近3年間で20走以上を対象としています。';
  const w = good ? '高い' : '低い', d = good ? 1 : -1;
  return [`勝率が${w}競馬場TOP3は${top3(rows, 'win_rate', d, rcName)}です。`, `複勝率が${w}競馬場TOP3は${top3(rows, 'place_rate', d, rcName)}です。`, '※直近3年間で20走以上を対象としています。'].join('\n');
}
function courseAnswer(rows, good) {
  if (rows.length === 0) return '対象となるコースが存在しません。\n※直近3年間で10走以上を対象としています。';
  const w = good ? '高い' : '低い', d = good ? 1 : -1;
  return [`勝率が${w}コースTOP3は${top3(rows, 'win_rate', d, courseName)}です。`, `複勝率が${w}コースTOP3は${top3(rows, 'place_rate', d, courseName)}です。`, '※直近3年間で10走以上を対象としています。'].join('\n');
}
function surfaceAnswer(turf, dirt) {
  if (!turf && !dirt) return '対象となるデータが存在しません。';
  if (!turf) return `ダートの成績のみあります。ダートの複勝率は**${pct(dirt.place_rate)}%**です。`;
  if (!dirt) return `芝の成績のみあります。芝の複勝率は**${pct(turf.place_rate)}%**です。`;
  const diff = turf.place_rate - dirt.place_rate;
  const detail = `芝の複勝率は**${pct(turf.place_rate)}%**、ダートは**${pct(dirt.place_rate)}%**です。`;
  if (diff >= 5) return `芝の方が得意な傾向があります。\n${detail}`;
  if (diff >= 3) return `やや芝の方が得意な傾向があります。\n${detail}`;
  if (diff <= -5) return `ダートの方が得意な傾向があります。\n${detail}`;
  if (diff <= -3) return `ややダートの方が得意な傾向があります。\n${detail}`;
  return `芝とダートで差はありません。\n${detail}`;
}
function mergedDistance(stats) {
  const f = (c) => stats.find((s) => s.category === c);
  const merge = (d1, d2, label) => {
    if (!d1 && !d2) return null;
    if (!d1) return { ...d2, category: label };
    if (!d2) return { ...d1, category: label };
    const r = d1.races + d2.races;
    return {
      category: label, races: r, wins: d1.wins + d2.wins,
      place_rate: r > 0 ? ((d1.wins + d2.wins + d1.places_2 + d2.places_2 + d1.places_3 + d2.places_3) / r) * 100 : 0,
    };
  };
  return [merge(f('短距離'), f('マイル'), '短〜マ'), merge(f('中距離'), f('長距離'), '中〜長')].filter(Boolean);
}
const fullName = (cat) => (cat === '短〜マ' ? '短距離〜マイル' : cat === '中〜長' ? '中距離〜長距離' : cat);
function distanceAnswer(groups) {
  if (groups.length === 0) return '対象となるデータが存在しません。';
  const best = [...groups].sort((a, b) => b.place_rate - a.place_rate)[0];
  const other = groups.find((g) => g.category !== best.category);
  const diff = other ? best.place_rate - other.place_rate : 0;
  const detail = groups.map((g) => `${fullName(g.category)}の複勝率は**${pct(g.place_rate)}%**`).join('、');
  const conclusion = diff >= 5 ? `${fullName(best.category)}が得意な傾向があります。` : diff >= 3 ? `やや${fullName(best.category)}が得意な傾向があります。` : '距離帯で差はありません。';
  return [conclusion, `${detail}です。`].join('\n');
}
// 馬場状態：良 と 稍重〜不良（出走数で重み付け）
function mergedCondition(stats, surface) {
  const rows = ['good', 'yielding', 'soft', 'heavy'].map((c) => stats.find((s) => s.surface === surface && s.condition === c) ?? { races: 0, wins: 0, places_2: 0, places_3: 0, place_rate: 0 });
  const bad = rows.slice(1);
  const n = bad.reduce((a, c) => a + c.races, 0);
  const hit = bad.reduce((a, c) => a + c.wins + c.places_2 + c.places_3, 0);
  return { good: { ...rows[0] }, bad: { races: n, place_rate: n > 0 ? (hit / n) * 100 : 0 } };
}
function conditionTrend(stats, surface) {
  const good = stats.filter((s) => s.surface === surface && s.condition === 'good');
  const bad = stats.filter((s) => s.surface === surface && ['yielding', 'soft', 'heavy'].includes(s.condition));
  if (good.length === 0 || bad.length === 0) return 3;
  const w = (rows) => rows.reduce((a, s) => a + s.place_rate * s.races, 0) / rows.reduce((a, s) => a + s.races, 0);
  const diff = w(good) - w(bad);
  return diff >= 5 ? 1 : diff >= 2 ? 2 : diff <= -5 ? 5 : diff <= -2 ? 4 : 3;
}
function trackAnswer(stats) {
  const text = (m, surface) => {
    const { good, bad } = m;
    const detail = `良馬場の複勝率は**${pct(good.place_rate)}%**、稍〜不良馬場は**${pct(bad.place_rate)}%**`;
    const diff = good.place_rate - bad.place_rate;
    const trend = diff >= 5 ? `**${surface}は良馬場の方が得意な傾向があります。**` : diff >= 3 ? `**${surface}はやや良馬場の方が得意な傾向があります。**` : diff <= -5 ? `**${surface}は道悪の方が得意な傾向があります。**` : diff <= -3 ? `**${surface}はやや道悪の方が得意な傾向があります。**` : `**${surface}は馬場状態による差はありません。**`;
    const rain = diff <= -5 ? '雨が降った馬場では有利になる傾向があります。' : diff <= -3 ? '雨が降った馬場ではやや有利になる傾向があります。' : diff >= 5 ? '雨が降った馬場では割引が必要です。' : diff >= 3 ? '雨が降った馬場ではやや割引が必要です。' : '';
    return [trend, `${detail}です。`, rain].filter(Boolean).join('\n');
  };
  return [text(mergedCondition(stats, '芝'), '芝'), text(mergedCondition(stats, 'ダート'), 'ダート')].join('\n\n');
}
const courseMaps = (rows) => {
  const url = {}, label = {}, short = {};
  rows.forEach((c) => { const u = lib.resolveCourseUrl(c); if (u) url[c.name] = u; label[c.name] = lib.courseLabel(c); short[c.name] = lib.courseLabel(c, { withRacecourse: true, shortDirt: true }); });
  return { url, label, short };
};

// ================= 種牡馬 =================
{
  const s = read('sire-99556.json');
  const clamp = (v) => Math.min(5, Math.max(1, Math.round(v) || 3));
  const surfacePos = clamp(s.characteristics?.surface_trend_position ?? 3);
  const distancePos = clamp(s.characteristics?.distance_trend_position ?? 3);
  const turfPos = conditionTrend(s.track_condition_stats, '芝');
  const dirtPos = conditionTrend(s.track_condition_stats, 'ダート');
  const surfaceText = ['芝が得意', 'やや芝が得意', '差分なし', 'ややダートが得意', 'ダートが得意'][surfacePos - 1];
  const distanceText = ['短距離が得意', 'やや短距離が得意', '差分なし', 'やや長距離が得意', '長距離が得意'][distancePos - 1];
  const ds = s.distance_surface_stats ?? {};
  const blocks = lib.buildSireSummaryBlocks(lib.buildSireSummaryKeyed(s));
  blocks.unshift({ key: 'lead', text: X.buildSireLead({ name: s.name, profile: s.profile, surfaceTrendText: surfaceText, distanceTrendText: distanceText, bestTurf: X.bestBand(ds.turf), bestDirt: X.bestBand(ds.dirt), progeny: s.notable_progeny }) });
  const cm = courseMaps(s.course_stats);
  const damSireUrl = {};
  s.dam_sire_stats.forEach((d) => { const hit = lib.ALL_SIRES.find((x) => x.name === d.name); if (hit) damSireUrl[d.name] = `/sires/${hit.id}`; });
  const rcQ = s.racecourse_stats.filter((r) => r.name !== '中央' && r.name !== 'ローカル' && r.races >= 20);
  const cQ = s.course_stats.filter((c) => c.races >= 10 && c.surface_en !== 'obstacle');
  const turf = s.surface_stats.find((x) => x.surface === '芝'), dirt = s.surface_stats.find((x) => x.surface === 'ダート');
  const md = mergedDistance(s.distance_stats);
  const band = X.buildSireBandAnswer(s.name, ds.turf, ds.dirt), growth = X.buildSireGrowthAnswer(s.name, s.growth_rates), prog = X.buildProgenyAnswer(s.name, s.notable_progeny);
  const n = s.name;
  const faq = [
    { q: `${n}産駒の得意な競馬場は？`, a: rcAnswer(rcQ, true) },
    { q: `${n}産駒の得意なコースは？`, a: courseAnswer(cQ, true) },
    { q: `${n}産駒は芝とダートどちらが得意？`, a: surfaceAnswer(turf, dirt), lead: true },
    { q: `${n}産駒の得意な距離は？`, a: distanceAnswer(md), lead: true },
    ...(band ? [{ q: `${n}産駒の芝・ダートそれぞれの得意距離は？`, a: band }] : []),
    { q: `${n}産駒の馬場適性は？`, a: trackAnswer(s.track_condition_stats), lead: true },
    ...(growth ? [{ q: `${n}産駒は早熟？晩成？`, a: growth }] : []),
    ...(prog ? [{ q: `${n}の代表産駒は？`, a: prog }] : []),
    { q: `${n}産駒の苦手な競馬場は？`, a: rcAnswer(rcQ, false) },
    { q: `${n}産駒の苦手なコースは？`, a: courseAnswer(cQ, false) },
  ];
  const derived = {
    periodText: lib.periodFromDataPeriod(s.data_period), dateIso: lib.jaDateToIso(s.last_updated), enoughRaces: lib.hasEnoughRaces(s.total_races),
    verdict: { surfacePos, distancePos, turfPos, dirtPos, surfaceText, distanceText },
    mergedDistance: md, turfCondition: mergedCondition(s.track_condition_stats, '芝'), dirtCondition: mergedCondition(s.track_condition_stats, 'ダート'),
    graded: X.gradedTotals(s.class_stats), thisYear: X.thisYearOf(s.yearly_leading),
    progenyTitles: Object.fromEntries(s.notable_progeny.map((h) => [h.horse_id, X.formatTitles(h.titles)])),
    summary: blocks, courseUrl: cm.url, courseLabel: cm.label, courseShort: cm.short, damSireUrl, faq,
  };
  fs.writeFileSync(D + 'sire-99556.derived.json', JSON.stringify(derived, null, 1));
  console.log('sire', blocks.length, 'blocks', faq.length, 'faq', Object.keys(cm.url).length, '/', s.course_stats.length, 'course links', Object.keys(damSireUrl).length, 'damsire links');
}

// ================= 調教師 =================
{
  const t = read('trainer-01157.json');
  const raw = t.characteristics?.gate_position;
  const surfacePos = typeof raw === 'number' ? 6 - raw : null; // 調教師データは 1＝ダートが得意。表示用に反転（現行どおり）
  const distancePos = t.characteristics?.distance_trend_position ?? null;
  const sText = { 1: '芝が得意', 2: 'やや芝が得意', 3: '差分なし', 4: 'ややダートが得意', 5: 'ダートが得意' };
  const dText = { 1: '短距離が得意', 2: 'やや短距離が得意', 3: '差分なし', 4: 'やや長距離が得意', 5: '長距離が得意' };
  const graded = X.gradedTotals(t.class_stats);
  const wins = t.graded_wins ?? [], horses = t.active_horses ?? [];
  // 本番の getTrainerDataFromGCS と同じく、人気別は配列→オブジェクトに直してから文章を作る
  // characteristics は本番で gate_position と distance_trend_position だけに作り直される（そのため「1番人気の信頼度」の段落は本番では出ない）
  const forText = { ...t, characteristics: t.characteristics ? { gate_position: t.characteristics.gate_position, distance_trend_position: t.characteristics.distance_trend_position } : undefined };
  const blocks = lib.toTrainerSummaryBlocks(lib.buildTrainerSummaryKeyed(forText));
  blocks.unshift({ key: 'lead', text: X.buildPersonLead({ kind: '調教師', name: t.name, region: t.stable, debutYear: t.debut_year, traits: [sText[surfacePos], dText[distancePos]].filter((x) => x && x !== '差分なし'), graded, recentWin: wins[0] ?? null }) });
  const courses = t.course_stats.filter((c) => c.surface_en !== 'obstacle');
  const cm = courseMaps(courses);
  const ids = new Set(lib.ALL_JOCKEYS.map((j) => String(j.id)));
  const jockeyUrl = {};
  t.jockey_stats.forEach((j) => { const fromData = typeof j.link === 'string' && ids.has(j.link.split('/').pop() ?? '') ? j.link : undefined; const byName = lib.ALL_JOCKEYS.find((x) => x.name === j.name); const u = fromData ?? (byName ? `/jockeys/${byName.id}` : undefined); if (u) jockeyUrl[j.name] = u; });
  const rcQ = t.racecourse_stats.filter((r) => r.name !== '中央' && r.name !== 'ローカル' && r.races >= 20);
  const cQ = t.course_stats.filter((c) => c.races >= 10 && c.surface_en !== 'obstacle');
  const turf = t.surface_stats.find((x) => x.surface === '芝'), dirt = t.surface_stats.find((x) => x.surface === 'ダート');
  const md = mergedDistance(t.distance_stats);
  const asOf = new Date(lib.jaDateToIso(t.last_updated));
  const ages = t.age_stats ?? [];
  const two = ages.find((r) => r.age === '2歳'), others = ages.filter((r) => r.age !== '2歳');
  const oN = others.reduce((a, r) => a + r.races, 0);
  const oRate = oN > 0 ? others.reduce((a, r) => a + r.place_rate * r.races, 0) / oN : null;
  const twoA = two && two.races >= 20 && oRate !== null ? `${t.name}調教師の2歳戦の成績は${two.races}戦${two.wins}勝、複勝率**${pct(two.place_rate)}%**です（3歳以上は${pct(oRate)}%）。\n2歳戦の単勝回収率は${pct(two.win_payback)}%です。` : null;
  const horsesA = horses.length > 0 ? `直近半年に出走した${t.name}厩舎の管理馬では、${horses.slice(0, 5).map((h) => `**${h.horse_name}**${h.titles.length > 0 ? `（${X.formatTitles(h.titles, 2).join('、')}）` : `（${h.wins}勝）`}`).join('、')}が主な馬です。\n※集計期間の重賞勝ち→勝利数の順。` : null;
  const n = t.name;
  const faq = [
    { q: `${n}調教師の得意な競馬場は？`, a: rcAnswer(rcQ, true) },
    { q: `${n}調教師の得意なコースは？`, a: courseAnswer(cQ, true) },
    { q: `${n}調教師は芝とダートどちらが得意？`, a: surfaceAnswer(turf, dirt), lead: true },
    { q: `${n}調教師の得意な距離は？`, a: distanceAnswer(md), lead: true },
    { q: `${n}調教師の重賞成績は？`, a: X.buildGradedAnswer(`${n}調教師`, graded, wins) },
    ...(horsesA ? [{ q: `${n}厩舎の主な管理馬は？`, a: horsesA }] : []),
    ...(twoA ? [{ q: `${n}厩舎の2歳戦の成績は？`, a: twoA }] : []),
    { q: `${n}調教師の苦手な競馬場は？`, a: rcAnswer(rcQ, false) },
    { q: `${n}調教師の苦手なコースは？`, a: courseAnswer(cQ, false) },
  ];
  const derived = {
    periodText: lib.periodFromDataPeriod(t.data_period), dateIso: lib.jaDateToIso(t.last_updated), enoughRaces: lib.hasEnoughRaces(t.total_races),
    verdict: { surfacePos, distancePos, surfaceText: sText[surfacePos], distanceText: dText[distancePos] },
    mergedDistance: md, graded, thisYear: X.thisYearOf(t.yearly_leading),
    profile: { birth: X.jaDate(t.profile?.birth_date), age: X.ageAt(t.profile?.birth_date, asOf), career: t.debut_year ? asOf.getFullYear() - Number(t.debut_year) + 1 : null },
    horseTitles: Object.fromEntries(horses.map((h) => [h.horse_id, X.formatTitles(h.titles)])),
    summary: blocks, courseUrl: cm.url, courseLabel: cm.label, courseShort: cm.short, jockeyUrl, faq,
  };
  fs.writeFileSync(D + 'trainer-01157.derived.json', JSON.stringify(derived, null, 1));
  console.log('trainer', blocks.length, 'blocks', faq.length, 'faq', Object.keys(cm.url).length, '/', courses.length, 'course links', Object.keys(jockeyUrl).length, 'jockey links');
}
fs.rmSync(tmp, { recursive: true, force: true });
