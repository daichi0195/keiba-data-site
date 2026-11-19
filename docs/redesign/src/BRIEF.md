# 見本づくりの共通の頼み方（作業者向け）

あなたは競馬データサイト「競馬データ.com」（Next.js。リポジトリ /Users/kubotataichi/keiba-data-site）のリデザイン見本を1ページ（または近い数ページ）担当します。回答・コメントは日本語。

## まず読むもの
1. `docs/redesign/src/RULES.md` … オーナーと詰めたルール。**これが最優先。**
2. `docs/redesign/src/pages/top.mjs` と `docs/redesign/src/lib.mjs` … 確定済みのトップ見本の生成元。`node docs/redesign/src/pages/top.mjs` で `docs/redesign/v6-looks.html` と確認用 `docs/redesign/src/.preview/v6-looks.html` が出る。
3. 確認用のトップを Playwright でスマホ（390）と PC（1440）で開き、上から下まで撮影して**実物の見た目を目で見る**（色・余白・板・マス・行の作り）。あなたのページはこれと同じ1つのサイトに見えなければならない。
4. 担当ページの現行の実装（`app/` と `components/`）と、本番 https://keibadata.com の同じページ（Playwright でスマホ・PCを撮影）。載っている情報・件数・並び・リンクを洗い出す。

## 作るもの
- `docs/redesign/src/pages/<名前>.mjs`（＋`docs/redesign/src/css/<名前>.css`、必要なら `docs/redesign/src/js/<名前>.js`）。`L.page({ title, body, current, out, css, js })` で `docs/redesign/v6-<名前>.html` を出す。
- 現行ページの情報は削らない。数値・名前は本番の実データ（`lib/get*DataFromGCS.ts` のURL、`public/data/`、`lib/*.ts`）。取得したJSONは `docs/redesign/src/data/` に置く。
- 現行の並びをなぞるのではなく、RULES.md の考え方（見やすさ・使いやすさ、PCは表、スマホは1件1行と板1枚、余白を詰める、強弱、動きと見やすい図）で組み直してよい。ただし極端に振らない。
- 図（棒・メーター・折れ線など）は見やすさを最優先に。動きは画面に入ったら1回だけ。
- **編集してよいのは自分のページのファイルだけ。** `lib.mjs`・`top.css`・`themes.css`・`top.js`・`pages/top.mjs`・ほかの作業者のファイル・`app/`・`components/` は編集しない。git の commit もしない。

## 確認してから報告
RULES.md「確認」のとおり、8つの幅（360 / 390 / 430 / 768 / 1280 / 1440 / 1920 / 2240）で計測し、全画面を目で見て、崩れを直してから報告する。
Playwright は `/private/tmp/claude-501/-Users-kubotataichi-keiba-data-site/04b9221d-7d5e-4154-a34b-de93df0218e3/scratchpad/shots/` で `node` を実行すると使える（`import { chromium, devices } from 'playwright'`。`v.mjs` が例）。撮影物は同フォルダの `pg-<名前>/` に置く。

## 報告に書くこと
- 作ったファイル、出力ファイル
- 現行ページの情報をどう配置したか（セクションの一覧）。現行にあって見本に入れなかったものがあれば必ず列挙
- 確認した幅と結果（計測値）。目で見た範囲
- 自分で気になっている点、判断に迷った点
