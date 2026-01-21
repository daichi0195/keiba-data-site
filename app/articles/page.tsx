import { Metadata } from 'next';
import Link from 'next/link';
import { getAllArticles, getAllCategories } from '@/lib/articles';
import ArticleList from '@/components/ArticleList';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'コラム | 競馬データ.com',
  description:
    'データを活用した分析記事や一口馬主のコラムなどを掲載しています。',
};

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <div className={styles.container}>
      {/* パンくずリスト */}
      <nav className={styles.breadcrumb}>
        <Link href="/">HOME</Link>
        <span> &gt; </span>
        <span>コラム</span>
      </nav>

      {/* ヘッダー */}
      <header className={styles.header}>
        <h1 className={styles.title}>コラム</h1>
        <p className={styles.description}>
          データを活用した分析記事や一口馬主のコラムなどを掲載しています
        </p>
      </header>

      {/* 並び替えボタン & コラム一覧 */}
      <ArticleList articles={articles} />
    </div>
  );
}
