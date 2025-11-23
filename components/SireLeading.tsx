'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './SireLeading.module.css';
import AllSires from './AllSires';

interface SireData {
  rank: number;
  name: string;
  wins: number;
  rides: number;
  winRate: number;
}

// モックデータ
const mockSireData: SireData[] = [
  { rank: 1, name: 'ディープインパクト', wins: 245, rides: 1520, winRate: 16.1 },
  { rank: 2, name: 'ロードカナロア', wins: 198, rides: 1380, winRate: 14.3 },
  { rank: 3, name: 'ハーツクライ', wins: 187, rides: 1450, winRate: 12.9 },
  { rank: 4, name: 'キングカメハメハ', wins: 176, rides: 1290, winRate: 13.6 },
  { rank: 5, name: 'オルフェーヴル', wins: 165, rides: 1180, winRate: 14.0 },
  { rank: 6, name: 'ダイワメジャー', wins: 154, rides: 1250, winRate: 12.3 },
  { rank: 7, name: 'ルーラーシップ', wins: 148, rides: 1100, winRate: 13.5 },
  { rank: 8, name: 'キズナ', wins: 142, rides: 980, winRate: 14.5 },
  { rank: 9, name: 'エピファネイア', wins: 136, rides: 920, winRate: 14.8 },
  { rank: 10, name: 'モーリス', wins: 128, rides: 850, winRate: 15.1 },
];

export default function SireLeading() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          entry.target.classList.add('is-visible');
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const maxWins = Math.max(...mockSireData.map((s) => s.wins));

  // 順位に応じた背景色を返す関数
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return '#FCF080';
    if (rank === 2) return '#CCDFFF';
    if (rank === 3) return '#F0C8A0';
    return '#F0F0F0';
  };

  // 名前を6文字で省略する関数
  const truncateName = (name: string) => {
    return name.length > 6 ? name.slice(0, 6) + '...' : name;
  };

  return (
    <section ref={sectionRef} className="section fade-in-card">
      <h2 className="section-title">血統（種牡馬）別データ</h2>

      <div className="gate-place-rate-detail">
        <div className="gate-detail-title">種牡馬リーディング</div>
        <div className="gate-chart">
          {mockSireData.map((sire) => (
            <div key={sire.rank} className="gate-chart-item">
              <div
                className="gate-number-badge"
                style={{ backgroundColor: getRankBadgeColor(sire.rank), color: '#333333' }}
              >
                {sire.rank}
              </div>
              <div className={styles.name}>{truncateName(sire.name)}</div>
              <div className="gate-bar-container" style={{ background: 'transparent', boxShadow: 'none' }}>
                <div
                  className={`gate-bar ${isVisible ? 'visible' : ''}`}
                  style={{ width: `${(sire.wins / maxWins) * 100}%` }}
                />
              </div>
              <div className="gate-rate">{sire.wins}勝</div>
            </div>
          ))}
        </div>
      </div>

      <AllSires />
    </section>
  );
}
