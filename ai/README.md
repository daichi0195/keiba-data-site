# 競馬予測AIシステム

## 📁 ディレクトリ構造

```
ai/
├── scripts/           # Pythonスクリプト
│   ├── prediction/    # 予測スクリプト
│   ├── training/      # モデル訓練・特徴量計算
│   └── evaluation/    # バックテスト・評価
├── models/            # 訓練済みモデル
├── data/              # データファイル
│   ├── predictions/   # 予測結果
│   ├── evaluations/   # 評価結果
│   └── visualizations/# グラフ・可視化
├── docs/              # ドキュメント
│   ├── reports/       # 分析レポート
│   └── archive/       # 古いドキュメント
└── results/           # 実行結果（一時的）
```

## 🎯 主要スクリプト

### 予測
- `scripts/prediction/predict_arima_2025_v2.py` - 有馬記念予測（騎手ID版）

### 訓練
- `scripts/training/train_with_improved_time_index.py` - モデル訓練
- `scripts/training/calculate_time_index_improved.py` - タイム指数計算

### 評価
- `scripts/evaluation/backtest_improved_model.py` - 通常バックテスト
- `scripts/evaluation/backtest_high_confidence.py` - 高信頼度バックテスト（閾値0.50）
- `scripts/evaluation/backtest_expected_value.py` - 期待値バックテスト

## 📊 現在のモデル性能

### 改善版モデル (`model_improved_time_index.pkl`)

**データソース**: `umadata.keiba_data.all_features_complete_improved`
**特徴量数**: 39個（改善版タイム指数含む）
**訓練期間**: 2020年1月～2024年10月
**テスト期間**: 2024年11月～2025年11月

### 性能指標

| 戦略 | 閾値 | 回収率 | 的中率 | ベット数 | 損益 |
|------|------|--------|--------|---------|------|
| 全レース | 0.00 | 78.01% | 26.50% | 3,358 | -73,840円 |
| **高信頼度** | **0.50** | **101.71%** ✅ | **51.22%** | **41** | **+70円** |

### AUC
- **0.7663** (テストデータ)

## 🚀 使い方

### 1. 有馬記念を予測

```bash
cd scripts/prediction
python3 predict_arima_2025_v2.py
```

結果: `data/predictions/arima_2025_predictions_v2.csv`

### 2. モデルを再訓練

```bash
cd scripts/training
python3 train_with_improved_time_index.py
```

出力: `models/model_improved_time_index.pkl`

### 3. バックテストを実行

```bash
cd scripts/evaluation
python3 backtest_high_confidence.py
```

結果: `data/evaluations/backtest_high_confidence.csv`

## 📖 重要ドキュメント

- **AI_WORKFLOW.md** - AI開発ワークフロー（必読）
- **DATA_LEAKAGE_CHECKLIST.md** - データリーケージ防止チェックリスト

## 🎯 推奨戦略

**高信頼度戦略（閾値0.50）**
- 予測確率50%以上のレースのみベット
- 的中率: 51.22%
- 回収率: 101.71% ✅
- 年間約41レース（月3.4レース）

## 📝 バージョン履歴

### v2.0 (2025-12-29)
- ディレクトリ構造を整理
- 196個の不要ファイルを削除
- 騎手ID版予測スクリプトを追加

### v1.0 (2025-12-27)
- 改善版タイム指数モデルを実装
- Fallback階層の順番変更
- 信頼度調整（Level 3+を0.7倍）

## 🔗 関連リンク

- BigQueryデータセット: `umadata.keiba_data`
- モデル: LightGBM (二値分類)
- 特徴量: 39個（タイム指数、騎手成績、脚質など）
