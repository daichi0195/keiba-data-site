import Link from '@/components/HardLink';
import { FrameIcon, FRAME_ICONS } from '@/components/layout/icons';
import { WEEK_RACES, jaDateShort, weekRacesByDate, type WeekGrade, type WeekRace } from '@/lib/weekRaces';
import BannerScroller from './BannerScroller';
import { Gallop } from './Gallop';
import w from './week.module.css';

const SURF: Record<string, string> = { turf: '芝', dirt: 'ダート' };
const GRADE_CLASS: Record<WeekGrade, string> = { G1: w.g1, G2: w.g2, G3: w.g3, L: w.gl, OP: w.gop };

export function GradeBadge({ grade }: { grade: WeekGrade }) {
  return <i className={`${w.gr} ${GRADE_CLASS[grade]}`}>{grade}</i>;
}

const meta = (r: WeekRace) => `${jaDateShort(r.date)} ${r.venue}${r.raceNo}R・${SURF[r.surface]}${r.distance}m・${r.condition}・${r.weightType}`;

/** 今週の重賞のバナー（トップの一番上）。レース名と日時に、過去10年のデータ・コースデータの2つのボタン。右に馬と騎手の絵 */
export function WeekBanners() {
  const order: Record<string, number> = { G1: 0, G2: 1, G3: 2 };
  const races = WEEK_RACES.filter((r) => r.slug && r.grade in order).sort((a, b) => order[a.grade] - order[b.grade] || a.date.localeCompare(b.date));
  if (!races.length) return null;
  return (
    <BannerScroller>
      {races.map((r) => (
        <div key={r.slug} className={`${w['bn-i']} ${GRADE_CLASS[r.grade]}`}>
          <Gallop className={w['bn-art']} />
          <span className={w['bn-d']}>
            {jaDateShort(r.date)} {r.venue}
            {r.raceNo}R・{SURF[r.surface]}
            {r.distance}m
          </span>
          <Link prefetch={false} href={`/races/${r.slug}`} className={w['bn-n']}>
            <i className={w['bn-g']}>{r.grade}</i>
            {r.name}
          </Link>
          <div className={w['bn-b']}>
            <Link prefetch={false} href={`/races/${r.slug}`} className={w.p}>
              過去10年のデータ
            </Link>
            <Link prefetch={false} href={r.course} className={w.s}>
              コースデータ
            </Link>
          </div>
        </div>
      ))}
    </BannerScroller>
  );
}

/** 今週のオープン以上のレース（日付ごと。過去10年データがあればそちらへ、なければコースデータへ） */
export function WeekRaceList() {
  return (
    <div className={w.wl}>
      {weekRacesByDate().map(({ date, races }) => (
        <div key={date} className={w['wl-d']}>
          <h3>{jaDateShort(date)}</h3>
          <ul>
            {races.map((r) => (
              <li key={`${r.venue}${r.raceNo}`}>
                <div className={w['wl-n']}>
                  <GradeBadge grade={r.grade} />
                  {r.slug ? (
                    <Link prefetch={false} href={`/races/${r.slug}`}>{r.name}</Link>
                  ) : (
                    <span>{r.name}</span>
                  )}
                </div>
                <div className={w['wl-m']}>
                  {r.venue}
                  {r.raceNo}R・{SURF[r.surface]}
                  {r.distance}m<span className={w.cn}>・{r.condition}</span>
                </div>
                <div className={w['wl-a']}>
                  {r.slug && (
                    <Link prefetch={false} href={`/races/${r.slug}`}>
                      過去10年<span className={w.lg}>のデータを見る</span>
                    </Link>
                  )}
                  <Link prefetch={false} href={r.course}>
                    コース<span className={w.lg}>データを見る</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
