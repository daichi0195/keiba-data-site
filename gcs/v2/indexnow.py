#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
週次データ更新後に、サイトマップの全 URL を IndexNow (Bing・Yahoo! など) へ通知する。

  python indexnow.py            # 本番の反映 (Vercel 再ビルド) を待ってから通知
  python indexnow.py --no-wait  # 待たずに通知

反映の確認: 本番の /data/leading.json の last_updated が、リポジトリの public/data/leading.json と一致するまで待つ
(push 前に呼ぶと待ち続けるので、weekly.sh では push 後に呼ぶ)。最大 30 分待ち、反映されなければ通知せず終了する。
キーファイルは public/<KEY>.txt (本番で https://www.keibadata.com/<KEY>.txt として配信される)。
"""
import argparse
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

HOST = 'www.keibadata.com'
BASE = f'https://{HOST}'
KEY = '69ba6933024691a4091bb47048991c04'
REPO = Path(__file__).resolve().parents[2]
ENDPOINT = 'https://api.indexnow.org/indexnow'
UA = {'User-Agent': 'keibadata-indexnow/1.0'}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode('utf-8')


def wait_for_deploy(timeout_sec=1800, interval=60):
    local = json.loads((REPO / 'public/data/leading.json').read_text(encoding='utf-8'))['last_updated']
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            live = json.loads(get(f'{BASE}/data/leading.json?t={int(time.time())}'))['last_updated']
            if live == local:
                print(f'deploy confirmed (last_updated={live})', flush=True)
                return True
            print(f'waiting deploy: live={live} local={local}', flush=True)
        except Exception as e:  # noqa: BLE001 再ビルド中の一時エラーは待つ
            print(f'waiting deploy: {e}', flush=True)
        time.sleep(interval)
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--no-wait', action='store_true')
    args = ap.parse_args()

    if not args.no_wait and not wait_for_deploy():
        sys.exit('本番への反映を確認できなかったため IndexNow 通知をスキップ')

    if get(f'{BASE}/{KEY}.txt').strip() != KEY:
        sys.exit('キーファイルが本番で確認できない')

    urls = re.findall(r'<loc>([^<]+)</loc>', get(f'{BASE}/sitemap.xml'))
    if not urls:
        sys.exit('サイトマップから URL を取得できない')

    body = json.dumps({
        'host': HOST,
        'key': KEY,
        'keyLocation': f'{BASE}/{KEY}.txt',
        'urlList': urls[:10000],
    }).encode('utf-8')
    req = urllib.request.Request(ENDPOINT, data=body, method='POST',
                                 headers={**UA, 'Content-Type': 'application/json; charset=utf-8'})
    with urllib.request.urlopen(req, timeout=60) as r:
        print(f'IndexNow: {len(urls)} urls submitted (HTTP {r.status})')


if __name__ == '__main__':
    main()
