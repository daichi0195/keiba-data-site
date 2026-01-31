'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './JockeyLeading.module.css';
import AllTrainers from './AllTrainers';
import { LeadingData } from '@/lib/getLeadingData';

interface TrainerLeadingProps {
  data: LeadingData[];
}

export default function TrainerLeading({ data }: TrainerLeadingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
      if (titleRef.current) {
        observer.unobserve(titleRef.current);
      }
      cardRefs.current.forEach((card) => {
        if (card) observer.unobserve(card);
      });
    };
  }, []);

  const maxWins = Math.max(...data.map((t) => t.wins));

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return '#FCF080';
    if (rank === 2) return '#CCDFFF';
    if (rank === 3) return '#F0C8A0';
    return '#F0F0F0';
  };

  return (
    <section ref={sectionRef} className="section fade-in-card">
      <h2 ref={titleRef} className="section-title">
        調教師別データ
      </h2>

      <div className="gate-place-rate-detail">
        <div className="gate-detail-title">調教師リーディング</div>
        <div className="gate-chart">
          {data.map((trainer, index) => (
            <div
              key={trainer.rank}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className={`gate-chart-item fade-in-card fade-in-stagger-${(index % 10) + 1}`}
            >
              <div
                className="gate-number-badge"
                style={{ backgroundColor: getRankBadgeColor(trainer.rank), color: '#333333' }}
              >
                {trainer.rank}
              </div>
              <Link href={`/trainers/${trainer.id}`} className={styles.nameLink}>
                {trainer.name}
              </Link>
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
