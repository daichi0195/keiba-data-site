#!/usr/bin/env node
// インデックス登録リクエストの候補を選ぶ（毎日。リクエスト自体は Claude が Search Console の画面で行う：request.md）
// 候補＝サイトマップのURLのうち、直近28日に検索で一度も表示されていない（＝未登録の可能性が高い）もの。
// 14日以内にリクエスト済み／登録済みと確認済み（7日以内）のURLは除き、ページの種類で優先度を付けて上位を出す。
// 出力：~/keibadata-indexing/candidates.json（Claude が上から順に確認する。リクエストは1日10件まで）
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SITE = 'https://www.keibadata.com';
const DIR = join(homedir(), 'keibadata-indexing');
const HISTORY = join(DIR, 'history.json'); // { url: { requestedAt?, indexedCheckedAt?, status? } }
const N = Number(process.argv[2] ?? 25); // 登録済みが混ざるので多めに出す
mkdirSync(DIR, { recursive: true });
const hist = existsSync(HISTORY) ? JSON.parse(readFileSync(HISTORY, 'utf8')) : {};
const daysAgo = (iso) => (iso ? (Date.now() - Date.parse(iso)) / 86400000 : Infinity);

const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

const sql = "SELECT DISTINCT url FROM `umadata.searchconsole.searchdata_url_impression` WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY) AND impressions > 0";
const out = execFileSync('bq', ['query', '--project_id=umadata', '--use_legacy_sql=false', '--format=csv', '--max_rows=100000', sql], {
  encoding: 'utf8',
  env: { ...process.env, CLOUDSDK_CORE_ACCOUNT: 'umadata.daichi@gmail.com' },
});
const seen = new Set(out.split('\n').slice(1).map((s) => s.trim().replace(/\/$/, '')).filter(Boolean));

const W = [
  [/^\/courses\/[^/]+\/[^/]+\/[^/]+$/, 50],
  [/^\/sires\/[^/]+$/, 45],
  [/^\/jockeys\/[^/]+$/, 40],
  [/^\/trainers\/[^/]+$/, 35],
  [/^\/articles\/[^/]+$/, 30],
  [/./, 20],
];
const weight = (p) => W.find(([re]) => re.test(p))[1];

const cands = urls
  .filter((u) => !seen.has(u.replace(/\/$/, '')))
  .filter((u) => {
    const h = hist[u] ?? {};
    if (daysAgo(h.requestedAt) < 14) return false;
    if (h.status === 'indexed' && daysAgo(h.checkedAt) < 7) return false;
    return true;
  })
  .map((u) => {
    const p = new URL(u).pathname.replace(/\/$/, '') || '/';
    const h = hist[u] ?? {};
    // 一度もリクエストしていないものを先に、同じなら種類の重み、さらに前回のリクエストが古いもの
    return { url: u, score: weight(p) + (h.requestedAt ? 0 : 30) + Math.min(30, daysAgo(h.requestedAt) === Infinity ? 0 : daysAgo(h.requestedAt) / 2) };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, N)
  .map((c) => c.url);

writeFileSync(join(DIR, 'candidates.json'), JSON.stringify({ date: new Date().toISOString().slice(0, 10), sitemap: urls.length, shownIn28d: seen.size, candidates: cands }, null, 1));
console.log(`サイトマップ${urls.length}件／28日以内に表示あり${seen.size}件／候補${cands.length}件 → ${join(DIR, 'candidates.json')}`);
