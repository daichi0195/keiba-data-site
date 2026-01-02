# 競馬レース 1着確率予測モデル

## 概要

このプロジェクトは、過去の競馬レースデータを用いて、各レースにおける各出走馬の**1着になる確率**を推定するモデルです。

### 主な特徴

- **モデル**: LightGBM ランキング学習（LambdaRank）
- **出力**: 各レース・各馬の1着確率（レース内で合計が1になる）
- **評価指標**: LogLoss（主）、Top1 Accuracy、Top3 Hit Rate
- **学習期間**: 2023年1月1日 〜 2025年8月31日
- **テスト期間**: 2025年9月1日 〜 2025年10月31日

---

## 📁 ディレクトリ構成

```
ai/
├── README.md               # このファイル
├── 指示書.md               # 要件定義書
├── explore_bigquery.py     # BigQuery探索スクリプト
├── prepare_data.py         # データ前処理（BigQuery → CSV）
├── feature_engineering.py  # 特徴量エンジニアリング（全データ用）
├── feature_engineering_sample.py  # 特徴量エンジニアリング（サンプル用）
├── train.py                # モデル学習スクリプト
├── predict.py              # 推論スクリプト
├── data/                   # データディレクトリ
│   ├── train_raw.csv       # 生の学習データ
│   ├── test_raw.csv        # 生のテストデータ
│   ├── train_features.csv  # 特徴量付き学習データ
│   └── test_features.csv   # 特徴量付きテストデータ
├── models/                 # モデル保存先
│   └── model.txt           # 学習済みモデル
└── predictions/            # 予測結果保存先
    └── predictions.csv     # 予測結果（race_id, horse_id, pred_win_prob）
```

---

## 🚀 クイックスタート

### 1. 環境構築

```bash
# 仮想環境を有効化
source venv/bin/activate

# 必要なライブラリをインストール（初回のみ）
pip install pandas numpy lightgbm scikit-learn google-cloud-bigquery db-dtypes

# macOSの場合、OpenMPが必要
brew install libomp
```

### 2. データ準備

```bash
# BigQueryからデータを取得
python ai/prepare_data.py

# 特徴量を作成（サンプル版で動作確認）
python ai/feature_engineering_sample.py

# 全データで特徴量を作成（時間がかかります）
python ai/feature_engineering.py
```

### 3. モデル学習

```bash
# サンプルデータで学習（動作確認）
export DYLD_LIBRARY_PATH="/opt/homebrew/opt/libomp/lib:$DYLD_LIBRARY_PATH"
python ai/train.py

# 全データで学習（train.pyのパスを変更してください）
# train_path='ai/data/train_features.csv'
# test_path='ai/data/test_features.csv'
```

### 4. 予測

```bash
# サンプルデータで予測
export DYLD_LIBRARY_PATH="/opt/homebrew/opt/libomp/lib:$DYLD_LIBRARY_PATH"
python ai/predict.py

# カスタムパスで実行
python ai/predict.py <model_path> <test_data_path> <output_path>
```

---

## 📊 特徴量

### タイム偏差値系（中核特徴量）

各馬の過去5走のタイムを、競馬場・芝ダ・距離・馬場状態ごとに標準化したスコア。

**母集団定義のフォールバック階層**:
1. 競馬場 × 芝ダ × 距離 ±200m × 馬場状態
2. 芝ダ × 距離 ±200m × 馬場状態
3. 芝ダ × 距離 ±400m × 馬場状態
4. 芝ダ × 距離 ±600m × 馬場状態

母集団サイズが200件未満の場合、次の階層へフォールバック。

**集約特徴量**:
- `time_dev_last1` 〜 `time_dev_last5`: 直近5走のタイム偏差値
- `time_dev_mean_5`: 過去5走の平均
- `time_dev_max_5`: 過去5走の最大値
- `time_dev_trend_5`: トレンド（last1 - last5）

### 騎手特徴量

- `jockey_place_rate_surface_distance`: 騎手 × 芝ダ × 距離帯（±200m）での複勝率（3着内率）
- `jockey_rides_surface_distance`: 上記条件での騎乗数
- `is_jockey_change`: 騎手変更フラグ（前走と騎手が異なる場合1）

### その他補助特徴量

- `finish_pos_mean_last5`: 過去5走の平均着順
- `finish_pos_best_last5`: 過去5走のベスト着順
- `days_since_last_race`: 前走からの日数

### カテゴリカル特徴量

- `racecourse_encoded`: 競馬場（ラベルエンコーディング）
- `surface_encoded`: 芝/ダート
- `going_encoded`: 馬場状態
- `race_class_encoded`: クラス

### レース・馬情報

- `distance`: 距離
- `sex`: 性別
- `age`: 年齢
- `horse_weight`: 馬体重
- `weight_change`: 馬体重変化
- `bracket_number`: 枠番
- `horse_number`: 馬番

---

## 📈 評価指標

### 主評価指標

**LogLoss（Cross Entropy）**
レース内でSoftmax変換した確率を用いて計算。値が小さいほど良い。

### 参考指標

- **Top1 Accuracy（1着的中率）**: 各レースで最も確率が高い馬が実際に1着だった割合
- **Top3 Hit Rate（3着内的中率）**: 上位3頭に実際の勝ち馬が含まれていた割合

---

## 🔧 カスタマイズ

### ハイパーパラメータ調整

`train.py` の `params` 辞書を編集してください。

```python
params = {
    'objective': 'lambdarank',
    'metric': 'ndcg',
    'num_leaves': 31,
    'learning_rate': 0.05,
    'feature_fraction': 0.9,
    'bagging_fraction': 0.8,
    'bagging_freq': 5,
    # ... その他のパラメータ
}
```

### 特徴量の追加

1. `feature_engineering.py` で新しい特徴量を計算
2. `train.py` と `predict.py` の `feature_cols` リストに追加

---

## 🚨 注意事項

### 時系列データリーク防止

- テスト期間以降のデータを学習に使用しない
- 同一レース内の情報を他馬の未来情報として使わない
- 過去走特徴量の計算時、必ず `race_date < 対象レース日` の条件を守る

### オッズ情報は使用しない

本モデルは**勝率推定専用**です。期待値計算・買い目生成は別工程として実装してください。

---

## 📝 出力形式

予測結果は以下のCSV形式で出力されます：

```csv
race_id,horse_id,pred_win_prob
202509060101,2020101234,0.1523
202509060101,2021102345,0.0987
202509060101,2022103456,0.0754
...
```

- `race_id`: レースID
- `horse_id`: 馬ID
- `pred_win_prob`: 1着確率（同一レース内で合計が1.0）

---

## 📜 ライセンス

このプロジェクトは KEIBA DATA LAB の一部です。

---

## 🙏 謝辞

このモデルは要件定義書（`指示書.md`）に従って実装されました。

---

**開発者向けメモ**:

- サンプルデータ（1万行）での学習時間: 約30秒
- 全データ（26万行）での特徴量エンジニアリング: 約20-30分（推定）
- 全データでの学習時間: 約2-3分（推定）
