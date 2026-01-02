#!/bin/bash

# 最新のBigQueryジョブを監視して進捗を表示
echo "📊 BigQueryジョブ監視開始..."

while true; do
    # 最新のジョブ情報を取得
    job_info=$(bq ls -j -n 1 --format=prettyjson 2>/dev/null)

    if [ $? -eq 0 ]; then
        # ジョブIDと状態を抽出
        job_id=$(echo "$job_info" | grep -o '"jobId": "[^"]*"' | head -1 | cut -d'"' -f4)
        state=$(echo "$job_info" | grep -o '"state": "[^"]*"' | head -1 | cut -d'"' -f4)

        # 現在時刻
        timestamp=$(date '+%H:%M:%S')

        if [ "$state" = "RUNNING" ]; then
            echo "[$timestamp] ⚙️  実行中: $job_id"
        elif [ "$state" = "DONE" ]; then
            echo "[$timestamp] ✅ 完了: $job_id"
            break
        elif [ "$state" = "PENDING" ]; then
            echo "[$timestamp] ⏳ 待機中: $job_id"
        else
            echo "[$timestamp] ❓ 状態: $state ($job_id)"
        fi
    fi

    sleep 2
done

echo ""
echo "✅ ジョブ完了しました"
