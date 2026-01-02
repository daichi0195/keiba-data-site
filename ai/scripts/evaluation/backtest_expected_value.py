#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
期待値ベッティング戦略のバックテスト

戦略:
1. 各馬の勝率を予測
2. 期待オッズ = 1 / 予測勝率 を算出
3. 期待値 = (予測勝率 × 実際のオッズ × 100) - 100 を計算
4. 各レースで期待値が最も高い馬を購入
5. オプション: 期待値が正（+EV）の場合のみベット
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

def calculate_expected_value(df, model):
    """
    期待値を計算

    Args:
        df: データフレーム
        model: LightGBMモデル

    Returns:
        期待値を追加したデータフレーム
    """
    # 予測
    X, features = prepare_features(df)
    df = df.copy()
    df['pred_win_prob'] = model.predict(X)

    # 期待オッズ = 1 / 予測勝率
    df['expected_odds'] = 1 / df['pred_win_prob']

    # 期待値 = (予測勝率 × 実際のオッズ × 100) - 100
    # 100円賭けた場合の期待リターン - 投資額
    df['expected_value'] = (df['pred_win_prob'] * df['odds'] * 100) - 100

    # 期待値率（%）
    df['ev_rate'] = (df['expected_value'] / 100) * 100

    # オッズギャップ = 実際のオッズ / 期待オッズ
    # 1.0より大きい = 市場が過小評価（狙い目）
    df['odds_gap'] = df['odds'] / df['expected_odds']

    return df

def simulate_ev_betting(df, model, min_ev=None, strategy='max_ev'):
    """
    期待値ベッティングシミュレーション

    Args:
        df: データフレーム
        model: LightGBMモデル
        min_ev: 最小期待値（この値以上の場合のみベット、Noneの場合は制限なし）
        strategy: 'max_ev' = 期待値最大の馬, 'max_prob' = 予測確率最大の馬

    Returns:
        結果の辞書
    """
    # 期待値を計算
    df_ev = calculate_expected_value(df, model)

    # 各レースで戦略に応じた馬を選択
    if strategy == 'max_ev':
        # 期待値が最も高い馬を選択
        race_bets = df_ev.loc[df_ev.groupby('race_id')['expected_value'].idxmax()].copy()
    else:  # max_prob
        # 予測確率が最も高い馬を選択（従来の方法）
        race_bets = df_ev.loc[df_ev.groupby('race_id')['pred_win_prob'].idxmax()].copy()

    # 期待値でフィルタリング（指定がある場合）
    if min_ev is not None:
        race_bets = race_bets[race_bets['expected_value'] >= min_ev]

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
    avg_ev = race_bets['expected_value'].mean()

    return {
        'strategy': strategy,
        'min_ev': min_ev,
        'total_races': total_bets,
        'total_cost': total_cost,
        'total_return': total_return,
        'profit': total_return - total_cost,
        'recovery_rate': recovery_rate,
        'hit_rate': hit_rate,
        'hits': race_bets['hit'].sum(),
        'avg_odds': avg_odds,
        'avg_ev': avg_ev,
        'race_bets': race_bets
    }

def analyze_by_ev_threshold(df, model, ev_thresholds):
    """期待値閾値別の分析"""
    results = []

    for ev_threshold in ev_thresholds:
        result = simulate_ev_betting(df, model, min_ev=ev_threshold, strategy='max_ev')
        results.append(result)

    return pd.DataFrame(results)

def analyze_ev_vs_prob_strategy(df, model, ev_thresholds):
    """期待値戦略 vs 確率戦略の比較"""
    results = []

    for ev_threshold in ev_thresholds:
        # 期待値戦略
        ev_result = simulate_ev_betting(df, model, min_ev=ev_threshold, strategy='max_ev')
        ev_result['strategy_type'] = 'EV戦略'
        results.append(ev_result)

        # 確率戦略
        prob_result = simulate_ev_betting(df, model, min_ev=ev_threshold, strategy='max_prob')
        prob_result['strategy_type'] = '確率戦略'
        results.append(prob_result)

    return pd.DataFrame(results)

def analyze_by_odds_gap(df, model):
    """オッズギャップ別の分析"""
    # 期待値を計算
    df_ev = calculate_expected_value(df, model)

    # 期待値最大の馬を選択
    race_bets = df_ev.loc[df_ev.groupby('race_id')['expected_value'].idxmax()].copy()

    # オッズギャップ帯を定義
    # 1.0未満 = 過大評価, 1.0以上 = 過小評価（狙い目）
    gap_bins = [0, 0.5, 0.8, 1.0, 1.2, 1.5, 10.0]
    gap_labels = ['0.5未満', '0.5-0.8', '0.8-1.0', '1.0-1.2', '1.2-1.5', '1.5以上']

    race_bets['gap_range'] = pd.cut(race_bets['odds_gap'], bins=gap_bins, labels=gap_labels)

    # 的中判定と払戻
    race_bets['hit'] = (race_bets['finish_position'] == 1).astype(int)
    race_bets['return'] = race_bets['hit'] * race_bets['odds'] * 100

    # オッズギャップ帯別に集計
    gap_analysis = race_bets.groupby('gap_range', observed=False).agg({
        'race_id': 'count',
        'hit': ['sum', 'mean'],
        'return': 'sum',
        'expected_value': 'mean',
        'odds': 'mean'
    }).round(2)

    gap_analysis.columns = ['レース数', '的中数', '的中率', '総払戻', '平均EV', '平均オッズ']
    gap_analysis['投資額'] = gap_analysis['レース数'] * 100
    gap_analysis['回収率'] = (gap_analysis['総払戻'] / gap_analysis['投資額'] * 100).round(1)
    gap_analysis['的中率'] = (gap_analysis['的中率'] * 100).round(1)

    return gap_analysis

def plot_ev_analysis(ev_threshold_df, comparison_df, gap_df):
    """期待値分析の可視化"""
    # 日本語フォント設定
    plt.rcParams['font.sans-serif'] = ['Hiragino Sans', 'Yu Gothic', 'Meiryo', 'DejaVu Sans']
    plt.rcParams['axes.unicode_minus'] = False

    fig, axes = plt.subplots(2, 3, figsize=(18, 12))

    # 1. EV閾値別の回収率
    ax1 = axes[0, 0]
    ax1.plot(ev_threshold_df['min_ev'], ev_threshold_df['recovery_rate'], marker='o', linewidth=2, markersize=8, color='purple')
    ax1.axhline(y=100, color='r', linestyle='--', label='損益分岐点（100%）')
    ax1.set_xlabel('期待値閾値', fontsize=12)
    ax1.set_ylabel('回収率（%）', fontsize=12)
    ax1.set_title('期待値閾値別の回収率', fontsize=14, fontweight='bold')
    ax1.grid(True, alpha=0.3)
    ax1.legend()

    # 2. EV閾値別の的中率とベット数
    ax2 = axes[0, 1]
    ax2_twin = ax2.twinx()
    ax2.plot(ev_threshold_df['min_ev'], ev_threshold_df['hit_rate'], marker='s', color='green', linewidth=2, markersize=8, label='的中率')
    ax2_twin.plot(ev_threshold_df['min_ev'], ev_threshold_df['total_races'], marker='^', color='orange', linewidth=2, markersize=8, label='ベット数')
    ax2.set_xlabel('期待値閾値', fontsize=12)
    ax2.set_ylabel('的中率（%）', fontsize=12, color='green')
    ax2_twin.set_ylabel('ベット数', fontsize=12, color='orange')
    ax2.set_title('期待値閾値別の的中率とベット数', fontsize=14, fontweight='bold')
    ax2.tick_params(axis='y', labelcolor='green')
    ax2_twin.tick_params(axis='y', labelcolor='orange')
    ax2.grid(True, alpha=0.3)

    # 3. EV戦略 vs 確率戦略の回収率比較
    ax3 = axes[0, 2]
    ev_strategy = comparison_df[comparison_df['strategy_type'] == 'EV戦略']
    prob_strategy = comparison_df[comparison_df['strategy_type'] == '確率戦略']
    ax3.plot(ev_strategy['min_ev'], ev_strategy['recovery_rate'], marker='o', linewidth=2, markersize=8, label='EV戦略', color='purple')
    ax3.plot(prob_strategy['min_ev'], prob_strategy['recovery_rate'], marker='s', linewidth=2, markersize=8, label='確率戦略', color='blue')
    ax3.axhline(y=100, color='r', linestyle='--', label='損益分岐点')
    ax3.set_xlabel('期待値閾値', fontsize=12)
    ax3.set_ylabel('回収率（%）', fontsize=12)
    ax3.set_title('EV戦略 vs 確率戦略の回収率', fontsize=14, fontweight='bold')
    ax3.grid(True, alpha=0.3)
    ax3.legend()

    # 4. EV閾値別の損益
    ax4 = axes[1, 0]
    ax4.plot(ev_threshold_df['min_ev'], ev_threshold_df['profit'], marker='D', linewidth=2, markersize=8, color='darkgreen')
    ax4.axhline(y=0, color='r', linestyle='--', label='損益ゼロ')
    ax4.set_xlabel('期待値閾値', fontsize=12)
    ax4.set_ylabel('損益（円）', fontsize=12)
    ax4.set_title('期待値閾値別の損益', fontsize=14, fontweight='bold')
    ax4.grid(True, alpha=0.3)
    ax4.legend()

    # 5. オッズギャップ別の回収率
    ax5 = axes[1, 1]
    gap_df['回収率'].plot(kind='bar', ax=ax5, color='steelblue', alpha=0.7)
    ax5.axhline(y=100, color='r', linestyle='--', label='損益分岐点（100%）')
    ax5.set_xlabel('オッズギャップ', fontsize=12)
    ax5.set_ylabel('回収率（%）', fontsize=12)
    ax5.set_title('オッズギャップ別の回収率', fontsize=14, fontweight='bold')
    ax5.set_xticklabels(ax5.get_xticklabels(), rotation=45, ha='right')
    ax5.grid(True, alpha=0.3, axis='y')
    ax5.legend()

    # 6. オッズギャップ別の平均EV
    ax6 = axes[1, 2]
    gap_df['平均EV'].plot(kind='bar', ax=ax6, color='coral', alpha=0.7)
    ax6.axhline(y=0, color='r', linestyle='--', label='EV=0')
    ax6.set_xlabel('オッズギャップ', fontsize=12)
    ax6.set_ylabel('平均期待値', fontsize=12)
    ax6.set_title('オッズギャップ別の平均期待値', fontsize=14, fontweight='bold')
    ax6.set_xticklabels(ax6.get_xticklabels(), rotation=45, ha='right')
    ax6.grid(True, alpha=0.3, axis='y')
    ax6.legend()

    plt.tight_layout()
    plt.savefig('data/backtest_expected_value.png', dpi=300, bbox_inches='tight')
    print("\n📊 グラフ保存: data/backtest_expected_value.png")

def main():
    print("=" * 100)
    print("💰 期待値ベッティング戦略のバックテスト")
    print("=" * 100)

    # 1. データ読み込み
    df = load_test_data()

    # 2. モデル読み込み
    print("\n📦 モデル読み込み中...")
    with open('model_improved_time_index.pkl', 'rb') as f:
        model = pickle.load(f)
    print("✅ モデル読み込み完了")

    # 3. 基本シミュレーション（期待値戦略、閾値なし）
    print("\n" + "=" * 100)
    print("📊 基本シミュレーション（期待値最大の馬を選択）")
    print("=" * 100)

    result = simulate_ev_betting(df, model, min_ev=None, strategy='max_ev')

    print(f"\n【結果サマリー】")
    print(f"  ベット数: {result['total_races']:,}レース")
    print(f"  投資額: {result['total_cost']:,}円")
    print(f"  払戻額: {result['total_return']:,.0f}円")
    print(f"  損益: {result['profit']:+,.0f}円")
    print(f"  回収率: {result['recovery_rate']:.2f}%")
    print(f"  的中率: {result['hit_rate']:.2f}% ({result['hits']}/{result['total_races']})")
    print(f"  平均配当: {result['avg_odds']:.2f}倍")
    print(f"  平均期待値: {result['avg_ev']:+.2f}")

    # 4. 確率戦略との比較
    print("\n" + "=" * 100)
    print("🔄 期待値戦略 vs 確率戦略（従来手法）")
    print("=" * 100)

    prob_result = simulate_ev_betting(df, model, min_ev=None, strategy='max_prob')

    print(f"\n【確率戦略（予測確率最大の馬を選択）】")
    print(f"  回収率: {prob_result['recovery_rate']:.2f}%")
    print(f"  的中率: {prob_result['hit_rate']:.2f}%")
    print(f"  損益: {prob_result['profit']:+,.0f}円")
    print(f"  平均配当: {prob_result['avg_odds']:.2f}倍")

    print(f"\n【比較】")
    print(f"  回収率の差: {result['recovery_rate'] - prob_result['recovery_rate']:+.2f}%")
    print(f"  的中率の差: {result['hit_rate'] - prob_result['hit_rate']:+.2f}%")
    print(f"  損益の差: {result['profit'] - prob_result['profit']:+,.0f}円")

    # 5. 期待値閾値別の分析
    print("\n" + "=" * 100)
    print("📈 期待値閾値別の分析")
    print("=" * 100)

    ev_thresholds = [-50, -25, 0, 10, 20, 30, 40, 50]
    ev_threshold_df = analyze_by_ev_threshold(df, model, ev_thresholds)

    print("\n【期待値閾値別の回収率】")
    print(ev_threshold_df[['min_ev', 'total_races', 'hits', 'hit_rate', 'recovery_rate', 'profit', 'avg_ev']].to_string(index=False))

    # 6. EV戦略 vs 確率戦略の詳細比較
    print("\n" + "=" * 100)
    print("🔍 EV戦略 vs 確率戦略の詳細比較")
    print("=" * 100)

    comparison_df = analyze_ev_vs_prob_strategy(df, model, [0, 10, 20, 30])

    print("\n【戦略比較】")
    print(comparison_df[['strategy_type', 'min_ev', 'total_races', 'hit_rate', 'recovery_rate', 'profit']].to_string(index=False))

    # 7. オッズギャップ別の分析
    print("\n" + "=" * 100)
    print("🎯 オッズギャップ別の分析")
    print("=" * 100)

    gap_df = analyze_by_odds_gap(df, model)
    print("\n【オッズギャップ別の回収率】")
    print("※ オッズギャップ = 実際のオッズ / 期待オッズ")
    print("   1.0以上 = 市場が過小評価（狙い目）")
    print(gap_df)

    # 8. 可視化
    print("\n" + "=" * 100)
    print("📊 結果の可視化")
    print("=" * 100)

    plot_ev_analysis(ev_threshold_df, comparison_df, gap_df)

    # 9. 結果を保存
    ev_threshold_df.to_csv('data/backtest_ev_by_threshold.csv', index=False, encoding='utf-8-sig')
    comparison_df.to_csv('data/backtest_ev_vs_prob.csv', index=False, encoding='utf-8-sig')
    gap_df.to_csv('data/backtest_by_odds_gap.csv', encoding='utf-8-sig')

    print("\n📁 結果保存:")
    print("  - data/backtest_ev_by_threshold.csv")
    print("  - data/backtest_ev_vs_prob.csv")
    print("  - data/backtest_by_odds_gap.csv")

    # 10. 推奨戦略
    print("\n" + "=" * 100)
    print("💡 推奨戦略")
    print("=" * 100)

    best_recovery = ev_threshold_df.loc[ev_threshold_df['recovery_rate'].idxmax()]
    best_profit = ev_threshold_df.loc[ev_threshold_df['profit'].idxmax()]
    positive_ev = ev_threshold_df[ev_threshold_df['min_ev'] == 0].iloc[0] if len(ev_threshold_df[ev_threshold_df['min_ev'] == 0]) > 0 else None

    print(f"\n💰 最高回収率:")
    print(f"  期待値閾値: {best_recovery['min_ev']:+.0f}")
    print(f"  回収率: {best_recovery['recovery_rate']:.2f}%")
    print(f"  的中率: {best_recovery['hit_rate']:.2f}%")
    print(f"  ベット数: {best_recovery['total_races']:.0f}レース")
    print(f"  損益: {best_recovery['profit']:+,.0f}円")
    print(f"  平均EV: {best_recovery['avg_ev']:+.2f}")

    print(f"\n💎 最高利益:")
    print(f"  期待値閾値: {best_profit['min_ev']:+.0f}")
    print(f"  回収率: {best_profit['recovery_rate']:.2f}%")
    print(f"  的中率: {best_profit['hit_rate']:.2f}%")
    print(f"  ベット数: {best_profit['total_races']:.0f}レース")
    print(f"  損益: {best_profit['profit']:+,.0f}円")
    print(f"  平均EV: {best_profit['avg_ev']:+.2f}")

    if positive_ev is not None:
        print(f"\n🎯 プラスEV戦略（EV≧0）:")
        print(f"  回収率: {positive_ev['recovery_rate']:.2f}%")
        print(f"  的中率: {positive_ev['hit_rate']:.2f}%")
        print(f"  ベット数: {positive_ev['total_races']:.0f}レース")
        print(f"  損益: {positive_ev['profit']:+,.0f}円")
        print(f"  平均EV: {positive_ev['avg_ev']:+.2f}")

    print("\n" + "=" * 100)
    print("✅ バックテスト完了")
    print("=" * 100)

if __name__ == '__main__':
    main()
