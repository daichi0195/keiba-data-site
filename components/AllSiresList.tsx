import Link from 'next/link';
import styles from './AllSires.module.css';
import listStyles from './shared-list.module.css';
import { ALL_SIRES, type SireInfo } from '@/lib/sires';

const getKanaGroup = (name: string): string => {
  if (!name) return 'その他';
  const first = name.charAt(0);
  if (/[あいうえおアイウエオヴ]/.test(first)) return 'ア行';
  if (/[かきくけこがぎぐげごカキクケコガギグゲゴ]/.test(first)) return 'カ行';
  if (/[さしすせそざじずぜぞサシスセソザジズゼゾ]/.test(first)) return 'サ行';
  if (/[たちつてとだぢづでどタチツテトダヂヅデド]/.test(first)) return 'タ行';
  if (/[なにぬねのナニヌネノ]/.test(first)) return 'ナ行';
  if (/[はひふへほばびぶべぼぱぴぷぺぽハヒフヘホバビブベボパピプペポ]/.test(first)) return 'ハ行';
  if (/[まみむめもマミムメモ]/.test(first)) return 'マ行';
  if (/[やゆよヤユヨ]/.test(first)) return 'ヤ行';
  if (/[らりるれろラリルレロ]/.test(first)) return 'ラ行';
  if (/[わをんワヲン]/.test(first)) return 'ワ行';
  return 'その他';
};

const siresData = (() => {
  const grouped: Record<string, SireInfo[]> = {};

  ALL_SIRES.forEach(sire => {
    const group = getKanaGroup(sire.name);
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(sire);
  });

  const kanaOrder = ['ア行', 'カ行', 'サ行', 'タ行', 'ナ行', 'ハ行', 'マ行', 'ヤ行', 'ラ行', 'ワ行', 'その他'];

  return kanaOrder
    .filter(kana => grouped[kana])
    .map(kana => ({
      kana,
      sires: grouped[kana].sort((a, b) => a.name.localeCompare(b.name, 'ja'))
    }));
})();

export default function AllSiresList() {
  return (
    <div className={listStyles.groupList}>
      {siresData.map((group) => (
        <div key={group.kana} className={listStyles.groupSection}>
          <h2 className={listStyles.groupTitle}>{group.kana}</h2>

          <div className={listStyles.dataCardGrid}>
            {group.sires.map((sire) => (
              <Link
                key={sire.id}
                href={`/sires/${sire.id}`}
                className={styles.dataCard}
              >
                {sire.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
