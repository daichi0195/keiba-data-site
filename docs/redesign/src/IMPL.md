# 見本 → 本番実装の共通指示（ページ担当向け）

競馬データサイト（Next.js 15 App Router、`/Users/kubotataichi/keiba-data-site`、ブランチ `redesign-v6`）。docs/redesign/ の静的見本（オーナーとレビュー済み）を本番のページに移す。日本語で報告。commit・push はしない（まとめ役が行う）。

## まず読む
- `docs/redesign/src/RULES.md`（オーナーと決めたルール。最優先。末尾の「文面の決めごと」も）
- 担当ページの生成元：`docs/redesign/src/pages/<名前>.mjs`、`css/<名前>.css`、`js/<名前>.js`。完成形は `docs/redesign/src/.preview/v6-<名前>.html`（ブラウザで開ける）
- 共通の見た目：`top.css` → `themes.css`（後勝ち、`:root[data-look="m"]` が正）
- 本番の共通の枠（実装済み）：`app/layout.tsx`、`components/layout/`（SiteFrame・FrameNav・RailAiOff）、`app/globals.css` 先頭の v6 の CSS 変数（`--c-theme` など。見本の変数名との対応はコメント参照）

## 守ること
1. **データは本番の取得処理をそのまま使う**（GCS・lib/*.ts の関数）。見本の数値は本番データから作ったものなので、同じ関数の出力を見本と同じ形で並べる。作り物の数値・文言は禁止。件数（初期10件・さらに表示で最大50件など）は見本＝現行仕様どおり。
2. **SEO と広告は変えない**：`generateMetadata`・title・description・構造化データ（JSON-LD）・canonical・`generateStaticParams`・revalidate はそのまま。広告は既存の `AdSlot` を見本と同じ位置に（スロット種別は現行のものを流用）。
3. **共通ファイルは編集禁止**：`app/layout.tsx`、`app/globals.css`、`components/layout/*`、`components/AdSlot.*`、ほかの担当のページ・部品。必要な変更があれば報告に書く。共通の CSS 変数は使ってよい（`var(--c-theme)` など）。
4. 担当ページの新しい部品は `components/v6/<領域>/` に CSS Modules で置く。古い部品は、担当ページから外れて**どこからも参照されなくなったものだけ**削除。
5. クライアント側の動き（チップの現在地、開閉、五十音、数え上げ・棒の動き）は見本の js を React に移す（`'use client'` の小さな部品に閉じ込める）。サーバーで描ける部分はサーバーコンポーネントのまま。ハイドレーション不一致を出さない。
6. 型エラーを増やさない：担当ファイルで `npx tsc --noEmit` の新規エラー0（既存の95件は無関係）。
7. **自分で `next dev` / `next build` を起動しない**（Mac のメモリ8GB）。開発サーバーが `http://localhost:3100` で動いている（まとめ役が起動済み。落ちていたら報告して待つ）。初回アクセスはコンパイルで数十秒かかる。

## 確認（必須）
- Playwright：`/private/tmp/claude-501/-Users-kubotataichi-keiba-data-site/04b9221d-7d5e-4154-a34b-de93df0218e3/scratchpad/shots/` に node_modules がある。そこに自分用のフォルダを作ってスクリプトを置く。
- 幅 360 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920 で、本番（localhost:3100）と見本（.preview の HTML、同じ幅）を撮って並べ、**全画面を目で見て**一致を確認。横はみ出し0、JSエラー0（広告スクリプト由来のハイドレーション警告1件は既知・対象外）。開閉・チップ・さらに表示などの操作も確認。
- 数値の突き合わせ：本番ページの表の数値と見本の数値を機械的に比べる（同じデータなら一致するはず。差があれば、本番データが新しくなったのか実装ミスかを切り分ける）。
- 報告：変更・追加・削除したファイル、見本との差（残った差と理由）、確認した幅と目視した範囲、気になる点。
