import Link from 'next/link';
import s from '@/components/course/course.module.css';
import l from './list.module.css';
import type { NameItem } from './kana';

/** 騎手・種牡馬・調教師の名前チップ（詳細ページへのリンク） */
export default function NameChips({ items, hrefPrefix }: { items: NameItem[]; hrefPrefix: string }) {
  return (
    <div className={l.chips}>
      {items.map((item) => (
        <Link key={item.id} href={`${hrefPrefix}${item.id}`} className={`${s.chip} ${l.nameChip}`}>
          {item.name}
        </Link>
      ))}
    </div>
  );
}
