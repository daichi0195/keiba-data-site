import Link from 'next/link';
import styles from './TrainersList.module.css';
import articleStyles from './article-content.module.css';
import { ALL_TRAINERS } from '@/lib/trainers';

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

// 調教師を五十音順にグルーピング
export const trainersGroupedByKana = KANA_GROUPS.map(group => {
  const trainers = ALL_TRAINERS
    .filter(trainer => group.pattern.test(trainer.kana))
    .sort((a, b) => a.kana.localeCompare(b.kana, 'ja'));

  return {
    ...group,
    trainers,
  };
}).filter(group => group.trainers.length > 0);

export default function TrainersList() {
  return (
    <div className={styles.trainerList}>
      {trainersGroupedByKana.map((group) => (
        <section key={group.id} id={group.id} className={articleStyles.section}>
          <h2 className={articleStyles.heading}>
            {group.label}
          </h2>
          <ul className={styles.trainerGrid}>
            {group.trainers.map((trainer) => (
              <li key={trainer.id}>
                <Link href={`/trainers/${trainer.id}`} className={styles.trainerLink}>
                  {trainer.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
