#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
パターンC（複勝率+勝率）の特徴量重要度を表示
"""
import pickle
import pandas as pd

def show_feature_importance():
    """特徴量重要度を表示"""

    print("=" * 100)
    print("📊 パターンC（複勝率+勝率）特徴量重要度の分析")
    print("=" * 100)

    with open('../../models/model_pattern_c_both_rates.pkl', 'rb') as f:
        model = pickle.load(f)

    # 特徴量リスト（32個）
    features = [
        'running_style_last1', 'running_style_mode',
        'running_style_mode_win_rate', 'running_style_last1_win_rate',
        'jockey_rides_surface_distance',
        'jockey_place_rate_surface_distance',
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

    # 特徴量重要度を取得
    importance = model.feature_importance(importance_type='gain')

    # DataFrameに変換
    importance_df = pd.DataFrame({
        'feature': features,
        'importance': importance
    }).sort_values('importance', ascending=False)

    # 重要度の合計
    total_importance = importance_df['importance'].sum()

    # パーセンテージを計算
    importance_df['percentage'] = (importance_df['importance'] / total_importance * 100).round(2)
    importance_df['cumulative'] = importance_df['percentage'].cumsum().round(2)

    # ランクを追加
    importance_df['rank'] = range(1, len(importance_df) + 1)

    # 表示
    print("\n【特徴量重要度ランキング（全32個）】")
    print("=" * 100)
    print(f"{'順位':>4} {'特徴量':50} {'重要度':>12} {'割合':>8} {'累積':>8}")
    print("-" * 100)

    for idx, row in importance_df.iterrows():
        print(f"{row['rank']:>4} {row['feature']:50} {row['importance']:>12.0f} {row['percentage']:>7.2f}% {row['cumulative']:>7.2f}%")

    # カテゴリ別の重要度
    print("\n" + "=" * 100)
    print("【カテゴリ別重要度】")
    print("=" * 100)

    # カテゴリ分類
    categories = {
        '脚質': ['running_style_last1', 'running_style_mode', 'running_style_mode_win_rate', 'running_style_last1_win_rate'],
        '騎手': ['jockey_rides_surface_distance', 'jockey_place_rate_surface_distance', 'jockey_win_rate_surface_distance', 'is_jockey_change'],
        '過去成績': ['finish_pos_best_last5'],
        'レース条件': ['racecourse_encoded', 'surface_encoded', 'going_encoded', 'race_class_encoded'],
        '基本情報': ['distance', 'sex', 'age', 'horse_weight', 'weight_change', 'bracket_number', 'horse_number', 'days_since_last_race'],
        'タイム指数': ['time_index_zscore_last1_improved', 'time_index_zscore_last2_improved', 'time_index_zscore_last3_improved',
                     'time_index_zscore_mean_3_improved', 'time_index_zscore_best_3_improved',
                     'time_index_zscore_worst_3_improved', 'time_index_zscore_trend_3_improved'],
        'ラスト3F指数': ['last3f_index_zscore_last1_improved', 'last3f_index_zscore_last2_improved'],
        '休養': ['is_consecutive_race', 'rest_period_category']
    }

    category_importance = []
    for cat_name, cat_features in categories.items():
        cat_imp = importance_df[importance_df['feature'].isin(cat_features)]['importance'].sum()
        cat_pct = (cat_imp / total_importance * 100)
        category_importance.append({
            'category': cat_name,
            'importance': cat_imp,
            'percentage': cat_pct,
            'num_features': len(cat_features)
        })

    category_df = pd.DataFrame(category_importance).sort_values('importance', ascending=False)

    print(f"\n{'カテゴリ':15} {'特徴量数':>8} {'重要度':>12} {'割合':>8}")
    print("-" * 50)
    for idx, row in category_df.iterrows():
        print(f"{row['category']:15} {row['num_features']:>8}個 {row['importance']:>12.0f} {row['percentage']:>7.2f}%")

    # 削除候補の特徴量
    print("\n" + "=" * 100)
    print("【削除候補の特徴量】")
    print("=" * 100)

    # 重要度が低い閾値を設定
    thresholds = [0.5, 1.0, 2.0]

    for threshold in thresholds:
        low_importance = importance_df[importance_df['percentage'] < threshold]
        print(f"\n重要度{threshold}%未満の特徴量: {len(low_importance)}個")
        if len(low_importance) > 0:
            print(f"\n{'順位':>4} {'特徴量':50} {'重要度':>12} {'割合':>8}")
            print("-" * 80)
            for idx, row in low_importance.iterrows():
                print(f"{row['rank']:>4} {row['feature']:50} {row['importance']:>12.0f} {row['percentage']:>7.2f}%")

    # 推奨削除候補
    print("\n" + "=" * 100)
    print("💡 推奨削除候補")
    print("=" * 100)

    # 重要度1%未満を削除候補とする
    delete_candidates = importance_df[importance_df['percentage'] < 1.0].copy()

    print(f"\n重要度1%未満の特徴量を削除することを推奨します（{len(delete_candidates)}個）:\n")

    for idx, row in delete_candidates.iterrows():
        print(f"  ✗ {row['feature']:50} ({row['percentage']:.2f}%)")

    print(f"\n削除後の特徴量数: {len(features) - len(delete_candidates)}個")
    print(f"削減される重要度の合計: {delete_candidates['percentage'].sum():.2f}%")

    # CSV保存
    importance_df.to_csv('../../data/evaluations/feature_importance_pattern_c_full.csv', index=False, encoding='utf-8-sig')
    delete_candidates.to_csv('../../data/evaluations/delete_candidates_pattern_c.csv', index=False, encoding='utf-8-sig')

    print("\n" + "=" * 100)
    print("💾 特徴量重要度を保存:")
    print("   - data/evaluations/feature_importance_pattern_c_full.csv")
    print("   - data/evaluations/delete_candidates_pattern_c.csv")
    print("=" * 100)

    return importance_df, delete_candidates

if __name__ == '__main__':
    show_feature_importance()
