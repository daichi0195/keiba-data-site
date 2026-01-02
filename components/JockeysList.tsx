import Link from 'next/link';
import styles from './JockeysList.module.css';
import articleStyles from './article-content.module.css';
import { ALL_JOCKEYS } from '@/lib/jockeys';

// 五十音グループ定義
const KANA_GROUPS = [
  { id: 'a-gyo', label: 'あ行', pattern: /^[あいうえおぁぃぅぇぉ]/ },
  { id: 'ka-gyo', label: 'か行', pattern: /^[かきくけこがぎぐげごゃゅょ]/ },
  { id: 'sa-gyo', label: 'さ行', pattern: /^[さしすせそざじずぜぞ]/ },
  { id: 'ta-gyo', label: 'た行', pattern: /^[たちつてとだぢづでど]/ },
  { id: 'na-gyo', label: 'な行', pattern: /^[なにぬねの]/ },
  { id: 'ha-gyo', label: 'は行', pattern: /^[はひふへほばびぶべぼぱぴぷぺぽ]/ },
  { id: 'ma-gyo', label: 'ま行', pattern: /^[まみむめも]/ },
  { id: 'ya-gyo', label: 'や行', pattern: /^[やゆよゃゅょ]/ },
  { id: 'ra-gyo', label: 'ら行', pattern: /^[らりるれろ]/ },
  { id: 'wa-gyo', label: 'わ行', pattern: /^[わをん]/ },
];

// 騎手を五十音順にグルーピング
export const jockeysGroupedByKana = KANA_GROUPS.map(group => {
  const jockeys = ALL_JOCKEYS
    .filter(jockey => group.pattern.test(jockey.kana))
    .sort((a, b) => a.kana.localeCompare(b.kana, 'ja'));

  return {
    ...group,
    jockeys,
  };
}).filter(group => group.jockeys.length > 0);

export default function JockeysList() {
  return (
    <div className={styles.jockeyList}>
      {jockeysGroupedByKana.map((group) => (
        <section key={group.id} id={group.id} className={articleStyles.section}>
          <h2 className={articleStyles.heading}>
            {group.label}
          </h2>
          <ul className={styles.jockeyGrid}>
            {group.jockeys.map((jockey) => (
              <li key={jockey.id}>
                <Link href={`/jockeys/${jockey.id}`} className={styles.jockeyLink}>
                  {jockey.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
