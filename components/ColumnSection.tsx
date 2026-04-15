'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import ArticleList from './ArticleList';
import { Article } from '@/lib/articles';
import styles from './ColumnSection.module.css';

interface ColumnSectionProps {
  articles: Article[];
}

export default function ColumnSection({ articles: rawArticles }: ColumnSectionProps) {
  const articles = rawArticles.filter((a) => !a.frontmatter.link);
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
      <div style={{ marginTop: '0' }}>
        <ArticleList articles={articles} />
      </div>
      <div style={{ margin: '0' }}>
        <Link
          href="/articles"
          className={styles.moreLink}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '16px',
            padding: '0.75rem 1rem',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: '#4b5563',
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
