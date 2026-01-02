# 脚質特徴量 強化プラン

**作成日**: 2025年12月26日
**目的**: 脚質特徴量を強化し、回収率169.7% → 170-180%を目指す
**根拠**: SHAP分析で脚質のSHAPが0.8049（購入レース）と圧倒的

---

## 📊 現状の脚質特徴量（3つ）

| 特徴量 | 説明 | Gain | SHAP（購入） | 課題 |
|--------|------|------|-------------|------|
| `running_style_encoded` | 現在の脚質（0-3） | 39,348 | 0.8049 | 条件別の適性を考慮していない |
| `running_style_last1` | 前走の脚質 | 471 | 0.0096 | 変化を捉えられていない |
| `running_style_mode` | 最頻脚質 | 430 | 0.0086 | 安定性を示せていない |

### 問題点

1. **条件別の適性が未実装**
   - 例: 「ダート1800mでは先行が有利」という知識がない
   - 現在は「この馬は先行脚質」という情報のみ

2. **脚質の安定性が不明**
   - 毎回同じ脚質か？それとも変化しているか？
   - 安定している馬の方が信頼できる

3. **レース展開の予測なし**
   - 「このレースはハイペースか？」
   - 「差しが届きやすいか？」

---

## 🎯 改善案：3段階のアプローチ

### Phase 1: 条件別脚質適性（最優先）✅

**目的**: 「馬場・距離・競馬場ごとに、どの脚質が有利か」を学習

#### 追加する特徴量（4つ）

##### 1. `running_style_surface_win_rate`
**定義**: その脚質が、その馬場（芝/ダート）で勝つ確率

```sql
-- BigQueryでの集計例
WITH style_surface_stats AS (
  SELECT
    running_style_encoded,
    surface,
    COUNT(*) as races,
    SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) as wins
  FROM race_results
  WHERE running_style_encoded IS NOT NULL
  GROUP BY running_style_encoded, surface
)
SELECT
  running_style_encoded,
  surface,
  races,
  wins,
  SAFE_DIVIDE(wins, races) as win_rate  -- 勝率
FROM style_surface_stats
WHERE races >= 50  -- 最低サンプル数
```

**期待効果**:
- 「ダートでは逃げ・先行が有利（前残り）」
- 「芝では差し・追込が有利（差しが届く）」

##### 2. `running_style_distance_win_rate`
**定義**: その脚質が、その距離帯で勝つ確率

```sql
-- 距離を200m刻みで丸める
WITH style_distance_stats AS (
  SELECT
    running_style_encoded,
    FLOOR(distance / 200) * 200 as distance_band,  -- 1200, 1400, 1600...
    COUNT(*) as races,
    SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) as wins
  FROM race_results
  WHERE running_style_encoded IS NOT NULL
  GROUP BY running_style_encoded, distance_band
)
SELECT
  running_style_encoded,
  distance_band,
  SAFE_DIVIDE(wins, races) as win_rate
FROM style_distance_stats
WHERE races >= 30
```

**期待効果**:
- 「短距離（1200m以下）では逃げ・先行が有利」
- 「長距離（2400m以上）では追込が有利」

##### 3. `running_style_racecourse_win_rate`
**定義**: その脚質が、その競馬場で勝つ確率

```sql
WITH style_racecourse_stats AS (
  SELECT
    running_style_encoded,
    racecourse,
    COUNT(*) as races,
    SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) as wins
  FROM race_results
  WHERE running_style_encoded IS NOT NULL
  GROUP BY running_style_encoded, racecourse
)
SELECT
  running_style_encoded,
  racecourse,
  SAFE_DIVIDE(wins, races) as win_rate
FROM style_racecourse_stats
WHERE races >= 20
```

**期待効果**:
- 「中山は前残りコース → 先行有利」
- 「東京は差しが届く → 差し有利」

##### 4. `running_style_combined_win_rate` ⭐最重要
**定義**: 馬場 × 距離帯 × 競馬場の組み合わせでの勝率

```sql
WITH style_combined_stats AS (
  SELECT
    running_style_encoded,
    surface,
    FLOOR(distance / 200) * 200 as distance_band,
    racecourse,
    COUNT(*) as races,
    SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) as wins
  FROM race_results
  WHERE running_style_encoded IS NOT NULL
  GROUP BY running_style_encoded, surface, distance_band, racecourse
)
SELECT
  running_style_encoded,
  surface,
  distance_band,
  racecourse,
  SAFE_DIVIDE(wins, races) as win_rate
FROM style_combined_stats
WHERE races >= 10
```

**階層的フォールバック**:
```python
# サンプル数に応じてフォールバック
if sample_count_combined >= 10:
    return combined_win_rate  # 最も細かい
elif sample_count_surface_distance >= 30:
    return surface_distance_win_rate  # 中程度
elif sample_count_surface >= 50:
    return surface_win_rate  # 粗い
else:
    return overall_win_rate  # 全体平均
```

**期待効果**:
- 「中山ダート1800mでは先行脚質の勝率30%」
- 「阪神芝2000mでは差し脚質の勝率25%」

#### 実装の優先順位

1. **最優先**: `running_style_combined_win_rate`（階層的フォールバック付き）
2. **次点**: `running_style_surface_win_rate`
3. **補助**: `running_style_distance_win_rate`
4. **補助**: `running_style_racecourse_win_rate`

→ **推奨**: 1のみ実装（2-4は1に含まれるため）

---

### Phase 2: 脚質の安定性指標（次点）

**目的**: 「この馬の脚質は安定しているか」を評価

#### 追加する特徴量（2つ）

##### 1. `running_style_consistency`
**定義**: 過去5走で最頻脚質が占める割合

```python
# 例
過去5走の脚質: [先行, 先行, 先行, 差し, 先行]
最頻脚質: 先行（4回）
consistency = 4/5 = 0.8  # 80%の一貫性
```

**計算方法**:
```sql
WITH style_history AS (
  SELECT
    horse_id,
    race_date,
    running_style_encoded,
    ROW_NUMBER() OVER (PARTITION BY horse_id ORDER BY race_date DESC) as race_num
  FROM race_results
  WHERE running_style_encoded IS NOT NULL
),
style_last5 AS (
  SELECT
    horse_id,
    race_date,
    running_style_encoded,
    COUNT(*) OVER (PARTITION BY horse_id, running_style_encoded
                   ORDER BY race_date DESC
                   ROWS BETWEEN 4 PRECEDING AND CURRENT ROW) as style_count
  FROM style_history
  WHERE race_num <= 5
)
SELECT
  horse_id,
  race_date,
  MAX(style_count) / 5.0 as consistency  -- 最頻脚質の割合
FROM style_last5
GROUP BY horse_id, race_date
```

**期待効果**:
- 一貫性が高い馬（0.8以上）→ 信頼できる
- 一貫性が低い馬（0.4以下）→ 不安定

##### 2. `running_style_last_change`
**定義**: 前走から脚質が変わったかどうか（0/1フラグ）

```python
# 例
前走の脚質: 先行
今回の脚質: 差し
→ running_style_last_change = 1  # 変化あり
```

**計算方法**:
```sql
WITH style_with_lag AS (
  SELECT
    horse_id,
    race_date,
    running_style_encoded,
    LAG(running_style_encoded) OVER (PARTITION BY horse_id ORDER BY race_date) as prev_style
  FROM race_results
)
SELECT
  horse_id,
  race_date,
  CASE
    WHEN prev_style IS NULL THEN 0
    WHEN running_style_encoded = prev_style THEN 0
    ELSE 1
  END as style_last_change
FROM style_with_lag
```

**期待効果**:
- 変化なし（0）→ 安定している
- 変化あり（1）→ 戦略変更？調子の変化？

---

### Phase 3: レース展開の予測（高度）⚠️

**目的**: 「このレースはどんな展開になるか」を予測

#### 追加する特徴量（2つ）

##### 1. `expected_pace`
**定義**: レース全体のペース予測（ハイ/平均/スロー）

**計算方法**:
```python
# 出走馬の脚質分布から予測
逃げ馬の頭数 + 先行馬の頭数 が多い → ハイペース（速い）
差し・追込馬の頭数 が多い → スローペース（遅い）
```

**問題点**:
- レース前に出走馬全員の脚質が必要
- データ構造の変更が必要（レース単位の特徴量）

##### 2. `expected_4corner_position`
**定義**: 4コーナー通過順位の期待値

**計算方法**:
```sql
-- 過去の同条件レースでの4コーナー通過順位平均
WITH position_history AS (
  SELECT
    running_style_encoded,
    surface,
    distance_band,
    AVG(position_4corner) as avg_position
  FROM race_results
  GROUP BY running_style_encoded, surface, distance_band
)
```

**問題点**:
- `position_4corner`のデータがない可能性
- あっても精度向上効果は限定的

**推奨**: **Phase 3は保留**（Phase 1-2で十分）

---

## 🚀 実装ロードマップ

### Step 1: Phase 1の実装（推奨: 今すぐ）

#### 1.1 BigQueryでの集計
```sql
-- running_style_combined_win_rateを階層的に計算
CREATE OR REPLACE TABLE `project.dataset.running_style_stats` AS

WITH combined_stats AS (
  SELECT
    running_style_encoded,
    surface,
    FLOOR(distance / 200) * 200 as distance_band,
    racecourse,
    COUNT(*) as sample_count_combined,
    SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END) as wins,
    SAFE_DIVIDE(SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END), COUNT(*)) as win_rate
  FROM `project.dataset.race_results`
  WHERE running_style_encoded IS NOT NULL
    AND race_date < CURRENT_DATE()  -- 未来のデータを使わない
  GROUP BY running_style_encoded, surface, distance_band, racecourse
),

surface_distance_stats AS (
  SELECT
    running_style_encoded,
    surface,
    FLOOR(distance / 200) * 200 as distance_band,
    COUNT(*) as sample_count_surface_distance,
    SAFE_DIVIDE(SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END), COUNT(*)) as win_rate
  FROM `project.dataset.race_results`
  WHERE running_style_encoded IS NOT NULL
    AND race_date < CURRENT_DATE()
  GROUP BY running_style_encoded, surface, distance_band
),

surface_stats AS (
  SELECT
    running_style_encoded,
    surface,
    COUNT(*) as sample_count_surface,
    SAFE_DIVIDE(SUM(CASE WHEN finish_position = 1 THEN 1 ELSE 0 END), COUNT(*)) as win_rate
  FROM `project.dataset.race_results`
  WHERE running_style_encoded IS NOT NULL
    AND race_date < CURRENT_DATE()
  GROUP BY running_style_encoded, surface
)

SELECT
  c.running_style_encoded,
  c.surface,
  c.distance_band,
  c.racecourse,

  -- 階層的フォールバック
  CASE
    WHEN c.sample_count_combined >= 10 THEN c.win_rate
    WHEN sd.sample_count_surface_distance >= 30 THEN sd.win_rate
    WHEN s.sample_count_surface >= 50 THEN s.win_rate
    ELSE 0.1  -- 全体平均（デフォルト）
  END as running_style_combined_win_rate,

  c.sample_count_combined,
  sd.sample_count_surface_distance,
  s.sample_count_surface

FROM combined_stats c
LEFT JOIN surface_distance_stats sd
  ON c.running_style_encoded = sd.running_style_encoded
  AND c.surface = sd.surface
  AND c.distance_band = sd.distance_band
LEFT JOIN surface_stats s
  ON c.running_style_encoded = s.running_style_encoded
  AND c.surface = s.surface
```

#### 1.2 既存特徴量テーブルとのJOIN
```sql
-- 既存のfeature_engineering.pyまたはBigQueryクエリに追加
LEFT JOIN `project.dataset.running_style_stats` rs
  ON r.running_style_encoded = rs.running_style_encoded
  AND r.surface = rs.surface
  AND FLOOR(r.distance / 200) * 200 = rs.distance_band
  AND r.racecourse = rs.racecourse
```

#### 1.3 Pythonでの実装
```python
# prepare_features()に追加
def prepare_features(df):
    # ... 既存のコード ...

    # 脚質統計をマージ（事前に計算済みのCSVまたはBigQueryから取得）
    style_stats = pd.read_csv('data/running_style_stats.csv')

    df = df.merge(
        style_stats,
        on=['running_style_encoded', 'surface', 'distance_band', 'racecourse'],
        how='left'
    )

    # 欠損値は全体平均で埋める
    df['running_style_combined_win_rate'] = df['running_style_combined_win_rate'].fillna(0.1)

    # 特徴量リストに追加
    features = [
        # ... 既存の特徴量 ...
        'running_style_combined_win_rate'  # ← NEW
    ]

    return X, features
```

### Step 2: モデルの再訓練

```bash
# 1. データを再生成
python prepare_features_with_running_style.py

# 2. モデルを再訓練
python train_model_clean.py

# 3. 評価
python evaluate_final_strategy.py
```

### Step 3: 効果の検証

期待される結果:
- Validation回収率: 169.7% → **172-175%**
- Validation的中率: 9.0% → **9.5-10.0%**
- 特徴量重要度: `running_style_combined_win_rate`がTop 5に入る

### Step 4: Phase 2の実装（Phase 1の効果確認後）

Phase 1で効果があれば、Phase 2の安定性指標を追加。

---

## 📊 期待効果の見積もり

### Phase 1のみ（条件別脚質適性）

| 指標 | 現在 | 予測 | 根拠 |
|------|------|------|------|
| Validation回収率 | 169.7% | **172-175%** | 脚質のSHAP 0.8が0.9-1.0に向上 |
| Validation的中率 | 9.0% | **9.5-10.0%** | 条件に合わない馬を除外 |
| 購入数 | 501 | 480-520 | 大きな変化なし |

### Phase 1 + Phase 2（+ 安定性指標）

| 指標 | 現在 | 予測 | 根拠 |
|------|------|------|------|
| Validation回収率 | 169.7% | **175-180%** | 不安定な馬を除外 |
| Validation的中率 | 9.0% | **10.0-11.0%** | 安定した馬を選別 |

---

## ⚠️ リスクと対策

### リスク1: 過学習
**内容**: 条件を細かくしすぎて過学習

**兆候**:
- Train回収率は上がるがValidation回収率が下がる
- 特定の条件でのみ効く

**対策**:
- 階層的フォールバックで粒度を調整
- サンプル数の閾値を守る（combined≥10, surface_distance≥30など）

### リスク2: データリーケージ
**内容**: 未来のデータを使ってしまう

**対策**:
```sql
-- 集計時に必ず過去のデータのみ使う
WHERE race_date < CURRENT_DATE()

-- Window関数でも
ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
```

### リスク3: 計算コストの増加
**内容**: 脚質統計の計算に時間がかかる

**対策**:
- 事前に集計してテーブル化
- 定期的に更新（週1回など）

---

## 🎯 推奨アクション（優先順位）

### 今すぐ実施すべき

1. **Phase 1の実装**
   - `running_style_combined_win_rate`を追加
   - 階層的フォールバック付き

2. **モデル再訓練**
   - 既存の30特徴量 + 1特徴量 = 31特徴量

3. **効果検証**
   - Validation回収率が172%以上なら成功

### 効果確認後

4. **Phase 2の実装**
   - `running_style_consistency`を追加
   - `running_style_last_change`を追加

5. **最終評価**
   - 回収率175-180%を目指す

### 保留

6. **Phase 3は保留**
   - 実装コストが高い
   - Phase 1-2で十分な効果が期待できる

---

## 💬 相談ポイント

実装を進める前に以下を確認したいです：

### 質問1: データ構造
- BigQueryのテーブル名・カラム名は何ですか？
- `running_style_encoded`は0-3の値ですか？（逃げ=0, 先行=1, 差し=2, 追込=3？）

### 質問2: 実装環境
- BigQueryを使っていますか？それともローカルのCSV？
- データの更新頻度は？（リアルタイム or バッチ？）

### 質問3: 優先順位
- Phase 1だけで十分ですか？それともPhase 2も一緒に実装しますか？
- すぐに実装を始めますか？それとも設計を詰めますか？

---

**次のステップ**: ご質問への回答をいただければ、具体的な実装スクリプトを作成します。

