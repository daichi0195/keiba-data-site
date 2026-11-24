import { Metadata } from 'next';
import Link from '@/components/HardLink';
import s from '@/components/v6/course/course.module.css';
import { Head } from '@/components/v6/course/parts';
import { GradeBadge, WeekBanners, WeekRaceList } from '@/components/v6/race/WeekRaces';
import w from '@/components/v6/race/week.module.css';
import { RACES } from '@/lib/races';
import { WEEK_RACES, weekSpan } from '@/lib/weekRaces';
import type { WeekGrade } from '@/lib/weekRaces';

const title = 'レースデータ｜G1・重賞・リステッドの過去10年データと傾向';
const description = '今週の重賞・リステッド・オープン特別と、レースごとの過去10年のデータ（人気・枠順・前走・上がり・血統・騎手）をまとめています。';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://www.keibadata.com/races' },
  // 公開前のテスト中は検索結果に出さない
  robots: RACES.every((r) => r.test) ? { index: false, follow: false } : undefined,
};

const SURF: Record<string, string> = { turf: '芝', dirt: 'ダート' };
const GROUPS = [
  { grade: 'G1', label: 'G1' },
  { grade: 'G2', label: 'G2' },
  { grade: 'G3', label: 'G3' },
  { grade: 'L', label: 'リステッド' },
  { grade: 'OP', label: 'オープン特別' },
];
const MONTH = (iso: string) => `${Number(iso.slice(5, 7))}月`;

export default function RacesPage() {
  const dates = [...new Set(WEEK_RACES.map((r) => r.date))].sort();
  return (
    <div className={s.pg} data-course-page="">
      <div className={`${s.hero} ${w.top}`}>
        <nav className={s.crumb} aria-label="パンくず">
          <Link prefetch={false} href="/">HOME</Link>
          <span aria-hidden="true">/</span>
          <span>レースデータ</span>
        </nav>
        <h1>レースデータ</h1>
        <p className={s['hero-l']}>G1から重賞・リステッド・オープン特別まで、{RACES.length}レースの過去10年のデータと、今週のオープン以上のレースをまとめています。</p>
      </div>

      <section className={`${s.sc} ${s.first}`} aria-label="今週の重賞">
        <Head title="今週の重賞" />
        <WeekBanners />
      </section>

      <section className={s.sc} aria-label="今週のレース">
        <Head title="今週のピックアップレース" sub={`オープン・リステッド以上（${weekSpan(dates)}）`} />
        <WeekRaceList />
      </section>

      {GROUPS.map((g) => {
        const rows = RACES.filter((r) => r.grade === g.grade).sort((a, b) => a.last_date.slice(5).localeCompare(b.last_date.slice(5)));
        if (!rows.length) return null;
        return (
          <section key={g.grade} id={`grade-${g.grade.toLowerCase()}`} className={s.sc} aria-label={`${g.label}の過去10年データ`}>
            <Head title={`${g.label}の過去10年データ`} sub={`${rows.length}レース・開催時期の順`} />
            <div className={w.wl}>
              <ul className={w['wl-d']}>
                {rows.map((r) => (
                  <li key={r.slug}>
                    <div className={w['wl-n']}>
                      {r.grade && <GradeBadge grade={r.grade as WeekGrade} />}
                      <Link prefetch={false} href={`/races/${r.slug}`}>{r.name}</Link>
                    </div>
                    <div className={w['wl-m']}>
                      {MONTH(r.last_date)}・{r.venue}
                      {SURF[r.surface]}
                      {r.distance}m
                    </div>
                    <div className={w['wl-a']}>
                      <Link prefetch={false} href={`/races/${r.slug}`}>
                        過去10年<span className={w.lg}>のデータを見る</span>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
