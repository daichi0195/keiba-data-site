import Link from 'next/link';
import styles from './AllTrainers.module.css';
import listStyles from './shared-list.module.css';
import { ALL_TRAINERS, type TrainerInfo } from '@/lib/trainers';

const getKanaGroup = (kana: string): string => {
  if (!kana) return 'その他';
  const first = kana.charAt(0);
  if (/[あいうえおアイウエオ]/.test(first)) return 'あ行';
  if (/[かきくけこがぎぐげごカキクケコガギグゲゴ]/.test(first)) return 'か行';
  if (/[さしすせそざじずぜぞサシスセソザジズゼゾ]/.test(first)) return 'さ行';
  if (/[たちつてとだぢづでどタチツテトダヂヅデド]/.test(first)) return 'た行';
  if (/[なにぬねのナニヌネノ]/.test(first)) return 'な行';
  if (/[はひふへほばびぶべぼぱぴぷぺぽハヒフヘホバビブベボパピプペポ]/.test(first)) return 'は行';
  if (/[まみむめもマミムメモ]/.test(first)) return 'ま行';
  if (/[やゆよヤユヨ]/.test(first)) return 'や行';
  if (/[らりるれろラリルレロ]/.test(first)) return 'ら行';
  if (/[わをんワヲン]/.test(first)) return 'わ行';
  return 'その他';
};

const trainersData = (() => {
  const grouped: Record<string, TrainerInfo[]> = {};

  ALL_TRAINERS.forEach(trainer => {
    const group = getKanaGroup(trainer.kana);
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(trainer);
  });

  const kanaOrder = ['あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行', 'その他'];

  return kanaOrder
    .filter(kana => grouped[kana])
    .map(kana => ({
      kana,
      trainers: grouped[kana].sort((a, b) => a.kana.localeCompare(b.kana, 'ja'))
    }));
})();

export default function AllTrainersList() {
  return (
    <div className={listStyles.groupList}>
      {trainersData.map((group) => (
        <div key={group.kana} className={listStyles.groupSection}>
          <h2 className={listStyles.groupTitle}>{group.kana}</h2>

          <div className={listStyles.dataCardGrid}>
            {group.trainers.map((trainer) => (
              <Link
                key={trainer.id}
                href={`/trainers/${trainer.id}`}
                className={styles.dataCard}
              >
                {trainer.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
