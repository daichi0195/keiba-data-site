import styles from './DataSummary.module.css';
import { MIN_RACES_FOR_TRENDS } from '@/lib/dataPageRules';

interface Props {
  totalRaces: number;
  hiddenItems?: string; // 例: 「コースの特徴」「注目ポイント」「データQ&A」
}

/**
 * 対象レース数が少ないページに表示する注意書き
 */
export default function ThinDataNotice({ totalRaces, hiddenItems }: Props) {
  return (
    <div className={styles.thinNotice} role="note">
      <strong>対象レース数が{totalRaces.toLocaleString('ja-JP')}レースと少ないページです。</strong>
      統計的な傾向を判定するには{MIN_RACES_FOR_TRENDS}レース以上が必要なため、
      {hiddenItems ? `${hiddenItems}は表示していません。` : '傾向判定は行っていません。'}
      表の数値は偶然の影響を強く受けるため、参考程度にご覧ください。
    </div>
  );
}
