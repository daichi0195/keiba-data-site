import Link from 'next/link';
import styles from './SiresList.module.css';
import articleStyles from './article-content.module.css';
import { ALL_SIRES } from '@/lib/sires';

// 五十音グループ定義（カタカナ対応）
const KANA_GROUPS = [
  { id: 'a-gyo', label: 'ア行', pattern: /^[アイウエオァィゥェォ]/ },
  { id: 'ka-gyo', label: 'カ行', pattern: /^[カキクケコガギグゲゴヵヶ]/ },
  { id: 'sa-gyo', label: 'サ行', pattern: /^[サシスセソザジズゼゾ]/ },
  { id: 'ta-gyo', label: 'タ行', pattern: /^[タチツテトダヂヅデド]/ },
  { id: 'na-gyo', label: 'ナ行', pattern: /^[ナニヌネノ]/ },
  { id: 'ha-gyo', label: 'ハ行', pattern: /^[ハヒフヘホバビブベボパピプペポ]/ },
  { id: 'ma-gyo', label: 'マ行', pattern: /^[マミムメモ]/ },
  { id: 'ya-gyo', label: 'ヤ行', pattern: /^[ヤユヨャュョ]/ },
  { id: 'ra-gyo', label: 'ラ行', pattern: /^[ラリルレロ]/ },
  { id: 'wa-gyo', label: 'ワ行', pattern: /^[ワヲン]/ },
];

// 種牡馬を五十音順にグルーピング
export const siresGroupedByKana = KANA_GROUPS.map(group => {
  const sires = ALL_SIRES
    .filter(sire => group.pattern.test(sire.name))
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  return {
    ...group,
    sires,
  };
}).filter(group => group.sires.length > 0);

export default function SiresList() {
  return (
    <div className={styles.sireList}>
      {siresGroupedByKana.map((group) => (
        <section key={group.id} id={group.id} className={articleStyles.section}>
          <h2 className={articleStyles.heading}>
            {group.label}
          </h2>
          <ul className={styles.sireGrid}>
            {group.sires.map((sire) => (
              <li key={sire.id}>
                <Link href={`/sires/${sire.id}`} className={styles.sireLink}>
                  {sire.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
