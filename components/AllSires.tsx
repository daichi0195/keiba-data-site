'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './AllSires.module.css';
import { ALL_SIRES, type SireInfo } from '@/lib/sires';

interface SireGroup {
  kana: string;
  sires: SireInfo[];
}

// 五十音順グループ化関数（HeaderMenuと同じロジック）
const getKanaGroup = (name: string): string => {
  if (!name) return 'その他';
  const first = name.charAt(0);
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

  const kanaOrder = ['あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行', 'その他'];

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
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toggleKana = (kana: string) => {
    setExpandedKana((prev) => ({
      ...prev,
      [kana]: !prev[kana],
    }));
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    itemRefs.current.forEach((item) => {
      if (item) observer.observe(item);
    });

    return () => {
      itemRefs.current.forEach((item) => {
        if (item) observer.unobserve(item);
      });
    };
  }, []);

  return (
    <div>
      <h3 className={styles.subsectionTitle}>全血統（種牡馬）データ</h3>

      <div className={styles.accordionList}>
        {siresData.map((group, index) => (
          <div
            key={group.kana}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={`${styles.accordionItem} fade-in-card fade-in-stagger-${(index % 10) + 1}`}
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

            {expandedKana[group.kana] && (
              <div className={styles.accordionContent}>
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
