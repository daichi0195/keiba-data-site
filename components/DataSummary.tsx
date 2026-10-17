import styles from './DataSummary.module.css';

interface Props {
  title: string;
  paragraphs: string[];
  id?: string;
}

/**
 * データページ冒頭の固有解説文（サーバーコンポーネント）
 * lib/dataPageText.ts で各ページの実データから生成した文章を表示する。
 */
export default function DataSummary({ title, paragraphs, id = 'summary-section' }: Props) {
  if (!paragraphs || paragraphs.length === 0) return null;
  return (
    <section id={id} aria-label="データの概要" className={styles.summary}>
      <h2 className="section-title">{title}</h2>
      {paragraphs.map((text, i) => (
        <p key={i} className={styles.paragraph}>{text}</p>
      ))}
    </section>
  );
}
