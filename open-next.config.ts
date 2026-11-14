// Cloudflare Workers 向けの OpenNext 設定
// ISR（トップ60秒・各データページ週次）を Cloudflare 上でも動かすため、
// R2 にキャッシュを保存し、再生成は Durable Object のキューで行う
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

export default defineCloudflareConfig({
  // R2 の読み出しを減らすため、各リージョンの Cache API にも短期間キャッシュする
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  queue: doQueue,
});
