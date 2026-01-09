'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './JockeyLeading.module.css';
import AllJockeys from './AllJockeys';
import { LeadingData } from '@/lib/getLeadingData';

interface JockeyLeadingProps {
  data: LeadingData[];
}

export default function JockeyLeading({ data }: JockeyLeadingProps) {
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

  const maxWins = Math.max(...data.map((j) => j.wins));

  // 順位に応じた背景色を返す関数
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return '#FCF080';
    if (rank === 2) return '#CCDFFF';
    if (rank === 3) return '#F0C8A0';
    return '#F0F0F0';
  };

  return (
    <section ref={sectionRef} className="section fade-in-card">
      <h2 className="section-title">騎手別データ</h2>

      <div className="gate-place-rate-detail">
        <div className="gate-detail-title">騎手リーディング</div>
        <div className="gate-chart">
          {data.map((jockey) => (
            <div key={jockey.rank} className="gate-chart-item">
              <div
                className="gate-number-badge"
                style={{ backgroundColor: getRankBadgeColor(jockey.rank), color: '#333333' }}
              >
                {jockey.rank}
              </div>
              <div className={styles.name}>{jockey.name}</div>
              <div className="gate-bar-container" style={{ background: 'transparent', boxShadow: 'none' }}>
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

      <AllJockeys />
    </section>
  );
}
