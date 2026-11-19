// コラムの絵の並び（一覧・記事ページ下の「人気記事」で共用。見本 articles.mjs の card()）
import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/lib/articles';
import { cx } from './cx';

export type ColumnCard = { slug: string; title: string; description: string; date: string; dateJa: string; thumbnail?: string };

/** 日付を「2026年5月16日」の形にする（現行の記事ページと同じ書き方） */
export function dateJa(date: string): string {
  return new Date(date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo' });
}

export function toCard(a: Article): ColumnCard {
  const f = a.frontmatter;
  return { slug: a.slug, title: f.title, description: f.description ?? '', date: f.date, dateJa: dateJa(f.date), thumbnail: f.thumbnail };
}

export function Card({ a, withDesc, i }: { a: ColumnCard; withDesc: boolean; i: number }) {
  return (
    <Link className={cx('cl-i')} href={`/articles/${a.slug}`} title={a.title} style={{ '--i': i } as React.CSSProperties}>
      <span className={cx('cl-p')}>
        {a.thumbnail && <Image src={a.thumbnail} alt="" width={1200} height={630} sizes="(max-width: 699px) 50vw, (max-width: 1099px) 33vw, 420px" />}
      </span>
      <p className={cx('cl-m')}>
        コラム・<time dateTime={a.date}>{a.dateJa}</time>
      </p>
      <p className={cx('cl-t')}>{a.title}</p>
      {withDesc && a.description && <p className={cx('cl-d')}>{a.description}</p>}
    </Link>
  );
}
