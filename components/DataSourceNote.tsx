import Link from 'next/link';
import styles from './DataSummary.module.css';
import { MIN_RACES_FOR_MENTION, MIN_RACES_FOR_TRENDS } from '@/lib/dataPageRules';

interface Props {
  periodText?: string;
  lastUpdated?: string;
  /** 見た目を差し替える場合のクラス（未指定なら共通の見た目） */
  className?: string;
}

/**
 * データの出典・集計方法の注記（全データページ共通）
 */
export default function DataSourceNote({ periodText, lastUpdated, className }: Props) {
  return (
    <aside className={className ?? styles.sourceNote} aria-label="データの出典と集計方法">
      <h2>このデータについて</h2>
      <p>
        掲載している数値は、中央競馬（JRA）の過去レース結果をもとに当サイトが独自に構築したデータベースから集計したものです。
        {periodText ? `集計期間は${periodText}で、` : '集計期間は直近3年間で、'}
        {lastUpdated ? `${lastUpdated}時点のデータです。` : '毎週更新しています。'}
      </p>
      <p>
        勝率・連対率・複勝率は出走数に対する1着・2着以内・3着以内の割合、回収率は該当馬券を100円ずつ購入した場合の払戻率です。
        対象レース数が{MIN_RACES_FOR_TRENDS}レース未満の条件では傾向判定を行わず、個別の騎手・調教師・種牡馬への言及は{MIN_RACES_FOR_MENTION}走以上を目安にしています。
      </p>
      <p>
        過去の統計は将来の結果を保証するものではありません。集計定義や更新頻度の詳細は
        <Link href="/about/data">データの出典と集計方法</Link>
        をご覧ください。
      </p>
    </aside>
  );
}
