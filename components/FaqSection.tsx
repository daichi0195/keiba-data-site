'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './FaqSection.module.css';

interface FaqLink {
  text: string;
  href: string;
}

interface FaqItem {
  question: string;
  answer?: string;
  links?: FaqLink[];
  boldFirstLine?: boolean;
}

interface FaqSectionProps {
  items: FaqItem[];
}

// **テキスト** を highlight span に変換し、links があればリンクに置換する
function parseLine(text: string, links?: FaqLink[]) {
  // まず **...** でスプリット
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);

  return boldParts.flatMap((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return [<span key={`b-${i}`} className={styles.highlight}>{part.slice(2, -2)}</span>];
    }

    // リンクの置換
    if (!links || links.length === 0) return [part];

    const result: React.ReactNode[] = [];
    let remaining = part;
    let keyIdx = 0;

    for (const link of links) {
      const idx = remaining.indexOf(link.text);
      if (idx === -1) continue;
      if (idx > 0) result.push(remaining.slice(0, idx));
      result.push(
        <Link key={`${i}-link-${keyIdx++}`} href={link.href} className={styles.link}>
          {link.text}
        </Link>
      );
      remaining = remaining.slice(idx + link.text.length);
    }
    result.push(remaining);
    return result;
  });
}

function AnswerText({ text, links, boldFirstLine }: { text: string; links?: FaqLink[]; boldFirstLine?: boolean }) {
  const lines = text.split('\n');
  return (
    <span className={styles.answerText}>
      {lines.map((line, i) => {
        if (line === '') return <span key={i} className={styles.answerSpacer} />;
        const isFullBold = line.startsWith('**') && line.endsWith('**');
        const cls = line.startsWith('※') ? styles.answerNote
          : i === 0 && boldFirstLine ? styles.answerConclusionBold
          : isFullBold ? styles.answerConclusion
          : i === 0 ? styles.answerConclusion
          : styles.answerLine;
        return <span key={i} className={cls}>{parseLine(line, links)}</span>;
      })}
    </span>
  );
}

export default function FaqSection({ items }: FaqSectionProps) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setOpenIndexes(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  return (
    <div className={styles.faqList}>
      {items.map((item, index) => (
        <div key={index} className={styles.faqItem}>
          <button
            className={`${styles.faqQuestion} ${openIndexes.has(index) ? styles.open : ''}`}
            onClick={() => toggle(index)}
            aria-expanded={openIndexes.has(index)}
          >
            <span className={styles.qBadge}>Q</span>
            <span className={styles.questionText}>{item.question}</span>
            <span className={styles.chevron}></span>
          </button>
          {openIndexes.has(index) && item.answer && (
            <div className={styles.faqAnswer}>
              <span className={styles.aBadge}>A</span>
              <AnswerText text={item.answer} links={item.links} boldFirstLine={item.boldFirstLine} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
