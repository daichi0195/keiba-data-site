#!/bin/bash
# BigQueryセットアップスクリプト

set -e

PROJECT_ID="umadata"
DATASET="keiba_ai"

echo "========================================="
echo "BigQuery セットアップ"
echo "========================================="

# プロジェクト設定
echo "📋 プロジェクトID: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# データセット作成（既に存在する場合はスキップ）
echo ""
echo "📦 データセット作成中..."
bq mk --dataset --location=US $DATASET 2>/dev/null || echo "  ℹ️  データセット '$DATASET' は既に存在します"

# データアップロード
echo ""
echo "📤 データアップロード中..."

echo "  → train_raw テーブル"
bq load \
  --source_format=CSV \
  --autodetect \
  --replace \
  $DATASET.train_raw \
  ai/data/train_raw.csv

echo "  → test_raw テーブル"
bq load \
  --source_format=CSV \
  --autodetect \
  --replace \
  $DATASET.test_raw \
  ai/data/test_raw.csv

# テーブル確認
echo ""
echo "✅ アップロード完了"
echo ""
echo "📊 テーブル情報:"
bq show $DATASET.train_raw
bq show $DATASET.test_raw

echo ""
echo "========================================="
echo "セットアップ完了！"
echo "========================================="
echo ""
echo "次のステップ:"
echo "  bash ai/compute_features_bq.sh"
