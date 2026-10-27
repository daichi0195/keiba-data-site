import Link from 'next/link';
import styles from './DataSummary.module.css';

interface Props {
  periodText?: string;
  lastUpdated?: string;
  /** 見た目を差し替える場合のクラス（未指定なら共通の見た目） */
  className?: string;
}

/**
 * データの出典・集計方法の注記（全データページ共通）
 * 指標の定義や判定ルールは /about/data にまとめ、ここは出典と期間の1文だけにする
 */
export default function DataSourceNote({ periodText, lastUpdated, className }: Props) {
  return (
    <aside className={className ?? styles.sourceNote} aria-label="データの出典と集計方法">
      <h2>このデータについて</h2>
      <p>
        中央競馬（JRA）のレース結果をもとに当サイトのデータベースで集計しています
        {periodText ? `（集計期間：${periodText}` : '（集計期間：直近3年間'}
        {lastUpdated ? `、${lastUpdated}時点）。` : '、毎週更新）。'}
        指標の定義と集計方法は<Link href="/about/data">データの出典と集計方法</Link>をご覧ください。
      </p>
    </aside>
  );
}
