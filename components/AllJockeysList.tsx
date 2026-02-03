import Link from 'next/link';
import styles from './AllJockeys.module.css';
import listStyles from './shared-list.module.css';
import { ALL_JOCKEYS, type JockeyInfo } from '@/lib/jockeys';

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

const jockeysData = (() => {
  const grouped: Record<string, JockeyInfo[]> = {};

  ALL_JOCKEYS.forEach(jockey => {
    const group = getKanaGroup(jockey.kana);
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(jockey);
  });

  const kanaOrder = ['あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行', 'その他'];

  return kanaOrder
    .filter(kana => grouped[kana])
    .map(kana => ({
      kana,
      jockeys: grouped[kana].sort((a, b) => a.kana.localeCompare(b.kana, 'ja'))
    }));
})();

export default function AllJockeysList() {
  return (
    <div className={listStyles.groupList}>
      {jockeysData.map((group) => (
        <div key={group.kana} className={listStyles.groupSection}>
          <h2 className={listStyles.groupTitle}>{group.kana}</h2>

          <div className={listStyles.dataCardGrid}>
            {group.jockeys.map((jockey) => (
              <Link
                key={jockey.id}
                href={`/jockeys/${jockey.id}`}
                className={styles.dataCard}
              >
                {jockey.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
