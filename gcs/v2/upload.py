#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
out/ 以下の生成物を gs://umadata へ同期する (gcloud storage rsync、アカウントは umadata.daichi@gmail.com)。

  python upload.py --prefix v2staging   # gs://umadata/v2staging/{course,jockey,trainer,sires}/... に置く (検証用)
  python upload.py                      # 本番パス (gs://umadata/course/... など) に置く

同期するのは course/ jockey/ trainer/ sires/ index/ と leading.json。out/lib (TypeScript) と logs は対象外。
rsync なので変更のないファイルは転送されない。--delete は付けない (本番側の余分なファイルは消さない)。
"""
import argparse
import subprocess
import sys

from localdb import OUT_DIR

BUCKET = 'umadata'
ACCOUNT = 'umadata.daichi@gmail.com'
DIRS = ['course', 'jockey', 'trainer', 'sires', 'index']


def run(cmd):
    print('$', ' '.join(cmd), flush=True)
    r = subprocess.run(cmd, text=True, capture_output=True)
    if r.returncode != 0:
        print(r.stderr[-2000:], file=sys.stderr)
        raise SystemExit(f'failed: {cmd[1]}')
    tail = (r.stderr or r.stdout).strip().splitlines()[-3:]
    print('  ' + '\n  '.join(tail))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--prefix', default='', help='バケット内のプレフィックス (検証用)。空なら本番パス')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    base = f'gs://{BUCKET}/' + (a.prefix.strip('/') + '/' if a.prefix else '')
    common = [f'--account={ACCOUNT}']
    if a.dry_run:
        common.append('--dry-run')
    for d in DIRS:
        src = OUT_DIR / d
        if not src.exists():
            print(f'  skip {d} (なし)')
            continue
        run(['gcloud', 'storage', 'rsync', '-r', str(src), base + d, '--content-type=application/json', *common])
    if (OUT_DIR / 'leading.json').exists():
        run(['gcloud', 'storage', 'cp', str(OUT_DIR / 'leading.json'), base + 'leading.json', '--content-type=application/json', *common])
    print(f'✅ upload done → {base}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
