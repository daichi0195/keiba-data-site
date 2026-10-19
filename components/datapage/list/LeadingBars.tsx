import Link from 'next/link';
import s from '@/components/course/course.module.css';
import AnimateOnView from '@/components/course/AnimateOnView';
import l from './list.module.css';
import type { LeadingData } from '@/lib/getLeadingData';

/**
 * リーディング（勝ち数順）の横棒グラフ
 * 1行1段「順位｜名前｜横棒｜勝利数」。名前は詳細ページへのリンク。
 */
export default function LeadingBars({ data, linkPrefix }: { data: LeadingData[]; linkPrefix: string }) {
  if (data.length === 0) return null;
  const maxWins = Math.max(...data.map((d) => d.wins), 1);

  return (
    <AnimateOnView className={l.lRows}>
      {data.map((item, i) => (
        <div key={item.rank} className={l.lr}>
          <span className={l.rank}>
            {item.rank <= 3 ? (
              <b className={item.rank === 1 ? l.rank1 : item.rank === 2 ? l.rank2 : l.rank3}>{item.rank}</b>
            ) : (
              item.rank
            )}
          </span>
          <Link href={`${linkPrefix}${item.id}`} className={l.lName} title={item.name}>
            {item.name}
          </Link>
          <span className={s.bt} aria-hidden="true">
            <span
              className={s.bf}
              style={{ ['--w' as string]: `${(item.wins / maxWins) * 100}%`, ['--i' as string]: i }}
            />
          </span>
          <span className={l.lVal}>{item.wins}勝</span>
        </div>
      ))}
    </AnimateOnView>
  );
}
