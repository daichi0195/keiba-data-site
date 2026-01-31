'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './AllTrainers.module.css';
import { ALL_TRAINERS, type TrainerInfo } from '@/lib/trainers';

interface TrainerGroup {
  kana: string;
  trainers: TrainerInfo[];
}

// 五十音順グループ化関数（HeaderMenuと同じロジック）
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

// 調教師データを五十音順にグループ化
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

interface ExpandedState {
  [key: string]: boolean;
}

export default function AllTrainers() {
  const [expandedKana, setExpandedKana] = useState<ExpandedState>({});

  const toggleKana = (kana: string) => {
    setExpandedKana((prev) => ({
      ...prev,
      [kana]: !prev[kana],
    }));
  };

  return (
    <div>
      <h3 className={styles.subsectionTitle}>全調教師データ</h3>
      <p className={styles.dataDescription}>過去3年間に30レース以上出走している現役中央調教師のデータを集計しています。</p>

      <div className={styles.accordionList}>
        {trainersData.map((group, index) => (
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
          </div>
        ))}
      </div>
    </div>
  );
}
