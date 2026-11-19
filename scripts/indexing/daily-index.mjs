#!/usr/bin/env node
// 競馬データ.com：インデックス登録の促進（毎日1回）
//
// 1. サイトマップの全URLのうち、確認が古いものから順に URL 検査 API（読み取り専用、1日2,000件まで）で状態を調べる
// 2. 未登録のURLから優先度の高い10件を選び、Indexing API に「更新した」と通知する（URL_UPDATED）
// 3. 結果を状態ファイルと日次ログに残し、Mac の通知で知らせる
//
// 注意：Indexing API は Google が「求人・ライブ配信のページ向け」としている API。
//       それ以外のページに使うのは規約の想定外で、効果の保証はなく、利用を止められる可能性がある。
//       オーナー（久保田さん）がリスクを承知のうえで導入を決定（2026-11-19）。1日の送信は10件に抑える。
//
// 認証：umadata.daichi@gmail.com（Search Console の所有者）のユーザー認証を、ほかの gcloud 設定と分けて使う。
//   初回だけ：CLOUDSDK_CONFIG=$HOME/.config/gcloud-keibadata-indexing gcloud auth application-default login \
//     --scopes=https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform
//   （ブラウザで umadata.daichi@gmail.com を選ぶ。）umadata プロジェクトで Indexing API と Search Console API を有効にしておく。
//
// 使い方：node scripts/indexing/daily-index.mjs [--dry-run] [--inspect-limit=N] [--submit-limit=N]

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SITE = 'https://www.keibadata.com';
const QUOTA_PROJECT = 'umadata';
const GCLOUD_CONFIG = join(homedir(), '.config', 'gcloud-keibadata-indexing');
const DATA_DIR = join(homedir(), 'keibadata-indexing');
const STATE_FILE = join(DATA_DIR, 'state.json');
const LOG_DIR = join(DATA_DIR, 'logs');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const DRY = Boolean(args['dry-run']);
const INSPECT_LIMIT = Number(args['inspect-limit'] ?? 400); // 1日2,000件の上限より十分少なく
const SUBMIT_LIMIT = Number(args['submit-limit'] ?? 10);
const RESUBMIT_DAYS = 14; // 一度送ったURLは14日間は送り直さない
const RECHECK_DAYS = 7; // 登録済みのURLは7日に1回だけ確認し直す

const today = new Date().toISOString().slice(0, 10);
const daysAgo = (iso) => (iso ? (Date.now() - Date.parse(iso)) / 86400000 : Infinity);

mkdirSync(LOG_DIR, { recursive: true });
const logFile = join(LOG_DIR, `${today}.log`);
const log = (...m) => {
  const line = `[${new Date().toISOString()}] ${m.join(' ')}`;
  console.log(line);
  appendFileSync(logFile, line + '\n');
};

function token() {
  const env = { ...process.env, CLOUDSDK_CONFIG: GCLOUD_CONFIG };
  return execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], { env, encoding: 'utf8' }).trim();
}

let TOKEN = '';
async function api(url, body, method = body ? 'POST' : 'GET') {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'x-goog-user-project': QUOTA_PROJECT,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 && attempt === 0) {
      TOKEN = token();
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${url} ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : {};
  }
  throw new Error(`retry exhausted ${url}`);
}

async function sitemapUrls() {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  // サイトマップの索引なら、子のサイトマップも読む
  if (/<sitemapindex/.test(xml)) {
    const all = [];
    for (const sm of locs) {
      const x = await (await fetch(sm)).text();
      all.push(...[...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
    }
    return all;
  }
  return locs;
}

async function propertyUrl() {
  const { siteEntry = [] } = await api('https://www.googleapis.com/webmasters/v3/sites');
  const cand = ['sc-domain:keibadata.com', `${SITE}/`, 'https://keibadata.com/'];
  for (const c of cand) if (siteEntry.some((s) => s.siteUrl === c)) return c;
  throw new Error(`Search Console のプロパティが見つかりません：${siteEntry.map((s) => s.siteUrl).join(', ')}`);
}

// 優先度：ページの種類（検索で狙うデータページを先に）
const TYPE_WEIGHT = [
  [/^\/courses\/[^/]+\/[^/]+\/[^/]+$/, 50],
  [/^\/sires\/[^/]+$/, 45],
  [/^\/jockeys\/[^/]+$/, 40],
  [/^\/trainers\/[^/]+$/, 35],
  [/^\/articles\/[^/]+$/, 30],
  [/^\/(courses|sires|jockeys|trainers|articles|ai)$/, 25],
  [/./, 10],
];
const typeWeight = (path) => TYPE_WEIGHT.find(([re]) => re.test(path))[1];
const isIndexed = (r) => r && r.verdict === 'PASS';

async function main() {
  const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : { urls: {} };
  TOKEN = token();
  const prop = await propertyUrl();
  const urls = await sitemapUrls();
  log(`開始 ${DRY ? '(dry-run) ' : ''}プロパティ=${prop} サイトマップ=${urls.length}件`);

  for (const u of urls) state.urls[u] ??= {};

  // 1. 確認：未確認 → 未登録で確認が古い → 登録済みで7日以上前、の順
  const toInspect = urls
    .filter((u) => {
      const s = state.urls[u];
      if (!s.checkedAt) return true;
      return isIndexed(s) ? daysAgo(s.checkedAt) >= RECHECK_DAYS : daysAgo(s.checkedAt) >= 1;
    })
    .sort((a, b) => (Date.parse(state.urls[a].checkedAt ?? 0) || 0) - (Date.parse(state.urls[b].checkedAt ?? 0) || 0))
    .slice(0, INSPECT_LIMIT);

  let inspected = 0;
  for (const u of toInspect) {
    try {
      const r = await api('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        inspectionUrl: u,
        siteUrl: prop,
        languageCode: 'ja',
      });
      const ix = r.inspectionResult?.indexStatusResult ?? {};
      const s = state.urls[u];
      const was = s.verdict;
      Object.assign(s, {
        checkedAt: new Date().toISOString(),
        verdict: ix.verdict,
        coverageState: ix.coverageState,
        lastCrawlTime: ix.lastCrawlTime,
      });
      if (isIndexed(s) && !s.indexedAt) {
        s.indexedAt = s.checkedAt;
        if (s.submittedAt) log(`登録を確認 ${u}（送信から${Math.round(daysAgo(s.submittedAt))}日）`);
      }
      if (was && was !== s.verdict) log(`状態の変化 ${u}: ${was} → ${s.verdict}`);
      inspected++;
      await new Promise((r) => setTimeout(r, 150)); // 1分600件の上限より遅く
    } catch (e) {
      log(`確認の失敗 ${u}: ${e.message}`);
      if (/quota|429/i.test(e.message)) break;
    }
  }
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 1));

  // 2. 送信の対象：未登録・14日以内に送っていない。優先度＝種類の重み＋一度もクロールされていない＋未登録の期間
  const candidates = urls
    .filter((u) => {
      const s = state.urls[u];
      return s.checkedAt && !isIndexed(s) && daysAgo(s.submittedAt) >= RESUBMIT_DAYS;
    })
    .map((u) => {
      const s = state.urls[u];
      const path = new URL(u).pathname.replace(/\/$/, '') || '/';
      const neverCrawled = !s.lastCrawlTime ? 20 : 0;
      const waited = Math.min(30, daysAgo(s.firstSeenUnindexed ?? s.checkedAt));
      return { u, score: typeWeight(path) + neverCrawled + waited, s };
    })
    .sort((a, b) => b.score - a.score);

  const picks = candidates.slice(0, SUBMIT_LIMIT);
  let sent = 0;
  for (const { u, s } of picks) {
    if (DRY) {
      log(`送信予定 ${u}（${s.coverageState ?? s.verdict}）`);
      continue;
    }
    try {
      await api('https://indexing.googleapis.com/v3/urlNotifications:publish', { url: u, type: 'URL_UPDATED' });
      s.submittedAt = new Date().toISOString();
      s.submitCount = (s.submitCount ?? 0) + 1;
      sent++;
      log(`送信 ${u}（${s.coverageState ?? s.verdict}）`);
    } catch (e) {
      log(`送信の失敗 ${u}: ${e.message}`);
      if (/quota|429|403/i.test(e.message)) break;
    }
  }
  for (const u of urls) {
    const s = state.urls[u];
    if (s.checkedAt && !isIndexed(s)) s.firstSeenUnindexed ??= s.checkedAt;
  }
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 1));

  // 3. まとめ
  const checked = urls.filter((u) => state.urls[u].checkedAt);
  const indexed = checked.filter((u) => isIndexed(state.urls[u])).length;
  const byCoverage = {};
  for (const u of checked) {
    const c = state.urls[u].coverageState ?? '不明';
    byCoverage[c] = (byCoverage[c] ?? 0) + 1;
  }
  const summary = `確認${inspected}件・送信${sent}件／登録済み${indexed}/${checked.length}（全${urls.length}）`;
  log(`まとめ ${summary}`);
  log(`内訳 ${JSON.stringify(byCoverage)}`);
  writeFileSync(join(DATA_DIR, 'summary.json'), JSON.stringify({ date: today, inspected, sent, indexed, checked: checked.length, total: urls.length, byCoverage }, null, 1));
  try {
    execFileSync('osascript', ['-e', `display notification "${summary}" with title "競馬データ.com インデックス促進"`]);
  } catch {}
}

main().catch((e) => {
  log(`エラー ${e.stack || e.message}`);
  try {
    execFileSync('osascript', ['-e', `display notification "失敗：${String(e.message).slice(0, 80).replace(/"/g, "'")}" with title "競馬データ.com インデックス促進"`]);
  } catch {}
  process.exit(1);
});
