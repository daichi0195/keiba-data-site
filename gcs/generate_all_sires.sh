#!/bin/bash

# 全種牡馬データを生成するスクリプト

set -e

cd "$(dirname "$0")"

# 仮想環境をアクティベート
if [ -d "venv" ]; then
    . venv/bin/activate
fi

echo "========================================="
echo "種牡馬データ一括生成"
echo "========================================="
echo ""

# 種牡馬リストを取得（既に存在する場合はスキップ）
if [ ! -f "lib/sires.ts" ]; then
    echo "Step 1: 種牡馬リストを取得中..."
    python3 -u generate_sire_list.py
    RESULT=$?
    if [ $RESULT -ne 0 ]; then
        echo "❌ 種牡馬リスト取得に失敗しました"
        exit 1
    fi
else
    echo "Step 1: 種牡馬リストは既に存在します (lib/sires.ts) - スキップ"
fi

echo ""
echo "Step 2: 各種牡馬のデータを生成中..."
echo ""

# lib/sires.ts から種牡馬名を抽出
SIRE_NAMES=$(grep "name: '" lib/sires.ts | sed "s/.*name: '\([^']*\)'.*/\1/")

TOTAL=$(echo "$SIRE_NAMES" | wc -l | tr -d ' ')
CURRENT=0
SUCCESS=0
FAILED=0

for SIRE_NAME in $SIRE_NAMES; do
    CURRENT=$((CURRENT + 1))
    echo ""
    echo "========================================="
    echo "[$CURRENT/$TOTAL] $SIRE_NAME"
    echo "========================================="

    if python3 generate_sires.py "$SIRE_NAME" 2>&1; then
        SUCCESS=$((SUCCESS + 1))
        echo ""
        echo "  ✅ Success ($CURRENT/$TOTAL)"
    else
        FAILED=$((FAILED + 1))
        echo ""
        echo "  ❌ Failed ($CURRENT/$TOTAL)"
    fi
done

echo "========================================="
echo "完了"
echo "========================================="
echo "成功: $SUCCESS"
echo "失敗: $FAILED"
echo "合計: $TOTAL"
