'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './SireLeading.module.css';
import AllSires from './AllSires';
import { LeadingData } from '@/lib/getLeadingData';

interface SireLeadingProps {
  data: LeadingData[];
}

export default function SireLeading({ data }: SireLeadingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    if (titleRef.current) {
      observer.observe(titleRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
      if (titleRef.current) {
        observer.unobserve(titleRef.current);
      }
    };
  }, []);

  const maxWins = Math.max(...data.map((s) => s.wins));

  // 順位に応じた背景色を返す関数
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return '#FCF080';
    if (rank === 2) return '#CCDFFF';
    if (rank === 3) return '#F0C8A0';
    return '#F0F0F0';
  };


  return (
    <section ref={sectionRef} className="section fade-in-card">
      <h2 ref={titleRef} className="section-title">血統（種牡馬）別データ</h2>

      <div className="gate-place-rate-detail">
        <div className="gate-detail-title">種牡馬リーディング</div>
        <div className="gate-chart">
          {data.map((sire) => (
            <div key={sire.rank} className="gate-chart-item">
              <div
                className="gate-number-badge"
                style={{ backgroundColor: getRankBadgeColor(sire.rank), color: '#333333' }}
              >
                {sire.rank}
              </div>
              <Link href={`/sires/${sire.id}`} className={styles.nameLink}>
                {sire.name.length > 6 ? (
                  <>
                    {sire.name.slice(0, 6)}
                    <span className={styles.ellipsis}>...</span>
                  </>
                ) : (
                  sire.name
                )}
              </Link>
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
