'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './AllTrainers.module.css';

interface Trainer {
  name: string;
  nameEn: string;
}

interface TrainerGroup {
  kana: string;
  trainers: Trainer[];
}

// モックデータ（五十音順）
const trainersData: TrainerGroup[] = [
  {
    kana: 'あ行',
    trainers: [
      { name: '青木孝文', nameEn: 'aoki-takafumi' },
      { name: '安田隆行', nameEn: 'yasuda-takayuki' },
      { name: '安田翔伍', nameEn: 'yasuda-shogo' },
      { name: '池江泰寿', nameEn: 'ikee-taiju' },
      { name: '石坂公一', nameEn: 'ishizaka-koichi' },
      { name: '石坂正', nameEn: 'ishizaka-tadashi' },
      { name: '伊藤圭三', nameEn: 'ito-keizo' },
      { name: '伊藤大士', nameEn: 'ito-hiroshi' },
      { name: '岩戸孝樹', nameEn: 'iwato-takaki' },
      { name: '上村洋行', nameEn: 'uemura-hiroyuki' },
      { name: '音無秀孝', nameEn: 'otonashi-hidetaka' },
    ],
  },
  {
    kana: 'か行',
    trainers: [
      { name: '角居勝彦', nameEn: 'kakoi-katsuhiko' },
      { name: '加藤征弘', nameEn: 'kato-yukihiro' },
      { name: '金成貴史', nameEn: 'kanenari-takashi' },
      { name: '木村哲也', nameEn: 'kimura-tetsuya' },
      { name: '久保田貴士', nameEn: 'kubota-takashi' },
      { name: '国枝栄', nameEn: 'kunieda-sakae' },
    ],
  },
  {
    kana: 'さ行',
    trainers: [
      { name: '斉藤崇史', nameEn: 'saito-takashi' },
      { name: '笹田和秀', nameEn: 'sasada-kazuhide' },
      { name: '佐々木晶三', nameEn: 'sasaki-shozo' },
      { name: '清水久詞', nameEn: 'shimizu-hisashi' },
      { name: '須貝尚介', nameEn: 'sugai-shosuke' },
      { name: '杉山晴紀', nameEn: 'sugiyama-haruki' },
      { name: '鈴木孝志', nameEn: 'suzuki-takashi' },
    ],
  },
  {
    kana: 'た行',
    trainers: [
      { name: '高木登', nameEn: 'takagi-noboru' },
      { name: '高野友和', nameEn: 'takano-tomokazu' },
      { name: '高橋亮', nameEn: 'takahashi-ryo' },
      { name: '武井亮', nameEn: 'takei-ryo' },
      { name: '田中博康', nameEn: 'tanaka-hiroyasu' },
      { name: '田中剛', nameEn: 'tanaka-takeshi' },
      { name: '田村康仁', nameEn: 'tamura-yasuhito' },
      { name: '友道康夫', nameEn: 'tomodo-yasuo' },
    ],
  },
  {
    kana: 'な行',
    trainers: [
      { name: '中内田充正', nameEn: 'nakauchida-mitsumasa' },
      { name: '中竹和也', nameEn: 'nakatake-kazuya' },
      { name: '中舘英二', nameEn: 'nakadate-eiji' },
      { name: '西園正都', nameEn: 'nishizono-masato' },
      { name: '西村真幸', nameEn: 'nishimura-masaki' },
    ],
  },
  {
    kana: 'は行',
    trainers: [
      { name: '橋口慎介', nameEn: 'hashiguchi-shinsuke' },
      { name: '橋田満', nameEn: 'hashida-mitsuru' },
      { name: '浜田多実雄', nameEn: 'hamada-tamio' },
      { name: '藤岡健一', nameEn: 'fujioka-kenichi' },
      { name: '藤沢和雄', nameEn: 'fujisawa-kazuo' },
      { name: '藤原英昭', nameEn: 'fujiwara-hideaki' },
      { name: '堀宣行', nameEn: 'hori-nobuyuki' },
    ],
  },
  {
    kana: 'ま行',
    trainers: [
      { name: '松下武士', nameEn: 'matsushita-takeshi' },
      { name: '松田国英', nameEn: 'matsuda-kunihide' },
      { name: '松永幹夫', nameEn: 'matsunaga-mikio' },
      { name: '松永昌博', nameEn: 'matsunaga-masahiro' },
      { name: '宮田敬介', nameEn: 'miyata-keisuke' },
      { name: '宮本博', nameEn: 'miyamoto-hiroshi' },
      { name: '武幸四郎', nameEn: 'take-koshiro' },
    ],
  },
  {
    kana: 'や行',
    trainers: [
      { name: '矢作芳人', nameEn: 'yahagi-yoshito' },
      { name: '矢野英一', nameEn: 'yano-eiichi' },
      { name: '吉田直弘', nameEn: 'yoshida-naohiro' },
      { name: '吉村圭司', nameEn: 'yoshimura-keiji' },
    ],
  },
  {
    kana: 'ら行',
    trainers: [
      { name: '陸奥克也', nameEn: 'mutsu-katsuya' },
    ],
  },
  {
    kana: 'わ行',
    trainers: [
      { name: '渡辺薫彦', nameEn: 'watanabe-kunihiko' },
    ],
  },
];

interface ExpandedState {
  [key: string]: boolean;
}

export default function AllTrainers() {
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
      <h3 className={styles.subsectionTitle}>全調教師データ</h3>

      <div className={styles.accordionList}>
        {trainersData.map((group, index) => (
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
                <ul className={styles.trainerList}>
                  {group.trainers.map((trainer) => (
                    <li key={trainer.nameEn}>
                      <Link
                        href={`/trainers/${trainer.nameEn}`}
                        className={styles.trainerLink}
                      >
                        {trainer.name}
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
