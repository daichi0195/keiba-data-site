import Link from 'next/link';
import styles from './course.module.css';

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

// **テキスト** を強調に、links の名前を詳細ページへのリンクに置き換える（FaqSection と同じ規則）
function renderLine(text: string, links: FaqLink[] | undefined, key: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).flatMap((part, i): React.ReactNode[] => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return [<b key={`${key}-b${i}`} className={styles.em}>{part.slice(2, -2)}</b>];
    }
    if (!links || links.length === 0) return [part];
    const out: React.ReactNode[] = [];
    let remaining = part;
    links.forEach((link, j) => {
      const idx = remaining.indexOf(link.text);
      if (idx === -1) return;
      if (idx > 0) out.push(remaining.slice(0, idx));
      out.push(
        <Link key={`${key}-l${i}-${j}`} href={link.href} className={styles.textLink}>
          {link.text}
        </Link>
      );
      remaining = remaining.slice(idx + link.text.length);
    });
    out.push(remaining);
    return out;
  });
}

/** コースページのデータQ&A（開閉式の行） */
export default function CourseFaq({ items }: { items: FaqItem[] }) {
  return (
    <div className={styles.qa}>
      {items.map((item, index) => (
        <details key={index}>
          <summary>
            <span>{item.question}</span>
          </summary>
          {item.answer && (
            <div className={styles.qaAnswer}>
              {item.answer.split('\n').map((line, i) => {
                if (line === '') return null;
                const cls = line.startsWith('※') ? styles.qaNote : i === 0 && item.boldFirstLine ? styles.qaLead : undefined;
                return (
                  <p key={i} className={cls}>
                    {renderLine(line, item.links, `${index}-${i}`)}
                  </p>
                );
              })}
            </div>
          )}
        </details>
      ))}
    </div>
  );
}
