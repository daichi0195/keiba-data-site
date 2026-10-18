# gcs/v2 — JRA-VAN 準拠 DB からサイト用 JSON を生成する

2026-10-18 に `gcs/*.py` (netkeiba スクレイピング版 `umadata.keiba_data` を BigQuery で集計) を置き換えるために作成。
計画と調査結果は `docs/DATA_SOURCE_MIGRATION_PLAN.md`。

## 流れ

```
keibaai-v2.core / raw_jv (JRA-VAN DataLab 由来)
  │  keibaai_v2/etl/build_site.py   … sql/site/keiba_data.sql で旧スキーマ互換のマート site.* を作る (約 0.2GB 読み取り、20 秒)
  ▼
keibaai-v2.site (race_master / race_result / horse / jockey / trainer / sire / breeding_alias)
  │  localdb.py fetch               … 6 テーブルを data/*.parquet に落とす (約 10MB)
  ▼
DuckDB (ローカル)                    … localdb.LocalClient が BigQuery 方言の SQL を DuckDB 方言に変換して実行
  │  generate_lists.py              … lib/{jockeys,trainers,sires}.ts を「既存を維持して追加」で更新 (URL 維持)
  │  generate_courses.py / generate_jockeys.py / generate_trainers.py / generate_sires.py / generate_leading_data.py
  ▼
out/{course,jockey,trainer,sires}/*.json, out/leading.json, out/lib/*.ts, out/index/*.json
  │  upload.py [--prefix v2staging]  … gs://umadata へ rsync (umadata.daichi@gmail.com)
  ▼
Next.js (lib/get*DataFromGCS.ts、変更なし)
```

`weekly.sh` が 2〜5 を一括で行う。さらに上流の確定成績の取り込み (VM 起動 → JV-Link 差分取得 → raw_jv → core 再構築) を含めた全体は
`keibaai_v2/ops/weekly_ingest.sh` が行い、毎週火曜 20:00 に launchd (`keibaai_v2/ops/com.keibadata.weekly.plist`、ラベル `com.keibadata.weekly`) から実行する。
ログは `keibaai_v2/data/ops/weekly/<日付>.log` と `gcs/v2/logs/weekly_<日付>.log`。手動で流すときは `keibaai_v2/ops/weekly_ingest.sh` (VM あり) か
`gcs/v2/weekly.sh` (core が最新のとき、サイト側だけ)。

## 生成スクリプトについて

- `generate_*.py` は `gcs/` の旧スクリプトのコピーに最小限の変更を入れたもの (BigQuery クライアント → `LocalClient`、GCS 直接アップロード → `save_json`)。
  SQL 本文は旧版のままなので、集計の定義は変わらない。
- 旧版は 1 回の全生成で約 14,000 クエリを BigQuery に投げる (推定 300〜500GB)。v2 はマート取得の 1 回だけ BigQuery を使い、集計は DuckDB で行う (全 681 ページで 2 分、課金なし)。
- `SITE_AS_OF=2026-10-02` で「現在日」を固定、`SITE_UNTIL=2026-09-27` でそれより後のレースを除外できる (旧データとの突合用)。
- `compare.py --summary course/` などで本番 JSON との差を集計できる。

## 旧データ (netkeiba) との対応

| 項目 | 対応 |
|---|---|
| 騎手・調教師 ID | JRA コードと同じ (例: ルメール 5339) |
| 種牡馬 ID | 名前の SHA256 ハッシュ (旧と同じ)。既存の連番 ID (99557〜) も `lib/sires.ts` を正として維持 |
| 名前の表記 | NFKC 正規化 + 空白除去 (`Ｃ．ルメール` → `C.ルメール`、`川田　将雅` → `川田将雅`) |
| 外国産馬の父・母父 | 同じ繁殖馬の欧字名と片仮名名を片仮名に統一 (`Sunday Silence` → `サンデーサイレンス`)。サイトの既存表記が欧字のもの (`American Pharoah` 等) は `sire_aliases.json` で戻す |
| 同名馬の「２」 | netkeiba 流の「II」に (`クリエイター２` → `クリエイターII`) |
| 現役判定 | 美浦・栗東は JRA 免許の有効性、地方・海外は直近 3 年の騎乗の有無 |
| 払戻 | `core.payout` (HR) の単勝・複勝・三連単 |
| 内回り・外回り | トラックコード 12/18/26 を「外」 (京都芝 1400/1600・新潟芝 2000) |

突合 (2026-10-18、同じ期間で比較) の結果: 全 681 ページでセクション構成と行数は一致。数値の差は、人気順・コーナー通過順のわずかな違い (JRA 公式値)、引退騎手・調教師の除外、少数サンプルの回収率に限られる。リーディング TOP10 は完全一致。
