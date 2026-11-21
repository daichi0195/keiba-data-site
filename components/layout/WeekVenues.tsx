'use client';

import { useEffect, useState } from 'react';
import Link from '@/components/HardLink';
import s from './SiteFrame.module.css';

type WeekVenue = { id: string; name: string };

/** 左メニューの「今週開催」。/api/this-week をブラウザ側で取りに行く（ページの再生成間隔を縮めないため） */
export default function WeekVenues() {
  const [venues, setVenues] = useState<WeekVenue[]>([]);
  useEffect(() => {
    let alive = true;
    fetch('/api/this-week')
      .then((r) => (r.ok ? r.json() : []))
      .then((v: WeekVenue[]) => { if (alive && Array.isArray(v)) setVenues(v); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!venues.length) return null;
  return (
    <>
      <h2>今週開催</h2>
      <nav className={s.nav} aria-label="今週開催の競馬場">
        {venues.map((v) => (
          <Link prefetch={false} key={v.id} href={`/courses#rc-${v.id}`}>
            <i className={s.vd} aria-hidden="true" />
            <span>{v.name}競馬場</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
