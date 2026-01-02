#!/bin/bash

# クリーンなデータパイプライン再構築スクリプト
# データリーケージを完全に排除した特徴量テーブルを作成
#
# 実行方法:
#   chmod +x rebuild_pipeline.sh
#   ./rebuild_pipeline.sh
#
# 注意:
# - BigQueryの実行コストが発生します
# - 各ステップは30分～1時間かかる場合があります
# - エラーが発生した場合は、該当ステップを個別に再実行してください

set -e  # エラーで停止

echo "======================================================================"
echo "🚀 クリーンなデータパイプライン再構築を開始します"
echo "======================================================================"
echo ""
echo "⚠️  警告: この処理には時間とコストがかかります"
echo "   - 推定実行時間: 2-4時間"
echo "   - BigQueryのクエリ料金が発生します"
echo ""
read -p "続行しますか？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ 中断しました"
    exit 1
fi

echo ""
echo "======================================================================"
echo "ステップ1/4: 基礎特徴量テーブルの作成"
echo "======================================================================"
echo "📋 実行SQL: 01_create_base_features_no_leakage.sql"
echo "📊 出力テーブル: all_features_base_no_leakage"
echo "⏱️  推定時間: 30-60分"
echo ""

bq query --use_legacy_sql=false < 01_create_base_features_no_leakage.sql

echo ""
echo "✅ ステップ1完了: 基礎特徴量テーブル作成完了"
echo ""
echo "🔍 確認中..."
bq query --use_legacy_sql=false "
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT race_id) as total_races,
  MIN(race_date) as min_date,
  MAX(race_date) as max_date
FROM \`umadata.keiba_data.all_features_base_no_leakage\`
"

echo ""
echo "======================================================================"
echo "ステップ2/4: 騎手統計の追加"
echo "======================================================================"
echo "📋 実行SQL: add_jockey_win_rate_no_leakage.sql"
echo "📊 出力テーブル: all_features_with_jockey_stats_no_leakage"
echo "⏱️  推定時間: 30-60分"
echo ""

bq query --use_legacy_sql=false < add_jockey_win_rate_no_leakage.sql

echo ""
echo "✅ ステップ2完了: 騎手統計追加完了"
echo ""
echo "🔍 確認中..."
bq query --use_legacy_sql=false "
SELECT
  jockey_stat_level,
  COUNT(*) as cnt,
  AVG(jockey_win_rate_surface_distance) as avg_win_rate,
  AVG(jockey_place_rate_surface_distance) as avg_place_rate
FROM \`umadata.keiba_data.all_features_with_jockey_stats_no_leakage\`
GROUP BY jockey_stat_level
ORDER BY cnt DESC
"

echo ""
echo "======================================================================"
echo "ステップ3/4: 調教師統計の追加"
echo "======================================================================"
echo "📋 実行SQL: add_trainer_win_rate_no_leakage.sql"
echo "📊 出力テーブル: all_features_with_trainer_stats_no_leakage"
echo "⏱️  推定時間: 30-60分"
echo ""

bq query --use_legacy_sql=false < add_trainer_win_rate_no_leakage.sql

echo ""
echo "✅ ステップ3完了: 調教師統計追加完了"
echo ""
echo "🔍 確認中..."
bq query --use_legacy_sql=false "
SELECT
  trainer_stat_level,
  COUNT(*) as cnt,
  AVG(trainer_win_rate_surface_distance) as avg_win_rate,
  AVG(trainer_place_rate_surface_distance) as avg_place_rate
FROM \`umadata.keiba_data.all_features_with_trainer_stats_no_leakage\`
GROUP BY trainer_stat_level
ORDER BY cnt DESC
"

echo ""
echo "======================================================================"
echo "ステップ4/4: 脚質統計と休養フラグの追加"
echo "======================================================================"
echo "📋 実行SQL: add_missing_features_no_leakage.sql"
echo "📊 出力テーブル: all_features_complete_no_leakage"
echo "⏱️  推定時間: 30-60分"
echo ""

bq query --use_legacy_sql=false < add_missing_features_no_leakage.sql

echo ""
echo "✅ ステップ4完了: 脚質統計と休養フラグ追加完了"
echo ""
echo "🔍 確認中..."
bq query --use_legacy_sql=false "
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT race_id) as total_races,
  MIN(race_date) as min_date,
  MAX(race_date) as max_date,
  AVG(running_style_mode_win_rate) as avg_style_win_rate,
  COUNT(CASE WHEN rest_period_category = 0 THEN 1 END) as short_rest_count,
  COUNT(CASE WHEN rest_period_category = 4 THEN 1 END) as debut_count
FROM \`umadata.keiba_data.all_features_complete_no_leakage\`
"

echo ""
echo "======================================================================"
echo "🎉 パイプライン再構築完了！"
echo "======================================================================"
echo ""
echo "✅ 作成されたテーブル:"
echo "   1. umadata.keiba_data.all_features_base_no_leakage"
echo "   2. umadata.keiba_data.all_features_with_jockey_stats_no_leakage"
echo "   3. umadata.keiba_data.all_features_with_trainer_stats_no_leakage"
echo "   4. umadata.keiba_data.all_features_complete_no_leakage"
echo ""
echo "📋 次のステップ:"
echo "   1. データリーケージのテストを実行"
echo "   2. モデル訓練スクリプトを修正"
echo "   3. 新しいクリーンなデータでモデルを訓練"
echo "   4. 修正前後の特徴量重要度を比較"
echo ""
echo "📖 詳細は DATA_PIPELINE_REBUILD.md を参照してください"
echo ""
echo "======================================================================"
