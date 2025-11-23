'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './AllJockeys.module.css';

interface Jockey {
  name: string;
  nameEn: string;
}

interface JockeyGroup {
  kana: string;
  jockeys: Jockey[];
}

// モックデータ（五十音順）
const jockeysData: JockeyGroup[] = [
  {
    kana: 'あ行',
    jockeys: [
      { name: '秋山真一郎', nameEn: 'akiyama-shinichiro' },
      { name: '池添謙一', nameEn: 'ikezoe-kenichi' },
      { name: '石橋脩', nameEn: 'ishibashi-osamu' },
      { name: '石川裕紀人', nameEn: 'ishikawa-yukito' },
      { name: '泉谷楓真', nameEn: 'izumiya-fuuma' },
      { name: '岩田康誠', nameEn: 'iwata-yasunari' },
      { name: '岩田望来', nameEn: 'iwata-mitsuki' },
      { name: '内田博幸', nameEn: 'uchida-hiroyuki' },
      { name: '大野拓弥', nameEn: 'oono-takuya' },
      { name: '荻野極', nameEn: 'ogino-kiwamu' },
    ],
  },
  {
    kana: 'か行',
    jockeys: [
      { name: '角田大河', nameEn: 'kakuda-taiga' },
      { name: '勝浦正樹', nameEn: 'katsuura-masaki' },
      { name: '川田将雅', nameEn: 'kawata-masayoshi' },
      { name: '菊沢一樹', nameEn: 'kikuzawa-kazuki' },
      { name: '北村友一', nameEn: 'kitamura-yuichi' },
      { name: '国分恭介', nameEn: 'kokubun-kyosuke' },
      { name: '国分優作', nameEn: 'kokubun-yusaku' },
      { name: '小林勝太', nameEn: 'kobayashi-shouta' },
      { name: '小林脩斗', nameEn: 'kobayashi-shuuto' },
    ],
  },
  {
    kana: 'さ行',
    jockeys: [
      { name: '坂井瑠星', nameEn: 'sakai-ryusei' },
      { name: '酒井学', nameEn: 'sakai-manabu' },
      { name: '柴田大知', nameEn: 'shibata-daichi' },
      { name: '島川綾', nameEn: 'shimakawa-ryo' },
      { name: '杉原誠人', nameEn: 'sugihara-makoto' },
      { name: '菅原明良', nameEn: 'sugawara-akira' },
      { name: '鮫島克駿', nameEn: 'sameshima-katsutoshi' },
    ],
  },
  {
    kana: 'た行',
    jockeys: [
      { name: '武豊', nameEn: 'take-yutaka' },
      { name: '田口貫太', nameEn: 'taguchi-kanta' },
      { name: '田辺裕信', nameEn: 'tanabe-hironobu' },
      { name: '津村明秀', nameEn: 'tsumura-akihide' },
      { name: '戸崎圭太', nameEn: 'tosaki-keita' },
      { name: '富田暁', nameEn: 'tomita-satoru' },
    ],
  },
  {
    kana: 'な行',
    jockeys: [
      { name: '永野猛蔵', nameEn: 'nagano-takezou' },
      { name: '中井裕二', nameEn: 'nakai-yuji' },
      { name: '西村淳也', nameEn: 'nishimura-junya' },
    ],
  },
  {
    kana: 'は行',
    jockeys: [
      { name: '浜中俊', nameEn: 'hamanaka-shun' },
      { name: '原優介', nameEn: 'hara-yusuke' },
      { name: '藤岡佑介', nameEn: 'fujioka-yusuke' },
      { name: '藤岡康太', nameEn: 'fujioka-kouta' },
      { name: '古川奈穂', nameEn: 'furukawa-naho' },
      { name: '福永祐一', nameEn: 'fukunaga-yuichi' },
    ],
  },
  {
    kana: 'ま行',
    jockeys: [
      { name: '松岡正海', nameEn: 'matsuoka-masaumi' },
      { name: '松山弘平', nameEn: 'matsuyama-kouhei' },
      { name: '丸田恭介', nameEn: 'maruta-kyosuke' },
      { name: '三浦皇成', nameEn: 'miura-kousei' },
      { name: '宮崎北斗', nameEn: 'miyazaki-hokuto' },
      { name: '武藤雅', nameEn: 'mutou-miyabi' },
    ],
  },
  {
    kana: 'や行',
    jockeys: [
      { name: '横山武史', nameEn: 'yokoyama-takeshi' },
      { name: '横山和生', nameEn: 'yokoyama-kazuki' },
      { name: '横山典弘', nameEn: 'yokoyama-norihiro' },
      { name: '吉田隼人', nameEn: 'yoshida-hayato' },
    ],
  },
  {
    kana: 'ら行',
    jockeys: [
      { name: 'C.ルメール', nameEn: 'lemaire' },
      { name: 'M.デムーロ', nameEn: 'demuro' },
      { name: 'R.ムーア', nameEn: 'moore' },
      { name: '鲁西迪', nameEn: 'russell' },
    ],
  },
  {
    kana: 'わ行',
    jockeys: [
      { name: '和田竜二', nameEn: 'wada-ryuji' },
    ],
  },
];

interface ExpandedState {
  [key: string]: boolean;
}

export default function AllJockeys() {
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
      <h3 className={styles.subsectionTitle}>全騎手データ</h3>

      <div className={styles.accordionList}>
        {jockeysData.map((group, index) => (
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
                <ul className={styles.jockeyList}>
                  {group.jockeys.map((jockey) => (
                    <li key={jockey.nameEn}>
                      <Link href={`/jockeys/${jockey.nameEn}`} className={styles.jockeyLink}>
                        {jockey.name}
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
