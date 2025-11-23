'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './JockeyLeading.module.css';
import AllTrainers from './AllTrainers';

interface TrainerData {
  rank: number;
  name: string;
  wins: number;
  rides: number;
  winRate: number;
}

// モックデータ
const mockTrainerData: TrainerData[] = [
  { rank: 1, name: '藤沢和雄', wins: 198, rides: 920, winRate: 21.5 },
  { rank: 2, name: '友道康夫', wins: 185, rides: 880, winRate: 21.0 },
  { rank: 3, name: '矢作芳人', wins: 172, rides: 850, winRate: 20.2 },
  { rank: 4, name: '角居勝彦', wins: 165, rides: 820, winRate: 20.1 },
  { rank: 5, name: '国枝栄', wins: 158, rides: 780, winRate: 20.3 },
  { rank: 6, name: '堀宣行', wins: 152, rides: 790, winRate: 19.2 },
  { rank: 7, name: '池江泰寿', wins: 148, rides: 760, winRate: 19.5 },
  { rank: 8, name: '須貝尚介', wins: 142, rides: 740, winRate: 19.2 },
  { rank: 9, name: '音無秀孝', wins: 138, rides: 720, winRate: 19.2 },
  { rank: 10, name: '中内田充正', wins: 135, rides: 710, winRate: 19.0 },
];

export default function TrainerLeading() {
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

  const maxWins = Math.max(...mockTrainerData.map((t) => t.wins));

  // 順位に応じた背景色を返す関数
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return '#FCF080';
    if (rank === 2) return '#CCDFFF';
    if (rank === 3) return '#F0C8A0';
    return '#F0F0F0';
  };

  return (
    <section ref={sectionRef} className="section fade-in-card">
      <h2 className="section-title">調教師別データ</h2>

      <div className="gate-place-rate-detail">
        <div className="gate-detail-title">調教師リーディング</div>
        <div className="gate-chart">
          {mockTrainerData.map((trainer) => (
            <div key={trainer.rank} className="gate-chart-item">
              <div
                className="gate-number-badge"
                style={{ backgroundColor: getRankBadgeColor(trainer.rank), color: '#333333' }}
              >
                {trainer.rank}
              </div>
              <div className={styles.name}>{trainer.name}</div>
              <div className="gate-bar-container" style={{ background: 'transparent', boxShadow: 'none' }}>
                <div
                  className={`gate-bar ${isVisible ? 'visible' : ''}`}
                  style={{ width: `${(trainer.wins / maxWins) * 100}%` }}
                />
              </div>
              <div className="gate-rate">{trainer.wins}勝</div>
            </div>
          ))}
        </div>
      </div>

      <AllTrainers />
    </section>
  );
}
