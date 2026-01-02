# データパイプライン再構築ガイド

> **作成日**: 2025-12-29
> **目的**: データリーケージを完全に排除したクリーンな特徴量パイプラインの構築
> **重要度**: 🚨 CRITICAL - 全てのモデル評価に影響

---

## 📋 目次

1. [背景と問題の概要](#背景と問題の概要)
2. [データリーケージの詳細](#データリーケージの詳細)
3. [新パイプライン設計](#新パイプライン設計)
4. [実行手順](#実行手順)
5. [検証方法](#検証方法)
6. [トラブルシューティング](#トラブルシューティング)
7. [参照情報](#参照情報)

---

## 背景と問題の概要

### 発見された問題

2025年12月29日、全SQLファイルの包括的なデータリーケージチェックを実施した結果、以下の問題が発見されました：

**🔴 データリーケージが確認されたファイル:**
1. `add_trainer_win_rate.sql` - 調教師の勝率・複勝率
2. `add_jockey_win_rate.sql` - 騎手の勝率
3. `add_missing_features.sql` - 脚質別勝率

**🟡 作成経緯が不明で信頼できないテーブル:**
- `umadata.keiba_data.all_features_complete_improved`
- 騎手複勝率の計算スクリプトが見つからず、データリーケージの可能性が高い

### 影響範囲

**全ての既存モデルが影響を受けています:**
- Pattern A（騎手複勝率のみ）
- Pattern B（騎手勝率のみ）
- Pattern C（騎手複勝率+勝率）
- Pattern C v2（最適化版）
- Pattern C v3（調教師統計追加）

**具体的な証拠:**
- 調教師統計の重要度: データリーケージあり **42.47%** → 修正後 **0.19%**
- これは調教師統計の高い重要度が「未来のデータ」によるものだったことを証明

### なぜ再構築が必要か

現在のテーブル（`all_features_complete_improved`）は：
1. 作成経緯が不明
2. 騎手複勝率の計算方法が確認できない
3. データリーケージがある可能性が極めて高い
4. 信頼できるモデル評価ができない

**結論**: クリーンなパイプラインを一から構築し、全ての特徴量計算が正しく時系列フィルタリングされていることを保証する必要がある。

---

## データリーケージの詳細

### データリーケージとは

**定義**: 予測対象のレース時点では入手不可能な「未来の情報」を使って特徴量を計算してしまう問題。

**なぜ問題か**:
- モデルの評価指標（AUC、的中率、回収率）が実際より高く見える
- 実運用では同じ性能が出ない
- 特徴量の重要度が歪む
- 意思決定を誤る

### 発見されたデータリーケージのパターン

#### ❌ 間違ったパターン（固定日付カットオフ）

```sql
-- 調教師統計の計算例（add_trainer_win_rate.sql Line 26）
trainer_stats_detailed AS (
  SELECT
    rm.venue_name,
    rm.surface,
    rm.distance,
    rr.trainer_id,
    AVG(CASE WHEN rr.finish_position = 1 THEN 1.0 ELSE 0.0 END) as win_rate
  FROM race_result rr
  JOIN race_master rm ON rr.race_id = rm.race_id
  WHERE rm.race_date < '2025-01-01'  -- ❌ 全てのレースで同じ統計を使用
  GROUP BY rm.venue_name, rm.surface, rm.distance, rr.trainer_id
)

SELECT
  af.*,
  ts.win_rate as trainer_win_rate_surface_distance
FROM all_features af
LEFT JOIN trainer_stats_detailed ts
  ON af.trainer_id = ts.trainer_id
  AND rm.venue_name = ts.venue_name
  ...
```

**問題点**:
- 2024年1月1日のレースも、2024年12月31日のレースも、同じ統計値を使用
- 2024年12月のレース結果が、2024年1月のレース予測に影響を与える
- これは「未来の情報」を使っていることになる

#### ✅ 正しいパターン（レースごとの時系列フィルタリング）

```sql
-- 修正版（add_trainer_win_rate_no_leakage.sql）
WITH
all_races AS (
  SELECT
    af.*,
    rm.race_date as current_race_date,
    rm.venue_name as current_venue_name,
    ...
  FROM all_features af
  JOIN race_master rm ON af.race_id = rm.race_id
),

trainer_past_performance AS (
  SELECT
    current_race.race_id,
    current_race.trainer_id,
    AVG(CASE
      WHEN past_rm.venue_name = current_race.current_venue_name
        AND past_rm.surface = current_race.current_surface
        AND past_rm.distance = current_race.current_distance
        AND past_rr.finish_position = 1
      THEN 1.0
      WHEN ... THEN 0.0
    END) as detailed_win_rate
  FROM all_races current_race
  LEFT JOIN race_result past_rr
    ON current_race.trainer_id = past_rr.trainer_id
  LEFT JOIN race_master past_rm
    ON past_rr.race_id = past_rm.race_id
  WHERE past_rm.race_date < current_race.current_race_date  -- ✅ レースごとに異なる統計
  GROUP BY current_race.race_id, current_race.trainer_id
)
```

**正しい点**:
- 各レースに対して、そのレース日付より前のデータのみを使用
- 2024年1月1日のレース → 2023年12月31日以前のデータのみ
- 2024年12月31日のレース → 2024年12月30日以前のデータのみ
- これにより「未来の情報」を使わない

### データリーケージがなかったパターン

#### ✅ WINDOW関数による正しい実装

```sql
-- feature_engineering.sql, fix_data_leakage.sql などで使用
jockey_stats AS (
  SELECT
    r1.race_id,
    r1.jockey_id,
    COUNT(r2.race_id) as jockey_rides,
    AVG(CASE WHEN r2.finish_position <= 3 THEN 1.0 ELSE 0.0 END) as place_rate
  FROM all_data r1
  LEFT JOIN all_data r2
    ON r1.jockey_id = r2.jockey_id
    AND r1.surface = r2.surface
    AND r2.race_date < r1.race_date  -- ✅ 各レースより前のデータのみ
  GROUP BY r1.race_id, r1.jockey_id
)
```

または

```sql
-- WINDOW関数のROWS BETWEEN句
time_deviation AS (
  SELECT
    *,
    AVG(time) OVER (
      PARTITION BY racecourse, surface, going
      ORDER BY race_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING  -- ✅ 現在行より前のみ
    ) as mean_time
  FROM all_races
)
```

---

## 新パイプライン設計

### 全体フロー

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 基礎データ（race_master, race_result）                   │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. fix_data_leakage.sql                                     │
│    - 過去走のタイム指数（time_index_zscore_last1-5）        │
│    - 過去走の着順（finish_position_last1-5）                │
│    - 過去走の上がり3F指数（last3f_index_zscore_last1-5）    │
│    - 脚質情報（running_style_last1, mode）                  │
│    - 前走からの日数（days_since_last_race）                 │
│    ✅ WINDOW関数で正しく時系列処理                          │
│                                                             │
│    出力: all_features_base_no_leakage                       │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. add_jockey_win_rate_no_leakage.sql                       │
│    - jockey_win_rate_surface_distance（騎手勝率）           │
│    - jockey_place_rate_surface_distance（騎手複勝率）       │
│    - jockey_rides_surface_distance（騎乗回数）              │
│    ✅ 各レースより前のデータのみ使用                        │
│                                                             │
│    出力: all_features_with_jockey_stats_no_leakage          │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. add_trainer_win_rate_no_leakage.sql                      │
│    - trainer_win_rate_surface_distance（調教師勝率）        │
│    - trainer_place_rate_surface_distance（調教師複勝率）    │
│    ✅ 各レースより前のデータのみ使用                        │
│                                                             │
│    出力: all_features_with_trainer_stats_no_leakage         │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. add_missing_features_no_leakage.sql                      │
│    - running_style_mode_win_rate（最頻脚質勝率）            │
│    - running_style_last1_win_rate（直近脚質勝率）           │
│    - 休養関連フラグ（is_after_long_rest等）                 │
│    ✅ 各レースより前のデータのみ使用                        │
│                                                             │
│    出力: all_features_complete_no_leakage                   │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. タイム指数の改善版計算（必要に応じて）                   │
│    - time_index_zscore_mean_3_improved                      │
│    - time_index_zscore_best_3_improved                      │
│    - time_index_zscore_worst_3_improved                     │
│    - time_index_zscore_trend_3_improved                     │
│    - last3f_index_zscore集約特徴量                          │
│                                                             │
│    出力: all_features_complete_improved_no_leakage          │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. モデル訓練                                               │
│    - train_pattern_c_v3_with_trainer_no_leakage.py          │
│    - 新しいクリーンなテーブルを使用                         │
│    - 正しいAUC、的中率、回収率を評価                        │
└─────────────────────────────────────────────────────────────┘
```

### SQLファイルの詳細

| # | ファイル名 | 入力テーブル | 出力テーブル | 主要な特徴量 |
|---|-----------|-------------|-------------|------------|
| 1 | `fix_data_leakage.sql` | `race_master`, `race_result` | `all_features_base_no_leakage` | 過去走タイム指数、着順、脚質、日数 |
| 2 | `add_jockey_win_rate_no_leakage.sql` | `all_features_base_no_leakage` | `all_features_with_jockey_stats_no_leakage` | 騎手勝率、複勝率、騎乗回数 |
| 3 | `add_trainer_win_rate_no_leakage.sql` | `all_features_with_jockey_stats_no_leakage` | `all_features_with_trainer_stats_no_leakage` | 調教師勝率、複勝率 |
| 4 | `add_missing_features_no_leakage.sql` | `all_features_with_trainer_stats_no_leakage` | `all_features_complete_no_leakage` | 脚質勝率、休養フラグ |

### 特徴量一覧（32個）

#### 脚質関連（4個）
- `running_style_last1`: 前走の脚質
- `running_style_mode`: 最頻脚質
- `running_style_mode_win_rate`: 最頻脚質の勝率 ✅
- `running_style_last1_win_rate`: 前走脚質の勝率 ✅

#### 騎手関連（4個）
- `jockey_rides_surface_distance`: 騎乗回数 ✅
- `jockey_place_rate_surface_distance`: 騎手複勝率 ✅
- `jockey_win_rate_surface_distance`: 騎手勝率 ✅
- `is_jockey_change`: 騎手変更フラグ

#### 調教師関連（2個）
- `trainer_place_rate_surface_distance`: 調教師複勝率 ✅
- `trainer_win_rate_surface_distance`: 調教師勝率 ✅

#### 馬の成績（1個）
- `finish_pos_best_last5`: 過去5走のベスト着順

#### レース条件（3個）
- `racecourse_encoded`: 競馬場コード
- `surface_encoded`: 馬場コード（芝/ダート）
- `race_class_encoded`: クラスコード

#### 馬の基本情報（8個）
- `distance`: 距離
- `sex`: 性別
- `age`: 年齢
- `horse_weight`: 馬体重
- `weight_change`: 馬体重増減
- `bracket_number`: 枠番
- `horse_number`: 馬番
- `days_since_last_race`: 前走からの日数

#### タイム指数（7個）
- `time_index_zscore_last1_improved`: 前走タイム指数
- `time_index_zscore_last2_improved`: 2走前タイム指数
- `time_index_zscore_last3_improved`: 3走前タイム指数
- `time_index_zscore_mean_3_improved`: 直近3走平均
- `time_index_zscore_best_3_improved`: 直近3走ベスト
- `time_index_zscore_worst_3_improved`: 直近3走ワースト
- `time_index_zscore_trend_3_improved`: 直近3走トレンド

#### 上がり3F指数（2個）
- `last3f_index_zscore_last1_improved`: 前走上がり指数
- `last3f_index_zscore_last2_improved`: 2走前上がり指数

#### 休養関連（1個）
- `rest_period_category`: 休養期間カテゴリ

**✅マーク**: データリーケージ修正が必要だった特徴量

---

## 実行手順

### 前提条件

- BigQueryへのアクセス権限
- `umadata.keiba_data`プロジェクトへの書き込み権限
- 基礎テーブル（`race_master`, `race_result`）が存在すること

### ステップ1: 基礎特徴量テーブルの作成

**実行するSQL**: `fix_data_leakage.sql`

```bash
bq query --use_legacy_sql=false < ai/fix_data_leakage.sql
```

**確認**:
```bash
bq show umadata:keiba_data.all_features_base_no_leakage
bq head -n 5 umadata:keiba_data.all_features_base_no_leakage
```

**期待される結果**:
- テーブルが作成される
- カラム数: 基本情報 + 過去走特徴量（約50カラム）
- レコード数: race_resultとほぼ同じ

**注意点**:
- このステップは最も時間がかかる（30分～1時間程度）
- WINDOW関数を多用するため、BigQueryのスロットを多く消費

### ステップ2: 騎手統計の追加

**実行前の修正が必要**:

`add_jockey_win_rate_no_leakage.sql`の**Line 16**を修正：

```sql
-- 修正前（このファイルを作成時のミス）
FROM `umadata.keiba_data.all_features_with_aggregated_time_index` af

-- 修正後
FROM `umadata.keiba_data.all_features_base_no_leakage` af
```

**実行**:
```bash
bq query --use_legacy_sql=false < ai/add_jockey_win_rate_no_leakage.sql
```

**確認**:
```bash
bq query --use_legacy_sql=false "
SELECT
  jockey_win_rate_surface_distance,
  jockey_place_rate_surface_distance,
  jockey_rides_surface_distance,
  jockey_stat_level,
  COUNT(*) as cnt
FROM umadata.keiba_data.all_features_with_jockey_stats_no_leakage
GROUP BY 1, 2, 3, 4
ORDER BY cnt DESC
LIMIT 10
"
```

**期待される結果**:
- 騎手勝率が0.05～0.30程度の範囲（デフォルト0.05を除く）
- 騎手複勝率が0.15～0.40程度の範囲
- jockey_stat_level: 'detailed', 'medium', 'overall', 'default'の分布を確認

### ステップ3: 調教師統計の追加

**実行前の修正が必要**:

`add_trainer_win_rate_no_leakage.sql`の**Line 16**を修正：

```sql
-- 修正前
FROM `umadata.keiba_data.all_features_complete_improved` af

-- 修正後
FROM `umadata.keiba_data.all_features_with_jockey_stats_no_leakage` af
```

**実行**:
```bash
bq query --use_legacy_sql=false < ai/add_trainer_win_rate_no_leakage.sql
```

**確認**:
```bash
bq query --use_legacy_sql=false "
SELECT
  trainer_win_rate_surface_distance,
  trainer_place_rate_surface_distance,
  trainer_stat_level,
  COUNT(*) as cnt
FROM umadata.keiba_data.all_features_with_trainer_stats_no_leakage
GROUP BY 1, 2, 3
ORDER BY cnt DESC
LIMIT 10
"
```

### ステップ4: 脚質統計と休養フラグの追加

**実行前の修正が必要**:

`add_missing_features_no_leakage.sql`の**Line 19**を修正：

```sql
-- 修正前
FROM `umadata.keiba_data.all_features_final` af

-- 修正後
FROM `umadata.keiba_data.all_features_with_trainer_stats_no_leakage` af
```

**実行**:
```bash
bq query --use_legacy_sql=false < ai/add_missing_features_no_leakage.sql
```

**確認**:
```bash
bq query --use_legacy_sql=false "
SELECT
  running_style_mode_win_rate,
  running_style_last1_win_rate,
  rest_period_category,
  COUNT(*) as cnt
FROM umadata.keiba_data.all_features_complete_no_leakage
GROUP BY 1, 2, 3
ORDER BY cnt DESC
LIMIT 20
"
```

### ステップ5: タイム指数の改善版（必要に応じて）

**現状確認**:

`fix_data_leakage.sql`がすでに以下の改善版タイム指数を計算している可能性を確認：

```bash
bq query --use_legacy_sql=false "
SELECT
  time_index_zscore_mean_3_improved,
  time_index_zscore_best_3_improved,
  time_index_zscore_worst_3_improved,
  time_index_zscore_trend_3_improved
FROM umadata.keiba_data.all_features_complete_no_leakage
LIMIT 5
"
```

**もし存在しない場合**:

別途SQLを作成して集約特徴量を追加：

```sql
CREATE OR REPLACE TABLE `umadata.keiba_data.all_features_complete_improved_no_leakage` AS
SELECT
  *,

  -- タイム指数集約（直近3走）
  (time_index_zscore_last1 + time_index_zscore_last2 + time_index_zscore_last3) / 3.0
    as time_index_zscore_mean_3_improved,

  GREATEST(
    COALESCE(time_index_zscore_last1, -999),
    COALESCE(time_index_zscore_last2, -999),
    COALESCE(time_index_zscore_last3, -999)
  ) as time_index_zscore_best_3_improved,

  LEAST(
    COALESCE(time_index_zscore_last1, 999),
    COALESCE(time_index_zscore_last2, 999),
    COALESCE(time_index_zscore_last3, 999)
  ) as time_index_zscore_worst_3_improved,

  time_index_zscore_last1 - time_index_zscore_last3
    as time_index_zscore_trend_3_improved

FROM `umadata.keiba_data.all_features_complete_no_leakage`
```

### ステップ6: 最終テーブルの確認

```bash
bq query --use_legacy_sql=false "
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT race_id) as total_races,
  MIN(race_date) as min_date,
  MAX(race_date) as max_date
FROM umadata.keiba_data.all_features_complete_no_leakage
"
```

**期待される結果**:
- total_records: 数十万～数百万レコード
- total_races: 数万レース
- min_date: 2021-01-01 以降
- max_date: 2025-11-30 程度

### ステップ7: モデル訓練スクリプトの修正

**新しい訓練スクリプトを作成**:

`scripts/training/train_pattern_c_v3_final_no_leakage.py`

主な変更点：
```python
# Line 93付近
query = """
SELECT
    race_id,
    race_date,
    ...
FROM `umadata.keiba_data.all_features_complete_no_leakage`  -- ✅ 新しいテーブル
WHERE race_date >= '2021-01-01'
    AND finish_position IS NOT NULL
ORDER BY race_date
"""
```

### ステップ8: モデル訓練の実行

```bash
cd ai/scripts/training
python3 train_pattern_c_v3_final_no_leakage.py
```

**期待される変化**:
- AUCが低下する可能性（データリーケージがなくなるため）
- 調教師統計の重要度が大幅に低下（42% → 1%未満）
- 騎手統計の重要度も低下する可能性
- より現実的な的中率・回収率

---

## 検証方法

### 1. データリーケージのテスト

特定のレースについて、統計値に未来のデータが含まれていないか確認：

```sql
-- 2024-11-01の特定レースを選択
WITH test_race AS (
  SELECT
    race_id,
    jockey_id,
    trainer_id,
    race_date,
    jockey_win_rate_surface_distance,
    trainer_win_rate_surface_distance
  FROM `umadata.keiba_data.all_features_complete_no_leakage`
  WHERE race_date = '2024-11-01'
  LIMIT 1
)

-- 手動で騎手の過去成績を計算（2024-11-01より前）
SELECT
  tr.race_date,
  tr.jockey_id,
  tr.jockey_win_rate_surface_distance as stored_jockey_win_rate,

  -- 手動計算: 2024-11-01より前のデータのみ
  COUNT(CASE WHEN rm.race_date < tr.race_date THEN 1 END) as manual_rides,
  AVG(CASE
    WHEN rm.race_date < tr.race_date AND rr.finish_position = 1 THEN 1.0
    WHEN rm.race_date < tr.race_date THEN 0.0
  END) as manual_jockey_win_rate,

  -- リーケージチェック: 2024-11-01以降も含めた場合
  AVG(CASE WHEN rr.finish_position = 1 THEN 1.0 ELSE 0.0 END) as all_time_win_rate

FROM test_race tr
JOIN `umadata.keiba_data.race_result` rr ON tr.jockey_id = rr.jockey_id
JOIN `umadata.keiba_data.race_master` rm ON rr.race_id = rm.race_id
WHERE rm.surface IN ('芝', 'ダート')
GROUP BY tr.race_date, tr.jockey_id, tr.jockey_win_rate_surface_distance
```

**合格基準**:
- `stored_jockey_win_rate` ≈ `manual_jockey_win_rate`（誤差5%以内）
- `all_time_win_rate` > `manual_jockey_win_rate`であることが多い（未来のデータを含むため）

### 2. 特徴量重要度の比較

修正前後のモデルで特徴量重要度を比較：

```python
# scripts/evaluation/compare_leakage_impact.py
import pandas as pd
import pickle

# 修正前のモデル
with open('../../models/model_pattern_c_v3_with_trainer.pkl', 'rb') as f:
    model_before = pickle.load(f)

# 修正後のモデル
with open('../../models/model_pattern_c_v3_final_no_leakage.pkl', 'rb') as f:
    model_after = pickle.load(f)

# 重要度比較
importance_before = model_before.feature_importance(importance_type='gain')
importance_after = model_after.feature_importance(importance_type='gain')

comparison = pd.DataFrame({
    'feature': features,
    'importance_before': importance_before,
    'importance_after': importance_after,
    'change': importance_after - importance_before,
    'change_pct': (importance_after - importance_before) / importance_before * 100
})

print(comparison.sort_values('change', ascending=True).head(20))
```

**期待される結果**:
- 調教師統計の重要度が大幅に低下（-90%以上）
- 騎手統計の重要度も低下する可能性
- タイム指数などの馬自身の特徴量の重要度が相対的に上昇

### 3. AUCと回収率の変化

```python
print(f"修正前 AUC: {auc_before:.4f}")
print(f"修正後 AUC: {auc_after:.4f}")
print(f"変化: {auc_after - auc_before:.4f}")
```

**期待される結果**:
- AUCが0.01～0.05程度低下する可能性（データリーケージがなくなるため）
- 回収率も低下する可能性
- ただし、これが**正しい評価**

---

## トラブルシューティング

### エラー1: テーブルが見つからない

```
Error: Not found: Table umadata:keiba_data.all_features_base_no_leakage
```

**原因**: 前のステップのSQLが実行されていない、または失敗した

**対処**:
```bash
# テーブル一覧を確認
bq ls umadata:keiba_data | grep "all_features"

# 前のステップのSQLを再実行
bq query --use_legacy_sql=false < ai/fix_data_leakage.sql
```

### エラー2: カラムが存在しない

```
Error: Unrecognized name: time_index_zscore_last1_improved
```

**原因**: 入力テーブルに期待されるカラムが存在しない

**対処**:
```bash
# テーブルのスキーマを確認
bq show --schema umadata:keiba_data.all_features_base_no_leakage

# 欠けているカラムを確認
bq query --use_legacy_sql=false "
SELECT column_name
FROM umadata.keiba_data.INFORMATION_SCHEMA.COLUMNS
WHERE table_name = 'all_features_base_no_leakage'
ORDER BY column_name
"
```

### エラー3: メモリ不足

```
Error: Resources exceeded during query execution
```

**原因**: CROSS JOINや大量のWINDOW関数でメモリ不足

**対処**:
- データを期間で分割して処理
- WHERE句で期間を制限（例: `WHERE race_date >= '2023-01-01'`）
- BigQueryのスロットを増やす

### エラー4: 実行時間が長すぎる

**原因**: 騎手・調教師統計の計算でクロスジョインが重い

**対処法1**: 期間を分割

```sql
-- 2023年のみ処理
CREATE OR REPLACE TABLE `umadata.keiba_data.all_features_with_jockey_stats_no_leakage_2023` AS
...
WHERE current_race.current_race_date BETWEEN '2023-01-01' AND '2023-12-31'

-- 2024年のみ処理
CREATE OR REPLACE TABLE `umadata.keiba_data.all_features_with_jockey_stats_no_leakage_2024` AS
...
WHERE current_race.current_race_date BETWEEN '2024-01-01' AND '2024-12-31'

-- 結合
CREATE OR REPLACE TABLE `umadata.keiba_data.all_features_with_jockey_stats_no_leakage` AS
SELECT * FROM `umadata.keiba_data.all_features_with_jockey_stats_no_leakage_2023`
UNION ALL
SELECT * FROM `umadata.keiba_data.all_features_with_jockey_stats_no_leakage_2024`
```

**対処法2**: サンプル数の閾値を上げる

```sql
-- 詳細統計の最低サンプル数を5 → 10に変更
CASE WHEN jpp.detailed_rides >= 10 THEN jpp.detailed_win_rate END,  -- 5 → 10
```

### エラー5: 特徴量の値が異常

**症状**: 勝率が1.0を超える、複勝率がマイナス、など

**確認**:
```sql
SELECT
  MIN(jockey_win_rate_surface_distance) as min_win_rate,
  MAX(jockey_win_rate_surface_distance) as max_win_rate,
  AVG(jockey_win_rate_surface_distance) as avg_win_rate
FROM umadata.keiba_data.all_features_with_jockey_stats_no_leakage
WHERE jockey_win_rate_surface_distance IS NOT NULL
```

**対処**: SQLのAVG計算部分を確認、CASE文の条件を見直す

---

## 参照情報

### 関連ドキュメント

- **[DATA_LEAKAGE_CHECKLIST.md](./DATA_LEAKAGE_CHECKLIST.md)**: データリーケージ防止チェックリスト（新規特徴量追加時に参照）
- **[AI_WORKFLOW.md](./AI_WORKFLOW.md)**: AI開発ワークフローの全体像
- **[ARCHITECTURE.md](../ARCHITECTURE.md)**: システム全体のアーキテクチャ
- **[COMPONENTS.md](../COMPONENTS.md)**: フロントエンドコンポーネント

### SQLファイル一覧

#### ✅ データリーケージなし（使用推奨）

| ファイル名 | 用途 | 状態 |
|-----------|------|------|
| `fix_data_leakage.sql` | 基礎特徴量（過去走、タイム指数） | ✅ 正しい |
| `add_jockey_win_rate_no_leakage.sql` | 騎手統計（修正版） | ✅ 作成済み |
| `add_trainer_win_rate_no_leakage.sql` | 調教師統計（修正版） | ✅ 作成済み |
| `add_missing_features_no_leakage.sql` | 脚質統計・休養フラグ（修正版） | ✅ 作成済み |
| `feature_engineering.sql` | keiba_aiデータセット用 | ✅ 正しい |
| `feature_engineering_bq.sql` | BigQuery最適化版 | ✅ 正しい |
| `add_past_race_conditions.sql` | 過去走のレース条件 | ✅ 正しい |
| `add_trend_features.sql` | トレンド特徴量 | ✅ 正しい |

#### ❌ データリーケージあり（使用禁止）

| ファイル名 | 問題点 | 修正版 |
|-----------|--------|--------|
| `add_trainer_win_rate.sql` | 固定日付カットオフ | `add_trainer_win_rate_no_leakage.sql` |
| `add_jockey_win_rate.sql` | 固定日付カットオフ | `add_jockey_win_rate_no_leakage.sql` |
| `add_missing_features.sql` | 固定日付カットオフ | `add_missing_features_no_leakage.sql` |

#### 🟡 参考用（脚質統計）

| ファイル名 | 備考 |
|-----------|------|
| `add_running_style_win_rate.sql` | 脚質別勝率（一般的傾向） |
| `add_running_style_win_rate_CORRECT.sql` | 前走脚質でマッピング |
| `add_running_style_win_rate_FIXED.sql` | 前走脚質でマッピング |

### Pythonスクリプト一覧

#### 訓練スクリプト

- `scripts/training/train_pattern_c_v2_optimized.py`: Pattern C v2（30特徴量）
- `scripts/training/train_pattern_c_v3_with_trainer.py`: Pattern C v3（32特徴量、調教師統計追加）
- **`scripts/training/train_pattern_c_v3_final_no_leakage.py`**: 作成予定（クリーンなデータで訓練）

#### 評価スクリプト

- `scripts/evaluation/show_pattern_c_feature_importance.py`: 特徴量重要度の表示
- `scripts/evaluation/compare_jockey_rate_patterns.py`: パターン比較
- `scripts/evaluation/analyze_odds_distribution.py`: オッズ分布分析

### BigQueryテーブル一覧

#### 基礎テーブル

- `umadata.keiba_data.race_master`: レースマスタ（日付、競馬場、距離等）
- `umadata.keiba_data.race_result`: レース結果（着順、オッズ、騎手等）

#### ❌ 旧テーブル（データリーケージあり、使用禁止）

- `umadata.keiba_data.all_features_complete_improved`
- `umadata.keiba_data.all_features_with_trainer_stats`
- `umadata.keiba_data.all_features_with_jockey_win_rate`

#### ✅ 新テーブル（データリーケージなし、使用推奨）

- `umadata.keiba_data.all_features_base_no_leakage`
- `umadata.keiba_data.all_features_with_jockey_stats_no_leakage`
- `umadata.keiba_data.all_features_with_trainer_stats_no_leakage`
- `umadata.keiba_data.all_features_complete_no_leakage`

### 重要な発見・教訓

1. **データリーケージは特徴量の重要度を大幅に歪める**
   - 調教師統計: 42.47% → 0.19%（99%以上の減少）

2. **固定日付カットオフは危険**
   - 全てのレースで同じ統計を使うことになる
   - 必ず `WHERE past.race_date < current.race_date` を使う

3. **作成経緯が不明なテーブルは信用しない**
   - SQLファイルが見つからないテーブルは再作成すべき
   - ドキュメントとコードの一貫性が重要

4. **WINDOW関数は正しく使えばリーケージを防げる**
   - `ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING`
   - `ORDER BY race_date` で時系列順に処理

5. **検証は必須**
   - テストクエリでデータリーケージがないか確認
   - 修正前後の特徴量重要度を比較
   - AUCの低下は「正しい評価」への改善

### 連絡先・質問

このドキュメントに関する質問や、パイプライン実行時の問題については、以下を参照してください：

- **作成者**: Claude (Anthropic)
- **作成日**: 2025-12-29
- **最終更新**: 2025-12-29
- **バージョン**: 1.0

---

**🎯 重要**: このドキュメントは今後の全ての特徴量エンジニアリング作業の基礎となります。新しい特徴量を追加する際は、必ず[DATA_LEAKAGE_CHECKLIST.md](./DATA_LEAKAGE_CHECKLIST.md)を参照し、データリーケージがないことを確認してください。
