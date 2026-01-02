#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
パターンB: 騎手勝率のみを使用したモデル訓練

比較実験:
- パターンA（現行）: jockey_place_rate_surface_distance（複勝率）
- パターンB（本スクリプト）: jockey_win_rate_surface_distance（勝率）
- パターンC: 両方使用
"""
from google.cloud import bigquery
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.metrics import roc_auc_score
import pickle

PROJECT_ID = "umadata"
DATASET_ID = "keiba_data"

def load_data_from_bigquery():
    """BigQueryからデータを読み込む"""
    client = bigquery.Client(project=PROJECT_ID)

    print("=" * 100)
    print("📊 BigQueryからデータを読み込み中（パターンB: 勝率のみ）...")
    print("=" * 100)

    query = """
    SELECT
        race_id,
        race_date,
        racecourse,
        surface,
        distance,
        going,
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

        -- 騎手情報（勝率を使用）
        jockey_id,
        is_jockey_change,
        jockey_win_rate_surface_distance,  -- ← 変更点：勝率を使用
        jockey_rides_surface_distance,

        -- 脚質情報
        running_style_last1,
        running_style_mode,
        running_style_mode_win_rate,
        running_style_last1_win_rate,

        -- 過去成績
        finish_pos_best_last5,

        -- 改善版タイム指数（past 1-3）
        time_index_zscore_last1_improved,
        time_index_zscore_last2_improved,
        time_index_zscore_last3_improved,

        -- 改善版タイム指数集約
        time_index_zscore_mean_3_improved,
        time_index_zscore_best_3_improved,
        time_index_zscore_worst_3_improved,
        time_index_zscore_trend_3_improved,

        -- 改善版ラスト3F指数
        last3f_index_zscore_last1_improved,
        last3f_index_zscore_last2_improved,

        -- 休養関連
        is_after_long_rest,
        is_consecutive_race,
        rest_period_category

    FROM `umadata.keiba_data.all_features_complete_improved`
    WHERE race_date >= '2021-01-01'
        AND finish_position IS NOT NULL
    ORDER BY race_date
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
    print("🔧 特徴量エンジニアリング（パターンB: 勝率）")
    print("=" * 100)

    # カテゴリカル変数のエンコーディング
    racecourse_map = {'札幌': 1, '函館': 2, '福島': 3, '新潟': 4, '東京': 5, '中山': 6, '中京': 7, '京都': 8, '阪神': 9, '小倉': 10}
    surface_map = {'芝': 0, 'ダート': 1}
    going_map = {'良': 0, 'やや重': 1, '重': 2, '不良': 3}
    race_class_map = {'新馬': 0, '未勝利': 1, '１勝クラス': 2, '２勝クラス': 3, '３勝クラス': 4, 'オープン': 5}

    df['racecourse_encoded'] = df['racecourse'].map(racecourse_map).fillna(0)
    df['surface_encoded'] = df['surface'].map(surface_map).fillna(0)
    df['going_encoded'] = df['going'].map(going_map).fillna(0)
    df['race_class_encoded'] = df['race_class'].map(race_class_map).fillna(5)

    # 特徴量リスト（32個 - is_debutを削除、勝率を使用）
    features = [
        # 脚質（4個）
        'running_style_last1', 'running_style_mode',
        'running_style_mode_win_rate', 'running_style_last1_win_rate',

        # 騎手（3個）← 変更点：win_rateを使用
        'jockey_rides_surface_distance',
        'jockey_win_rate_surface_distance',  # ← 勝率
        'is_jockey_change',

        # 馬の成績（1個）
        'finish_pos_best_last5',

        # レース条件（4個）
        'racecourse_encoded', 'surface_encoded', 'going_encoded', 'race_class_encoded',

        # 馬の基本情報（8個）
        'distance', 'sex', 'age', 'horse_weight', 'weight_change',
        'bracket_number', 'horse_number', 'days_since_last_race',

        # 改善版タイム指数（past 1-3、3個）
        'time_index_zscore_last1_improved',
        'time_index_zscore_last2_improved',
        'time_index_zscore_last3_improved',

        # 改善版タイム指数集約（4個）
        'time_index_zscore_mean_3_improved',
        'time_index_zscore_best_3_improved',
        'time_index_zscore_worst_3_improved',
        'time_index_zscore_trend_3_improved',

        # 改善版ラスト3F指数（2個）
        'last3f_index_zscore_last1_improved',
        'last3f_index_zscore_last2_improved',

        # 休養関連（3個 - is_debutとis_after_long_restを削除）
        'is_consecutive_race', 'rest_period_category'
    ]

    print(f"\n✅ 使用する特徴量: {len(features)}個")
    print(f"\n【変更点】")
    print(f"  - 騎手統計: jockey_win_rate_surface_distance（勝率）を使用")
    print(f"  - 削除: is_debut, is_after_long_rest（重要度0%）")

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
    print("🚂 モデル訓練（パターンB: 勝率のみ）")
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
    print("📊 モデル評価（パターンB: 勝率）")
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

    # テストデータで予測結果を保存
    test_df['predicted_prob'] = y_pred_test
    test_df['predicted_rank'] = test_df.groupby('race_id')['predicted_prob'].rank(ascending=False, method='first')

    # 適中率・回収率評価
    evaluate_betting_performance(test_df)

    # モデル保存
    model.save_model('../../models/model_pattern_b_win_rate.txt')
    with open('../../models/model_pattern_b_win_rate.pkl', 'wb') as f:
        pickle.dump(model, f)

    print(f"\n💾 モデル保存完了")
    print(f"   - models/model_pattern_b_win_rate.txt")
    print(f"   - models/model_pattern_b_win_rate.pkl")

    # 特徴量重要度をCSV保存
    feature_importance.to_csv('../../data/evaluations/feature_importance_pattern_b.csv', index=False, encoding='utf-8-sig')
    print(f"   - data/evaluations/feature_importance_pattern_b.csv")

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

    print(f"\n【結果】")
    print(f"  総レース数: {total_races:,}レース")
    print(f"  的中数: {wins}レース")
    print(f"  的中率: {win_rate:.2f}%")
    print(f"  総投資額: {total_bet:,}円")
    print(f"  総払戻額: {total_return:,.0f}円")
    print(f"  回収率: {recovery_rate:.2f}%")
    print(f"  損益: {total_return - total_bet:,.0f}円")

    # 閾値0.50での評価
    print(f"\n【高信頼度戦略（閾値0.50）】")
    high_conf = predicted_winners[predicted_winners['predicted_prob'] >= 0.50]
    if len(high_conf) > 0:
        hc_wins = (high_conf['finish_position'] == 1).sum()
        hc_win_rate = hc_wins / len(high_conf) * 100
        hc_total_bet = len(high_conf) * bet_amount
        hc_winning = high_conf[high_conf['finish_position'] == 1]
        hc_return = (hc_winning['odds'] * bet_amount).sum()
        hc_recovery = (hc_return / hc_total_bet) * 100

        print(f"  ベット数: {len(high_conf)}レース")
        print(f"  的中率: {hc_win_rate:.2f}%")
        print(f"  回収率: {hc_recovery:.2f}%")
        print(f"  損益: {hc_return - hc_total_bet:,.0f}円")
    else:
        print(f"  該当レースなし")

def main():
    print("\n" + "=" * 100)
    print("🐎 パターンB: 騎手勝率を使用したモデル訓練")
    print("=" * 100)

    # データ読み込み
    df = load_data_from_bigquery()

    # モデル訓練・評価
    model, test_df, feature_importance, auc_test = train_and_evaluate(df)

    print("\n" + "=" * 100)
    print("✅ パターンB訓練完了")
    print(f"   AUC: {auc_test:.4f}")
    print("=" * 100)

if __name__ == '__main__':
    main()
