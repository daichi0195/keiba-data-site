#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2025年有馬記念の予測（騎手ID版）

arima.txtから出走馬データを読み込み、改善版モデルで予測
騎手テーブルを使って正しいjockey_idを取得
"""
from google.cloud import bigquery
import pandas as pd
import numpy as np
import pickle
import re

PROJECT_ID = "umadata"
DATASET_ID = "keiba_data"

# 騎手名マッピング（arima.txt → jockeyテーブル）
JOCKEY_MAPPING = {
    'ルメール': 'C.ルメール',
    'Ｃデムーロ': 'C.デムーロ',
    'Cデムーロ': 'C.デムーロ',
    'デムーロ': 'C.デムーロ',
    '武豊': '武豊',
    '川田': '川田将雅',
    '戸崎圭': '戸崎圭太',
    '戸崎': '戸崎圭太',
    '坂井': '坂井瑠星',
    '団野': '団野大成',
    '荻野極': '荻野極',
    '鮫島駿': '鮫島克駿',
    '北村友': '北村友一',
    '横山武': '横山武史',
    '松本': '松本大輝',
    '丹内': '丹内祐次',
    '大野': '大野拓弥',
    '西村淳': '西村淳也'
}

def parse_arima_data(file_path):
    """arima.txtを解析して出走馬リストを作成"""
    print("=" * 100)
    print("📋 出走馬データを読み込み中...")
    print("=" * 100)

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    horses = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # 枠番・馬番の行をスキップ
        if re.match(r'^\d+\s+\d+', line) or line == '--' or line == '編集':
            i += 1
            continue

        # 馬名の行
        if line and not re.match(r'^[牡牝セ]\d+', line):
            horse_name = line
            i += 1

            # 次の行に詳細情報
            if i < len(lines):
                details = lines[i].strip()
                parts = details.split('\t')

                if len(parts) >= 7:
                    sex_age = parts[0]
                    weight = float(parts[1]) if parts[1] else 0
                    jockey = parts[2]
                    odds = float(parts[5]) if parts[5] else 0
                    popularity = int(parts[6]) if parts[6] else 0

                    # 性別と年齢を分離
                    if sex_age:
                        sex = 1 if sex_age[0] == '牡' else (2 if sex_age[0] == '牝' else 3)
                        age = int(sex_age[1]) if len(sex_age) > 1 and sex_age[1].isdigit() else 0
                    else:
                        sex = 0
                        age = 0

                    # 騎手名を正規化
                    normalized_jockey = JOCKEY_MAPPING.get(jockey, jockey)

                    horses.append({
                        'horse_name': horse_name,
                        'sex': sex,
                        'age': age,
                        'jockey_weight': weight,
                        'jockey_name_arima': jockey,  # arima.txtの表記
                        'jockey_name_normalized': normalized_jockey,  # 正規化後
                        'odds': odds,
                        'popularity': popularity
                    })
            i += 1
        else:
            i += 1

    df = pd.DataFrame(horses)

    print(f"\n✅ {len(df)}頭の出走馬を読み込みました")
    print("\n【出走馬一覧】")
    for idx, row in df.iterrows():
        print(f"  {idx+1:2d}. {row['horse_name']:20s} | {row['age']}歳 | {row['jockey_name_arima']:10s} | {row['popularity']:2d}番人気 | {row['odds']:6.1f}倍")

    return df

def get_jockey_ids(jockey_names):
    """騎手名からjockey_idを取得"""
    client = bigquery.Client(project=PROJECT_ID)

    print("\n" + "=" * 100)
    print("🔍 騎手IDを取得中...")
    print("=" * 100)

    # ユニークな騎手名リスト
    unique_jockeys = list(set(jockey_names))

    # WHERE句を構築
    where_conditions = []
    for jockey in unique_jockeys:
        where_conditions.append(f"jockey_name = '{jockey}'")

    where_clause = " OR ".join(where_conditions)

    query = f"""
    SELECT jockey_id, jockey_name, region, debut_year
    FROM `{PROJECT_ID}.{DATASET_ID}.jockey`
    WHERE {where_clause}
    ORDER BY jockey_name
    """

    df = client.query(query).to_dataframe()

    print(f"\n✅ {len(df)}人の騎手IDを取得")

    # 騎手名 → jockey_id のマッピング
    jockey_id_map = {}
    for idx, row in df.iterrows():
        jockey_id_map[row['jockey_name']] = row['jockey_id']
        print(f"  {row['jockey_name']:15s} → ID: {row['jockey_id']}")

    return jockey_id_map

def get_jockey_stats_by_id(jockey_id_map):
    """jockey_idを使って騎手の芝2500m成績を取得"""
    client = bigquery.Client(project=PROJECT_ID)

    print("\n" + "=" * 100)
    print("🏇 騎手成績データを取得中...")
    print("=" * 100)

    # jockey_idのリスト
    jockey_ids = list(jockey_id_map.values())
    jockey_ids_str = ','.join(map(str, jockey_ids))

    query = f"""
    WITH jockey_stats AS (
      SELECT
        jockey_id,
        jockey_name,
        COUNT(*) as rides,
        AVG(CASE WHEN finish_position <= 3 THEN 1 ELSE 0 END) as place_rate
      FROM `{PROJECT_ID}.{DATASET_ID}.all_features_complete_improved`
      WHERE jockey_id IN ({jockey_ids_str})
        AND surface = '芝'
        AND distance = 2500
        AND race_date >= '2020-01-01'
      GROUP BY jockey_id, jockey_name
      HAVING COUNT(*) >= 1
    )
    SELECT *
    FROM jockey_stats
    ORDER BY rides DESC
    """

    df = client.query(query).to_dataframe()

    print(f"\n✅ {len(df)}人の騎手成績を取得")

    # jockey_id → 成績のマッピング
    jockey_stats_map = {}
    for idx, row in df.iterrows():
        jockey_stats_map[row['jockey_id']] = {
            'jockey_name': row['jockey_name'],
            'rides': row['rides'],
            'place_rate': row['place_rate']
        }
        print(f"  ID {row['jockey_id']:4d} | {row['jockey_name']:15s} | {row['rides']:4.0f}回 | 複勝率{row['place_rate']*100:5.1f}%")

    return jockey_stats_map

def get_horse_features_from_bigquery(horse_names):
    """BigQueryから出走馬の過去データを取得"""
    client = bigquery.Client(project=PROJECT_ID)

    print("\n" + "=" * 100)
    print("🔍 BigQueryから出走馬の過去データを取得中...")
    print("=" * 100)

    horse_names_sql = "', '".join(horse_names)

    query = f"""
    WITH latest_races AS (
      SELECT
        f.*,
        ROW_NUMBER() OVER (PARTITION BY f.horse_name ORDER BY f.race_date DESC) as rn
      FROM `{PROJECT_ID}.{DATASET_ID}.all_features_complete_improved` f
      WHERE f.horse_name IN ('{horse_names_sql}')
        AND f.race_date < '2025-12-22'
    )
    SELECT *
    FROM latest_races
    WHERE rn = 1
    """

    df = client.query(query).to_dataframe()

    if len(df) == 0:
        print("\n⚠️ BigQueryからデータが取得できませんでした")
        return None

    print(f"\n✅ {len(df)}頭の過去データを取得しました")

    return df

def prepare_arima_features(arima_df, past_data_df, jockey_id_map, jockey_stats_map):
    """有馬記念用の特徴量を準備"""
    print("\n" + "=" * 100)
    print("🔧 特徴量エンジニアリング（有馬記念）")
    print("=" * 100)

    # 有馬記念のレース条件
    ARIMA_RACECOURSE = '中山'
    ARIMA_SURFACE = '芝'
    ARIMA_DISTANCE = 2500
    ARIMA_GOING = '良'
    ARIMA_RACE_CLASS = 'オープン'

    # カテゴリカル変数のエンコーディング
    racecourse_map = {'札幌': 1, '函館': 2, '福島': 3, '新潟': 4, '東京': 5, '中山': 6, '中京': 7, '京都': 8, '阪神': 9, '小倉': 10}
    surface_map = {'芝': 0, 'ダート': 1}
    going_map = {'良': 0, 'やや重': 1, '重': 2, '不良': 3}
    race_class_map = {'新馬': 0, '未勝利': 1, '１勝クラス': 2, '２勝クラス': 3, '３勝クラス': 4, 'オープン': 5}

    features_list = []

    for idx, arima_row in arima_df.iterrows():
        horse_name = arima_row['horse_name']

        # 過去データから該当馬を検索
        past_row = past_data_df[past_data_df['horse_name'] == horse_name]

        if len(past_row) == 0:
            print(f"⚠️ {horse_name}: 過去データなし（スキップ）")
            continue

        past_row = past_row.iloc[0]

        # 騎手IDと成績を取得
        jockey_name_normalized = arima_row['jockey_name_normalized']
        jockey_id = jockey_id_map.get(jockey_name_normalized, 0)
        jockey_stats = jockey_stats_map.get(jockey_id, {'rides': 0, 'place_rate': 0.25})

        # 騎手変更判定
        is_jockey_change = 1 if jockey_id != past_row.get('jockey_id', 0) else 0

        # 特徴量を準備
        features = {
            # arima.txtから
            'horse_name': horse_name,
            'sex': arima_row['sex'],
            'age': arima_row['age'],
            'odds': arima_row['odds'],
            'popularity': arima_row['popularity'],

            # 有馬記念のレース条件
            'racecourse_encoded': racecourse_map.get(ARIMA_RACECOURSE, 0),
            'surface_encoded': surface_map.get(ARIMA_SURFACE, 0),
            'going_encoded': going_map.get(ARIMA_GOING, 0),
            'race_class_encoded': race_class_map.get(ARIMA_RACE_CLASS, 5),
            'distance': ARIMA_DISTANCE,

            # 過去データから
            'running_style_last1': past_row.get('running_style_last1', 0),
            'running_style_mode': past_row.get('running_style_mode', 0),
            'running_style_mode_win_rate': past_row.get('running_style_mode_win_rate', 0),
            'running_style_last1_win_rate': past_row.get('running_style_last1_win_rate', 0),

            # 騎手データ（有馬記念で騎乗する騎手のデータ）
            'jockey_rides_surface_distance': jockey_stats['rides'],
            'jockey_place_rate_surface_distance': jockey_stats['place_rate'],
            'is_jockey_change': is_jockey_change,

            'finish_pos_best_last5': past_row.get('finish_pos_best_last5', 10),

            'horse_weight': past_row.get('horse_weight', 500),
            'weight_change': 0,
            'bracket_number': idx // 2 + 1,
            'horse_number': idx + 1,
            'days_since_last_race': 30,

            # タイム指数（改善版）
            'time_index_zscore_last1_improved': past_row.get('time_index_zscore_last1_improved', 0),
            'time_index_zscore_last2_improved': past_row.get('time_index_zscore_last2_improved', 0),
            'time_index_zscore_last3_improved': past_row.get('time_index_zscore_last3_improved', 0),
            'time_index_zscore_mean_3_improved': past_row.get('time_index_zscore_mean_3_improved', 0),
            'time_index_zscore_best_3_improved': past_row.get('time_index_zscore_best_3_improved', 0),
            'time_index_zscore_worst_3_improved': past_row.get('time_index_zscore_worst_3_improved', 0),
            'time_index_zscore_trend_3_improved': past_row.get('time_index_zscore_trend_3_improved', 0),

            # ラスト3F指数
            'last3f_index_zscore_last1_improved': past_row.get('last3f_index_zscore_last1_improved', 0),
            'last3f_index_zscore_last2_improved': past_row.get('last3f_index_zscore_last2_improved', 0),

            # 休養関連
            'is_after_long_rest': 0,
            'is_consecutive_race': 0,
            'is_debut': 0,
            'rest_period_category': 2
        }

        features_list.append(features)

    features_df = pd.DataFrame(features_list)

    print(f"\n✅ {len(features_df)}頭の特徴量を準備しました")

    return features_df

def predict_arima(features_df, model_path):
    """有馬記念を予測"""
    print("\n" + "=" * 100)
    print("🔮 有馬記念2025予測")
    print("=" * 100)

    # モデル読み込み
    with open(model_path, 'rb') as f:
        model = pickle.load(f)

    # 予測用の特徴量を準備
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

    X = features_df[feature_cols].fillna(0)

    # 予測
    y_pred = model.predict(X)

    # 結果をDataFrameに追加
    features_df['win_probability'] = y_pred
    features_df['predicted_rank'] = features_df['win_probability'].rank(ascending=False, method='first').astype(int)

    # ソート
    result_df = features_df.sort_values('predicted_rank')

    # 結果表示
    print("\n【予測結果】")
    print("=" * 100)
    print(f"{'予測順位':>8} {'馬名':20} {'年齢':>4} {'人気':>4} {'オッズ':>8} {'勝率':>8} {'タイム指数':>10}")
    print("-" * 100)

    for idx, row in result_df.iterrows():
        print(f"{row['predicted_rank']:>8.0f} {row['horse_name']:20} {row['age']:>4.0f}歳 {row['popularity']:>4.0f}番 {row['odds']:>8.1f}倍 {row['win_probability']*100:>7.2f}% {row['time_index_zscore_last1_improved']:>10.2f}")

    # 上位3頭を強調表示
    print("\n" + "=" * 100)
    print("🏆 予測上位3頭")
    print("=" * 100)

    for i in range(min(3, len(result_df))):
        row = result_df.iloc[i]
        print(f"\n{i+1}位: {row['horse_name']}")
        print(f"  勝率: {row['win_probability']*100:.2f}%")
        print(f"  人気: {row['popularity']:.0f}番人気")
        print(f"  オッズ: {row['odds']:.1f}倍")
        print(f"  タイム指数（前走）: {row['time_index_zscore_last1_improved']:.2f}")
        print(f"  タイム指数（3走平均）: {row['time_index_zscore_mean_3_improved']:.2f}")

    # CSV保存
    result_df[['predicted_rank', 'horse_name', 'age', 'popularity', 'odds', 'win_probability',
               'time_index_zscore_last1_improved', 'time_index_zscore_mean_3_improved']].to_csv(
        'data/arima_2025_predictions_v2.csv', index=False, encoding='utf-8-sig'
    )

    print("\n" + "=" * 100)
    print("💾 予測結果を保存しました: data/arima_2025_predictions_v2.csv")
    print("=" * 100)

    return result_df

def main():
    print("\n" + "=" * 100)
    print("🎄 2025年有馬記念予測（騎手ID版）")
    print("=" * 100)

    # 1. arima.txtを読み込み
    arima_df = parse_arima_data('/Users/kubotataichi/Desktop/keiba-data-site/arima.txt')

    # 2. 騎手IDを取得
    jockey_id_map = get_jockey_ids(arima_df['jockey_name_normalized'].tolist())

    # 3. 騎手の成績を取得
    jockey_stats_map = get_jockey_stats_by_id(jockey_id_map)

    # 4. BigQueryから過去データを取得
    past_data_df = get_horse_features_from_bigquery(arima_df['horse_name'].tolist())

    if past_data_df is None:
        print("\n❌ 過去データの取得に失敗しました")
        return

    # 5. 特徴量を準備
    features_df = prepare_arima_features(arima_df, past_data_df, jockey_id_map, jockey_stats_map)

    # 6. 予測
    result_df = predict_arima(features_df, 'model_improved_time_index.pkl')

    print("\n" + "=" * 100)
    print("✅ すべての処理が完了しました")
    print("=" * 100)

if __name__ == '__main__':
    main()
