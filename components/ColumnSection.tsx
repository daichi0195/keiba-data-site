'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import ArticleList from './ArticleList';
import { Article } from '@/lib/articles';

interface ColumnSectionProps {
  articles: Article[];
}

export default function ColumnSection({ articles }: ColumnSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

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
      <h2 className="section-title is-visible">
        コラム
      </h2>
      <div style={{ marginTop: '12px' }}>
        <ArticleList articles={articles} />
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link
          href="/articles"
          style={{
            display: 'block',
            width: '100%',
            marginTop: '16px',
            padding: '10px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#333',
            textAlign: 'center',
            textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          もっとみる
        </Link>
      </div>
    </section>
  );
}
