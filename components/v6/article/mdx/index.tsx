// 記事本文（MDX）の部品の対応表。見出し（目次・記事内広告の位置）と箇条書きの見た目もここで決める。
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import AdSlot from '@/components/AdSlot';
import { cx } from '../cx';
import { TocInline, type Heading } from '../Toc';
import { ChevronRight } from '../icons';
import { DataTable, StatsTable, GateTable, ClassTable, GenderTable, HorseWeightTable, PreviousFinishTable, RunningStyleTable, ComparisonTable, PopularityTable } from './tables';
import { SeasonDualChart, DiffTable, BarCompareChart } from './charts';
import { AverageMaturityChart, MaturityChart } from './linesLazy';

/** 見出しのID（lib/articles.ts の extractHeadings と同じ作り方） */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w぀-ゟ゠-ヿ一-龯\s-]/g, '')
    .replace(/\s+/g, '-');
}

/** 要素の中の文字だけを取り出す */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return '';
}

type El = ReactElement<{ children?: ReactNode; href?: string }>;
const kidsOf = (el: El) => Children.toArray(el.props.children).filter((c) => !(typeof c === 'string' && !c.trim()));
const isEl = (n: unknown, type: string): n is El => isValidElement(n) && n.type === type;

/**
 * 記事ごとに作る（見出しの数を数えて、最初のH2の前に目次、2つ目と4つ目のH2の前に記事内広告を入れる＝現行と同じ）。
 * MDX の部品は本文の順に描かれるので、数えた値は本文の順になる。
 */
export function articleMdxComponents(headings: Heading[]) {
  let h2Count = 0;
  let lastH2 = '';

  return {
    DataTable,
    GateTable,
    HorseWeightTable,
    RunningStyleTable,
    PopularityTable,
    StatsTable,
    ClassTable,
    ComparisonTable,
    GenderTable,
    PreviousFinishTable,
    MaturityChart,
    AverageMaturityChart,
    BarCompareChart,
    SeasonDualChart,
    DiffTable,
    // 本文の先頭の「# 題」は、ページの頭に題（h1）があるので出さない（見本と同じ）
    h1: () => null,
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = textOf(children);
      h2Count += 1;
      lastH2 = text;
      return (
        <>
          {h2Count === 1 && <TocInline headings={headings} initialShow={5} />}
          {(h2Count === 2 || h2Count === 4) && (
            <div className={cx('ar-ad')}>
              <AdSlot unit="articleIn" variant="article" />
            </div>
          )}
          <h2 id={headingId(text)} {...props}>
            {children}
          </h2>
        </>
      );
    },
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 id={headingId(textOf(children))} {...props}>
        {children}
      </h3>
    ),
    // 箇条書き（Markdown の「- 」）：リンクだけの並びは押せるマス、「**春**：3月…」の並びは罫の表、「まとめ」の中は罫で囲む
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => {
      const items = Children.toArray(children).filter((c): c is El => isValidElement(c));
      const linkOnly =
        items.length > 0 &&
        items.every((li) => {
          const k = kidsOf(li);
          if (k.length !== 1 || !isEl(k[0], 'strong')) return false;
          const s = kidsOf(k[0]);
          return s.length === 1 && isEl(s[0], 'a');
        });
      if (linkOnly) {
        return (
          <ul className={cx('lk')}>
            {items.map((li, i) => {
              const a = kidsOf(kidsOf(li)[0] as El)[0] as El;
              return (
                <li key={i}>
                  <a href={a.props.href}>
                    {a.props.children}
                    <ChevronRight />
                  </a>
                </li>
              );
            })}
          </ul>
        );
      }
      const defs =
        items.length > 0 &&
        items.every((li) => {
          const k = kidsOf(li);
          return isEl(k[0], 'strong') && textOf(k[0]).length <= 2 && typeof k[1] === 'string' && k[1].startsWith('：');
        });
      if (defs) return <ul className={cx('kv')} {...props}>{children}</ul>;
      if (lastH2 === 'まとめ') return <ul className={cx('sum')} {...props}>{children}</ul>;
      return <ul {...props}>{children}</ul>;
    },
  };
}
