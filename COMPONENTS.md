# コンポーネント詳細リファレンス

最終更新日: 2025-11-09

## 📑 目次

1. [Server Components](#server-components)
2. [Client Components](#client-components)
3. [共通Props型定義](#共通props型定義)
4. [スタイルガイド](#スタイルガイド)
5. [開発時のベストプラクティス](#開発時のベストプラクティス)

---

## Server Components

### `app/layout.tsx`
**役割**: ルートレイアウト、全ページ共通のヘッダー・フッター

```typescript
export default function RootLayout({ children }: { children: React.ReactNode })
```

**構造**:
- `<header>`: サイト名 + SectionNav（ハンバーガーメニュー）
- `{children}`: ページコンテンツ
- `<Footer>`: フッター

**スタイル**: `app/globals.css`

---

### `app/courses/[racecourse]/[surface]/[distance]/page.tsx`
**役割**: コース別データページのメインコンポーネント

**動的ルート**:
```typescript
type Params = Promise<{
  racecourse: string;
  surface: string;
  distance: string;
}>
```

**主要関数**:
```typescript
// メタデータ生成
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata>

// ページコンポーネント
export default async function CoursePage({ params }: { params: Params })
```

**データ取得**:
```typescript
import { getCourseDataFromGCS } from '@/lib/getCourseDataFromGCS';

const courseData = await getCourseDataFromGCS(racecourse, surface, parseInt(distance));
```

**レンダリング内容**:
1. パンくずナビゲーション
2. コースヘッダー（コース名、メタ情報）
3. サマリーボックス
4. コース特性セクション（荒れやすさ、枠順偏差、脚質偏差）
5. 注目ポイント（HighlightsSection）
6. 人気別データ（PopularityTable）
7. 枠順別データ（GateTable）
8. 脚質別データ（RunningStyleTable）
9. 騎手ランキング（DataTable）
10. 血統ランキング（DataTable）
11. 母父馬ランキング（DataTable）
12. 調教師ランキング（DataTable）
13. フッターパンくず

**ISR設定**:
```typescript
export const revalidate = 604800; // 週1回再生成
```

---

## Client Components

### `components/SectionNav.tsx`
**役割**: ハンバーガーメニューとモバイルナビゲーション

**Props**:
```typescript
{ items: Item[] }

type Item = { id: string; label: string };
```

**State**:
```typescript
const [activeId, setActiveId] = useState<string>('');
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [expandedRacecourse, setExpandedRacecourse] = useState<Record<string, boolean>>({});
```

**主要機能**:
- ハンバーガーメニュー（3本線アイコン）
- 競馬場別アコーディオンメニュー（10競馬場）
- Coming Soonセクション（騎手別、調教師別、血統別）
- Intersection Observerでセクションアクティブ状態検出

**データ構造**:
```typescript
const racecoursesData: Racecourse[] = [
  {
    name: '札幌競馬場',
    nameEn: 'sapporo',
    courses: [
      { name: '芝 1000m', distance: 1000, surface: 'turf' },
      // ...
    ]
  },
  // ...
];
```

**スタイル**: `components/SectionNav.module.css`

---

### `components/DataTable.tsx`
**役割**: 汎用ランキングテーブル（騎手/血統/母父馬/調教師）

**Props**:
```typescript
{
  title: string;
  data: DataRow[];
  initialShow?: number; // デフォルト10件表示
}

type DataRow = {
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
};
```

**State**:
```typescript
const [showAll, setShowAll] = useState(false);
const [isScrolled, setIsScrolled] = useState(false);
```

**主要機能**:
1. **展開/折りたたみ**: 初期10件 → 「もっと見る」で全件表示
2. **スティッキーカラム**: 順位と名前列を横スクロール時に固定
3. **名前短縮**: スクロール時に名前を3文字に短縮（100px → 60px）
4. **最大値ハイライト**: 各指標の最大値セルを緑ハイライト
5. **ランクバッジ**: 1位（金）、2位（銀）、3位（銅）

**テーブル構造**:
| 順位 | 名前 | 出走数 | 1着 | 2着 | 3着 | 勝率 | 連対率 | 複勝率 | 単勝回収率 | 複勝回収率 |
|------|------|--------|-----|-----|-----|------|--------|--------|-----------|-----------|

**スタイル**: グローバルCSS（`.mobile-data-table`クラス群）

---

### `components/GateTable.tsx`
**役割**: 枠順別データテーブル

**Props**:
```typescript
{
  title: string;
  data: GateRow[];
}

type GateRow = {
  gate: number;        // 1-8
  color: string;       // 枠色（#FFFFFF, #222222, ...）
  races: number;
  wins: number;
  places_2: number;
  places_3: number;
  win_rate: number;
  place_rate: number;
  quinella_rate: number;
  win_payback: number;
  place_payback: number;
};
```

**State**:
```typescript
const [isScrolled, setIsScrolled] = useState(false);
```

**主要機能**:
1. **枠番バッジ**: 8枠の色分け表示
2. **最大値ハイライト**: 勝率、連対率、複勝率、回収率の最大値
3. **スティッキーカラム**: 枠番列を固定

**枠色定義**:
```typescript
1: '#FFFFFF' (白)
2: '#222222' (黒)
3: '#C62927' (赤)
4: '#2573CD' (青)
5: '#E4CA3C' (黄)
6: '#58AF4A' (緑)
7: '#FAA727' (橙)
8: '#DC6179' (桃)
```

**スタイル**: `components/GateTable.module.css`

---

### `components/PopularityTable.tsx`
**役割**: 人気別データテーブル

**Props**:
```typescript
{
  title: string;
  data: PopularityStats;
}

type PopularityBand = 'fav1' | 'fav2' | 'fav3' | 'fav4' | 'fav5' | 'fav6to9' | 'fav10plus';
type PopularityStats = Record<PopularityBand, MetricData>;
```

**State**:
```typescript
const [isScrolled, setIsScrolled] = useState(false);
```

**主要機能**:
1. **7段階人気区分**: 1人気、2人気、3人気、4人気、5人気、6-9人気、10人気-
2. **最大値ハイライト**: 各指標の列ごと最大値を緑ハイライト
3. **人気ラベル色分け**: 1人気（濃緑）、2-3人気（緑）、中人気（黄）、大穴（赤）

**テーブル構造**:
| 人気 | 勝率 | 連対率 | 複勝率 | 単勝回収率 | 複勝回収率 |
|------|------|--------|--------|-----------|-----------|

**スタイル**: `components/PopularityTable.module.css`

---

### `components/RunningStyleTable.tsx`
**役割**: 脚質別データテーブル

**Props**:
```typescript
{
  title: string;
  data: RunningStyleRow[];
}

type RunningStyleRow = {
  style: string;       // "逃げ", "先行", "差し", "追込"
  races: number;
  wins: number;
  places_2: number;
  places_3: number;
  win_rate: number;
  place_rate: number;
  quinella_rate: number;
  win_payback: number;
  place_payback: number;
};
```

**State**:
```typescript
const [isScrolled, setIsScrolled] = useState(false);
```

**主要機能**:
1. **4脚質**: 逃げ、先行、差し、追込
2. **最大値ハイライト**: 各指標の最大値
3. **脚質バッジ**: 脚質名の視覚的表示

**スタイル**: `components/RunningStyleTable.module.css`

---

### `components/HighlightsSection.tsx`
**役割**: 注目ポイントセクション（買い目・消し目）

**Props**:
```typescript
{
  courseInfo: {
    buying_points: {
      jockey: { strong: HighlightsItem[]; upset?: HighlightsItem[]; weak: HighlightsItem[] };
      pedigree: {
        sire: { strong: HighlightsItem[]; weak: HighlightsItem[] };
        dam_sire: { strong: HighlightsItem[]; weak: HighlightsItem[] };
      };
      trainer: { strong: HighlightsItem[]; weak: HighlightsItem[] };
    };
  };
}

type HighlightsItem = {
  name: string;
  record?: string;
  win_rate: string;
  place_rate: string;
  win_payback: string;
  place_payback: string;
};
```

**State**:
```typescript
const [modalState, setModalState] = useState<{
  isOpen: boolean;
  subsectionKey: string | null;
}>({ isOpen: false, subsectionKey: null });
```

**主要機能**:
1. **強い買い目**: 複勝率TOP5かつ複勝回収率100%以上
2. **穴狙い**: 複勝率TOP5未満かつ複勝回収率100%以上
3. **弱い消し目**: 複勝率10%以下かつ複勝回収率30%未満
4. **条件説明モーダル**: `?`ボタンで詳細条件を表示

**カード表示**:
- 強い買い目: 緑背景（`#f0fdf4`）+ 緑ボーダー
- 穴狙い: 緑背景（同上）
- 弱い消し目: 黄背景（`#fffbf0`）+ オレンジボーダー

**スタイル**: グローバルCSS（`.highlight-card`クラス群）

---

### `components/BarChartAnimation.tsx`
**役割**: バーグラフアニメーション（枠順偏差、脚質偏差）

**Props**:
```typescript
{
  data: Array<{
    label: string;
    value: number;     // パーセンテージ（0-100）
    badge?: string;    // バッジテキスト（"1枠", "逃げ"等）
    color?: string;    // バー色
  }>;
  maxValue?: number;   // 最大値（デフォルト100）
}
```

**主要機能**:
1. **アニメーション**: ページ表示時にバーが0%から伸びる（`expandWidth`アニメーション）
2. **Intersection Observer**: ビューポートに入ったらアニメーション開始
3. **色分け**: 枠順→枠色、脚質→共通色

**スタイル**: グローバルCSS（`.bar-chart`クラス群）

---

### `components/VolatilityExplanation.tsx`
**役割**: 荒れやすさ説明モーダル

**Props**: なし（内部で説明テキストを保持）

**主要機能**:
- モーダル表示/非表示
- 評価方法の説明（5段階評価基準）

**スタイル**: グローバルCSS（`.volatility-modal`クラス群）

---

### `components/GatePositionExplanation.tsx`
**役割**: 枠順偏差説明モーダル

**Props**: なし

**主要機能**:
- モーダル表示/非表示
- 評価方法の説明（枠順による有利/不利の判定基準）

**スタイル**: グローバルCSS（`.explanation-modal`クラス群）

---

### `components/RunningStyleExplanation.tsx`
**役割**: 脚質偏差説明モーダル

**Props**: なし

**主要機能**:
- モーダル表示/非表示
- 評価方法の説明（脚質による有利/不利の判定基準）

**スタイル**: グローバルCSS（`.explanation-modal`クラス群）

---

### `components/Footer.tsx`
**役割**: フッター

**Props**: なし

**主要機能**:
- コピーライト表示
- リンク（利用規約、プライバシーポリシー等）

**スタイル**: `components/Footer.module.css`

---

## 共通Props型定義

### MetricData（統計データ共通型）
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

### HighlightsItem（注目ポイント項目）
```typescript
type HighlightsItem = {
  name: string;          // 名前（騎手名、血統名、調教師名）
  record?: string;       // 成績（"75-58-42"形式）
  win_rate: string;      // 勝率（"31.3%"形式）
  place_rate: string;    // 複勝率
  win_payback: string;   // 単勝回収率
  place_payback: string; // 複勝回収率
};
```

---

## スタイルガイド

### クラス命名規則

#### グローバルクラス（`app/globals.css`）
- **ケバブケース**: `.section-title`, `.breadcrumb-footer`
- **プレフィックス**: `.mobile-*`（モバイルテーブル）、`.highlight-*`（注目ポイント）

#### CSS Modules
- **キャメルケース**: `.mobileMenu`, `.accordionItem`, `.gateBadge`
- **コンポーネント名プレフィックス不要**（スコープ付きのため）

### レスポンシブ対応

#### PC（768px以上）
```css
@media (min-width: 768px) {
  main {
    max-width: 1200px;
    padding: 2rem;
  }
}
```

#### モバイル（768px未満）
```css
@media (max-width: 768px) {
  h2.section-title {
    font-size: 1.2rem;
  }
}
```

---

## 開発時のベストプラクティス

### 1. Server vs Client Components
- **デフォルト**: Server Component（データ取得、静的レンダリング）
- **Client Component**: イベントハンドラ、`useState`、`useEffect`が必要な場合のみ
- **ディレクティブ**: `'use client'` を先頭に記述

### 2. データ取得
```typescript
// ✅ Good: Server Componentでデータ取得
const data = await getCourseDataFromGCS(racecourse, surface, distance);

// ❌ Bad: Client Componentでfetch（不要なネットワークリクエスト）
useEffect(() => { fetch(...) }, []);
```

### 3. スタイル優先順位
1. **グローバルCSS**: 共通スタイル、レイアウト
2. **CSS Modules**: コンポーネント固有のスタイル
3. **インラインスタイル**: データ駆動の動的スタイルのみ

### 4. 型定義
- **共通型**: `types/`ディレクトリにまとめる（将来）
- **Props型**: コンポーネント内で定義
- **データ型**: `lib/getCourseDataFromGCS.ts`で一元管理

### 5. パフォーマンス
- **最大値計算**: `Math.max(...data.map(d => d.win_rate))` は`useMemo`不要（データ変更なし）
- **スクロールイベント**: デバウンス不要（ブラウザネイティブで最適化済み）
- **Intersection Observer**: セクションナビのアクティブ状態検出に使用

### 6. アクセシビリティ
- **セマンティックHTML**: `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`
- **aria-label**: ボタンに説明ラベル
- **alt属性**: 画像（現状未使用）

---

## トラブルシューティング

### テーブルが横スクロールしない
- **原因**: `.mobile-table-scroll`の`overflow-x: auto;`が欠落
- **解決**: CSSで`overflow-x: auto; -webkit-overflow-scrolling: touch;`を確認

### 名前列が固定されない
- **原因**: `position: sticky;`がベンダープレフィックス不足
- **解決**: `-webkit-sticky`も追加（Safari対応）

### 最大値ハイライトが表示されない
- **原因**: 最大値計算ロジックのバグ、またはCSS優先度不足
- **解決**: `console.log(maxValue)`でデバッグ、`!important`で優先度上げ

### ISRが動作しない
- **原因**: `revalidate`の設定漏れ、またはVercelのキャッシュ
- **解決**: `export const revalidate = 604800;`を確認、Vercelダッシュボードでキャッシュクリア

---

**メンテナー**: KEIBA DATA LAB開発チーム
