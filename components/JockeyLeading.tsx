'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './JockeyLeading.module.css';

interface JockeyData {
  rank: number;
  name: string;
  wins: number;
  rides: number;
  winRate: number;
}

// モックデータ
const mockJockeyData: JockeyData[] = [
  { rank: 1, name: '川田将雅', wins: 145, rides: 620, winRate: 23.4 },
  { rank: 2, name: 'C.ルメール', wins: 142, rides: 580, winRate: 24.5 },
  { rank: 3, name: '福永祐一', wins: 118, rides: 550, winRate: 21.5 },
  { rank: 4, name: '横山武史', wins: 112, rides: 600, winRate: 18.7 },
  { rank: 5, name: '戸崎圭太', wins: 108, rides: 590, winRate: 18.3 },
  { rank: 6, name: '坂井瑠星', wins: 98, rides: 580, winRate: 16.9 },
  { rank: 7, name: '松山弘平', wins: 95, rides: 570, winRate: 16.7 },
  { rank: 8, name: 'M.デムーロ', wins: 92, rides: 520, winRate: 17.7 },
  { rank: 9, name: '岩田望来', wins: 88, rides: 560, winRate: 15.7 },
  { rank: 10, name: '武豊', wins: 85, rides: 480, winRate: 17.7 },
];

export default function JockeyLeading() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
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

  const maxWins = Math.max(...mockJockeyData.map((j) => j.wins));

  // 順位に応じた背景色を返す関数
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return '#FCF080';
    if (rank === 2) return '#CCDFFF';
    if (rank === 3) return '#F0C8A0';
    return '#F0F0F0';
  };

  return (
    <section ref={sectionRef} className="section">
      <h2 className="section-title">騎手別データ</h2>

      <div className="gate-place-rate-detail">
        <div className="gate-detail-title">騎手リーディング</div>
        <div className="gate-chart">
          {mockJockeyData.map((jockey) => (
            <div key={jockey.rank} className="gate-chart-item">
              <div
                className="gate-number-badge"
                style={{ backgroundColor: getRankBadgeColor(jockey.rank), color: '#333333' }}
              >
                {jockey.rank}
              </div>
              <div className={styles.name}>{jockey.name}</div>
              <div className="gate-bar-container" style={{ background: 'transparent' }}>
                <div
                  className={`gate-bar ${isVisible ? 'visible' : ''}`}
                  style={{ width: `${(jockey.wins / maxWins) * 100}%` }}
                />
              </div>
              <div className="gate-rate">{jockey.wins}勝</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
