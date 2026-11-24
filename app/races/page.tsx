import { Metadata } from 'next';
import { Hero, Tail } from '@/components/v6/list/parts';
import { ROOT, cx } from '@/components/v6/list/cx';
import { Head } from '@/components/v6/list/Head';
import RaceIndex, { type RaceRow } from '@/components/v6/race/RaceIndex';
import { WeekBanners, WeekRaceList } from '@/components/v6/race/WeekRaces';
import { RACES } from '@/lib/races';
import { WEEK_RACES, weekSpan } from '@/lib/weekRaces';

const title = 'レースデータ一覧｜G1・重賞・リステッドの過去10年データと傾向【毎週更新】';
const description = 'G1から重賞・リステッド・オープン特別まで、JRAのオープン以上のレースごとに過去10年の人気・枠順・前走・上がり・血統・騎手の傾向をまとめたデータ一覧。毎週更新。';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://www.keibadata.com/races' },
  openGraph: { title, description, url: 'https://www.keibadata.com/races', siteName: '競馬データ.com', locale: 'ja_JP', type: 'website' },
};

const SURF: Record<string, string> = { turf: '芝', dirt: 'ダート' };

export default function RacesPage() {
  const dates = [...new Set(WEEK_RACES.map((r) => r.date))].sort();
  // 格付けごとに開催時期（月日）の順
  const rows: RaceRow[] = [...RACES]
    .sort((a, b) => a.last_date.slice(5).localeCompare(b.last_date.slice(5)))
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      grade: r.grade ?? 'OP',
      month: Number(r.last_date.slice(5, 7)),
      venue: r.venue,
      surf: SURF[r.surface] ?? '',
      distance: r.distance,
      course: r.course,
    }));

  return (
    <main className={ROOT}>
      <Hero
        title="レースデータ一覧"
        lead="JRAのオープン以上のレースについて、最新回と同じ競馬場・距離で行われた過去10回の結果を集計しています。"
        count={`${RACES.length}レース`}
      />
      <RaceIndex
        rows={rows}
        week={
          WEEK_RACES.length > 0 ? (
            <>
              <section className={cx('sc l1')} id="week">
                <Head title="今週の重賞" />
                <WeekBanners />
              </section>
              <section className={cx('sc')} id="pickup">
                <Head title="今週のピックアップレース" sub={`オープン・リステッド以上（${weekSpan(dates)}）`} />
                <WeekRaceList />
              </section>
            </>
          ) : null
        }
      >
        <Tail current="race" />
      </RaceIndex>
    </main>
  );
}
