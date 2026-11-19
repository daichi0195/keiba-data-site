#!/usr/bin/env node
// Search Console での確認・リクエストの結果を記録する（Claude が1件ごとに呼ぶ）
// 使い方：node scripts/indexing/record.mjs <URL> <requested|indexed|not-indexed|failed|quota> [メモ]
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
const [url, status, ...memo] = process.argv.slice(2);
if (!url || !status) { console.error('usage: record.mjs <URL> <status> [memo]'); process.exit(1); }
const DIR = join(homedir(), 'keibadata-indexing');
mkdirSync(join(DIR, 'logs'), { recursive: true });
const file = join(DIR, 'history.json');
const hist = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
const now = new Date().toISOString();
const h = (hist[url] ??= {});
h.checkedAt = now;
h.status = status === 'requested' ? 'not-indexed' : status;
if (status === 'requested') { h.requestedAt = now; h.requestCount = (h.requestCount ?? 0) + 1; }
if (memo.length) h.memo = memo.join(' ');
writeFileSync(file, JSON.stringify(hist, null, 1));
appendFileSync(join(DIR, 'logs', `${now.slice(0, 10)}.log`), `${now}\t${status}\t${url}\t${memo.join(' ')}\n`);
console.log(`記録：${status} ${url}`);
