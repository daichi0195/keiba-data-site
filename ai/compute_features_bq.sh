#!/bin/bash
# BigQueryで特徴量を計算

set -e

PROJECT_ID="umadata"
DATASET="keiba_ai"

echo "========================================="
echo "BigQueryで特徴量計算"
echo "========================================="

# SQLファイルを実行
echo "🚀 特徴量計算を開始..."
echo ""

bq query \
  --use_legacy_sql=false \
  --project_id=$PROJECT_ID \
  < ai/feature_engineering.sql

echo ""
echo "✅ BigQueryでの計算完了"

# 結果をダウンロード
echo ""
echo "📥 結果をダウンロード中..."

# Train データ
echo "  → train_features.csv"
bq extract \
  --destination_format=CSV \
  --print_header=true \
  $DATASET.all_features \
  gs://${PROJECT_ID}-temp/train_features_*.csv

# GCSからローカルにダウンロード
gsutil -m cp "gs://${PROJECT_ID}-temp/train_features_*.csv" /tmp/
cat /tmp/train_features_*.csv > ai/data/train_features.csv
rm /tmp/train_features_*.csv

# 学習データとテストデータに分割
echo "  → データを分割中..."
python3 -c "
import pandas as pd

df = pd.read_csv('ai/data/train_features.csv')

# カテゴリカル変数のエンコーディング
categorical_cols = ['racecourse', 'surface', 'going', 'race_class']
for col in categorical_cols:
    df[f'{col}_encoded'] = df[col].astype('category').cat.codes

# 日付で分割
train_df = df[df['race_date'] <= '2025-08-31'].copy()
test_df = df[(df['race_date'] >= '2025-09-01') & (df['race_date'] <= '2025-10-31')].copy()

# 保存
train_df.to_csv('ai/data/train_features.csv', index=False)
test_df.to_csv('ai/data/test_features.csv', index=False)

print(f'学習データ: {len(train_df):,} 行')
print(f'テストデータ: {len(test_df):,} 行')
"

echo ""
echo "========================================="
echo "完了！"
echo "========================================="
echo ""
echo "次のステップ:"
echo "  cd ai && python3 train_model.py"
