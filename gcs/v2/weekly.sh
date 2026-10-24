#!/bin/zsh
# 競馬データ.com の週次データ更新 (JRA-VAN 準拠 DB keibaai-v2 → サイトの JSON)
#
#   1. keibaai-v2 の core が更新されている前提 (月曜 14:00 以降に確定成績を取り込む。keibaai_v2 側の運用)
#   2. BigQuery でサイト向けマート site.* を作り直す (約 0.2GB の読み取り)
#   3. マートをローカル Parquet に落とし、DuckDB で全ページの JSON を生成する (BigQuery の課金なし)
#   4. gs://umadata へ同期し、一覧 (lib/*.ts) とリーディング (public/data/leading.json) をリポジトリに commit → push
#      (push で Vercel が再ビルドし、全ページが新しい JSON で生成し直される)
#   5. 本番反映を待って IndexNow に全 URL を通知 (gcs/v2/indexnow.py)
#
# 使い方: gcs/v2/weekly.sh [--no-upload] [--no-push]
#   --no-upload: 生成だけ (out/ に残る)   --no-push: lib/*.ts と leading.json をリポジトリにコピーするが commit しない
# ログ: gcs/v2/logs/weekly_YYYYMMDD.log
# launchd から実行する場合は PATH が最小なので gcloud/git/curl の場所を足す
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$HOME/google-cloud-sdk/bin:$PATH
set -u
HERE=${0:A:h}
REPO=${HERE:h:h}
V2=/Users/kubotataichi/keibaai_v2
PY=/Users/kubotataichi/venvs/keiba-gcs/bin/python
PY2=/Users/kubotataichi/keiba-ai/venv/bin/python
LOG=$HERE/logs/weekly_$(date +%Y%m%d).log
mkdir -p $HERE/logs
UPLOAD=1; PUSH=1; pushed=0
for a in "$@"; do case $a in --no-upload) UPLOAD=0;; --no-push) PUSH=0;; esac; done
log() { echo "[$(date '+%F %T')] $*" | tee -a $LOG; }
fail() { log "FAILED: $*"; exit 1; }

log "== weekly start (upload=$UPLOAD push=$PUSH)"

# 2. マート再構築 (keibaai_v2/etl/build_site.py、REST + bqguard)
( cd $V2/etl && export SSL_CERT_FILE=$($PY2 -m certifi) && $PY2 build_site.py ) >> $LOG 2>&1 || fail "build_site"
log "mart built"

# 3. 取得と生成
cd $HERE
rm -rf out
$PY localdb.py fetch >> $LOG 2>&1 || fail "fetch"
# 種牡馬の父・母父（core.breeding_horse、約20MB）。失敗しても前回の parquet で続行
( export SSL_CERT_FILE=$($PY2 -m certifi) && $PY generate_extras.py --fetch ) >> $LOG 2>&1 || log "WARN: sire pedigree fetch に失敗（前回分を使用）"
$PY generate_lists.py >> $LOG 2>&1 || fail "lists"
( $PY generate_courses.py > logs/courses.log 2>&1 & $PY generate_jockeys.py > logs/jockeys.log 2>&1 &
  $PY generate_trainers.py > logs/trainers.log 2>&1 & $PY generate_sires.py > logs/sires.log 2>&1 & wait )
for f in courses jockeys trainers sires; do
  ok=$(grep -c '✅' logs/$f.log); ng=$(grep -c '❌' logs/$f.log)
  log "$f: ok=$ok failed=$ng"
  [[ $ng -gt 0 ]] && grep '❌' logs/$f.log | head -5 | tee -a $LOG
done
$PY generate_leading_data.py >> $LOG 2>&1 || fail "leading"
# 検索意図に合わせた追加項目（プロフィール・重賞勝ち・代表産駒・コース概要など）を JSON に追記
$PY generate_extras.py >> $LOG 2>&1 || log "WARN: extras に失敗（追加項目なしで続行）"
n=$(find out -name '*.json' | wc -l | tr -d ' ')
[[ $n -lt 600 ]] && fail "生成ファイルが少なすぎる ($n)"
log "generated $n json files"

# 4. アップロードと一覧の反映
if [[ $UPLOAD -eq 1 ]]; then
  $PY upload.py >> $LOG 2>&1 || fail "upload"
  log "uploaded to gs://umadata"
  changed=0
  for k in jockeys trainers sires; do
    if ! diff -q out/lib/$k.ts $REPO/lib/$k.ts > /dev/null 2>&1; then cp out/lib/$k.ts $REPO/lib/$k.ts; changed=1; fi
  done
  if ! diff -q out/leading.json $REPO/public/data/leading.json > /dev/null 2>&1; then cp out/leading.json $REPO/public/data/leading.json; changed=1; fi
  if [[ $changed -eq 1 && $PUSH -eq 1 ]]; then
    ( cd $REPO && git add lib/jockeys.ts lib/trainers.ts lib/sires.ts public/data/leading.json &&
      git commit -q -m "data: 週次データ更新 ($(date +%Y-%m-%d))

騎手・調教師・種牡馬の一覧とリーディングを JRA-VAN 準拠 DB から再生成 (gcs/v2/weekly.sh)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>" && git push -q origin main ) >> $LOG 2>&1 && pushed=1 && log "lists/leading committed & pushed (Vercel が再ビルド)" || log "WARN: commit/push に失敗"
  elif [[ $changed -eq 1 ]]; then
    log "lists/leading changed (未 commit: --no-push)"
  else
    log "lists/leading unchanged"
  fi
fi
# 5. 本番反映を待って IndexNow (Bing・Yahoo! など) に全 URL の更新を通知
if [[ $pushed -eq 1 ]]; then
  $PY indexnow.py >> $LOG 2>&1 && log "indexnow submitted" || log "WARN: indexnow に失敗"
fi
log "== weekly done"
