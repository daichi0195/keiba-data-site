import { Metadata } from 'next';
import Link from '@/components/HardLink';
import s from '@/components/v6/course/course.module.css';
import { Head } from '@/components/v6/course/parts';
import { GradeBadge, WeekBanners, WeekRaceList } from '@/components/v6/race/WeekRaces';
import w from '@/components/v6/race/week.module.css';
import { RACES, getRaceData } from '@/lib/races';
import { WEEK_RACES, weekSpan } from '@/lib/weekRaces';
import type { WeekGrade } from '@/lib/weekRaces';

const title = 'レースデータ｜重賞・リステッドの過去10年の傾向';
const description = '今週の重賞・リステッド・オープン特別と、レースごとの過去10年のデータ（人気・枠順・前走・上がり・血統・騎手）をまとめています。';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://www.keibadata.com/races' },
  // 公開前のテスト中は検索結果に出さない
  robots: RACES.every((r) => r.test) ? { index: false, follow: false } : undefined,
};

const SURF: Record<string, string> = { turf: '芝', dirt: 'ダート' };

export default function RacesPage() {
  const dates = [...new Set(WEEK_RACES.map((r) => r.date))].sort();
  const pages = RACES.map((r) => ({ def: r, d: getRaceData(r.slug) })).filter((x) => x.d);
  return (
    <div className={s.pg} data-course-page="">
      <div className={`${s.hero} ${w.top}`}>
        <nav className={s.crumb} aria-label="パンくず">
          <Link prefetch={false} href="/">HOME</Link>
          <span aria-hidden="true">/</span>
          <span>レースデータ</span>
        </nav>
        <h1>レースデータ</h1>
        <p className={s['hero-l']}>重賞・リステッドなど、レースごとの過去10年のデータと、今週のオープン以上のレースをまとめています。</p>
      </div>

      <section className={`${s.sc} ${s.first}`} aria-label="今週の重賞">
        <Head title="今週の重賞" />
        <WeekBanners />
      </section>

      <section className={s.sc} aria-label="今週のレース">
        <Head title="今週のピックアップレース" sub={`オープン・リステッド以上（${weekSpan(dates)}）`} />
        <WeekRaceList />
      </section>

      <section className={s.sc} aria-label="過去10年データのあるレース">
        <Head title="過去10年データのあるレース" sub="順次追加しています" />
        <div className={w.wl}>
          <ul className={w['wl-d']}>
            {pages.map(({ def, d }) => (
              <li key={def.slug}>
                <div className={w['wl-n']}>
                  {d!.grade && <GradeBadge grade={d!.grade as WeekGrade} />}
                  <Link prefetch={false} href={`/races/${def.slug}`}>{d!.name}</Link>
                </div>
                <div className={w['wl-m']}>
                  {d!.venue}
                  {SURF[d!.surface]}
                  {d!.distance}m・{d!.period.from}〜{d!.period.to}年
                </div>
                <div className={w['wl-a']}>
                  <Link prefetch={false} href={`/races/${def.slug}`}>過去10年</Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
