#!/usr/bin/env python3
"""
JRAレーススケジュールをスクレイピングしてJSONを生成
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import sys
import os
from datetime import datetime
from google.cloud import storage


# 内回り・外回りの区別があるコース定義
# format: (競馬場ID, コース区分, 距離)
COURSES_WITH_VARIANTS = {
    ('kyoto', 'turf', 1400),   # 京都 芝1400m
    ('kyoto', 'turf', 1600),   # 京都 芝1600m
    ('niigata', 'turf', 2000), # 新潟 芝2000m
}


def generate_jra_url(date_str):
    """
    YYYYMMDDからJRAカレンダーURLを生成

    Args:
        date_str: YYYYMMDD形式の日付文字列（例: 20260214）

    Returns:
        str: JRAカレンダーURL

    Raises:
        ValueError: 日付形式が不正な場合
    """
    if len(date_str) != 8 or not date_str.isdigit():
        raise ValueError("日付はYYYYMMDD形式で指定してください（例: 20260214）")

    year = date_str[:4]
    month = date_str[4:6]
    day = date_str[6:8]

    # 月のゼロ埋めを削除（02 → 2）
    month_int = int(month)

    # URL生成
    # 例: https://www.jra.go.jp/keiba/calendar2026/2026/2/0214.html
    url = f"https://www.jra.go.jp/keiba/calendar{year}/{year}/{month_int}/{month}{day}.html"

    return url


def scrape_race_schedule(url):
    """
    JRAカレンダーページからレーススケジュールをスクレイピング

    Args:
        url: JRAカレンダーページのURL

    Returns:
        dict: レーススケジュールデータ
    """
    print(f"🔍 Fetching: {url}")

    # ページを取得
    response = requests.get(url)
    response.encoding = 'shift_jis'  # JRAページはShift_JISエンコーディング
    soup = BeautifulSoup(response.text, 'html.parser')

    # 日付を抽出（URLから）
    # https://www.jra.go.jp/keiba/calendar2026/2026/2/0214.html → 2026-02-14
    date_str = url.split('/')[-1].replace('.html', '')
    year = url.split('/')[-3]
    month = url.split('/')[-2]
    date_formatted = f"{year}-{month.zfill(2)}-{date_str[2:].zfill(2)}"

    print(f"📅 Date: {date_formatted}")

    schedule = {
        "date": date_formatted,
        "venues": {}
    }

    # 競馬場ごとのテーブルを探す
    # captionから競馬場名を取得
    tables = soup.find_all('table', class_='basic')

    for table in tables:
        # captionから競馬場名を抽出（例: "1回東京5日"）
        caption = table.find('caption')
        if not caption:
            continue

        venue_text = caption.get_text(strip=True)
        print(f"\n🏇 Processing: {venue_text}")

        # 競馬場名から venue_id を判定
        venue_id = None
        venue_name = None

        if '東京' in venue_text:
            venue_id = 'tokyo'
            venue_name = '東京競馬場'
        elif '京都' in venue_text:
            venue_id = 'kyoto'
            venue_name = '京都競馬場'
        elif '小倉' in venue_text:
            venue_id = 'kokura'
            venue_name = '小倉競馬場'
        elif '中山' in venue_text:
            venue_id = 'nakayama'
            venue_name = '中山競馬場'
        elif '阪神' in venue_text:
            venue_id = 'hanshin'
            venue_name = '阪神競馬場'
        elif '札幌' in venue_text:
            venue_id = 'sapporo'
            venue_name = '札幌競馬場'
        elif '函館' in venue_text:
            venue_id = 'hakodate'
            venue_name = '函館競馬場'
        elif '福島' in venue_text:
            venue_id = 'fukushima'
            venue_name = '福島競馬場'
        elif '新潟' in venue_text:
            venue_id = 'niigata'
            venue_name = '新潟競馬場'
        elif '中京' in venue_text:
            venue_id = 'chukyo'
            venue_name = '中京競馬場'
        else:
            print(f"⚠️  Unknown venue: {venue_text}")
            continue

        # レース情報を抽出
        races = []
        rows = table.find_all('tr')

        for row in rows:
            # レース番号のセルを探す（th要素）
            race_number_cell = row.find('th', class_='num')
            if not race_number_cell:
                continue

            # レース番号（"1レース" → 1）
            race_number_text = race_number_cell.get_text(strip=True).replace('レース', '')
            if not race_number_text.isdigit():
                continue
            race_number = int(race_number_text)

            # レース名・距離・コース区分が入っているセル
            race_info_cell = row.find('td', class_='name')
            if not race_info_cell:
                continue

            race_info_text = race_info_cell.get_text(strip=True)

            # パターン例: "3歳未勝利1,400（ダ）", "クイーンカップ（G3）1,600（芝）", "3歳未勝利1,800（芝・外）"
            # 距離とコース区分を抽出（最後の部分）- 全角括弧に注意、内外の情報も考慮
            distance_pattern = re.search(r'([\d,]+)（(ダ|芝|障)(?:・([内外]))?）', race_info_text)
            if not distance_pattern:
                print(f"⚠️  Could not parse race info: {race_info_text}")
                continue

            distance_str = distance_pattern.group(1).replace(',', '')
            surface_char = distance_pattern.group(2)
            variant_char = distance_pattern.group(3)  # 内 or 外 or None

            # コース区分を判定
            if surface_char == 'ダ':
                surface = 'dirt'
            elif surface_char == '芝':
                surface = 'turf'
            elif surface_char == '障':
                surface = 'steeplechase'
            else:
                print(f"⚠️  Unknown surface: {surface_char}")
                continue

            distance = int(distance_str)

            # バリアント（内回り・外回り）の判定
            # 内外の区別があるコースかどうかをチェック
            variant = None
            course_key = (venue_id, surface, distance)
            if course_key in COURSES_WITH_VARIANTS:
                # 区別があるコースの場合
                if variant_char == '外':
                    variant = 'outer'
                else:
                    # 「外」の記載がない場合は内回りとして扱う
                    variant = 'inner'

            # レース名を抽出（距離とコース区分の前まで）- 全角括弧に注意、内外の情報も考慮
            race_name = re.sub(r'[\d,]+（(ダ|芝|障)(?:・[内外])?）.*$', '', race_info_text).strip()

            # レース名の整形
            # 1. （）内のすべての内容を削除（グレード情報、記念名などを削除）
            race_name = re.sub(r'（[^）]*）', '', race_name)

            # 2. 「第N回」を削除
            race_name = re.sub(r'第\d+回\s*', '', race_name)

            # 3. 「〜賞典」のプレフィックスを削除（例: 農林水産省賞典京都記念 → 京都記念）
            race_name = re.sub(r'^.*?賞典', '', race_name)

            # 4. ステークス/特別/カップ/杯/記念がある場合、その後のクラス情報を削除
            if re.search(r'(ステークス|特別|カップ|杯|記念|ジャンプステークス)', race_name):
                # ステークス/特別/カップ/杯/記念で終わるように、その後のすべてを削除
                race_name = re.sub(r'(ステークス|特別|カップ|杯|記念|ジャンプステークス).*$', r'\1', race_name)

            # 5. カップ→C、ステークス→S に変換（杯はそのまま残す）
            race_name = re.sub(r'ジャンプステークス', 'ジャンプS', race_name)
            race_name = re.sub(r'ステークス', 'S', race_name)
            race_name = re.sub(r'カップ', 'C', race_name)

            # 発走時刻
            time_cell = row.find('td', class_='time')
            if not time_cell:
                continue

            time_text = time_cell.get_text(strip=True)
            # "10時05分" → "10:05"
            time_match = re.search(r'(\d{1,2})時(\d{2})分', time_text)
            if time_match:
                start_time = f"{time_match.group(1).zfill(2)}:{time_match.group(2)}"
            else:
                print(f"⚠️  Could not parse time: {time_text}")
                continue

            race = {
                "raceNumber": race_number,
                "raceName": race_name,
                "surface": surface,
                "distance": distance,
                "startTime": start_time
            }

            # バリアントがある場合のみ追加
            if variant:
                race["variant"] = variant

            races.append(race)
            variant_str = f"({variant})" if variant else ""
            print(f"  ✓ {race_number}R {race_name} {surface}{distance}m{variant_str} {start_time}")

        if races:
            # レース番号順にソート
            races.sort(key=lambda x: x['raceNumber'])

            schedule["venues"][venue_id] = {
                "name": venue_name,
                "races": races
            }
            print(f"  📊 Total races: {len(races)}")

    return schedule


def save_schedule_json(schedule, output_path):
    """
    スケジュールをJSONファイルに保存

    Args:
        schedule: スケジュールデータ
        output_path: 出力ファイルパス
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(schedule, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Saved to: {output_path}")


def upload_to_gcs(schedule, bucket_name='umadata'):
    """
    スケジュールをGCSにアップロード

    Args:
        schedule: スケジュールデータ
        bucket_name: GCSバケット名
    """
    # ファイル名を YYYYMMDD.json 形式で生成
    filename = schedule['date'].replace('-', '') + '.json'

    # GCS内のパス（race_scheduleフォルダ内）
    gcs_path = f'race_schedule/{filename}'

    # JSONに変換
    json_data = json.dumps(schedule, ensure_ascii=False, indent=2)

    try:
        # GCSクライアント作成
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(gcs_path)

        # アップロード
        blob.upload_from_string(json_data, content_type='application/json')

        print(f"✅ Uploaded to GCS: gs://{bucket_name}/{gcs_path}")
    except Exception as e:
        print(f"❌ Failed to upload to GCS: {e}")
        raise


def display_race_names(schedule):
    """
    スクレイピング結果のレース名を見やすく表示

    Args:
        schedule: スケジュールデータ
    """
    print("\n" + "="*70)
    print("📋 スクレイピング結果 - レース名一覧")
    print("="*70)
    print(f"日付: {schedule['date']}")
    print()

    for venue_id, venue_data in schedule['venues'].items():
        print(f"【{venue_data['name']}】")
        for race in venue_data['races']:
            print(f"  {race['raceNumber']:2d}R | {race['startTime']} | {race['raceName']}")
        print()

    print("="*70)


def main():
    """メイン処理"""
    # 引数チェック
    if len(sys.argv) < 2:
        print("❌ Error: Date argument is required")
        print("\nUsage:")
        print("  python3 generate_race_schedule.py <YYYYMMDD> [--auto-upload]")
        print("\nOptions:")
        print("  --auto-upload    確認なしで自動的にGCSにアップロード")
        print("\nExample:")
        print("  python3 generate_race_schedule.py 20260214")
        print("  python3 generate_race_schedule.py 20260214 --auto-upload")
        sys.exit(1)

    date_arg = sys.argv[1]
    auto_upload = '--auto-upload' in sys.argv

    # URL生成
    try:
        url = generate_jra_url(date_arg)
    except ValueError as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

    # スクレイピング
    schedule = scrape_race_schedule(url)

    # ローカルに保存
    output_path = f"race-schedule-{schedule['date']}.json"
    save_schedule_json(schedule, output_path)

    # レース名一覧を表示
    display_race_names(schedule)

    # サマリー表示
    print("\n" + "="*50)
    print("📋 Summary")
    print("="*50)
    print(f"Date: {schedule['date']}")
    print(f"Venues: {len(schedule['venues'])}")
    for venue_id, venue_data in schedule['venues'].items():
        print(f"  - {venue_data['name']}: {len(venue_data['races'])} races")
    print(f"\nLocal file: {output_path}")
    print("="*50)

    # GCSアップロードの確認
    if auto_upload:
        print("\n🚀 Auto-uploading to GCS...")
        upload_to_gcs(schedule)
        print(f"✅ Uploaded: gs://umadata/race_schedule/{schedule['date'].replace('-', '')}.json")

        # ローカルファイルを削除
        os.remove(output_path)
        print(f"🗑️  Deleted local file: {output_path}")
    else:
        print("\n💡 レース名を確認してください。")
        print()
        response = input("このままGCSにアップロードしますか？ (y/n): ").strip().lower()

        if response == 'y' or response == 'yes':
            print("\n🚀 Uploading to GCS...")
            upload_to_gcs(schedule)
            print(f"✅ Uploaded: gs://umadata/race_schedule/{schedule['date'].replace('-', '')}.json")

            # ローカルファイルを削除
            os.remove(output_path)
            print(f"🗑️  Deleted local file: {output_path}")
        else:
            print("\n⏸️  アップロードをスキップしました。")
            print(f"   ローカルファイル: {output_path}")


if __name__ == "__main__":
    main()
