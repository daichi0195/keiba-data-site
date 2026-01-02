#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
改善版モデルでの回収率バックテスト

単勝ベットを想定：
- 各レースで予測確率が最も高い馬に100円賭ける
- オッズ（単勝配当）を使って回収率を計算
- 異なる閾値での回収率を比較
"""
from google.cloud import bigquery
import pandas as pd
import numpy as np
import pickle
import matplotlib.pyplot as plt
import seaborn as sns

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
    # オッズは単勝配当倍率なので、100円賭けた場合の払戻金は odds * 100
    race_bets['return'] = race_bets['hit'] * race_bets['odds'] * 100

    # 集計
    total_bets = len(race_bets)
    total_cost = total_bets * 100  # 1レースあたり100円
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

def analyze_by_odds_range(df, model):
    """オッズ帯別の回収率分析"""
    # 全体の予測を取得
    result = simulate_betting(df, model, threshold=0.0)
    race_bets = result['race_bets']

    # オッズ帯を定義
    odds_bins = [0, 3, 5, 10, 20, 50, 1000]
    odds_labels = ['1.0-3.0倍', '3.0-5.0倍', '5.0-10.0倍', '10.0-20.0倍', '20.0-50.0倍', '50.0倍以上']

    race_bets['odds_range'] = pd.cut(race_bets['odds'], bins=odds_bins, labels=odds_labels)

    # オッズ帯別に集計
    odds_analysis = race_bets.groupby('odds_range').agg({
        'race_id': 'count',
        'hit': ['sum', 'mean'],
        'return': 'sum'
    }).round(2)

    odds_analysis.columns = ['レース数', '的中数', '的中率', '総払戻']
    odds_analysis['投資額'] = odds_analysis['レース数'] * 100
    odds_analysis['回収率'] = (odds_analysis['総払戻'] / odds_analysis['投資額'] * 100).round(1)
    odds_analysis['的中率'] = (odds_analysis['的中率'] * 100).round(1)

    return odds_analysis

def analyze_by_popularity(df, model):
    """人気別の回収率分析"""
    # 全体の予測を取得
    result = simulate_betting(df, model, threshold=0.0)
    race_bets = result['race_bets']

    # 人気帯を定義
    popularity_bins = [0, 1, 3, 6, 18]
    popularity_labels = ['1番人気', '2-3番人気', '4-6番人気', '7番人気以下']

    race_bets['popularity_range'] = pd.cut(race_bets['popularity'], bins=popularity_bins, labels=popularity_labels)

    # 人気帯別に集計
    pop_analysis = race_bets.groupby('popularity_range').agg({
        'race_id': 'count',
        'hit': ['sum', 'mean'],
        'return': 'sum',
        'odds': 'mean'
    }).round(2)

    pop_analysis.columns = ['レース数', '的中数', '的中率', '総払戻', '平均オッズ']
    pop_analysis['投資額'] = pop_analysis['レース数'] * 100
    pop_analysis['回収率'] = (pop_analysis['総払戻'] / pop_analysis['投資額'] * 100).round(1)
    pop_analysis['的中率'] = (pop_analysis['的中率'] * 100).round(1)

    return pop_analysis

def plot_recovery_analysis(threshold_df, odds_df, pop_df):
    """回収率分析の可視化"""
    # 日本語フォント設定
    plt.rcParams['font.sans-serif'] = ['Hiragino Sans', 'Yu Gothic', 'Meiryo', 'DejaVu Sans']
    plt.rcParams['axes.unicode_minus'] = False

    fig, axes = plt.subplots(2, 3, figsize=(18, 12))

    # 1. 閾値別の回収率
    ax1 = axes[0, 0]
    ax1.plot(threshold_df['threshold'], threshold_df['recovery_rate'], marker='o', linewidth=2, markersize=8)
    ax1.axhline(y=100, color='r', linestyle='--', label='損益分岐点（100%）')
    ax1.set_xlabel('予測確率の閾値', fontsize=12)
    ax1.set_ylabel('回収率（%）', fontsize=12)
    ax1.set_title('予測確率閾値別の回収率', fontsize=14, fontweight='bold')
    ax1.grid(True, alpha=0.3)
    ax1.legend()

    # 2. 閾値別の的中率とレース数
    ax2 = axes[0, 1]
    ax2_twin = ax2.twinx()
    ax2.plot(threshold_df['threshold'], threshold_df['hit_rate'], marker='s', color='green', linewidth=2, markersize=8, label='的中率')
    ax2_twin.plot(threshold_df['threshold'], threshold_df['total_races'], marker='^', color='orange', linewidth=2, markersize=8, label='ベット数')
    ax2.set_xlabel('予測確率の閾値', fontsize=12)
    ax2.set_ylabel('的中率（%）', fontsize=12, color='green')
    ax2_twin.set_ylabel('ベット数', fontsize=12, color='orange')
    ax2.set_title('予測確率閾値別の的中率とベット数', fontsize=14, fontweight='bold')
    ax2.tick_params(axis='y', labelcolor='green')
    ax2_twin.tick_params(axis='y', labelcolor='orange')
    ax2.grid(True, alpha=0.3)

    # 3. 閾値別の損益
    ax3 = axes[0, 2]
    ax3.plot(threshold_df['threshold'], threshold_df['profit'], marker='D', linewidth=2, markersize=8, color='purple')
    ax3.axhline(y=0, color='r', linestyle='--', label='損益ゼロ')
    ax3.set_xlabel('予測確率の閾値', fontsize=12)
    ax3.set_ylabel('損益（円）', fontsize=12)
    ax3.set_title('予測確率閾値別の損益', fontsize=14, fontweight='bold')
    ax3.grid(True, alpha=0.3)
    ax3.legend()

    # 4. オッズ帯別の回収率
    ax4 = axes[1, 0]
    odds_df['回収率'].plot(kind='bar', ax=ax4, color='steelblue', alpha=0.7)
    ax4.axhline(y=100, color='r', linestyle='--', label='損益分岐点（100%）')
    ax4.set_xlabel('オッズ帯', fontsize=12)
    ax4.set_ylabel('回収率（%）', fontsize=12)
    ax4.set_title('オッズ帯別の回収率', fontsize=14, fontweight='bold')
    ax4.set_xticklabels(ax4.get_xticklabels(), rotation=45, ha='right')
    ax4.grid(True, alpha=0.3, axis='y')
    ax4.legend()

    # 5. オッズ帯別の的中率
    ax5 = axes[1, 1]
    ax5_twin = ax5.twinx()
    odds_df['的中率'].plot(kind='bar', ax=ax5, color='green', alpha=0.7, label='的中率')
    ax5_twin.plot(range(len(odds_df)), odds_df['レース数'].values, marker='o', color='orange', linewidth=2, markersize=8, label='レース数')
    ax5.set_xlabel('オッズ帯', fontsize=12)
    ax5.set_ylabel('的中率（%）', fontsize=12, color='green')
    ax5_twin.set_ylabel('レース数', fontsize=12, color='orange')
    ax5.set_title('オッズ帯別の的中率とレース数', fontsize=14, fontweight='bold')
    ax5.set_xticklabels(ax5.get_xticklabels(), rotation=45, ha='right')
    ax5.tick_params(axis='y', labelcolor='green')
    ax5_twin.tick_params(axis='y', labelcolor='orange')
    ax5.grid(True, alpha=0.3, axis='y')

    # 6. 人気別の回収率
    ax6 = axes[1, 2]
    pop_df['回収率'].plot(kind='bar', ax=ax6, color='coral', alpha=0.7)
    ax6.axhline(y=100, color='r', linestyle='--', label='損益分岐点（100%）')
    ax6.set_xlabel('人気', fontsize=12)
    ax6.set_ylabel('回収率（%）', fontsize=12)
    ax6.set_title('人気別の回収率', fontsize=14, fontweight='bold')
    ax6.set_xticklabels(ax6.get_xticklabels(), rotation=45, ha='right')
    ax6.grid(True, alpha=0.3, axis='y')
    ax6.legend()

    plt.tight_layout()
    plt.savefig('data/backtest_improved_model.png', dpi=300, bbox_inches='tight')
    print("\n📊 グラフ保存: data/backtest_improved_model.png")

def main():
    print("=" * 100)
    print("🔮 改善版モデルでの回収率バックテスト")
    print("=" * 100)

    # 1. データ読み込み
    df = load_test_data()

    # 2. モデル読み込み
    print("\n📦 モデル読み込み中...")
    with open('model_improved_time_index.pkl', 'rb') as f:
        model = pickle.load(f)
    print("✅ モデル読み込み完了")

    # 3. 基本シミュレーション（閾値なし）
    print("\n" + "=" * 100)
    print("📊 基本シミュレーション（全レースにベット）")
    print("=" * 100)

    result = simulate_betting(df, model, threshold=0.0)

    print(f"\n【結果サマリー】")
    print(f"  ベット数: {result['total_races']:,}レース")
    print(f"  投資額: {result['total_cost']:,}円")
    print(f"  払戻額: {result['total_return']:,.0f}円")
    print(f"  損益: {result['profit']:+,.0f}円")
    print(f"  回収率: {result['recovery_rate']:.2f}%")
    print(f"  的中率: {result['hit_rate']:.2f}% ({result['hits']}/{result['total_races']})")
    print(f"  平均配当: {result['avg_odds']:.2f}倍")

    # 4. 予測確率閾値別の分析
    print("\n" + "=" * 100)
    print("📈 予測確率閾値別の分析")
    print("=" * 100)

    thresholds = [0.0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40]
    threshold_df = analyze_by_confidence(df, model, thresholds)

    print("\n【予測確率閾値別の回収率】")
    print(threshold_df[['threshold', 'total_races', 'hits', 'hit_rate', 'recovery_rate', 'profit']].to_string(index=False))

    # 5. オッズ帯別の分析
    print("\n" + "=" * 100)
    print("🎯 オッズ帯別の分析")
    print("=" * 100)

    odds_df = analyze_by_odds_range(df, model)
    print("\n【オッズ帯別の回収率】")
    print(odds_df)

    # 6. 人気別の分析
    print("\n" + "=" * 100)
    print("⭐ 人気別の分析")
    print("=" * 100)

    pop_df = analyze_by_popularity(df, model)
    print("\n【人気別の回収率】")
    print(pop_df)

    # 7. 可視化
    print("\n" + "=" * 100)
    print("📊 結果の可視化")
    print("=" * 100)

    plot_recovery_analysis(threshold_df, odds_df, pop_df)

    # 8. 結果を保存
    threshold_df.to_csv('data/backtest_by_threshold.csv', index=False, encoding='utf-8-sig')
    odds_df.to_csv('data/backtest_by_odds.csv', encoding='utf-8-sig')
    pop_df.to_csv('data/backtest_by_popularity.csv', encoding='utf-8-sig')

    print("\n📁 結果保存:")
    print("  - data/backtest_by_threshold.csv")
    print("  - data/backtest_by_odds.csv")
    print("  - data/backtest_by_popularity.csv")

    # 9. 推奨戦略
    print("\n" + "=" * 100)
    print("💡 推奨戦略")
    print("=" * 100)

    best_recovery = threshold_df.loc[threshold_df['recovery_rate'].idxmax()]
    best_profit = threshold_df.loc[threshold_df['profit'].idxmax()]

    print(f"\n💰 最高回収率:")
    print(f"  閾値: {best_recovery['threshold']:.2f}")
    print(f"  回収率: {best_recovery['recovery_rate']:.2f}%")
    print(f"  的中率: {best_recovery['hit_rate']:.2f}%")
    print(f"  ベット数: {best_recovery['total_races']:.0f}レース")
    print(f"  損益: {best_recovery['profit']:+,.0f}円")

    print(f"\n💎 最高利益:")
    print(f"  閾値: {best_profit['threshold']:.2f}")
    print(f"  回収率: {best_profit['recovery_rate']:.2f}%")
    print(f"  的中率: {best_profit['hit_rate']:.2f}%")
    print(f"  ベット数: {best_profit['total_races']:.0f}レース")
    print(f"  損益: {best_profit['profit']:+,.0f}円")

    print("\n" + "=" * 100)
    print("✅ バックテスト完了")
    print("=" * 100)

if __name__ == '__main__':
    main()
