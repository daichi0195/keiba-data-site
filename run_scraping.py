import pandas as pd
import time
from scraper import scrape_oldest_sibling

def main():
    print("=== 兄弟馬スクレイピング開始 ===\n")

    # 対象馬のリストを読み込み
    target_df = pd.read_csv('target_horses.csv')
    print(f"対象馬: {len(target_df)}頭\n")

    results = []

    for idx, row in target_df.iterrows():
        horse_id = row['horse_id']
        print(f"[{idx + 1}/{len(target_df)}] horse_id: {horse_id}")

        # スクレイピング実行
        sibling_data = scrape_oldest_sibling(horse_id)

        if sibling_data:
            results.append({
                'horse_id': horse_id,
                'oldest_sibling_id': sibling_data['oldest_sibling_id'],
                'oldest_sibling_name': sibling_data['oldest_sibling_name'],
                'oldest_sibling_birth_year': sibling_data['oldest_sibling_birth_year']
            })

            if sibling_data['oldest_sibling_id']:
                print(f"  → 最年長兄弟: {sibling_data['oldest_sibling_name']} ({sibling_data['oldest_sibling_birth_year']}年)")
            else:
                print(f"  → 兄弟なし")
        else:
            print(f"  → エラー")

        # レート制限対策（1秒待機）
        time.sleep(1)
        print()

    # CSV保存
    result_df = pd.DataFrame(results)
    output_path = 'horse_siblings.csv'
    result_df.to_csv(output_path, index=False, encoding='utf-8-sig')

    print(f"✓ {len(result_df)}件のレコードを{output_path}に保存しました")
    print("\n=== スクレイピング完了 ===")

if __name__ == "__main__":
    main()
