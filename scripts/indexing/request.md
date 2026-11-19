# 毎日のインデックス登録リクエスト（Claude in Chrome で Search Console を操作する）

あなたは競馬データ.com（https://www.keibadata.com）のオーナーの代わりに、Google Search Console でインデックス登録をリクエストします。日本語で短く報告してください。

## 手順
1. `~/keibadata-indexing/candidates.json` の `candidates` を読む（上から優先度順）。
2. Claude in Chrome で、Search Console に **umadata.daichi@gmail.com でログイン済みの Chrome プロファイル**（「競馬」プロファイル）を使う。新しいタブで https://search.google.com/search-console?resource_id=https%3A%2F%2Fwww.keibadata.com%2F を開く（URL プレフィックスのプロパティ。ドメインプロパティ sc-domain:keibadata.com は権限がない）。ログイン画面や権限エラーが出たら、何もせず `node scripts/indexing/record.mjs <最初の候補URL> failed ログインが必要` を実行して終了する。
3. 候補を1件ずつ：
   - 画面上部の「URL 検査」欄をクリックしてから URL を入力し、入力内容を拡大して確認してから Enter（フォーカスが外れたまま Enter を押すと、前の URL の再リクエストになることがある）。
   - 結果が「URL は Google に登録されています」なら `node scripts/indexing/record.mjs <URL> indexed` を実行して次へ。
   - 「URL が Google に登録されていません」なら「インデックス登録をリクエスト」を押し、完了のダイアログ（1〜2分かかることがある）を待って閉じ、`node scripts/indexing/record.mjs <URL> requested <理由の文言（例：検出 - インデックス未登録）>` を実行。
   - 「割り当て量を超えました」等の上限の表示が出たら `node scripts/indexing/record.mjs <URL> quota` を実行して終了。
   - それ以外のエラーは `failed <エラーの文言>` で記録して次へ。
4. **リクエストは1日10件まで**。10件送ったら終了する。候補を使い切っても終了。
5. 最後に、確認した件数・リクエストした件数・登録済みだった件数を1〜2行で報告。

## 守ること
- Search Console では、URL 検査とインデックス登録のリクエスト以外の操作をしない（設定・ユーザー・サイトマップ・削除などに触れない）。
- ブラウザのダイアログ（alert/confirm）を出す操作をしない。
- 開いたタブは最後に閉じる。
