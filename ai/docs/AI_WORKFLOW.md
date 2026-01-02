# 競馬予測AIモデル開発ワークフロー

## ⚠️ 重要原則

**すべての処理はBigQuery上で完結させる。ローカルにデータをダウンロードしない。**

## データ処理フロー

### 1. 特徴量の追加

**⚠️ 必須: 実装前に [DATA_LEAKAGE_CHECKLIST.md](./DATA_LEAKAGE_CHECKLIST.md) を確認すること**

新しい特徴量を追加する際は：

1. **[DATA_LEAKAGE_CHECKLIST.md](./DATA_LEAKAGE_CHECKLIST.md) の全項目をチェック**
2. SQLクエリを作成（例：`add_running_style_win_rate.sql`）
3. **再度チェックリストで検証**
4. BigQueryで実行して新しいテーブルを作成
   ```bash
   bq query --use_legacy_sql=false --project_id=umadata \
     --destination_table=keiba_data.all_features_with_new_feature --replace \
     < add_new_feature.sql
   ```

### 2. データ分割（Train/Validation/Test）

**BigQuery上で**日付ベースで分割：

```sql
-- Training: 2021-01-01 ~ 2024-12-31（4年間）
-- Validation: 2025-01-01 ~ 2025-08-31（8ヶ月）
-- Test: 2025-09-01 ~ 2025-10-31（2ヶ月）

CREATE OR REPLACE TABLE `umadata.keiba_data.train_features` AS
SELECT * FROM `umadata.keiba_data.all_features_with_new_feature`
WHERE race_date >= '2021-01-01' AND race_date <= '2024-12-31';

CREATE OR REPLACE TABLE `umadata.keiba_data.validation_features` AS
SELECT * FROM `umadata.keiba_data.all_features_with_new_feature`
WHERE race_date >= '2025-01-01' AND race_date <= '2025-08-31';

CREATE OR REPLACE TABLE `umadata.keiba_data.test_features` AS
SELECT * FROM `umadata.keiba_data.all_features_with_new_feature`
WHERE race_date >= '2025-09-01' AND race_date <= '2025-10-31';
```

### 3. モデルトレーニング

#### Option A: BigQuery ML（推奨）

**BigQuery ML を使えば全てBigQuery上で完結**

```sql
-- モデル作成
CREATE OR REPLACE MODEL `umadata.keiba_data.ranking_model`
OPTIONS(
  model_type='BOOSTED_TREE_REGRESSOR',
  input_label_cols=['finish_position'],
  -- ハイパーパラメータ
  max_iterations=100,
  learn_rate=0.1,
  subsample=0.8,
  max_tree_depth=6
) AS
SELECT
  finish_position,
  -- 特徴量30個
  time_dev_last1, time_dev_last2, time_dev_last3, time_dev_last4, time_dev_last5,
  last3f_dev_last1, last3f_dev_last2, last3f_dev_last3, last3f_dev_last4, last3f_dev_last5,
  last3f_dev_mean_5,
  running_style_last1, running_style_mode, running_style_combined_win_rate,
  jockey_place_rate_surface_distance, jockey_rides_surface_distance, is_jockey_change,
  finish_pos_best_last5,
  racecourse_encoded, surface_encoded, going_encoded, race_class_encoded,
  distance, sex, age, horse_weight, weight_change,
  bracket_number, horse_number, days_since_last_race
FROM `umadata.keiba_data.train_features_with_running_style`;

-- 予測
CREATE OR REPLACE TABLE `umadata.keiba_data.predictions_validation` AS
SELECT
  race_id,
  race_date,
  horse_id,
  finish_position,
  odds,
  predicted_finish_position
FROM ML.PREDICT(
  MODEL `umadata.keiba_data.ranking_model`,
  (SELECT * FROM `umadata.keiba_data.validation_features_with_running_style`)
);
```

#### Option B: ローカルでLightGBM（高度なカスタマイズが必要な場合）

LambdaRankなど特殊な目的関数が必要な場合：

1. BigQueryから必要な特徴量のみを抽出（ネストカラムを除外）
2. GCS経由でエクスポート
3. ローカルにダウンロード
4. LightGBMでトレーニング

### 4. 予測と評価

**BigQuery上で可能な処理はBigQueryで行う**

## 現在のモデル仕様

### 使用特徴量（30個）

#### タイム偏差値（5個）
- `time_dev_last1`, `time_dev_last2`, `time_dev_last3`, `time_dev_last4`, `time_dev_last5`

#### 上がり偏差値（6個）
- `last3f_dev_last1`, `last3f_dev_last2`, `last3f_dev_last3`, `last3f_dev_last4`, `last3f_dev_last5`
- `last3f_dev_mean_5`

#### 脚質（3個）
- `running_style_last1`, `running_style_mode`
- `running_style_combined_win_rate` ← **NEW!**

#### 騎手（3個）
- `jockey_place_rate_surface_distance`, `jockey_rides_surface_distance`, `is_jockey_change`

#### 馬の成績（1個）
- `finish_pos_best_last5`

#### レース条件（4個）
- `racecourse_encoded`, `surface_encoded`, `going_encoded`, `race_class_encoded`

#### 馬の基本情報（8個）
- `distance`, `sex`, `age`, `horse_weight`, `weight_change`
- `bracket_number`, `horse_number`, `days_since_last_race`

### データ期間（固定）

**⚠️ この期間定義は変更しないこと。すべてのモデルで統一して使用**

- **Training**: 2021-01-01 ~ 2024-12-31（4年間）
- **Validation**: 2025-01-01 ~ 2025-08-31（8ヶ月）
- **Test**: 2025-09-01 ~ 2025-10-31（2ヶ月）

### モデルアーキテクチャ

- **Base Model**: LightGBM LambdaRank
- **Calibration**: Isotonic Regression
- **Objective**: ランキング学習（レース内順位予測）

### 購入戦略パラメータ

- **期待値閾値**: Validation期間で最適化（通常2.5-3.0）
- **オッズキャップ**: 25倍（必須）
- **購入方法**: 各レースで期待値最大の1頭のみ購入

### 目標性能

- **回収率**: 120%以上（Validation期間）
- **的中率**: 5%以上
- **購入レース数**: 50レース以上（Validation 6ヶ月で）

## データリーク対策

### 禁止事項

❌ `corner_positions` を直接使用（現在レースの情報）
❌ `running_style_encoded` を直接使用（`corner_positions`から計算されるため）
❌ 予測対象レースより未来のデータを参照

### 許可される使い方

✅ 過去レースの `running_style_encoded` を特徴量として使用
✅ 統計情報（勝率など）は予測対象レースより前のデータのみで計算
✅ 階層的フォールバック（サンプル数が少ない場合に粗い粒度の統計を使用）

## 特徴量追加のベストプラクティス

### 1つずつ追加

特徴量は必ず1つずつ追加して効果を測定する：

1. 新特徴量を追加したテーブルを作成
2. Train/Validation/Testに分割
3. モデルを再トレーニング
4. 性能を比較：
   - 回収率の変化
   - 的中率の変化
   - 購入機会の変化
   - SHAP値での貢献度
5. 改善が確認できたら次の特徴量へ

### 階層的フォールバック

条件別統計を計算する際は、サンプル数に応じてフォールバック：

```sql
CASE
  -- Level 1: 最も詳細（サンプル数 >= 閾値1）
  WHEN detailed_stats.sample_count >= 10 THEN detailed_stats.value

  -- Level 2: 中程度（サンプル数 >= 閾値2）
  WHEN medium_stats.sample_count >= 30 THEN medium_stats.value

  -- Level 3: 粗い（サンプル数 >= 閾値3）
  WHEN coarse_stats.sample_count >= 50 THEN coarse_stats.value

  -- Level 4: 全体平均
  ELSE overall_stats.value
END
```

## BigQueryテーブル構成

### マスターデータ
- `umadata.keiba_data.horse` - 馬マスタ
- `umadata.keiba_data.jockey` - 騎手マスタ
- `umadata.keiba_data.trainer` - 調教師マスタ

### レースデータ
- `umadata.keiba_data.race_master` - レース基本情報
- `umadata.keiba_data.race_result` - レース結果

### 特徴量テーブル
- `umadata.keiba_data.all_features_clean` - 基本特徴量（29個）
- `umadata.keiba_data.all_features_clean_with_dev` - 偏差値追加
- `umadata.keiba_data.all_features_with_running_style_win_rate` - 脚質勝率追加 ← **現在の最新**

### 分割テーブル（トレーニング用）
- `umadata.keiba_data.train_features` - Training期間
- `umadata.keiba_data.validation_features` - Validation期間
- `umadata.keiba_data.test_features` - Test期間

## GCSバケット

- `gs://umadata/` - メインバケット
- `gs://umadata/temp/` - 一時ファイル用

## 注意事項

1. **BigQuery優先**: 可能な限りBigQueryで処理を完結させる
2. **データリーク厳禁**: 未来の情報を使わない
3. **段階的改善**: 特徴量は1つずつ追加して効果測定
4. **ドキュメント更新**: 新しい特徴量を追加したらこのファイルを更新

## ⚠️ トラブルシューティング

### BigQueryの性能期待値

**データは5年分程度しかない。BigQueryの処理能力なら数秒〜数十秒で完了するはず。**

- **テーブル作成（CREATE TABLE AS SELECT）**: 通常5〜15秒
- **単純なSELECT COUNT(*)**: 1〜3秒
- **JOIN含むクエリ**: 10〜30秒
- **大規模な集計処理**: 30秒〜2分

**30秒以上応答がない場合は、エラーが発生していると疑うこと。**

### エラーハンドリング

BigQueryコマンドがハングしている場合：

1. **プロセス確認**:
   ```bash
   ps aux | grep "bq query" | grep -v grep
   ```

2. **テーブル作成確認**:
   ```bash
   # テーブルが実際に作成されているか確認
   bq show --project_id=umadata keiba_data.table_name
   ```

3. **ハングしたプロセスのクリーンアップ**:
   ```bash
   pkill -9 -f "bq query"
   ```

4. **簡単なクエリでテスト**:
   ```bash
   bq query --use_legacy_sql=false --project_id=umadata \
     "SELECT COUNT(*) FROM \`umadata.keiba_data.table_name\` LIMIT 1"
   ```

### ログ確認の重要性

**バックグラウンドプロセスの出力は必ず確認すること。**

- Bashツールは長時間処理を自動的にバックグラウンドで実行する
- 出力ファイルへの書き込みに遅延がある場合がある
- エラーが発生していてもプロセスが残り続ける場合がある

**確認方法**:
```bash
# 実行結果を直接確認
bq show keiba_data.table_name

# 行数を確認
bq query --use_legacy_sql=false "SELECT COUNT(*) FROM \`keiba_data.table_name\`"
```

### よくある問題

1. **`--destination_table`オプションでハング**
   - 解決策: `CREATE OR REPLACE TABLE` 構文を使用
   ```bash
   bq query --use_legacy_sql=false --project_id=umadata \
     "CREATE OR REPLACE TABLE \`dataset.table\` AS SELECT ..."
   ```

2. **バックグラウンドプロセスが応答しない**
   - 解決策: テーブル自体が作成されているか `bq show` で確認

3. **古いプロセスが残っている**
   - 解決策: `pkill -9 -f "bq query"` で全てクリーンアップ

### デバッグ用クエリ

```bash
# データセット内の全テーブル一覧
bq ls --project_id=umadata keiba_data

# テーブル詳細情報（行数、サイズ、最終更新日時）
bq show --format=prettyjson keiba_data.table_name | grep -E "numRows|numBytes|lastModified"

# テーブルスキーマ確認
bq show keiba_data.table_name

# 簡単な集計
bq query --use_legacy_sql=false \
  "SELECT COUNT(*), MIN(race_date), MAX(race_date) FROM \`keiba_data.table_name\`"
```
