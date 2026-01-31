'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './AllSires.module.css';
import { ALL_SIRES, type SireInfo } from '@/lib/sires';

interface SireGroup {
  kana: string;
  sires: SireInfo[];
}

// 五十音順グループ化関数（カタカナ表記）
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

// 種牡馬データを五十音順にグループ化
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

interface ExpandedState {
  [key: string]: boolean;
}

export default function AllSires() {
  const [expandedKana, setExpandedKana] = useState<ExpandedState>({});

  const toggleKana = (kana: string) => {
    setExpandedKana((prev) => ({
      ...prev,
      [kana]: !prev[kana],
    }));
  };

  return (
    <div>
      <h3 className={styles.subsectionTitle}>全血統（種牡馬）データ</h3>

      <div className={styles.accordionList}>
        {siresData.map((group, index) => (
          <div
            key={group.kana}
            className={styles.accordionItem}
          >
            <button
              className={`${styles.accordionTrigger} ${expandedKana[group.kana] ? styles.expanded : ''}`}
              onClick={() => toggleKana(group.kana)}
            >
              <span className={styles.accordionIcon}>
                {expandedKana[group.kana] ? '▼' : '▶'}
              </span>
              {group.kana}
            </button>

            <div className={`${styles.accordionContent} ${expandedKana[group.kana] ? '' : styles.hidden}`}>
              <div className={styles.dataCardGrid}>
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
          </div>
        ))}
      </div>
    </div>
  );
}
