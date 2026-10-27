"""
データページの「ページ間で同じ文章」の割合を測る（AdSense「有用性の低いコンテンツ」対策の確認用）

npm run build の出力（.next/server/app）から、インデックス対象のデータページを種類ごとに読み、
本文（表・スクリプトを除く）を文に分けて次の指標を出す。

- 共通文の割合: 同じ種類のページの10%以上に、一字一句同じ形で出てくる文の文字数の割合
- 骨格一致の割合: 数字を伏せたうえで、同じ種類のページの10%以上に出てくる文の文字数の割合
- 固有文字数: 共通文を除いた本文の文字数

使い方: python3 scripts/measure_duplication.py [--examples]
"""

import glob
import html
import re
import statistics
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / '.next' / 'server' / 'app'
KINDS = {
    'courses': 'courses/*/*/*.html',
    'jockeys': 'jockeys/*.html',
    'sires': 'sires/*.html',
    'trainers': 'trainers/*.html',
}
SHARED_RATIO = 0.10  # この割合以上のページに出てくる文を「共通」とみなす


def sentences(path: Path) -> list[str] | None:
    s = path.read_text(encoding='utf-8')
    if re.search(r'<meta name="robots" content="[^"]*noindex', s):
        return None  # noindex のページは審査の対象外として除く
    s = re.sub(r'<script.*?</script>|<style.*?</style>|<table.*?</table>|<svg.*?</svg>', '', s, flags=re.S)
    s = re.sub(r'<[^>]+>', '\n', s)
    s = html.unescape(s)
    out = []
    for line in s.split('\n'):
        for x in re.split(r'(?<=。)', line.strip()):
            x = x.strip()
            if len(x) >= 15:
                out.append(x)
    return out


def skeleton(x: str) -> str:
    return re.sub(r'[0-9０-９][0-9０-９,.]*', '#', x)


def measure(kind: str, pattern: str, show_examples: bool) -> None:
    pages = []
    for p in sorted(ROOT.glob(pattern)):
        sents = sentences(p)
        if sents is not None:
            pages.append(list(dict.fromkeys(sents)))
    if not pages:
        print(f'{kind}: ページが見つかりません（先に npm run build）')
        return
    n = len(pages)
    exact = Counter(x for sents in pages for x in sents)
    skel = Counter(k for sents in pages for k in {skeleton(x) for x in sents})
    limit = max(2, n * SHARED_RATIO)

    shared_pct, skel_pct, unique_chars = [], [], []
    for sents in pages:
        total = sum(len(x) for x in sents) or 1
        shared = sum(len(x) for x in sents if exact[x] >= limit)
        skel_shared = sum(len(x) for x in sents if skel[skeleton(x)] >= limit)
        shared_pct.append(shared / total * 100)
        skel_pct.append(skel_shared / total * 100)
        unique_chars.append(total - shared)

    med = statistics.median
    print(f'{kind}（{n}ページ）: 共通文 {med(shared_pct):.0f}%  骨格一致 {med(skel_pct):.0f}%  固有文字数 {med(unique_chars):.0f}字（いずれも中央値）')
    if show_examples:
        for x, c in Counter({k: v for k, v in skel.items() if v >= limit}).most_common(8):
            print(f'    {c:>4}ページ: {x[:80]}')


def main() -> None:
    show = '--examples' in sys.argv
    for kind, pattern in KINDS.items():
        measure(kind, pattern, show)


if __name__ == '__main__':
    main()
