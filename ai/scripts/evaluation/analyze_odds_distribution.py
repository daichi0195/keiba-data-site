#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
なぜ勝率を使うと回収率が上がるのか？詳細分析

仮説2: 的中率は下がるが、当たったときの配当が大きい
"""
from google.cloud import bigquery
import pandas as pd
import pickle
import numpy as np

PROJECT_ID = "umadata"

def load_test_data():
    """テストデータを読み込む"""
    client = bigquery.Client(project=PROJECT_ID)

    print("=" * 100)
    print("📊 テストデータ読み込み中...")
    print("=" * 100)

    query = """
    SELECT
        race_id,
        race_date,
        horse_id,
        horse_name,
        finish_position,
        popularity,
        odds,

        -- パターンA用
        jockey_place_rate_surface_distance,

        -- パターンB/C用
        jockey_win_rate_surface_distance,

        -- その他の特徴量（31個）
        running_style_last1, running_style_mode,
        running_style_mode_win_rate, running_style_last1_win_rate,
        jockey_rides_surface_distance,
        is_jockey_change,
        finish_pos_best_last5,
        racecourse, surface, going, race_class,
        distance, sex, age, horse_weight, weight_change,
        bracket_number, horse_number, days_since_last_race,
        time_index_zscore_last1_improved,
        time_index_zscore_last2_improved,
        time_index_zscore_last3_improved,
        time_index_zscore_mean_3_improved,
        time_index_zscore_best_3_improved,
        time_index_zscore_worst_3_improved,
        time_index_zscore_trend_3_improved,
        last3f_index_zscore_last1_improved,
        last3f_index_zscore_last2_improved,
        is_consecutive_race, rest_period_category

    FROM `umadata.keiba_data.all_features_complete_improved`
    WHERE race_date >= '2024-11-01'
        AND finish_position IS NOT NULL
    ORDER BY race_date, race_id
    """

    df = client.query(query).to_dataframe()
    df['race_date'] = pd.to_datetime(df['race_date'])

    print(f"✅ テストデータ: {len(df):,}行")
    print(f"   期間: {df['race_date'].min()} ~ {df['race_date'].max()}")
    print(f"   レース数: {df['race_id'].nunique():,}レース")

    return df

def prepare_features_pattern_a(df):
    """パターンA用の特徴量準備（33個の特徴量）"""
    racecourse_map = {'札幌': 1, '函館': 2, '福島': 3, '新潟': 4, '東京': 5, '中山': 6, '中京': 7, '京都': 8, '阪神': 9, '小倉': 10}
    surface_map = {'芝': 0, 'ダート': 1}
    going_map = {'良': 0, 'やや重': 1, '重': 2, '不良': 3}
    race_class_map = {'新馬': 0, '未勝利': 1, '１勝クラス': 2, '２勝クラス': 3, '３勝クラス': 4, 'オープン': 5}

    df['racecourse_encoded'] = df['racecourse'].map(racecourse_map).fillna(0)
    df['surface_encoded'] = df['surface'].map(surface_map).fillna(0)
    df['going_encoded'] = df['going'].map(going_map).fillna(0)
    df['race_class_encoded'] = df['race_class'].map(race_class_map).fillna(5)

    # is_after_long_rest と is_debut を追加（モデルAは33個の特徴量で訓練されている）
    df['is_after_long_rest'] = 0  # ダミー値
    df['is_debut'] = 0  # ダミー値

    features = [
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

    return df[features].fillna(0)

def prepare_features_pattern_bc(df, include_place_rate=False):
    """パターンB/C用の特徴量準備"""
    racecourse_map = {'札幌': 1, '函館': 2, '福島': 3, '新潟': 4, '東京': 5, '中山': 6, '中京': 7, '京都': 8, '阪神': 9, '小倉': 10}
    surface_map = {'芝': 0, 'ダート': 1}
    going_map = {'良': 0, 'やや重': 1, '重': 2, '不良': 3}
    race_class_map = {'新馬': 0, '未勝利': 1, '１勝クラス': 2, '２勝クラス': 3, '３勝クラス': 4, 'オープン': 5}

    df['racecourse_encoded'] = df['racecourse'].map(racecourse_map).fillna(0)
    df['surface_encoded'] = df['surface'].map(surface_map).fillna(0)
    df['going_encoded'] = df['going'].map(going_map).fillna(0)
    df['race_class_encoded'] = df['race_class'].map(race_class_map).fillna(5)

    features = [
        'running_style_last1', 'running_style_mode',
        'running_style_mode_win_rate', 'running_style_last1_win_rate',
        'jockey_rides_surface_distance',
        'jockey_win_rate_surface_distance',
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
        'is_consecutive_race', 'rest_period_category'
    ]

    if include_place_rate:
        features.insert(5, 'jockey_place_rate_surface_distance')

    return df[features].fillna(0)

def predict_all_patterns(df):
    """3パターン全ての予測を実行"""
    print("\n" + "=" * 100)
    print("🔮 3パターンで予測実行中...")
    print("=" * 100)

    # パターンA
    print("\nパターンA（複勝率のみ）予測中...")
    with open('../../models/model_improved_time_index.pkl', 'rb') as f:
        model_a = pickle.load(f)
    X_a = prepare_features_pattern_a(df)
    df['prob_a'] = model_a.predict(X_a, num_iteration=model_a.best_iteration)
    df['rank_a'] = df.groupby('race_id')['prob_a'].rank(ascending=False, method='first')

    # パターンB
    print("パターンB（勝率のみ）予測中...")
    with open('../../models/model_pattern_b_win_rate.pkl', 'rb') as f:
        model_b = pickle.load(f)
    X_b = prepare_features_pattern_bc(df, include_place_rate=False)
    df['prob_b'] = model_b.predict(X_b, num_iteration=model_b.best_iteration)
    df['rank_b'] = df.groupby('race_id')['prob_b'].rank(ascending=False, method='first')

    # パターンC
    print("パターンC（両方）予測中...")
    with open('../../models/model_pattern_c_both_rates.pkl', 'rb') as f:
        model_c = pickle.load(f)
    X_c = prepare_features_pattern_bc(df, include_place_rate=True)
    df['prob_c'] = model_c.predict(X_c, num_iteration=model_c.best_iteration)
    df['rank_c'] = df.groupby('race_id')['prob_c'].rank(ascending=False, method='first')

    print("✅ 予測完了")

    return df

def analyze_popularity_distribution(df):
    """予測1位馬の人気分布を分析"""
    print("\n" + "=" * 100)
    print("📊 予測1位馬の人気分布")
    print("=" * 100)

    patterns = [
        ('A: 複勝率のみ', 'rank_a'),
        ('B: 勝率のみ', 'rank_b'),
        ('C: 両方', 'rank_c')
    ]

    results = []

    for pattern_name, rank_col in patterns:
        predicted_1st = df[df[rank_col] == 1].copy()

        print(f"\n【{pattern_name}】")
        print(f"  総レース数: {len(predicted_1st):,}レース")
        print(f"  平均人気: {predicted_1st['popularity'].mean():.2f}番人気")
        print(f"  中央値人気: {predicted_1st['popularity'].median():.1f}番人気")

        # 人気帯分布
        pop_dist = predicted_1st['popularity'].value_counts().sort_index()
        print(f"\n  人気分布:")
        for pop in range(1, 11):
            count = pop_dist.get(pop, 0)
            pct = count / len(predicted_1st) * 100
            print(f"    {pop:2d}番人気: {count:4d}回 ({pct:5.1f}%)")

        # 人気帯別集計
        predicted_1st['pop_band'] = pd.cut(predicted_1st['popularity'],
                                            bins=[0, 1, 3, 6, 10, 18],
                                            labels=['1番人気', '2-3番人気', '4-6番人気', '7-10番人気', '11番人気以下'])

        print(f"\n  人気帯別:")
        for band in ['1番人気', '2-3番人気', '4-6番人気', '7-10番人気', '11番人気以下']:
            band_data = predicted_1st[predicted_1st['pop_band'] == band]
            count = len(band_data)
            pct = count / len(predicted_1st) * 100
            if count > 0:
                print(f"    {band:12s}: {count:4d}回 ({pct:5.1f}%)")

        results.append({
            'pattern': pattern_name,
            'avg_popularity': predicted_1st['popularity'].mean(),
            'median_popularity': predicted_1st['popularity'].median(),
            'pop_1': (predicted_1st['popularity'] == 1).sum(),
            'pop_2_3': ((predicted_1st['popularity'] >= 2) & (predicted_1st['popularity'] <= 3)).sum(),
            'pop_4_6': ((predicted_1st['popularity'] >= 4) & (predicted_1st['popularity'] <= 6)).sum(),
            'pop_7_10': ((predicted_1st['popularity'] >= 7) & (predicted_1st['popularity'] <= 10)).sum(),
            'pop_11plus': (predicted_1st['popularity'] >= 11).sum()
        })

    # 比較テーブル
    print("\n" + "=" * 100)
    print("📋 人気分布比較サマリー")
    print("=" * 100)

    df_results = pd.DataFrame(results)
    print(f"\n{'パターン':20} {'平均人気':>10} {'1番人気':>10} {'2-3番':>10} {'4-6番':>10} {'7-10番':>10} {'11番以下':>10}")
    print("-" * 100)
    for _, row in df_results.iterrows():
        print(f"{row['pattern']:20} {row['avg_popularity']:>9.2f} {row['pop_1']:>9}回 {row['pop_2_3']:>9}回 {row['pop_4_6']:>9}回 {row['pop_7_10']:>9}回 {row['pop_11plus']:>9}回")

    return df_results

def analyze_winning_odds(df):
    """的中時の平均オッズを分析"""
    print("\n" + "=" * 100)
    print("💰 的中時のオッズ分析")
    print("=" * 100)

    patterns = [
        ('A: 複勝率のみ', 'rank_a'),
        ('B: 勝率のみ', 'rank_b'),
        ('C: 両方', 'rank_c')
    ]

    results = []

    for pattern_name, rank_col in patterns:
        predicted_1st = df[df[rank_col] == 1].copy()
        winning_bets = predicted_1st[predicted_1st['finish_position'] == 1].copy()

        total_races = len(predicted_1st)
        wins = len(winning_bets)
        hit_rate = wins / total_races * 100

        avg_odds_all = predicted_1st['odds'].mean()
        avg_odds_winning = winning_bets['odds'].mean() if wins > 0 else 0

        total_return = (winning_bets['odds'] * 100).sum()
        total_bet = total_races * 100
        recovery_rate = (total_return / total_bet) * 100

        print(f"\n【{pattern_name}】")
        print(f"  予測1位レース数: {total_races:,}レース")
        print(f"  的中数: {wins}レース")
        print(f"  的中率: {hit_rate:.2f}%")
        print(f"  平均オッズ（全予測1位）: {avg_odds_all:.2f}倍")
        print(f"  平均オッズ（的中時のみ）: {avg_odds_winning:.2f}倍")
        print(f"  回収率: {recovery_rate:.2f}%")

        # オッズ帯別の的中数
        if wins > 0:
            print(f"\n  的中時のオッズ分布:")
            odds_bands = [
                ('1.0-2.0倍', 1.0, 2.0),
                ('2.0-5.0倍', 2.0, 5.0),
                ('5.0-10.0倍', 5.0, 10.0),
                ('10.0-20.0倍', 10.0, 20.0),
                ('20.0倍以上', 20.0, 999.0)
            ]

            for band_name, min_odds, max_odds in odds_bands:
                count = ((winning_bets['odds'] >= min_odds) & (winning_bets['odds'] < max_odds)).sum()
                pct = count / wins * 100
                if count > 0:
                    print(f"    {band_name:15s}: {count:3d}回 ({pct:5.1f}%)")

        results.append({
            'pattern': pattern_name,
            'total_races': total_races,
            'wins': wins,
            'hit_rate': hit_rate,
            'avg_odds_all': avg_odds_all,
            'avg_odds_winning': avg_odds_winning,
            'recovery_rate': recovery_rate
        })

    # 比較テーブル
    print("\n" + "=" * 100)
    print("📋 オッズ比較サマリー")
    print("=" * 100)

    df_results = pd.DataFrame(results)
    print(f"\n{'パターン':20} {'的中率':>10} {'平均オッズ(全)':>15} {'平均オッズ(的中)':>18} {'回収率':>10}")
    print("-" * 100)
    for _, row in df_results.iterrows():
        print(f"{row['pattern']:20} {row['hit_rate']:>9.2f}% {row['avg_odds_all']:>14.2f}倍 {row['avg_odds_winning']:>17.2f}倍 {row['recovery_rate']:>9.2f}%")

    return df_results

def analyze_by_popularity_bands(df):
    """人気帯別の的中率・回収率を分析"""
    print("\n" + "=" * 100)
    print("🎯 人気帯別の的中率・回収率")
    print("=" * 100)

    patterns = [
        ('A: 複勝率のみ', 'rank_a'),
        ('B: 勝率のみ', 'rank_b'),
        ('C: 両方', 'rank_c')
    ]

    pop_bands = [
        ('1番人気', 1, 1),
        ('2-3番人気', 2, 3),
        ('4-6番人気', 4, 6),
        ('7-10番人気', 7, 10),
        ('11番人気以下', 11, 18)
    ]

    for pattern_name, rank_col in patterns:
        print(f"\n【{pattern_name}】")
        print(f"{'人気帯':15} {'レース数':>10} {'的中数':>10} {'的中率':>10} {'回収率':>10}")
        print("-" * 65)

        predicted_1st = df[df[rank_col] == 1].copy()

        for band_name, min_pop, max_pop in pop_bands:
            band_data = predicted_1st[(predicted_1st['popularity'] >= min_pop) &
                                      (predicted_1st['popularity'] <= max_pop)]

            if len(band_data) == 0:
                continue

            races = len(band_data)
            wins = (band_data['finish_position'] == 1).sum()
            hit_rate = wins / races * 100 if races > 0 else 0

            winning = band_data[band_data['finish_position'] == 1]
            total_return = (winning['odds'] * 100).sum()
            total_bet = races * 100
            recovery_rate = (total_return / total_bet) * 100

            print(f"{band_name:15} {races:>10}回 {wins:>10}回 {hit_rate:>9.1f}% {recovery_rate:>9.1f}%")

def main():
    print("\n" + "=" * 100)
    print("🔍 オッズ分布詳細分析：なぜ勝率を使うと回収率が上がるのか？")
    print("=" * 100)

    # データ読み込み
    df = load_test_data()

    # 3パターンで予測
    df = predict_all_patterns(df)

    # 1. 人気分布分析
    pop_dist = analyze_popularity_distribution(df)

    # 2. 的中時オッズ分析
    odds_analysis = analyze_winning_odds(df)

    # 3. 人気帯別分析
    analyze_by_popularity_bands(df)

    # 結論
    print("\n" + "=" * 100)
    print("📝 分析結果サマリー")
    print("=" * 100)

    print("\n【仮説2の検証結果】")
    print("「的中率は下がるが、当たったときの配当が大きい」")
    print("\n→ この仮説が正しいかどうか、上記データから判断できます")

    # CSV保存
    pop_dist.to_csv('../../data/evaluations/popularity_distribution_analysis.csv', index=False, encoding='utf-8-sig')
    odds_analysis.to_csv('../../data/evaluations/odds_analysis.csv', index=False, encoding='utf-8-sig')

    print("\n💾 分析結果を保存:")
    print("   - data/evaluations/popularity_distribution_analysis.csv")
    print("   - data/evaluations/odds_analysis.csv")
    print("=" * 100)

if __name__ == '__main__':
    main()
