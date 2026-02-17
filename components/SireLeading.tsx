'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './SireLeading.module.css';
import AllSires from './AllSires';
import LeadingChart from './LeadingChart';
import { LeadingData } from '@/lib/getLeadingData';

interface SireLeadingProps {
  data: LeadingData[];
}

export default function SireLeading({ data }: SireLeadingProps) {
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
      <h2 className="section-title is-visible">血統（種牡馬）別データ</h2>
      <LeadingChart data={data} linkPrefix="/sires/" isVisible={isVisible} maxNameLength={8} title="種牡馬リーディング" />
      <AllSires />
    </section>
  );
}
