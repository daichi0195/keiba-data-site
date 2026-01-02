#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
パターンC v3: 騎手（勝率+複勝率）+ 調教師（勝率+複勝率）【データリーケージ修正版】

変更点:
- v2の特徴量（28個）に加えて:
  1. trainer_win_rate_surface_distance（調教師勝率）
  2. trainer_place_rate_surface_distance（調教師複勝率）
  3. finish_position_last1（前走の着順）
  4. finish_pos_avg_last5（直近5走の平均着順）

特徴量数: 28個 → 31個

注意:
- running_style勝率統計は削除（データリーケージのため）
- finish_pos_best_last5を finish_position_last1 + finish_pos_avg_last5 に分割
- all_features_complete_no_leakage テーブルを使用
"""
from google.cloud import bigquery
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.metrics import roc_auc_score
import pickle
import os

PROJECT_ID = "umadata"
DATASET_ID = "keiba_data"

def load_data_from_bigquery():
    """BigQueryからデータを読み込む"""
    client = bigquery.Client(project=PROJECT_ID)

    print("=" * 100)
    print("📊 BigQueryからデータを読み込み中（パターンC v3: データリーケージ修正版）...")
    print("=" * 100)

    query = """
    SELECT
        race_id,
        current_race_date as race_date,
        racecourse,
        surface,
        distance,
        race_class,
        horse_id,
        horse_name,
        finish_position,
        popularity,
        odds,

        -- 基本情報
        horse_number,
        bracket_number,
        sex,
        age,
        horse_weight,
        weight_change,
        days_since_last_race,

        -- 騎手情報（複勝率 + 勝率の両方を使用）
        jockey_id,
        is_jockey_change,
        jockey_place_rate_surface_distance,
        jockey_win_rate_surface_distance,
        detailed_rides as jockey_rides_surface_distance,

        -- 調教師情報
        trainer_id,
        trainer_place_rate_surface_distance,
        trainer_win_rate_surface_distance,

        -- 脚質情報
        running_style_last1,
        running_style_mode,

        -- 過去成績（着順）
        finish_position_last1,
        finish_position_last2,
        finish_position_last3,
        finish_position_last4,
        finish_position_last5,

        -- タイム指数（past 1-3）
        time_index_zscore_last1,
        time_index_zscore_last2,
        time_index_zscore_last3,

        -- タイム指数集約（改善版）
        time_index_zscore_mean_3_improved,
        time_index_zscore_best_3_improved,
        time_index_zscore_worst_3_improved,
        time_index_zscore_trend_3_improved,

        -- ラスト3F指数（改善版）
        last3f_index_zscore_last1_improved,
        last3f_index_zscore_last2_improved,

        -- 休養関連
        rest_period_category

    FROM `umadata.keiba_data.all_features_complete_no_leakage`
    WHERE current_race_date >= '2021-01-01'
        AND finish_position IS NOT NULL
    ORDER BY current_race_date
    """

    df = client.query(query).to_dataframe()

    # race_dateを日付型に変換
    df['race_date'] = pd.to_datetime(df['race_date'])

    print(f"\n✅ データ読み込み完了")
    print(f"   総レコード数: {len(df):,}行")
    print(f"   期間: {df['race_date'].min()} ~ {df['race_date'].max()}")
    print(f"   総レース数: {df['race_id'].nunique():,}レース")

    return df

def prepare_features(df):
    """特徴量を準備"""
    print("\n" + "=" * 100)
    print("🔧 特徴量エンジニアリング（パターンC v3: データリーケージ修正版）")
    print("=" * 100)

    # カテゴリカル変数のエンコーディング
    racecourse_map = {'札幌': 1, '函館': 2, '福島': 3, '新潟': 4, '東京': 5, '中山': 6, '中京': 7, '京都': 8, '阪神': 9, '小倉': 10}
    surface_map = {'芝': 0, 'ダート': 1}
    race_class_map = {'新馬': 0, '未勝利': 1, '１勝クラス': 2, '２勝クラス': 3, '３勝クラス': 4, 'オープン': 5}

    df['racecourse_encoded'] = df['racecourse'].map(racecourse_map).fillna(0)
    df['surface_encoded'] = df['surface'].map(surface_map).fillna(0)
    df['race_class_encoded'] = df['race_class'].map(race_class_map).fillna(5)

    # 直近5走の平均着順を計算
    df['finish_pos_avg_last5'] = df[['finish_position_last1', 'finish_position_last2',
                                       'finish_position_last3', 'finish_position_last4',
                                       'finish_position_last5']].mean(axis=1)

    # 特徴量リスト（31個）
    features = [
        # 脚質（2個）- 勝率統計は削除
        'running_style_last1', 'running_style_mode',

        # 騎手（4個）
        'jockey_rides_surface_distance',
        'jockey_place_rate_surface_distance',
        'jockey_win_rate_surface_distance',
        'is_jockey_change',

        # 調教師（2個）
        'trainer_place_rate_surface_distance',
        'trainer_win_rate_surface_distance',

        # 馬の成績（2個）- ベスト着順から前走着順+平均着順に変更
        'finish_position_last1',
        'finish_pos_avg_last5',

        # レース条件（3個）
        'racecourse_encoded', 'surface_encoded', 'race_class_encoded',

        # 馬の基本情報（8個）
        'distance', 'sex', 'age', 'horse_weight', 'weight_change',
        'bracket_number', 'horse_number', 'days_since_last_race',

        # タイム指数（past 1-3、3個）
        'time_index_zscore_last1',
        'time_index_zscore_last2',
        'time_index_zscore_last3',

        # タイム指数集約（改善版、4個）
        'time_index_zscore_mean_3_improved',
        'time_index_zscore_best_3_improved',
        'time_index_zscore_worst_3_improved',
        'time_index_zscore_trend_3_improved',

        # ラスト3F指数（改善版、2個）
        'last3f_index_zscore_last1_improved',
        'last3f_index_zscore_last2_improved',

        # 休養関連（1個）
        'rest_period_category'
    ]

    print(f"\n✅ 使用する特徴量: {len(features)}個")
    print(f"\n【データリーケージ対策】")
    print(f"  - all_features_complete_no_leakage テーブルを使用")
    print(f"  - 騎手・調教師統計は各レース日付より前のデータのみで計算")
    print(f"  - 脚質勝率統計は削除（リーケージリスクのため）")

    # 欠損値処理
    print(f"\n【欠損値の状況】")
    for feat in features:
        null_count = df[feat].isnull().sum()
        null_pct = null_count / len(df) * 100
        if null_pct > 0:
            print(f"  {feat}: {null_count:,}個 ({null_pct:.1f}%)")

    # 欠損値を0で埋める
    X = df[features].fillna(0)

    # ターゲット変数（1着=1, それ以外=0）
    y = (df['finish_position'] == 1).astype(int)

    print(f"\n✅ 特徴量準備完了")
    print(f"   1着率: {y.mean()*100:.2f}%")

    return X, y, features

def train_and_evaluate(df):
    """モデルを訓練して評価"""
    print("\n" + "=" * 100)
    print("🚂 モデル訓練（パターンC v3: データリーケージ修正版）")
    print("=" * 100)

    # データ分割（2024-11-01でtrain/test）
    train_df = df[df['race_date'] < '2024-11-01'].copy()
    test_df = df[df['race_date'] >= '2024-11-01'].copy()

    print(f"\n【データ分割】")
    print(f"  訓練期間: {train_df['race_date'].min()} ~ {train_df['race_date'].max()}")
    print(f"  訓練データ: {len(train_df):,}行（{train_df['race_id'].nunique():,}レース）")
    print(f"  テスト期間: {test_df['race_date'].min()} ~ {test_df['race_date'].max()}")
    print(f"  テストデータ: {len(test_df):,}行（{test_df['race_id'].nunique():,}レース）")

    # 特徴量とターゲット準備
    X_train, y_train, features = prepare_features(train_df)
    X_test, y_test, _ = prepare_features(test_df)

    # LightGBMパラメータ
    params = {
        'objective': 'binary',
        'metric': 'binary_logloss',
        'boosting_type': 'gbdt',
        'num_leaves': 31,
        'learning_rate': 0.05,
        'feature_fraction': 0.9,
        'bagging_fraction': 0.8,
        'bagging_freq': 5,
        'verbose': -1,
        'seed': 42
    }

    # データセット作成
    train_data = lgb.Dataset(X_train, label=y_train)
    test_data = lgb.Dataset(X_test, label=y_test, reference=train_data)

    # 訓練
    print(f"\n🏃 訓練開始...")
    model = lgb.train(
        params,
        train_data,
        num_boost_round=1000,
        valid_sets=[train_data, test_data],
        valid_names=['train', 'test'],
        callbacks=[
            lgb.early_stopping(stopping_rounds=50),
            lgb.log_evaluation(period=100)
        ]
    )

    print(f"\n✅ 訓練完了（best iteration: {model.best_iteration}）")

    # 予測
    y_pred_train = model.predict(X_train, num_iteration=model.best_iteration)
    y_pred_test = model.predict(X_test, num_iteration=model.best_iteration)

    # AUC評価
    auc_train = roc_auc_score(y_train, y_pred_train)
    auc_test = roc_auc_score(y_test, y_pred_test)

    print("\n" + "=" * 100)
    print("📊 モデル評価（パターンC v3: データリーケージ修正版）")
    print("=" * 100)
    print(f"\n【AUC】")
    print(f"  訓練データ: {auc_train:.4f}")
    print(f"  テストデータ: {auc_test:.4f}")

    # 特徴量重要度
    feature_importance = pd.DataFrame({
        'feature': features,
        'importance': model.feature_importance(importance_type='gain')
    }).sort_values('importance', ascending=False)

    print(f"\n【特徴量重要度 Top20】")
    print(feature_importance.head(20).to_string(index=False))

    # 調教師統計の重要度を確認
    trainer_features = feature_importance[feature_importance['feature'].str.contains('trainer')]
    if len(trainer_features) > 0:
        print(f"\n【調教師統計の重要度】")
        for idx, row in trainer_features.iterrows():
            rank = feature_importance[feature_importance['feature'] == row['feature']].index[0] + 1
            pct = row['importance'] / feature_importance['importance'].sum() * 100
            print(f"  {rank:2d}位: {row['feature']:45s} {row['importance']:>10.0f} ({pct:5.2f}%)")

    # テストデータで予測結果を保存
    test_df['predicted_prob'] = y_pred_test
    test_df['predicted_rank'] = test_df.groupby('race_id')['predicted_prob'].rank(ascending=False, method='first')

    # 適中率・回収率評価
    evaluate_betting_performance(test_df)

    # モデル保存ディレクトリ作成
    os.makedirs('../../models', exist_ok=True)
    os.makedirs('../../data/evaluations', exist_ok=True)

    # モデル保存
    model.save_model('../../models/model_pattern_c_v3_no_leakage.txt')
    with open('../../models/model_pattern_c_v3_no_leakage.pkl', 'wb') as f:
        pickle.dump(model, f)

    print(f"\n💾 モデル保存完了")
    print(f"   - models/model_pattern_c_v3_no_leakage.txt")
    print(f"   - models/model_pattern_c_v3_no_leakage.pkl")

    # 特徴量重要度をCSV保存
    feature_importance.to_csv('../../data/evaluations/feature_importance_pattern_c_v3_no_leakage.csv', index=False, encoding='utf-8-sig')
    print(f"   - data/evaluations/feature_importance_pattern_c_v3_no_leakage.csv")

    return model, test_df, feature_importance, auc_test

def evaluate_betting_performance(test_df):
    """的中率・回収率を評価"""
    print("\n" + "=" * 100)
    print("🎯 馬券シミュレーション（予測1位の馬を単勝購入）")
    print("=" * 100)

    # 予測1位の馬のみ抽出
    predicted_winners = test_df[test_df['predicted_rank'] == 1].copy()

    total_races = len(predicted_winners)
    wins = (predicted_winners['finish_position'] == 1).sum()
    win_rate = wins / total_races * 100

    # 回収率計算（100円ベット）
    bet_amount = 100
    total_bet = total_races * bet_amount

    # 的中時の払い戻し
    winning_bets = predicted_winners[predicted_winners['finish_position'] == 1]
    total_return = (winning_bets['odds'] * bet_amount).sum()

    recovery_rate = (total_return / total_bet) * 100

    print(f"\n【全レース購入】")
    print(f"  総レース数: {total_races:,}レース")
    print(f"  的中数: {wins}レース")
    print(f"  的中率: {win_rate:.2f}%")
    print(f"  総投資額: {total_bet:,}円")
    print(f"  総払戻額: {total_return:,.0f}円")
    print(f"  回収率: {recovery_rate:.2f}%")
    print(f"  損益: {total_return - total_bet:,.0f}円")

    # 複数の閾値で評価
    print(f"\n【閾値別戦略分析】")
    print(f"{'='*100}")
    print(f"{'閾値':>6} {'ベット数':>10} {'的中数':>10} {'的中率':>10} {'投資額':>12} {'払戻額':>12} {'回収率':>10} {'損益':>12}")
    print(f"{'-'*100}")

    thresholds = [0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80]

    results = []
    for threshold in thresholds:
        filtered = predicted_winners[predicted_winners['predicted_prob'] >= threshold]
        if len(filtered) > 0:
            bet_count = len(filtered)
            hit_count = (filtered['finish_position'] == 1).sum()
            hit_rate = hit_count / bet_count * 100
            total_bet = bet_count * bet_amount
            winning = filtered[filtered['finish_position'] == 1]
            total_return = (winning['odds'] * bet_amount).sum()
            recovery = (total_return / total_bet) * 100
            profit = total_return - total_bet

            # 回収率100%以上の場合は強調
            marker = " ✅" if recovery >= 100 else ""

            print(f"{threshold:>6.2f} {bet_count:>10,} {hit_count:>10,} {hit_rate:>9.2f}% {total_bet:>11,}円 {total_return:>11,.0f}円 {recovery:>9.2f}% {profit:>11,.0f}円{marker}")

            results.append({
                'threshold': threshold,
                'bet_count': bet_count,
                'hit_rate': hit_rate,
                'recovery_rate': recovery,
                'profit': profit
            })
        else:
            print(f"{threshold:>6.2f} {'該当なし':>10}")

    # 最も回収率が高い閾値を表示
    if results:
        best_recovery = max(results, key=lambda x: x['recovery_rate'])
        best_profit = max(results, key=lambda x: x['profit'])

        print(f"\n{'='*100}")
        print(f"【最適閾値分析】")
        print(f"  最高回収率: 閾値{best_recovery['threshold']:.2f} → 回収率{best_recovery['recovery_rate']:.2f}% （{best_recovery['bet_count']}レース）")
        print(f"  最大利益:   閾値{best_profit['threshold']:.2f} → 損益{best_profit['profit']:+,.0f}円 （{best_profit['bet_count']}レース）")

        # 回収率100%以上の閾値を抽出
        profitable = [r for r in results if r['recovery_rate'] >= 100]
        if profitable:
            print(f"\n  【プラス収支の閾値】（{len(profitable)}個）")
            for r in profitable:
                print(f"    閾値{r['threshold']:.2f}: 回収率{r['recovery_rate']:.2f}% / {r['bet_count']}レース / 損益{r['profit']:+,.0f}円")
        else:
            print(f"\n  ⚠️ 回収率100%以上の閾値はありません")

def main():
    print("\n" + "=" * 100)
    print("🐎 パターンC v3: 騎手統計 + 調教師統計【データリーケージ修正版】")
    print("=" * 100)

    # データ読み込み
    df = load_data_from_bigquery()

    # モデル訓練・評価
    model, test_df, feature_importance, auc_test = train_and_evaluate(df)

    print("\n" + "=" * 100)
    print("✅ パターンC v3訓練完了（データリーケージ修正版）")
    print(f"   特徴量数: 31個")
    print(f"   追加: trainer統計、馬の成績を前走着順+平均着順に分割")
    print(f"   削除: running_style勝率統計（リーケージ防止）")
    print(f"   AUC: {auc_test:.4f}")
    print("=" * 100)

if __name__ == '__main__':
    main()
