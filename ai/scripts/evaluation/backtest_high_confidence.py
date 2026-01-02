#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
高信頼度戦略のバックテスト

予測確率の閾値を高めに設定して、確実性の高いレースのみにベット
"""
from google.cloud import bigquery
import pandas as pd
import numpy as np
import pickle
import matplotlib.pyplot as plt

PROJECT_ID = "umadata"
DATASET_ID = "keiba_data"

def load_test_data():
    """BigQueryからテストデータを取得"""
    client = bigquery.Client(project=PROJECT_ID)

    query = f"""
    SELECT *
    FROM `{PROJECT_ID}.{DATASET_ID}.all_features_complete_improved`
    WHERE race_date >= '2024-11-01'
      AND race_date < '2025-12-22'
    ORDER BY race_date, race_id
    """

    print("\n📥 テストデータを取得中...")
    df = client.query(query).to_dataframe()

    print(f"✅ {len(df):,}件のデータを取得")
    print(f"   期間: {df['race_date'].min()} ~ {df['race_date'].max()}")
    print(f"   レース数: {df['race_id'].nunique():,}")

    return df

def prepare_features(df):
    """特徴量を準備"""
    # カテゴリカル変数のエンコーディング
    racecourse_map = {'札幌': 1, '函館': 2, '福島': 3, '新潟': 4, '東京': 5, '中山': 6, '中京': 7, '京都': 8, '阪神': 9, '小倉': 10}
    surface_map = {'芝': 0, 'ダート': 1}
    going_map = {'良': 0, 'やや重': 1, '重': 2, '不良': 3}
    race_class_map = {'新馬': 0, '未勝利': 1, '１勝クラス': 2, '２勝クラス': 3, '３勝クラス': 4, 'オープン': 5}

    df = df.copy()
    df['racecourse_encoded'] = df['racecourse'].map(racecourse_map).fillna(0)
    df['surface_encoded'] = df['surface'].map(surface_map).fillna(0)
    df['going_encoded'] = df['going'].map(going_map).fillna(0)
    df['race_class_encoded'] = df['race_class'].map(race_class_map).fillna(5)

    # 特徴量リスト（改善版モデル用）
    feature_cols = [
        'running_style_last1', 'running_style_mode',
        'running_style_mode_win_rate', 'running_style_last1_win_rate',
        'jockey_rides_surface_distance',
        'jockey_place_rate_surface_distance',
        'is_jockey_change',
        'finish_pos_best_last5',
        'racecourse_encoded', 'surface_encoded', 'going_encoded', 'race_class_encoded',
        'distance', 'sex', 'age', 'horse_weight', 'weight_change',
        'bracket_number', 'horse_number', 'days_since_last_race',
        'time_index_zscore_last1_improved',
        'time_index_zscore_last2_improved',
        'time_index_zscore_last3_improved',
        'time_index_zscore_mean_3_improved',
        'time_index_zscore_best_3_improved',
        'time_index_zscore_worst_3_improved',
        'time_index_zscore_trend_3_improved',
        'last3f_index_zscore_last1_improved',
        'last3f_index_zscore_last2_improved',
        'is_after_long_rest', 'is_consecutive_race', 'is_debut', 'rest_period_category'
    ]

    X = df[feature_cols].fillna(0)
    return X, feature_cols

def simulate_betting(df, model, threshold=0.0):
    """
    回収率シミュレーション

    Args:
        df: データフレーム
        model: LightGBMモデル
        threshold: 予測確率の閾値（この値以上の場合のみベット）

    Returns:
        結果の辞書
    """
    # 予測
    X, features = prepare_features(df)
    df = df.copy()
    df['pred_prob'] = model.predict(X)

    # 各レースで予測確率が最も高い馬を選択
    race_bets = df.loc[df.groupby('race_id')['pred_prob'].idxmax()].copy()

    # 閾値でフィルタリング
    race_bets = race_bets[race_bets['pred_prob'] >= threshold]

    # 的中判定
    race_bets['hit'] = (race_bets['finish_position'] == 1).astype(int)

    # 払戻金計算（単勝）
    race_bets['return'] = race_bets['hit'] * race_bets['odds'] * 100

    # 集計
    total_bets = len(race_bets)
    total_cost = total_bets * 100
    total_return = race_bets['return'].sum()
    recovery_rate = (total_return / total_cost * 100) if total_cost > 0 else 0
    hit_rate = race_bets['hit'].mean() * 100 if total_bets > 0 else 0
    avg_odds = race_bets[race_bets['hit'] == 1]['odds'].mean() if race_bets['hit'].sum() > 0 else 0

    return {
        'threshold': threshold,
        'total_races': total_bets,
        'total_cost': total_cost,
        'total_return': total_return,
        'profit': total_return - total_cost,
        'recovery_rate': recovery_rate,
        'hit_rate': hit_rate,
        'hits': race_bets['hit'].sum(),
        'avg_odds': avg_odds,
        'race_bets': race_bets
    }

def analyze_by_confidence(df, model, thresholds):
    """信頼度（予測確率）別の回収率分析"""
    results = []

    for threshold in thresholds:
        result = simulate_betting(df, model, threshold)
        results.append(result)

    return pd.DataFrame(results)

def plot_high_confidence_analysis(threshold_df):
    """高信頼度分析の可視化"""
    # 日本語フォント設定
    plt.rcParams['font.sans-serif'] = ['Hiragino Sans', 'Yu Gothic', 'Meiryo', 'DejaVu Sans']
    plt.rcParams['axes.unicode_minus'] = False

    fig, axes = plt.subplots(2, 2, figsize=(15, 12))

    # 1. 閾値別の回収率
    ax1 = axes[0, 0]
    ax1.plot(threshold_df['threshold'], threshold_df['recovery_rate'], marker='o', linewidth=2, markersize=8, color='darkgreen')
    ax1.axhline(y=100, color='r', linestyle='--', linewidth=2, label='損益分岐点（100%）')
    ax1.fill_between(threshold_df['threshold'], 100, threshold_df['recovery_rate'],
                      where=(threshold_df['recovery_rate'] >= 100), alpha=0.3, color='green', label='プラス収支')
    ax1.set_xlabel('予測確率の閾値', fontsize=12)
    ax1.set_ylabel('回収率（%）', fontsize=12)
    ax1.set_title('予測確率閾値別の回収率', fontsize=14, fontweight='bold')
    ax1.grid(True, alpha=0.3)
    ax1.legend()

    # 2. 閾値別の的中率
    ax2 = axes[0, 1]
    ax2.plot(threshold_df['threshold'], threshold_df['hit_rate'], marker='s', color='blue', linewidth=2, markersize=8)
    ax2.set_xlabel('予測確率の閾値', fontsize=12)
    ax2.set_ylabel('的中率（%）', fontsize=12)
    ax2.set_title('予測確率閾値別の的中率', fontsize=14, fontweight='bold')
    ax2.grid(True, alpha=0.3)

    # 3. 閾値別の損益
    ax3 = axes[1, 0]
    colors = ['red' if p < 0 else 'green' for p in threshold_df['profit']]
    ax3.bar(threshold_df['threshold'], threshold_df['profit'], color=colors, alpha=0.7)
    ax3.axhline(y=0, color='black', linestyle='--', linewidth=2)
    ax3.set_xlabel('予測確率の閾値', fontsize=12)
    ax3.set_ylabel('損益（円）', fontsize=12)
    ax3.set_title('予測確率閾値別の損益', fontsize=14, fontweight='bold')
    ax3.grid(True, alpha=0.3, axis='y')

    # 4. 閾値別のベット数
    ax4 = axes[1, 1]
    ax4.bar(threshold_df['threshold'], threshold_df['total_races'], color='orange', alpha=0.7)
    ax4.set_xlabel('予測確率の閾値', fontsize=12)
    ax4.set_ylabel('ベット数', fontsize=12)
    ax4.set_title('予測確率閾値別のベット数', fontsize=14, fontweight='bold')
    ax4.grid(True, alpha=0.3, axis='y')

    plt.tight_layout()
    plt.savefig('data/backtest_high_confidence.png', dpi=300, bbox_inches='tight')
    print("\n📊 グラフ保存: data/backtest_high_confidence.png")

def main():
    print("=" * 100)
    print("🎯 高信頼度戦略のバックテスト")
    print("=" * 100)

    # 1. データ読み込み
    df = load_test_data()

    # 2. モデル読み込み
    print("\n📦 モデル読み込み中...")
    with open('model_improved_time_index.pkl', 'rb') as f:
        model = pickle.load(f)
    print("✅ モデル読み込み完了")

    # 3. 予測確率閾値別の分析（0.40～0.70まで）
    print("\n" + "=" * 100)
    print("📈 予測確率閾値別の分析（高信頼度）")
    print("=" * 100)

    # より細かい閾値で分析
    thresholds = [0.00, 0.10, 0.20, 0.30, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70]
    threshold_df = analyze_by_confidence(df, model, thresholds)

    print("\n【予測確率閾値別の詳細】")
    print(f"{'閾値':>6} {'ベット数':>8} {'的中数':>8} {'的中率':>8} {'回収率':>8} {'損益':>12} {'平均配当':>8}")
    print("-" * 100)

    for idx, row in threshold_df.iterrows():
        profit_str = f"{row['profit']:+,.0f}円"
        print(f"{row['threshold']:>6.2f} {row['total_races']:>8.0f} {row['hits']:>8.0f} {row['hit_rate']:>7.2f}% {row['recovery_rate']:>7.2f}% {profit_str:>12} {row['avg_odds']:>7.2f}倍")

    # 4. 推奨戦略の特定
    print("\n" + "=" * 100)
    print("💡 推奨戦略")
    print("=" * 100)

    # 回収率100%以上
    profitable = threshold_df[threshold_df['recovery_rate'] >= 100.0]

    if len(profitable) > 0:
        print("\n🎉 回収率100%以上の戦略:")
        for idx, row in profitable.iterrows():
            print(f"\n  閾値: {row['threshold']:.2f}")
            print(f"  回収率: {row['recovery_rate']:.2f}%")
            print(f"  的中率: {row['hit_rate']:.2f}%")
            print(f"  ベット数: {row['total_races']:.0f}レース")
            print(f"  損益: {row['profit']:+,.0f}円")
            print(f"  平均配当: {row['avg_odds']:.2f}倍")
    else:
        print("\n⚠️ 回収率100%以上の戦略はありませんでした")

    # 最高回収率
    best_recovery = threshold_df.loc[threshold_df['recovery_rate'].idxmax()]
    print(f"\n💰 最高回収率:")
    print(f"  閾値: {best_recovery['threshold']:.2f}")
    print(f"  回収率: {best_recovery['recovery_rate']:.2f}%")
    print(f"  的中率: {best_recovery['hit_rate']:.2f}%")
    print(f"  ベット数: {best_recovery['total_races']:.0f}レース")
    print(f"  損益: {best_recovery['profit']:+,.0f}円")
    print(f"  平均配当: {best_recovery['avg_odds']:.2f}倍")

    # 最高利益
    best_profit = threshold_df.loc[threshold_df['profit'].idxmax()]
    print(f"\n💎 最高利益:")
    print(f"  閾値: {best_profit['threshold']:.2f}")
    print(f"  回収率: {best_profit['recovery_rate']:.2f}%")
    print(f"  的中率: {best_profit['hit_rate']:.2f}%")
    print(f"  ベット数: {best_profit['total_races']:.0f}レース")
    print(f"  損益: {best_profit['profit']:+,.0f}円")
    print(f"  平均配当: {best_profit['avg_odds']:.2f}倍")

    # 的中率50%以上
    high_accuracy = threshold_df[threshold_df['hit_rate'] >= 50.0]

    if len(high_accuracy) > 0:
        print("\n🎯 的中率50%以上の戦略:")
        for idx, row in high_accuracy.iterrows():
            print(f"\n  閾値: {row['threshold']:.2f}")
            print(f"  的中率: {row['hit_rate']:.2f}%")
            print(f"  回収率: {row['recovery_rate']:.2f}%")
            print(f"  ベット数: {row['total_races']:.0f}レース")
            print(f"  損益: {row['profit']:+,.0f}円")
    else:
        print("\n⚠️ 的中率50%以上の戦略はありませんでした")

    # 5. 可視化
    print("\n" + "=" * 100)
    print("📊 結果の可視化")
    print("=" * 100)

    plot_high_confidence_analysis(threshold_df)

    # 6. 結果を保存
    threshold_df.to_csv('data/backtest_high_confidence.csv', index=False, encoding='utf-8-sig')

    print("\n📁 結果保存: data/backtest_high_confidence.csv")

    # 7. サマリー
    print("\n" + "=" * 100)
    print("📋 サマリー")
    print("=" * 100)

    print(f"\n全体傾向:")
    print(f"  - 閾値を上げると的中率は上昇")
    print(f"  - しかしベット数は減少")
    print(f"  - 最高回収率: {threshold_df['recovery_rate'].max():.2f}%（閾値{best_recovery['threshold']:.2f}）")
    print(f"  - 最高的中率: {threshold_df['hit_rate'].max():.2f}%（閾値{threshold_df.loc[threshold_df['hit_rate'].idxmax(), 'threshold']:.2f}）")

    print("\n" + "=" * 100)
    print("✅ バックテスト完了")
    print("=" * 100)

if __name__ == '__main__':
    main()
