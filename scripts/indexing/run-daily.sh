#!/bin/bash
# 毎日のインデックス登録リクエスト：候補を選び（pick.mjs）、Claude in Chrome で Search Console からリクエストする（request.md）
# Chrome が起動していて、「競馬」プロファイル（umadata.daichi@gmail.com）で Claude in Chrome が使える状態であること。
set -u
cd /Users/kubotataichi/keiba-data-site
LOG=$HOME/keibadata-indexing/logs/run-$(date +%F).log
mkdir -p "$(dirname "$LOG")"
{
  echo "=== $(date) ==="
  node scripts/indexing/pick.mjs || exit 1
  claude -p --chrome \
    --allowedTools "mcp__claude-in-chrome__*" "Bash(node scripts/indexing/record.mjs:*)" "Read" \
    "$(cat scripts/indexing/request.md)"
  echo "=== 終了 $(date) ==="
} >> "$LOG" 2>&1
osascript -e "display notification \"$(tail -3 "$LOG" | head -1 | cut -c1-120 | tr '\"' \"'\")\" with title \"競馬データ.com インデックス登録\"" 2>/dev/null
