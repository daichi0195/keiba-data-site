# KEIBA DATA LAB - システムアーキテクチャ

最終更新日: 2025-11-09

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [システムアーキテクチャ](#システムアーキテクチャ)
4. [ディレクトリ構造](#ディレクトリ構造)
5. [ルーティング設計](#ルーティング設計)
6. [コンポーネント設計](#コンポーネント設計)
7. [データモデル](#データモデル)
8. [データフロー](#データフロー)
9. [スタイリング戦略](#スタイリング戦略)
10. [パフォーマンス最適化](#パフォーマンス最適化)
11. [ビルド・デプロイメント](#ビルドデプロイメント)

---

## プロジェクト概要

**KEIBA DATA LAB（競馬データラボ）** は、日本の中央競馬のコース別統計データを可視化するWebアプリケーションです。

### 主要機能
- 📊 コース別成績データの表示（10競馬場対応）
- 👤 騎手・調教師・血統別ランキング
- 🎯 枠順・人気・脚質別の統計分析
- 📈 コース特性の可視化（荒れやすさ、枠順偏差、脚質偏差）
- 💡 買い目・消し目の法則提示

### 対象競馬場
札幌、函館、福島、中山、東京、新潟、中京、京都、阪神、小倉（全10場）

---

## 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| **Next.js** | 15.5.6 | Reactフレームワーク（App Router） |
| **React** | 19.1.0 | UIライブラリ |
| **TypeScript** | 5.x | 型安全な開発 |
| **CSS Modules** | - | スコープ付きスタイリング |

### ビルドツール
| 技術 | 説明 |
|------|------|
| **Turbopack** | Next.js 15統合の高速ビルドツール |
| **ESLint** | コード品質チェック |

### データソース
- **Google Cloud Storage (GCS)**: `https://storage.googleapis.com/umadata`
- JSON形式（統合JSON / NDJSON対応）

### デプロイメント
- **Vercel** (推奨)
- ISR（Incremental Static Regeneration）: 週1回再生成（604,800秒）

---

## システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                         ユーザー                              │
│                     (Browser / Mobile)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       Vercel CDN                             │
│                   (Edge Network)                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 (App Router)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Server Comp.  │  │ Client Comp. │  │   API Routes    │  │
│  │  (RSC)        │  │ ('use client)│  │                 │  │
│  └───────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│          │                  │                   │            │
└──────────┼──────────────────┼───────────────────┼────────────┘
           │                  │                   │
           ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   Google Cloud Storage                       │
│              https://storage.googleapis.com/umadata          │
│                                                               │
│  /course/{racecourse}/{surface}/{distance}.json              │
│  - nakayama/dirt/1800.json                                   │
│  - tokyo/turf/2400.json                                      │
│  - hanshin/dirt/1400.json                                    │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

### データの生成元（2026-10-18 以降）
GCS の JSON は `gcs/v2/` のスクリプトが生成する。元データは JRA-VAN DataLab.（`keibaai-v2` プロジェクトの BigQuery）で、
`keibaai-v2.site` マート → ローカル Parquet → DuckDB で集計 → `gs://umadata` へ同期、という流れ。
騎手・調教師・種牡馬の一覧（`lib/*.ts`）とリーディング（`public/data/leading.json`）はリポジトリから読まれるため、
週次ジョブ（`keibaai_v2/ops/weekly_ingest.sh`、毎週火曜 20:00 の launchd）が差分を commit → push して Vercel を再ビルドする。
詳細は `gcs/v2/README.md` と `docs/DATA_SOURCE_MIGRATION_PLAN.md`。旧 `gcs/*.py`（netkeiba 版）は使わない。

### データフロー
1. **ビルド時**: Next.js が GCS からデータを取得し、静的ページを生成
2. **ISR**: 週1回（604,800秒）自動再生成（週次ジョブの push による再ビルドの方が先に来る）
3. **配信**: Vercel CDN経由でエンドユーザーに配信
4. **インタラクション**: クライアントコンポーネントで動的UI（スクロール、展開、モーダル等）

---

## ディレクトリ構造

```
keiba-data-site/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # ルートレイアウト（ヘッダー、フッター）
│   ├── globals.css                   # グローバルスタイル
│   ├── page.module.css               # トップページ固有スタイル
│   └── courses/                      # コース別動的ルート
│       └── [racecourse]/
│           └── [surface]/
│               └── [distance]/
│                   └── page.tsx      # メインページコンポーネント
│
├── components/                       # 再利用可能なUIコンポーネント
│   ├── SectionNav.tsx                # ハンバーガーメニュー＆ナビゲーション
│   ├── SectionNav.module.css
│   ├── DataTable.tsx                 # 汎用ランキングテーブル（騎手/血統/調教師）
│   ├── GateTable.tsx                 # 枠順別データテーブル
│   ├── GateTable.module.css
│   ├── PopularityTable.tsx           # 人気別データテーブル
│   ├── PopularityTable.module.css
│   ├── RunningStyleTable.tsx         # 脚質別データテーブル
│   ├── RunningStyleTable.module.css
│   ├── HighlightsSection.tsx         # 注目ポイントセクション
│   ├── BarChartAnimation.tsx         # バーグラフアニメーション
│   ├── VolatilityExplanation.tsx     # 荒れやすさ説明モーダル
│   ├── GatePositionExplanation.tsx   # 枠順偏差説明モーダル
│   ├── RunningStyleExplanation.tsx   # 脚質偏差説明モーダル
│   ├── Footer.tsx                    # フッター
│   └── Footer.module.css
│
├── lib/                              # ユーティリティ・ライブラリ
│   └── getCourseDataFromGCS.ts       # GCSデータ取得関数
│
├── public/                           # 静的アセット
│   └── scripts/
│       └── highlight-max-values.js   # テーブルハイライト用スクリプト（未使用の可能性）
│
├── next.config.ts                    # Next.js設定（Turbopack有効化）
├── tsconfig.json                     # TypeScript設定
├── eslint.config.mjs                 # ESLint設定
├── package.json                      # 依存関係管理
├── CLAUDE.md                         # Claude Code向け開発ガイドライン
└── ARCHITECTURE.md                   # 本ドキュメント
```

---

## ルーティング設計

### 動的ルート
```
/courses/[racecourse]/[surface]/[distance]
```

#### パラメータ定義

| パラメータ | 型 | 値の例 | 説明 |
|-----------|-----|--------|------|
| `racecourse` | string | `nakayama`, `tokyo`, `hanshin`, `kyoto` | 競馬場名（英語） |
| `surface` | string | `turf` (芝), `dirt` (ダート) | 馬場種別 |
| `distance` | number | `1200`, `1800`, `2400` | 距離（メートル） |

#### URLの例
```
/courses/nakayama/dirt/1800   → 中山競馬場 ダート1800m
/courses/tokyo/turf/2400       → 東京競馬場 芝2400m
/courses/hanshin/dirt/1400     → 阪神競馬場 ダート1400m
```

### メタデータ生成
各ページは`generateMetadata()`でSEO最適化されたメタデータを動的生成：
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { racecourse, surface, distance } = await params;
  const title = `${racecourse} ${surface} ${distance}m - KEIBA DATA LAB`;
  const description = `${racecourse}競馬場 ${surface} ${distance}mの統計データ`;
  return { title, description };
}
```

---

## コンポーネント設計

### コンポーネント分類

#### 1. Server Components（サーバーコンポーネント）
- `app/layout.tsx`: ルートレイアウト
- `app/courses/[racecourse]/[surface]/[distance]/page.tsx`: メインページ（データ取得）

#### 2. Client Components（クライアントコンポーネント）
全てのUIコンポーネントは `'use client'` ディレクティブで定義。

| コンポーネント | 責務 | 主要機能 |
|---------------|------|---------|
| **SectionNav** | ナビゲーション | ハンバーガーメニュー、競馬場別アコーディオン、Coming Soonエリア |
| **DataTable** | 汎用ランキング表示 | 騎手/血統/調教師データ、展開/折りたたみ、スクロール時名前短縮、最大値ハイライト |
| **GateTable** | 枠順別統計 | 8枠の色分けバッジ、勝率・回収率表示、最大値ハイライト |
| **PopularityTable** | 人気別統計 | 7段階の人気区分（1人気、2人気、...、10人気-）、最大値ハイライト |
| **RunningStyleTable** | 脚質別統計 | 4脚質（逃げ、先行、差し、追込）、最大値ハイライト |
| **HighlightsSection** | 注目ポイント | 買い目・消し目の条件表示、モーダル説明 |
| **BarChartAnimation** | バーグラフ | コース特性可視化（枠順偏差、脚質偏差のグラフ） |
| **VolatilityExplanation** | 説明モーダル | 荒れやすさの評価方法説明 |
| **GatePositionExplanation** | 説明モーダル | 枠順偏差の評価方法説明 |
| **RunningStyleExplanation** | 説明モーダル | 脚質偏差の評価方法説明 |
| **Footer** | フッター | サイト情報、リンク |

### コンポーネント間の通信
- **Props Drilling**: 親→子へのデータ渡し（グローバル状態管理なし）
- **ローカル状態**: `useState`でUI状態管理（展開/折りたたみ、スクロール位置、モーダル表示）
- **イベント**: クリック、スクロール、Intersection Observer

---

## データモデル

### 統合データ構造
GCSから取得するJSON形式：

```typescript
{
  course_info: {
    racecourse: string;          // "中山競馬場"
    racecourse_en: string;       // "nakayama"
    surface: string;             // "ダート" | "芝"
    surface_en: string;          // "dirt" | "turf"
    distance: number;            // 1800
    total_races: number;         // 245
    data_period: string;         // "直近3年間分（2021年1月1日〜2024年12月31日）"
    last_updated: string;        // "2024年12月31日"
    summary: string;             // コースの特徴
    characteristics: {
      running_style: number;     // 脚質偏差（1-5）
      volatility: number;        // 荒れやすさ（1-5）
      gate_position: number;     // 枠順偏差（1-5）
    };
    ranking: {
      trifecta_avg_payback_rank: number;
      trifecta_avg_payback: number;
      trifecta_median_payback: number;
      trifecta_all_median_payback: number;
      total_courses: number;
    };
    buying_points: {
      jockey: {
        strong: HighlightsItem[];
        upset?: HighlightsItem[];
        weak: HighlightsItem[];
      };
      pedigree: {
        sire: { strong: HighlightsItem[]; weak: HighlightsItem[] };
        dam_sire: { strong: HighlightsItem[]; weak: HighlightsItem[] };
      };
      trainer: {
        strong: HighlightsItem[];
        weak: HighlightsItem[];
      };
    };
  };

  // 人気別統計（7段階）
  popularity_stats: {
    fav1: MetricData;       // 1番人気
    fav2: MetricData;       // 2番人気
    fav3: MetricData;       // 3番人気
    fav4: MetricData;       // 4番人気
    fav5: MetricData;       // 5番人気
    fav6to9: MetricData;    // 6-9番人気
    fav10plus: MetricData;  // 10番人気以下
  };

  // 枠順別統計（8枠）
  gate_stats: Array<{
    gate: number;         // 1-8
    color: string;        // 枠色（#FFFFFF, #222222, ...）
    races: number;
    wins: number;
    places_2: number;
    places_3: number;
    win_rate: number;
    place_rate: number;
    quinella_rate: number;
    win_payback: number;
    place_payback: number;
  }>;

  // 脚質別統計（4種）
  running_style_stats: Array<{
    style: string;        // "逃げ", "先行", "差し", "追込"
    races: number;
    wins: number;
    places_2: number;
    places_3: number;
    win_rate: number;
    place_rate: number;
    quinella_rate: number;
    win_payback: number;
    place_payback: number;
  }>;

  // 騎手別統計（TOP 26）
  jockey_stats: Array<{
    rank: number;
    name: string;
    races: number;
    wins: number;
    places_2: number;
    places_3: number;
    win_rate: number;
    place_rate: number;
    quinella_rate: number;
    win_payback: number;
    place_payback: number;
  }>;

  // 血統別統計（TOP 15）
  pedigree_stats: Array<{
    rank: number;
    sire: string;         // 種牡馬名
    races: number;
    wins: number;
    places_2: number;
    places_3: number;
    win_rate: number;
    place_rate: number;
    quinella_rate: number;
    win_payback: number;
    place_payback: number;
  }>;

  // 母父馬別統計（TOP 20）
  dam_sire_stats: Array<{
    rank: number;
    dam_sire: string;     // 母父馬名
    races: number;
    wins: number;
    places_2: number;
    places_3: number;
    win_rate: number;
    place_rate: number;
    quinella_rate: number;
    win_payback: number;
    place_payback: number;
  }>;

  // 調教師別統計（TOP 20）
  trainer_stats: Array<{
    rank: number;
    trainer: string;
    races: number;
    wins: number;
    places_2: number;
    places_3: number;
    win_rate: number;
    place_rate: number;
    quinella_rate: number;
    win_payback: number;
    place_payback: number;
  }>;
}
```

### 共通メトリクス型
```typescript
type MetricData = {
  races: number;          // 出走数
  wins: number;           // 1着回数
  places_2: number;       // 2着回数
  places_3: number;       // 3着回数
  win_rate: number;       // 勝率（%）
  place_rate: number;     // 複勝率（%）
  quinella_rate: number;  // 連対率（%）
  win_payback: number;    // 単勝回収率（%）
  place_payback: number;  // 複勝回収率（%）
};
```

---

## データフロー

### 1. ビルド時（Static Generation）
```
[Next.js Build]
    ↓
[getCourseDataFromGCS(racecourse, surface, distance)]
    ↓
[GCS Fetch] https://storage.googleapis.com/umadata/course/{racecourse}/{surface}/{distance}.json
    ↓
[JSON Parse & Transform]
    ↓
[RSC Render] Server Component
    ↓
[HTML Generation] 静的HTMLファイル
    ↓
[Vercel Deployment] CDN配信
```

### 2. ランタイム（ユーザーアクセス時）
```
[User Request] /courses/nakayama/dirt/1800
    ↓
[Vercel CDN] キャッシュ済みHTML配信
    ↓
[Browser Hydration] React Hydration
    ↓
[Client Component Activation] イベントリスナー登録
    ↓
[User Interaction] スクロール、クリック、展開、モーダル表示
```

### 3. ISR（Incremental Static Regeneration）
```
[Scheduled Trigger] 週1回（604,800秒）
    ↓
[Revalidate] 古いキャッシュ無効化
    ↓
[Re-fetch GCS Data] 最新データ取得
    ↓
[Re-generate HTML] 静的ページ再生成
    ↓
[Update CDN Cache] 新しいHTMLで更新
```

---

## スタイリング戦略

### 3層アプローチ

#### 1. グローバルスタイル（`app/globals.css`）
- **CSS Custom Properties**: カラーパレット、グラデーション
- **リセットCSS**: マージン、パディング、ボックスモデル
- **基本スタイル**: `body`, `header`, `main`, `h1-h6`
- **共通クラス**: `.section`, `.section-title`, `.breadcrumb`, `.course-header`
- **モバイルテーブル**: `.mobile-data-table`, `.mobile-sticky-col`, `.mobile-scroll-col`

```css
:root {
  --primary-green: #1db854;
  --primary-green-dark: #1a9f47;
  --primary-green-light: #3bbf66;
  --gradient-green: linear-gradient(135deg, #1db854 0%, #0ea342 100%);
  --text-dark: #0f172a;
  --text-secondary: #475569;
  --bg-light: #f0fdf4;
  --border-color: #d1f0e5;
}
```

#### 2. CSS Modules（コンポーネント固有）
- **スコープ付きスタイル**: クラス名の衝突回避
- **例**:
  - `SectionNav.module.css` → `.hamburger`, `.mobileMenu`, `.accordionItem`
  - `DataTable.module.css` → `.table`, `.stickyCol`, `.scrollCol`
  - `GateTable.module.css` → `.gateBadge`, `.gateCol`

#### 3. インラインスタイル
- **データ駆動の動的スタイル**: 枠番の色 `style={{ backgroundColor: row.color }}`
- **最小限の使用**: 原則CSSクラスを優先

### デザインシステム

#### カラーパレット
| 用途 | カラー | Hex |
|------|--------|-----|
| プライマリ（緑） | Primary Green | `#1db854` |
| プライマリ（濃緑） | Primary Green Dark | `#1a9f47` |
| アクセント（緑） | Accent Green | `#0ea342` |
| 背景（淡緑） | Background Light | `#f0fdf4` |
| 背景（白系） | Background Lighter | `#fbfcfb` |
| ボーダー | Border Color | `#d1f0e5` |
| テキスト（濃） | Text Dark | `#0f172a` |
| テキスト（中） | Text Secondary | `#475569` |
| テキスト（淡） | Text Light | `#94a3b8` |
| ハイライト（金） | Gold Rank | `#FCEA7F` |
| ハイライト（銀） | Silver Rank | `#CBDEFF` |
| ハイライト（銅） | Bronze Rank | `#EFC79F` |

#### タイポグラフィ
```css
font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
```

| 要素 | サイズ（PC） | サイズ（SP） |
|------|-------------|-------------|
| サイト名 | 1.3rem | 1.3rem |
| h1 (コース名) | 2rem | 1.3rem |
| h2 (セクションタイトル) | 1.75rem | 1.2rem |
| テーブルヘッダー | 13px | 13px |
| テーブルボディ | 13px | 13px |

#### レスポンシブブレークポイント
```css
@media (min-width: 768px) {
  /* PC版スタイル */
}

@media (max-width: 768px) {
  /* モバイル版スタイル */
}
```

### UI/UXパターン

#### スティッキーカラム
- テーブル横スクロール時、順位と名前列を固定
- `position: sticky; left: 0;` / `left: 35px;`
- スクロール時に名前列を狭く（100px → 60px）、名前を3文字に短縮

#### 最大値ハイライト
- 各指標（勝率、回収率等）の最大値セルを緑ハイライト
- `background: linear-gradient(135deg, #d1f0e5 0%, #e8f9f0 100%);`

#### モーダル
- 条件説明用のオーバーレイモーダル
- `position: fixed;` + `rgba(0, 0, 0, 0.5)` 背景

#### アコーディオン
- ハンバーガーメニュー内の競馬場別展開
- `details` / `summary` タグ、または`useState`による制御

---

## パフォーマンス最適化

### 1. Static Generation（SSG）
- ビルド時に全ページを事前生成
- レスポンス速度: CDN直接配信 → ~50ms

### 2. Incremental Static Regeneration（ISR）
```typescript
export const revalidate = 604800; // 週1回（7日 = 604,800秒）
```
- 古いデータを自動更新
- ユーザーは常にキャッシュされたページにアクセス（高速）

### 3. Turbopack
- Webpackより高速なビルドツール
- 開発時のホットリロード高速化

### 4. CSS Modules
- スタイルの自動スコープ化 → クラス名の衝突なし
- 未使用CSSの自動削除

### 5. Lazy Loading（検討中）
- 画像やコンポーネントの遅延ロード
- 現状は全データ一括表示

### 6. クライアント最適化
- `Intersection Observer`: セクションナビゲーションのアクティブ状態検出
- スクロールイベント最適化: デバウンス不要（ブラウザネイティブ）

---

## ビルド・デプロイメント

### ローカル開発
```bash
# 依存関係インストール
npm install

# 開発サーバー起動（Turbopack）
npm run dev
# → http://localhost:3000

# リント
npm run lint
```

### プロダクションビルド
```bash
# ビルド（Turbopack）
npm run build

# プレビュー
npm start
# → http://localhost:3000
```

### Vercelデプロイ
1. **自動デプロイ**: GitHub連携で`main`ブランチへのプッシュ時に自動ビルド
2. **環境変数**: 不要（GCSは公開URL）
3. **ISR設定**: `revalidate = 604800`が自動認識される

### CI/CD（GitHub Actions）
- `.github/workflows/deploy.yml`: 週1回のスケジュールビルド
- Vercel Webhookトリガーでビルド実行

---

## 今後の拡張予定

### フェーズ2: 追加データカテゴリ
- 🧑 **騎手別データページ**: `/jockeys/[jockey_name]`
- 👨‍🏫 **調教師別データページ**: `/trainers/[trainer_name]`
- 🧬 **血統別データページ**: `/pedigrees/[sire_name]`

### フェーズ3: 機能拡張
- 🔍 **検索機能**: 騎手名、調教師名、血統名検索
- 📊 **グラフ可視化**: Chart.jsやRechartsによるグラフ表示
- 📅 **期間フィルター**: 直近1年、3年、5年のデータ切り替え
- 💾 **お気に入り機能**: LocalStorageでユーザー設定保存

### フェーズ4: パフォーマンス改善
- 🖼️ **画像最適化**: Next.js Image最適化
- 📦 **コード分割**: Dynamic Importでバンドルサイズ削減
- 🚀 **Edge Functions**: APIルートのエッジ実行

---

## 参考リンク

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vercel Deployment](https://vercel.com/docs)
- [CSS Modules](https://github.com/css-modules/css-modules)

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-11-09 | 1.0.0 | 初版作成（システムアーキテクチャドキュメント） |

---

**メンテナー**: KEIBA DATA LAB開発チーム
**ライセンス**: Private
