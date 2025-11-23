'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './AllSires.module.css';

interface Sire {
  name: string;
  nameEn: string;
}

interface SireGroup {
  kana: string;
  sires: Sire[];
}

// モックデータ（五十音順）
const siresData: SireGroup[] = [
  {
    kana: 'あ行',
    sires: [
      { name: 'アイルハヴアナザー', nameEn: 'ill-have-another' },
      { name: 'アドマイヤムーン', nameEn: 'admire-moon' },
      { name: 'アメリカンペイトリオット', nameEn: 'american-patriot' },
      { name: 'エイシンフラッシュ', nameEn: 'a-shin-flash' },
      { name: 'エスポワールシチー', nameEn: 'espoir-city' },
      { name: 'エピファネイア', nameEn: 'epiphaneia' },
      { name: 'オルフェーヴル', nameEn: 'orfevre' },
    ],
  },
  {
    kana: 'か行',
    sires: [
      { name: 'カレンブラックヒル', nameEn: 'curren-black-hill' },
      { name: 'キタサンブラック', nameEn: 'kitasan-black' },
      { name: 'キズナ', nameEn: 'kizuna' },
      { name: 'キングカメハメハ', nameEn: 'king-kamehameha' },
      { name: 'ゴールドシップ', nameEn: 'gold-ship' },
    ],
  },
  {
    kana: 'さ行',
    sires: [
      { name: 'サトノアラジン', nameEn: 'satono-aladdin' },
      { name: 'サトノクラウン', nameEn: 'satono-crown' },
      { name: 'サトノダイヤモンド', nameEn: 'satono-diamond' },
      { name: 'シルバーステート', nameEn: 'silver-state' },
      { name: 'ジャスタウェイ', nameEn: 'just-a-way' },
    ],
  },
  {
    kana: 'た行',
    sires: [
      { name: 'ダイワメジャー', nameEn: 'daiwa-major' },
      { name: 'タートルボウル', nameEn: 'turtle-bowl' },
      { name: 'ディープインパクト', nameEn: 'deep-impact' },
      { name: 'ドゥラメンテ', nameEn: 'duramente' },
    ],
  },
  {
    kana: 'な行',
    sires: [
      { name: 'ナカヤマフェスタ', nameEn: 'nakayama-festa' },
      { name: 'ノヴェリスト', nameEn: 'novellist' },
    ],
  },
  {
    kana: 'は行',
    sires: [
      { name: 'ハーツクライ', nameEn: 'hearts-cry' },
      { name: 'ハービンジャー', nameEn: 'harbinger' },
      { name: 'ビッグアーサー', nameEn: 'big-arthur' },
      { name: 'フェノーメノ', nameEn: 'fenomeno' },
    ],
  },
  {
    kana: 'ま行',
    sires: [
      { name: 'マインドユアビスケッツ', nameEn: 'mind-your-biscuits' },
      { name: 'マクフィ', nameEn: 'makfi' },
      { name: 'ミッキーアイル', nameEn: 'mickey-isle' },
      { name: 'モーリス', nameEn: 'maurice' },
    ],
  },
  {
    kana: 'や行',
    sires: [
      { name: 'ヨハネスブルグ', nameEn: 'johannesburg' },
    ],
  },
  {
    kana: 'ら行',
    sires: [
      { name: 'リアルインパクト', nameEn: 'real-impact' },
      { name: 'リオンディーズ', nameEn: 'rio-de-la-plata' },
      { name: 'ルーラーシップ', nameEn: 'rulership' },
      { name: 'ロードカナロア', nameEn: 'lord-kanaloa' },
    ],
  },
  {
    kana: 'わ行',
    sires: [
      { name: 'ワールドエース', nameEn: 'world-ace' },
    ],
  },
];

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
              className={styles.accordionTrigger}
              onClick={() => toggleKana(group.kana)}
            >
              <span className={styles.accordionIcon}>
                {expandedKana[group.kana] ? '▼' : '▶'}
              </span>
              {group.kana}
            </button>

            {expandedKana[group.kana] && (
              <div className={styles.accordionContent}>
                <ul className={styles.sireList}>
                  {group.sires.map((sire) => (
                    <li key={sire.nameEn}>
                      <Link
                        href={`/sires/${sire.nameEn}`}
                        className={styles.sireLink}
                      >
                        {sire.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
