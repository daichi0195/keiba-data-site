'use client';

// コラム一覧の頭（パンくず・題・並び替え）と絵の並び（見本 articles.mjs ＋ js/articles.js）
import { useState } from 'react';
import Link from '@/components/HardLink';
import { Card, type ColumnCard } from './Cards';
import { useRise } from './RiseGrid';
import { cx } from './cx';

type Sort = 'new' | 'pop';

/** newest：新着順（日付の新しい順）、popular：人気順（priority の小さい順）。どちらもサーバーで並べた順番 */
export default function ColumnIndex({ title, lead, newest, popular }: { title: string; lead: string; newest: ColumnCard[]; popular: ColumnCard[] }) {
  const [sort, setSort] = useState<Sort>('new');
  const { ref, cls, finish } = useRise<HTMLDivElement>();
  const list = sort === 'new' ? newest : popular;

  return (
    <>
      <div className={cx('pg')}>
        <nav className={cx('bc')} aria-label="パンくず">
          <Link prefetch={false} href="/">HOME</Link>
          <i aria-hidden="true">/</i>
          <span>コラム</span>
        </nav>
        <div className={cx('pg-h')}>
          <div>
            <h1>{title}</h1>
            <p>{lead}</p>
          </div>
          <div className={cx('srt')} role="group" aria-label="並び替え">
            {([['new', '新着順'], ['pop', '人気順']] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={sort === k}
                onClick={() => {
                  finish();
                  setSort(k);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div ref={ref} className={cx('cl', ...cls)}>
        {list.length === 0 ? <p>まだ記事がありません</p> : list.map((a, i) => <Card key={a.slug} a={a} withDesc i={i} />)}
      </div>
    </>
  );
}
