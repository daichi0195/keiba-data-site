'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './JockeyLeading.module.css';
import AllJockeys from './AllJockeys';
import LeadingChart from './LeadingChart';
import { LeadingData } from '@/lib/getLeadingData';

interface JockeyLeadingProps {
  data: LeadingData[];
}

export default function JockeyLeading({ data }: JockeyLeadingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="section fade-in-card">
      <h2 className="section-title is-visible">騎手別データ</h2>
      <LeadingChart data={data} linkPrefix="/jockeys/" isVisible={isVisible} title="騎手リーディング（勝ち数順）" />
      <AllJockeys />
    </section>
  );
}
