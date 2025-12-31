# 記事レイアウトコンポーネント使用ガイド

## 概要

`ArticleLayout`コンポーネントは、プライバシーポリシーや利用規約などの記事ページで統一されたレイアウトを提供する汎用コンポーネントです。

## ファイル構成

```
components/
├── ArticleLayout.tsx              # 記事レイアウトコンポーネント
├── ArticleLayout.module.css       # レイアウト用CSS
└── article-content.module.css     # 記事コンテンツ用CSS
```

## 使い方

### 基本的な使用例

```tsx
import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import styles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '記事タイトル | 競馬データ.com',
  description: '記事の説明文',
};

export default function ArticlePage() {
  return (
    <ArticleLayout
      title="記事タイトル"
      publishDate="2025年1月1日"
    >
      <section className={styles.section}>
        <h2 className={styles.heading}>見出し1</h2>
        <p className={styles.text}>本文テキスト</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>見出し2</h2>
        <p className={styles.text}>本文テキスト</p>
        <ul className={styles.list}>
          <li>リスト項目1</li>
          <li>リスト項目2</li>
        </ul>
      </section>
    </ArticleLayout>
  );
}
```

## ArticleLayoutコンポーネントのProps

| Props | 型 | 必須 | デフォルト | 説明 |
|-------|------|------|------------|------|
| `title` | `string` | ✅ | - | 記事のタイトル |
| `publishDate` | `string` | ❌ | `undefined` | 投稿日（例: "2025年1月1日"） |
| `showDateIcon` | `boolean` | ❌ | `true` | カレンダーアイコンの表示/非表示 |
| `children` | `ReactNode` | ✅ | - | 記事のコンテンツ |

## 利用可能なCSSクラス（article-content.module.css）

### セクション
- `.section` - 記事内のセクション（margin-bottom: 2.5rem）

### 見出し
- `.heading` - H2見出し（緑色、下線付き）

### テキスト
- `.text` - 本文テキスト
- `.list` - リスト（ul）
- `.link` - リンク（緑色、ホバーエフェクト付き）

## デザイン仕様

### カラー
- **タイトル下線**: `#1db854` (プライマリーグリーン)
- **見出し**: `#1db854` (プライマリーグリーン)
- **ボーダー**: `#d1f0e5` (ライトグリーン)
- **本文**: `#334155` (ダークグレー)
- **投稿日**: `#64748b` (グレー)

### レイアウト
- **最大幅**: 800px
- **パディング**: 20px 16px
- **ボーダー半径**: 14px
- **影**: `0 2px 8px rgba(0, 0, 0, 0.06)`
- **ホバー時の影**: `0 4px 16px rgba(0, 0, 0, 0.08)`

## 新しい記事ページの作成方法

1. `app/` 配下に新しいディレクトリを作成（例: `app/terms/`）
2. `page.tsx` を作成
3. `ArticleLayout` をインポート
4. コンテンツに `article-content.module.css` のスタイルを適用

### 例: 利用規約ページ

```tsx
// app/terms/page.tsx
import { Metadata } from 'next';
import ArticleLayout from '@/components/ArticleLayout';
import styles from '@/components/article-content.module.css';

export const metadata: Metadata = {
  title: '利用規約 | 競馬データ.com',
  description: '競馬データ.comの利用規約です。',
};

export default function TermsPage() {
  return (
    <ArticleLayout
      title="利用規約"
      publishDate="2025年1月1日"
    >
      <section className={styles.section}>
        <h2 className={styles.heading}>第1条（目的）</h2>
        <p className={styles.text}>
          本規約は、当サイトが提供するサービスの利用条件を定めるものです。
        </p>
      </section>

      {/* 他のセクション... */}
    </ArticleLayout>
  );
}
```

## 投稿日なしで使用する場合

```tsx
<ArticleLayout title="記事タイトル">
  {/* コンテンツ */}
</ArticleLayout>
```

## カレンダーアイコンを非表示にする場合

```tsx
<ArticleLayout
  title="記事タイトル"
  publishDate="2025年1月1日"
  showDateIcon={false}
>
  {/* コンテンツ */}
</ArticleLayout>
```

## 注意事項

- `ArticleLayout` は記事全体のレイアウトを提供します
- コンテンツのスタイリングには `article-content.module.css` を使用してください
- 一貫性を保つため、カスタムスタイルの追加は最小限にしてください
- 新しいスタイルが必要な場合は、`article-content.module.css` に追加を検討してください
