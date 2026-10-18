# データソース移行計画：netkeiba 版 → JRA-VAN 準拠 DB（keibaai-v2）

作成日: 2026-10-18　状態: ステップ 2〜5 実施済み・切替待ち（§7 に進捗）

## 0. 結論（先に要点）

- 移行先は `keibaai-v2` プロジェクトの `core` データセット（JRA-VAN DataLab 由来、2013 年〜、2026-10-04 まで確定成績あり）。
- v2 側にはすでに **旧スキーマ互換の変換 SQL**（`keibaai_v2/sql/v1compat/keiba_data.sql` → `v1a_keiba_data`）があり、
  サイトの生成スクリプトが使う `race_master / race_result / horse / jockey / trainer` の形に 8 割方そろっている。
  これを土台に「サイト向けマート」を作れば、生成スクリプト（`gcs/*.py` 計 6,300 行）の大半は温存できる。
- 互換 SQL に無くてサイトに必要なものは 5 点だけ：**単勝・複勝の払戻（回収率）**、**騎手・調教師のカナ／所属／現役／デビュー年**、**馬主名**、**内回り・外回りの区別**、**クラス名の完全対応**。いずれも JRA-VAN 側に元データがある（HR / KS / CH / BN / RA）。
- ID と URL は維持できる。騎手・調教師の ID は netkeiba と JRA-VAN で同一コード（例: ルメール 5339 = `05339`）。種牡馬 ID は名前のハッシュで、209 件中 208 件が JRA-VAN の表記と完全一致（残り 1 件は別名表で吸収）。
- 工数の見積もりは **作業 10.5 人日前後、カレンダーで 2〜3 週間**（週次バッチを実際の月曜で 2 回確認するため）。
- 着手前にユーザーの判断が必要な事項が 5 つある（§5）。特に **JRA-VAN DataLab の利用規約上、集計結果をウェブ公開してよいか** の確認が最優先。

## 1. 現状

### 1.1 サイトのデータの流れ（現行）

```
netkeiba スクレイピング (~/keiba_scraper)  →  BigQuery umadata.keiba_data
   (horse / race_master / race_result / jockey / trainer)
        ↓ gcs/.py (コース 137 件・12 クエリ/件)
        ↓ gcs/generate_jockeys.py (騎手 156 件・21 クエリ/件)
        ↓ gcs/generate_trainers.py (調教師 ~190 件・21 クエリ/件)
        ↓ gcs/generate_sires.py (種牡馬 210 件・24 クエリ/件)
        ↓ gcs/generate_leading_data.py → public/data/leading.json (リポジトリ内)
        ↓ gcs/generate_{jockey,sire}_list.py → lib/jockeys.ts, lib/sires.ts (リポジトリ内)
   GCS gs://umadata/{course,jockey,trainer,sires}/*.json
        ↓ lib/get*DataFromGCS.ts (ビルド時 fetch、ISR 7 日)
   Next.js (Vercel)
```

- 「今週開催」と AI 予測はすでに v2 が書く `gs://umadata/predictions/` を読んでおり、移行対象外。
- 開催日程 `gcs/generate_race_schedule.py` は JRA 公式サイトをスクレイピングしている（v2 の `core.schedule` = YS で置換可能）。
- 旧パイプラインの実行方法（定期実行の有無）は未確認。最終更新は 2026-10-02。

### 1.2 移行先（keibaai-v2）

| データセット | 内容 | 鮮度（2026-10-18 時点） |
|---|---|---|
| `raw_jv` | JV-Data 27 レコード種別をそのまま（日本語カラム名） | 2026-10-04 まで（10-07 構築） |
| `core` | AI 開発用の正規化層（race / entry / horse / pedigree / breeding_horse / jockey / trainer / payout / odds_* / schedule 等） | 同上 |
| `raw_jv_live` + `ops` | 速報（0B12 等）を夜間に取り込み、core と合成した最新版。HR（払戻）も含む | 毎晩更新（10-18 まで） |
| `v1a_keiba_data` | core から作った旧スキーマ互換（2019-01〜） | 10-07 構築 |

- v2 の週次の「蓄積データ（確定成績）取り込み → core 再構築」は **未整備**（review_findings F-18）。夜間の速報取り込みはあるが、`raw_jv_live` は取得のたびに上書きされるため、サイトの週次更新には F-18 が前提になる。
- BigQuery の利用上限はユーザー規約で 1 日 200GB（`etl/bqguard.py`）。現行の生成スクリプトは 1 回の全生成で約 14,000 クエリを発行し、3 年分のテーブルに対してでも **推定 300〜500GB** を読む。移行時に一括集計へ書き換える必要がある。

### 1.3 互換 SQL（v1compat）と、サイト要件との差分

| 項目 | 互換 SQL の状態 | 元データ（v2） | 対応 |
|---|---|---|---|
| 単勝・複勝払戻 `race_result.win / place` | NULL | `core.payout`（HR、馬番ごと） | マートで結合して埋める |
| 騎手のカナ・所属・現役・デビュー年 | NULL | `raw_jv.KS`（騎手名半角ｶﾅ、東西所属コード、免許交付・抹消日） | `core.jockey` を拡張、または マートで付与 |
| 調教師の同上 | NULL | `raw_jv.CH` | 同上 |
| 馬主名 `horse.owner_name` | NULL | `core.entry.owner_id` + `raw_jv.BN` | 出走ごとの馬主で集計（旧より正確） |
| 内回り・外回り `track_variant` | 外回りのみ `外`、内回りは NULL | `core.race.track_code` | 京都芝 1400/1600・新潟芝 2000 の inner/outer を両方ラベル化 |
| クラス `race_class` | 新馬〜オープンの 7 種 | `core.race.cond_code_youngest` + `grade_code` | サイトの 9 区分（G1/G2/G3/オープン/3勝/2勝/1勝/未勝利/新馬）へ対応 |
| 馬場 `track_condition` | 良/稍/重/不 | — | サイトの表記と一致。対応不要 |
| 頭数 `entry_count` | 登録頭数（旧と 100% 一致、脚質判定に使用） | — | 対応不要 |
| コーナー通過順 `corner_positions` | `1-2-3-4` 形式（旧と同じ） | — | 対応不要 |
| 騎手名の表記 | `Ｃ．ルメール`、`川田　将雅`（全角・全角空白） | — | NFKC 正規化と空白除去で `C.ルメール`、`川田将雅` に |
| 種牡馬名 | 209 件中 208 件が完全一致 | `core.horse.sire_name` | `クリエイターII`↔`クリエイター２` の別名表 |
| 種牡馬の生年 | — | `core.breeding_horse.birth_year` | 旧データの誤り（エピファネイア 2002 年）が直る |
| 地方・海外のレース | 含まない（旧と同じ） | `core.race_external` | 対象外のまま |

## 2. 移行後の構成

```
JRA-VAN (VM jvlink-win, 蓄積 差分: 月曜 14:00 以降)  →  gs://keibaai-v2-raw  →  raw_jv (追記)  →  core (再構築)
        ↓ sql/site/*.sql（新設: keibaai-v2.site データセット、直近 3 年 + マスタ）
        ↓ gcs/*.py（改修: 一括集計、クエリ数 14,000 → 約 80）
   GCS gs://umadata/{course,jockey,trainer,sires}/*.json  +  index.json（騎手・調教師・種牡馬の一覧）
        ↓ lib/get*DataFromGCS.ts（変更なし）、lib/*.ts の固定リストは GCS の index.json に置換（デプロイ不要で更新）
   Next.js (Vercel)  ←  生成後に ISR の再検証 API を叩いて即時反映
```

## 3. ステップと TODO

| # | ステップ | 主な TODO | 工数 | 依存 |
|---|---|---|---|---|
| 0 | 方針決定 | §5 の 5 項目を決める。JRA-VAN の規約確認 | 0.5 日（ユーザー） | — |
| 1 | v2: 週次の確定成績取り込み（F-18） | ①VM の蓄積 差分取得スクリプト（RACE 区分 7 / HR / UM / KS / CH / BN / HN / YS、option 1）②`raw_jv` への追記（行長・重複規則 F-01/F-09 を通す）③`core` の再構築を月曜に自動実行④`ops/night.sh` と同じ監視・ログ | 1.5 日 | 0 |
| 2 | サイト向けマート `keibaai-v2.site` | ①`v1compat/keiba_data.sql` を複製し §1.3 の差分 5 点を実装②直近 3 年（+1 週の余裕）に限定し `jockey_id / trainer_id / sire_id` でクラスタリング③`column_catalog` 相当の説明を付与④マスタ（騎手・調教師・種牡馬一覧、現役判定、所属） | 1.5 日 | 1 |
| 3 | 旧データとの突合 | ①`etl/v1compat_check.py` を拡張し、2024-01〜2026-09 の重複期間で、レース数・出走数・払戻合計・クラス別・馬場別・脚質別・内外別を比較②差があるものは原因を記録し、許容範囲を決める（取消・除外の扱い、払戻の出典の違い） | 1 日 | 2 |
| 4 | 生成スクリプトの改修 | ①接続先を `keibaai-v2.site` へ（プロジェクト・認証アカウントの切替）②1 エンティティ 1 クエリ → 全エンティティ一括集計（GROUP BY）に書き換え（約 80 クエリ）③名前の正規化、種牡馬の別名表④払戻を `site` の列から⑤一覧（lib/jockeys.ts 等）を GCS の `index.json` 出力に置換し、サイト側は fetch に変更⑥`generate_race_schedule.py` を `core.schedule` ベースに⑦`leading.json` も同じマートから | 3 日 | 2 |
| 5 | ステージング生成と全ページ比較 | ①`gs://umadata/staging/` へ全 681 ページ分を生成②現行 JSON と自動比較（各統計の件数・率の差、欠損、順位の入れ替わり）③`lib/dataPageText.ts` の生成文に不自然な出力がないか抽出④対象レース 30 未満（noindex）の増減を確認 | 1 日 | 3, 4 |
| 6 | サイト側の切替 | ①`BASE_URL`／パスの切替（staging → 本番プレフィックス）②一覧の fetch 化に伴う型と `generateStaticParams` の変更③`/about/data` の出典・更新頻度・除外ルールの文言更新（JRA-VAN の表記要件があれば追記）④`last_updated / data_period` の生成元確認⑤デプロイと ISR 再検証、サイトマップ確認 | 1 日 | 5 |
| 7 | 定期実行の自動化 | ①月曜: core 更新 → site マート → 生成 → GCS → 再検証 を 1 本の `ops/weekly_site.sh` に②実行場所の決定（Mac launchd か Cloud Run Job）③失敗時の Slack 通知④BigQuery 消費量のログ（bqguard 連携） | 1 日 | 1, 4, 6 |
| 8 | 旧パイプラインの停止と記録 | ①netkeiba スクレイパーの定期実行を停止②`umadata.keiba_data` を凍結（削除はしない）③ARCHITECTURE.md / CLAUDE.md / ADSENSE_REVIEW.md の更新 | 0.5 日 | 7 |

合計: 作業 **約 10.5 人日**。カレンダーでは **2〜3 週間**（ステップ 1 と 7 は実際の月曜で 2 回動作確認するため）。

### 推奨の進め方

1. 今週: ステップ 0 → 2 → 3（v2 側の既存 core で先に進められる。F-18 は並行）
2. 来週: ステップ 1（月曜に初回の週次取り込み）→ 4 → 5
3. 再来週: ステップ 6（切替）→ 7（2 回目の月曜で自動実行を確認）→ 8

## 4. リスクと対策

| リスク | 影響 | 対策 |
|---|---|---|
| JRA-VAN DataLab の規約で、データ由来の集計のウェブ公開や広告収益化に制限がある | 計画全体 | 着手前に規約と「JRA-VAN の表記」要否を確認（§5-1）。必要なら `/about/data` と各ページに出典表記 |
| 旧データとの数値差（払戻の出典、取消・除外の扱い、ラベルの定義）でページの数値が変わる | 読者の混乱、傾向判定の反転 | ステップ 3 で許容範囲を決め、切替時に `/about/data` に「2026-xx-xx から出典を JRA-VAN に変更」と明記 |
| BigQuery 消費が 200GB/日の上限に当たる | バッチ失敗 | 一括集計へ書き換え（ステップ 4-②）。切替前に dry run で消費量を測る |
| 週次取り込み（F-18）が月曜 14:00 の提供時刻に依存し、祝日開催や変則日程で欠ける | 更新遅れ | 火曜に再試行、欠損時は前週のまま公開し続ける |
| 一覧を GCS 化するとビルド時の fetch が増える | ビルド時間 | index.json は 3 ファイルのみ。失敗時は前回のビルドを維持（既存の notFound 方針と同じ） |
| AdSense 再申請（11 月上旬予定）と切替時期が重なる | 審査中の大幅な変更 | URL・ページ構成は変えないので影響は小さい。数値だけが変わる。切替は再申請の前か、審査結果が出た後のどちらかに寄せる |

## 5. 着手前に決めてほしいこと

1. **JRA-VAN DataLab の規約**：集計結果の公開・広告掲載が可能か、出典表記の要否。これが NG だと計画を見直す。
2. **種牡馬 ID**：現行のハッシュ ID を維持する（推奨。URL 不変、別名表 1 件で済む）か、繁殖登録番号に替えてリダイレクトを張るか。
3. **更新の実行場所**：Mac（既存の `ops/night.sh` と同じ方式、Mac が起動している必要あり）か、Cloud Run Job（常時動くが構築に +0.5 日）。
4. **集計期間**：直近 3 年を維持するか、JRA-VAN で 2013 年以降がそろうので「通算」や「5 年」を追加するか（追加はステップ 4 の後の別タスクとして見積もり直し）。
5. **切替時期**：AdSense 再申請（11 月上旬）の前に終えるか、審査結果後にするか。

## 6. 参考（調査で確認した事実）

- `keibaai-v2.core.entry` 672,887 行（2013〜2026-10-04）、`core.payout` 569,159 行、`core.jockey` 1,566 人、`core.trainer` 1,477 人、`core.breeding_horse` 161,995 頭
- `v1a_keiba_data.race_result` 367,260 行（2019-01-05〜2026-10-04、73.7MB）
- 速報の `raw_jv_live` には HR（払戻）も含まれる
- 騎手コードの一致例: 川田将雅 `01088`、Ｍ．デムーロ `05212`、Ｃ．ルメール `05339`、戸崎圭太 `05386`
- 種牡馬名の一致: 209 件中 208 件（不一致は `クリエイターII` → JRA-VAN では `クリエイター２`）
- 既存コード: `keibaai_v2/sql/v1compat/keiba_data.sql`、`keibaai_v2/etl/v1compat_check.py`、`keibaai_v2/etl/live_ingest.py`、`keibaai_v2/ops/night.sh`

## 7. 進捗（2026-10-18）

| # | ステップ | 状態 |
|---|---|---|
| 0 | 方針決定 | URL 全維持はユーザー決定。JRA-VAN の規約確認・実行場所・切替時期は未決 |
| 1 | v2 週次取り込み（F-18） | 未着手（VM の起動が必要。ユーザー許可待ち） |
| 2 | サイト向けマート | 完了: `keibaai-v2.site`（`keibaai_v2/sql/site/keiba_data.sql`、`etl/build_site.py`、0.2GB・20 秒） |
| 3 | 旧データとの突合 | 完了: 同一期間で全 681 ページを比較。セクション構成・行数は一致、リーディングは完全一致（`gcs/v2/README.md`） |
| 4 | 生成スクリプト改修 | 完了: `gcs/v2/`（DuckDB 互換層で旧 SQL をそのまま実行、課金なし、全ページ 2 分）。一覧は既存を維持して追加 |
| 5 | ステージング生成と比較 | 完了: `gs://umadata/v2staging/` に 701 ファイル |
| 6 | サイト側の切替 | 準備済み（`/about/data` の出典文、空ページ 2 件のリダイレクト）。本番パスへの同期と `lib/*.ts` の差し替えは未実施 |
| 7 | 自動化 | `gcs/v2/weekly.sh` 作成。launchd 登録と ISR 再検証 URL は未設定 |
| 8 | 旧パイプライン停止 | 未着手 |

設計上の変更点（計画からの差分）
- BigQuery 上で一括集計に書き換える案をやめ、マートをローカル Parquet に落として DuckDB で旧 SQL をそのまま実行する方式にした（書き換え量が少なく、BigQuery の消費もマート作成の 0.2GB のみ）。
- 一覧（`lib/*.ts`）は GCS 化せず、週次ジョブが差分を commit → push して Vercel を再ビルドする方式にした（`dynamicParams = false` のため、新ページにはビルドが必要）。
