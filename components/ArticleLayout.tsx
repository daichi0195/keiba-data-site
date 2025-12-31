import { ReactNode } from 'react';
import styles from './ArticleLayout.module.css';

interface ArticleLayoutProps {
  title: string;
  publishDate?: string;
  showDateIcon?: boolean;
  children: ReactNode;
}

export default function ArticleLayout({
  title,
  publishDate,
  showDateIcon = true,
  children
}: ArticleLayoutProps) {
  return (
    <div className={styles.container}>
      <article className={styles.article}>
        <h1 className={styles.title}>{title}</h1>
        {publishDate && (
          <p className={styles.date}>
            {showDateIcon && <i className="far fa-calendar-alt" style={{ marginRight: '6px' }}></i>}
            投稿日 {publishDate}
          </p>
        )}
        <div className={styles.content}>
          {children}
        </div>
      </article>
    </div>
  );
}
