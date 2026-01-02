#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
改善版モデルの特徴量重要度を表示
"""
import pickle
import pandas as pd

def show_feature_importance():
    """特徴量重要度を表示"""

    # モデル読み込み
    print("=" * 100)
    print("📊 特徴量重要度の分析")
    print("=" * 100)

    with open('../../models/model_improved_time_index.pkl', 'rb') as f:
        model = pickle.load(f)

    # 特徴量リスト
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
    print("\n【特徴量重要度ランキング】")
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
        '騎手': ['jockey_rides_surface_distance', 'jockey_place_rate_surface_distance', 'is_jockey_change'],
        '過去成績': ['finish_pos_best_last5'],
        'レース条件': ['racecourse_encoded', 'surface_encoded', 'going_encoded', 'race_class_encoded'],
        '基本情報': ['distance', 'sex', 'age', 'horse_weight', 'weight_change', 'bracket_number', 'horse_number', 'days_since_last_race'],
        'タイム指数': ['time_index_zscore_last1_improved', 'time_index_zscore_last2_improved', 'time_index_zscore_last3_improved',
                     'time_index_zscore_mean_3_improved', 'time_index_zscore_best_3_improved',
                     'time_index_zscore_worst_3_improved', 'time_index_zscore_trend_3_improved'],
        'ラスト3F指数': ['last3f_index_zscore_last1_improved', 'last3f_index_zscore_last2_improved'],
        '休養': ['is_after_long_rest', 'is_consecutive_race', 'is_debut', 'rest_period_category']
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

    # Top10の詳細
    print("\n" + "=" * 100)
    print("【Top10 特徴量の詳細】")
    print("=" * 100)

    top10 = importance_df.head(10)
    for idx, row in top10.iterrows():
        print(f"\n{row['rank']}位: {row['feature']}")
        print(f"  重要度: {row['importance']:,.0f}")
        print(f"  割合: {row['percentage']:.2f}%")
        print(f"  累積: {row['cumulative']:.2f}%")

    # 重要度が低い特徴量（削除候補）
    print("\n" + "=" * 100)
    print("【重要度が低い特徴量（削除候補）】")
    print("=" * 100)

    low_importance = importance_df[importance_df['percentage'] < 1.0]
    print(f"\n重要度1%未満の特徴量: {len(low_importance)}個\n")

    for idx, row in low_importance.iterrows():
        print(f"{row['rank']:>2}位: {row['feature']:50} {row['importance']:>10.0f} ({row['percentage']:>5.2f}%)")

    # CSV保存
    importance_df.to_csv('../../data/evaluations/feature_importance_improved.csv', index=False, encoding='utf-8-sig')
    print("\n" + "=" * 100)
    print("💾 特徴量重要度を保存: data/evaluations/feature_importance_improved.csv")
    print("=" * 100)

    return importance_df

if __name__ == '__main__':
    show_feature_importance()
