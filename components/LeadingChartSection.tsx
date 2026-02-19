'use client';

import { useState, useEffect, useRef } from 'react';
import LeadingChart from './LeadingChart';
import { LeadingData } from '@/lib/getLeadingData';

interface Props {
  data: LeadingData[];
  linkPrefix: string;
  title: string;
  maxNameLength?: number;
  nameWidth?: number;
}

export default function LeadingChartSection({ data, linkPrefix, title, maxNameLength, nameWidth }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div ref={ref}>
      <LeadingChart
        data={data}
        linkPrefix={linkPrefix}
        isVisible={isVisible}
        title={title}
        maxNameLength={maxNameLength}
        nameWidth={nameWidth}
      />
    </div>
  );
}
