# データリーケージ防止チェックリスト

## ⚠️ 絶対に守るべきルール

**新しい特徴量を追加する前に、必ずこのチェックリストを確認すること**

## チェック項目

### 1. 使用する元データの確認

- [ ] 使用するカラムは**過去のレース情報**か？
- [ ] 使用するカラムは**予測対象レースより前**のデータか？
- [ ] **予測対象レース自身の情報**を使っていないか？

### 2. 禁止されているカラム

以下のカラムは**絶対に直接使用禁止**（予測対象レースの情報のため）：

❌ `running_style_encoded`（現在レースのcorner_positionsから計算）
❌ `corner_positions`（現在レースの通過順位）
❌ `finish_position`（結果）
❌ `time`（現在レースのタイム）
❌ `last_3f_time`（現在レースの上がり）

### 3. 許可されている使い方

✅ 過去レースの情報:
- `running_style_last1`, `running_style_last2`, ..., `running_style_mode`
- `time_last1`, `last_3f_time_last1` など

✅ 統計情報:
- **必ず予測対象レースより前のデータのみで計算**
- 時点ごとの統計（Point-in-time statistics）

### 4. SQL特徴量作成時の必須チェック

```sql
-- ❌ ダメな例
SELECT
  bf.running_style_encoded  -- 現在レースの脚質を使用
FROM base_features bf
JOIN stats s ON s.running_style = bf.running_style_encoded

-- ✅ 正しい例
SELECT
  bf.running_style_last1  -- 前走の脚質を使用
FROM base_features bf
JOIN stats s ON s.running_style = bf.running_style_last1
```

```sql
-- ❌ ダメな例（全期間の統計）
SELECT AVG(win_rate) FROM all_races
GROUP BY condition

-- ✅ 正しい例（時点ごとの統計）
SELECT AVG(win_rate) FROM all_races
WHERE race_date < target_race_date  -- 予測対象より前
GROUP BY condition
```

### 5. 実装後の検証

- [ ] サンプルデータで、予測に使用した値が過去情報のみか確認
- [ ] 未来情報が含まれていないことを目視確認
- [ ] `running_style_encoded`が特徴量リストに含まれていないか確認

## 過去のミス事例

### ミス1: running_style_encodedの直接使用
```python
# ❌ 間違い
features = ['running_style_encoded', ...]  # 現在レースの脚質

# ✅ 修正後
features = ['running_style_last1', 'running_style_mode', ...]  # 過去レースの脚質
```

### ミス2: running_style_combined_win_rateの計算
```sql
-- ❌ 間違い
LEFT JOIN stats rs1
  ON rs1.running_style_encoded = bf.running_style_encoded  -- 現在レースの脚質

-- ✅ 修正後
LEFT JOIN stats rs1
  ON rs1.running_style_encoded = bf.running_style_last1  -- 前走の脚質
```

## 新特徴量追加時の手順

1. **このチェックリストを開く**
2. **各項目を確認しながら実装**
3. **実装後に再度チェック**
4. **サンプルデータで検証**
5. **問題なければコミット**

## データリーケージが疑われる場合

以下の兆候がある場合は、データリーケージを疑う：

- 🚨 Validation/Test精度が異常に高い
- 🚨 特定の特徴量の重要度が異常に高い
- 🚨 過学習の兆候（Train精度 >> Validation精度）
- 🚨 実運用で全く性能が出ない
