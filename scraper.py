import requests
from bs4 import BeautifulSoup
import re

def scrape_oldest_sibling(horse_id):
    """
    指定されたhorse_idの最年長兄弟を取得

    Returns:
        dict or None: {
            'oldest_sibling_id': int or None,
            'oldest_sibling_name': str or None,
            'oldest_sibling_birth_year': int or None
        }
    """
    url = f"https://db.netkeiba.com/horse/ped/{horse_id}/"

    try:
        # リクエスト送信（User-Agentヘッダーを追加）
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        # HTMLをパース
        soup = BeautifulSoup(response.content, 'html.parser')

        # 兄弟馬の表を取得
        table = soup.find('table', class_='nk_tb_common race_table_01')

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
        print(f"  エラー: {horse_id} - {e}")
        return None
