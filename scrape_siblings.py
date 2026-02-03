import requests
from bs4 import BeautifulSoup
import time
import pandas as pd
from google.cloud import bigquery
import re
import random
import datetime
import logging
import os

# ログ設定
def setup_logger():
    """ログ設定を初期化"""
    os.makedirs('./logs', exist_ok=True)

    log_filename = f"./logs/siblings_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

    logger = logging.getLogger('siblings_scraper')
    logger.setLevel(logging.INFO)

    # ファイルハンドラ
    file_handler = logging.FileHandler(log_filename, encoding='utf-8')
    file_handler.setLevel(logging.INFO)

    # コンソールハンドラ
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    # フォーマット
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger


def get_random_headers() -> dict:
    """ランダムなUser-Agentを含むヘッダーを生成"""
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
    ]

    return {
        "User-Agent": random.choice(user_agents),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }


def retry_request(url: str, session, max_retries: int = 3, retry_delay: int = 5, logger=None):
    """リトライ機能付きリクエスト"""
    for attempt in range(max_retries):
        try:
            headers = get_random_headers()
            response = session.get(url, headers=headers, timeout=30)
            response.encoding = response.apparent_encoding

            if response.status_code == 200:
                return response
            elif response.status_code == 429:  # Too Many Requests
                wait_time = retry_delay * (attempt + 1) * 2
                if logger:
                    logger.warning(f"レート制限検出 (429) - {wait_time}秒待機します")
                time.sleep(wait_time)
            else:
                if logger:
                    logger.warning(f"HTTPエラー {response.status_code}: {url}")

        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                if logger:
                    logger.warning(f"リクエストエラー (試行 {attempt + 1}/{max_retries}): {e}")
                time.sleep(retry_delay)
            else:
                if logger:
                    logger.error(f"リクエスト失敗: {url} - {e}")
                return None

    return None


def wait_random_time(min_sec: float, max_sec: float):
    """ランダムな時間だけ待機"""
    time.sleep(random.uniform(min_sec, max_sec))


def scrape_oldest_sibling(horse_id, session, logger=None):
    """
    指定されたhorse_idの最年長兄弟を取得

    Args:
        horse_id: 馬のID
        session: requests.Session オブジェクト
        logger: ロガーオブジェクト

    Returns:
        dict or None: {
            'oldest_sibling_id': int or None,
            'oldest_sibling_name': str or None,
            'oldest_sibling_birth_year': int or None
        }
    """
    url = f"https://db.netkeiba.com/horse/ped/{horse_id}/"

    try:
        response = retry_request(url, session, logger=logger)

        if not response:
            return None

        # HTMLをパース
        soup = BeautifulSoup(response.content, 'html.parser')

        # 兄弟馬の表を取得（captionまたはsummaryに「兄弟」を含むテーブル）
        table = None
        all_tables = soup.find_all('table', class_='nk_tb_common race_table_01')

        for t in all_tables:
            caption = t.find('caption')
            summary = t.get('summary', '')
            caption_text = caption.text.strip() if caption else ''

            # 「兄弟」「全兄弟」などを含むテーブルを探す
            if '兄弟' in caption_text or '兄弟' in summary:
                table = t
                break

        if not table:
            # 兄弟がいない場合
            return {
                'oldest_sibling_id': None,
                'oldest_sibling_name': None,
                'oldest_sibling_birth_year': None
            }

        siblings = []
        tbody = table.find('tbody')
        if tbody:
            rows = tbody.find_all('tr')
        else:
            rows = table.find_all('tr')

        for row in rows:
            # ヘッダー行をスキップ
            if row.find('th'):
                continue

            cols = row.find_all('td')
            if len(cols) >= 3:
                # 馬名を取得
                name_link = cols[0].find('a')
                name = name_link.text.strip() if name_link else ""

                # horse_idを取得（URLから抽出）
                sibling_horse_id = None
                if name_link and 'href' in name_link.attrs:
                    match = re.search(r'/horse/(\d+)/', name_link['href'])
                    if match:
                        sibling_horse_id = int(match.group(1))

                # 生年を取得
                birth_year_link = cols[2].find('a')
                birth_year = birth_year_link.text.strip() if birth_year_link else cols[2].text.strip()

                if birth_year.isdigit():
                    siblings.append({
                        'sibling_horse_id': sibling_horse_id,
                        'name': name,
                        'birth_year': int(birth_year)
                    })

        # 兄弟がいない場合
        if not siblings:
            return {
                'oldest_sibling_id': None,
                'oldest_sibling_name': None,
                'oldest_sibling_birth_year': None
            }

        # 最年長の兄弟を取得（birth_yearが最小のもの）
        oldest = min(siblings, key=lambda x: x['birth_year'])

        return {
            'oldest_sibling_id': oldest['sibling_horse_id'],
            'oldest_sibling_name': oldest['name'],
            'oldest_sibling_birth_year': oldest['birth_year']
        }

    except Exception as e:
        if logger:
            logger.error(f"スクレイピングエラー: {horse_id} - {e}")
        return None


def get_target_horses_from_csv(csv_path='target_horses.csv'):
    """CSVファイルから対象馬のリストを取得"""
    df = pd.read_csv(csv_path)
    return df


def get_target_horses_from_bigquery():
    """BigQueryから対象馬のリストを取得 (2022-2024年デビュー)"""
    client = bigquery.Client()

    query = """
    SELECT DISTINCT
      h.horse_id
    FROM `umadata.keiba_data.horse` h
    JOIN `umadata.keiba_data.race_result` rr ON h.horse_id = rr.horse_id
    JOIN `umadata.keiba_data.race_master` rm ON rr.race_id = rm.race_id
    WHERE h.mother IS NOT NULL
      AND h.mother != ""
    GROUP BY h.horse_id
    HAVING MIN(rm.race_date) BETWEEN "2022-01-01" AND "2024-12-31"
    ORDER BY h.horse_id
    """

    df = client.query(query).to_dataframe()
    return df


def main():
    # ロガーを初期化
    logger = setup_logger()

    logger.info("="*60)
    logger.info("兄弟馬スクレイピング開始")
    logger.info("="*60)

    # 対象馬のリストを取得
    logger.info("対象馬を取得中...")
    try:
        target_df = get_target_horses_from_csv()
        logger.info(f"target_horses.csvから{len(target_df)}頭を読み込みました")
    except FileNotFoundError:
        logger.info("target_horses.csvが見つかりません。BigQueryから取得します...")
        target_df = get_target_horses_from_bigquery()
        logger.info(f"BigQueryから{len(target_df)}頭を取得しました")

    # セッションを使い回す（接続の再利用）
    session = requests.Session()

    total = len(target_df)
    success_count = 0
    error_count = 0
    output_path = 'horse_siblings.csv'

    # CSVファイルを初期化（ヘッダーのみ書き込み）
    pd.DataFrame(columns=['horse_id', 'oldest_sibling_id', 'oldest_sibling_name', 'oldest_sibling_birth_year']).to_csv(
        output_path, index=False, encoding='utf-8-sig'
    )
    logger.info(f"出力ファイル: {output_path}")

    logger.info(f"開始時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("="*60)

    start_time = time.time()

    for idx, row in target_df.iterrows():
        horse_id = row['horse_id']

        # ランダムな待機時間（2〜5秒）
        wait_random_time(2, 5)

        logger.info(f"[{idx + 1}/{total}] horse_id: {horse_id} を処理中...")

        # スクレイピング実行
        sibling_data = scrape_oldest_sibling(horse_id, session, logger)

        if sibling_data:
            # リアルタイムでCSVに追記
            result_row = pd.DataFrame([{
                'horse_id': horse_id,
                'oldest_sibling_id': sibling_data['oldest_sibling_id'],
                'oldest_sibling_name': sibling_data['oldest_sibling_name'],
                'oldest_sibling_birth_year': sibling_data['oldest_sibling_birth_year']
            }])
            result_row.to_csv(output_path, mode='a', header=False, index=False, encoding='utf-8-sig')

            success_count += 1

            if sibling_data['oldest_sibling_id']:
                logger.info(f"✓ 成功: 最年長兄弟 {sibling_data['oldest_sibling_name']} ({sibling_data['oldest_sibling_birth_year']}年)")
            else:
                logger.info(f"✓ 成功: 兄弟なし")
        else:
            error_count += 1
            logger.error(f"✗ エラー: {horse_id}")

        # 進捗表示（10件ごと）
        if (idx + 1) % 10 == 0:
            elapsed = time.time() - start_time
            avg_time = elapsed / (idx + 1)
            remaining = (total - (idx + 1)) * avg_time
            logger.info(f"  進捗: {idx + 1}/{total} | 成功: {success_count} | エラー: {error_count} | 予想残り時間: {remaining/60:.1f}分")

    # セッションを閉じる
    session.close()

    total_elapsed = time.time() - start_time

    logger.info("")
    logger.info("="*60)
    logger.info("✓ すべての処理が完了しました")
    logger.info("="*60)
    logger.info(f"終了時刻: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"総処理時間: {total_elapsed/3600:.2f}時間 ({total_elapsed/60:.1f}分)")
    logger.info(f"処理結果:")
    logger.info(f"  - 総数: {total}")
    logger.info(f"  - 成功: {success_count}")
    logger.info(f"  - エラー: {error_count}")
    logger.info(f"出力ファイル: {output_path}")
    logger.info("="*60)


if __name__ == "__main__":
    main()
