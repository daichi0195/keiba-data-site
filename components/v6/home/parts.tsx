import Link from '@/components/HardLink';
import Image from 'next/image';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FrameIcon } from '@/components/layout/icons';
import { ALL_COURSES, getCourseUrl, getCoursesByRacecourse } from '@/lib/courses';
import { getRaceGrade } from '@/lib/raceGrades';
import type { Article } from '@/lib/articles';
import type { KanaGroup } from '@/components/datapage/list/kana';
import LeadingRank, { type RankRow } from './LeadingRank';
import KanaIndex from './KanaIndex';
import RiseOnView from './RiseOnView';
import { cx } from './cx';

/* ---------- データの形（見本 lib.mjs の VENUES・SURF・of・dl と同じ） ---------- */
type Course = (typeof ALL_COURSES)[number];
type Surface = 'turf' | 'dirt' | 'steeplechase';
const SURF: [Surface, string, string][] = [
  ['turf', '芝', '芝'],
  ['dirt', 'ダート', 'ダ'],
  ['steeplechase', '障害', '障'],
];
const variantOf = (c: Course) => (c as { variant?: 'inner' | 'outer' }).variant;
const vLabel = (c: Course) => (variantOf(c) === 'inner' ? '内' : variantOf(c) === 'outer' ? '外' : '');
const dl = (c: Course) => `${c.distance}m${vLabel(c)}`;

/** 北から南の10競馬場（コースは馬場→距離→内外の順） */
export const VENUES = getCoursesByRacecourse().map((g) => ({
  id: g.racecourse,
  name: g.racecourse_ja.replace('競馬場', ''),
  courses: g.courses as readonly Course[],
}));
export type VenueRow = (typeof VENUES)[number];
const of = (v: VenueRow, sf: Surface) => v.courses.filter((c) => c.surface === sf);
export const COURSE_TOTAL = ALL_COURSES.length;

const ChevR = () => <FrameIcon icon={faChevronRight} className={cx('ic')} />;
const ChevD = () => <FrameIcon icon={faChevronDown} className={cx('ic')} />;

/** 節の見出し（地の上）。右に丸いボタン */
export function Head({ title, sub, more }: { title: string; sub?: string; more?: { href: string; label: string } }) {
  return (
    <div className={cx('hd')}>
      <h2>
        {title}
        {sub && <small>{sub}</small>}
      </h2>
      {more && (
        <Link prefetch={false} className={cx('pill')} href={more.href}>
          {more.label}
        </Link>
      )}
    </div>
  );
}

/** 競馬場の距離の表：馬場の札＋距離のマス（見本の dists()） */
export function Dists({ venue }: { venue: VenueRow }) {
  return (
    <div className={cx('ds')}>
      {SURF.filter(([sf]) => of(venue, sf).length).map(([sf, ja, short]) => (
        <div key={sf} className={cx('ds-r')}>
          <span className={cx(`sf ${sf}`)} data-short={short}>
            <span>{ja}</span>
          </span>
          <div className={cx('ds-c')}>
            {of(venue, sf).map((c) => (
              <Link prefetch={false} key={getCourseUrl(c)} href={getCourseUrl(c)} className={cx(variantOf(c) && 'v') || undefined} aria-label={`${venue.name}${ja}${dl(c)}`}>
                {c.distance}
                <span className={cx('u')}>m</span>
                {vLabel(c)}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const venueHref = (id: string) => `/courses#rc-${id}`;

/** 今週開催：スマホは競馬場ごとの板、700px以上は「競馬場｜芝・ダート・障害の行｜距離のマス」の表1枚 */
export function WeekVenues({ venues }: { venues: VenueRow[] }) {
  return (
    <>
      <div className={cx('wk')}>
        {venues.map((v) => (
          <div key={v.id} className={cx('pn')}>
            <h3>
              <Link prefetch={false} href={venueHref(v.id)}>
                {v.name}競馬場
                <ChevR />
              </Link>
            </h3>
            <Dists venue={v} />
          </div>
        ))}
      </div>
      <div className={cx('pn wkt')}>
        {venues.map((v) => (
          <div key={v.id} className={cx('wkt-r')}>
            <h3>
              <Link prefetch={false} href={venueHref(v.id)}>
                {v.name}競馬場
                <ChevR />
              </Link>
            </h3>
            <div className={cx('wkt-s')}>
              {SURF.filter(([sf]) => of(v, sf).length).map(([sf, ja]) => (
                <div key={sf} className={cx('wkt-c')}>
                  <span className={cx(`sf ${sf}`)}>{ja}</span>
                  <div className={cx('ds-c')}>
                    {of(v, sf).map((c) => (
                      <Link prefetch={false} key={getCourseUrl(c)} href={getCourseUrl(c)} aria-label={`${v.name}${ja}${dl(c)}`}>
                        {dl(c)}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/** コース別データ：競馬場ごとに開閉（閉じていてもリンクは HTML に含まれる） */
export function VenueList() {
  return (
    <div className={cx('vl')}>
      {VENUES.map((v) => (
        <details key={v.id}>
          <summary>
            <b>{v.name}競馬場</b>
            <span className={cx('vl-c')}>
              {SURF.filter(([sf]) => of(v, sf).length).map(([sf, , short]) => (
                <span key={sf} className={cx(`sf sm ${sf}`)}>
                  {short} {of(v, sf).length}
                </span>
              ))}
            </span>
            <ChevD />
          </summary>
          <Dists venue={v} />
        </details>
      ))}
    </div>
  );
}

/** 騎手・種牡馬・調教師：左にリーディング、右に全件の五十音（見本 lib.mjs の people()） */
export function People(p: {
  id: string;
  title: string;
  leadTitle: string;
  year: number;
  rows: RankRow[];
  ridesLabel: string;
  groups: KanaGroup[];
  unit: string;
  total: number;
  desc: string;
  list: { href: string; label: string };
  hrefPrefix: string;
}) {
  const name = p.title.replace('別データ', '');
  return (
    <section className={cx('sc')} id={p.id}>
      <Head title={p.title} more={p.list} />
      <div className={cx('two')}>
        <div className={cx('pn')}>
          <h3>
            {p.leadTitle}
            <small>{p.year}年・勝ち数順</small>
          </h3>
          {p.rows.length > 0 && <LeadingRank rows={p.rows} unit={p.ridesLabel} hrefPrefix={p.hrefPrefix} />}
        </div>
        <div className={cx('pn')}>
          <h3>
            全{name}データ
            <small>
              {p.total}
              {p.unit}
            </small>
          </h3>
          <p className={cx('de')}>{p.desc}</p>
          <KanaIndex groups={p.groups} unit={p.unit} label={name} hrefPrefix={p.hrefPrefix} />
        </div>
      </div>
    </section>
  );
}

/* ---------- AI勝率予測 ---------- */
export interface RaceSummary {
  slug: string;
  date: string;
  venueLabel: string;
  raceNumber: number;
  raceName: string;
  surface: string;
  distance: number;
}
const WD = '日月火水木金土';
/** "2026-11-15" → "11/15（日）" */
const shortDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return `${m}/${d}（${WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}）`;
};
/** 「3歳以上1勝クラス」→「3歳以上 1勝クラス」 */
const short = (n: string) => n.replace(/^(\d歳(以上)?)/, '$1 ');

export function AiCards({ races }: { races: RaceSummary[] }) {
  return (
    <RiseOnView>
      {races.map((e, i) => {
        const g = getRaceGrade(e.raceName);
        const turf = e.surface === '芝';
        return (
          <Link prefetch={false} key={e.slug} className={cx('ac')} href={`/ai/races/${e.slug}`} style={{ ['--i' as string]: i }}>
            <p className={cx('ac-h')}>
              <span className={cx('ac-v')}>
                {e.venueLabel}
                <b className={cx('num')}>{e.raceNumber}</b>R
              </span>
              <span className={cx('ac-d')}>{shortDate(e.date)}</span>
            </p>
            <p className={cx('ac-n')}>
              {g && <i className={cx(`gr ${g.toLowerCase()}`)}>{g}</i>}
              {short(e.raceName)}
            </p>
            <p className={cx('ac-m')}>
              <i className={cx(`sf sm ${turf ? 'turf' : 'dirt'}`)}>{turf ? '芝' : 'ダート'}</i>
              <span className={cx('num')}>{e.distance}m</span>
            </p>
          </Link>
        );
      })}
    </RiseOnView>
  );
}

/* ---------- コラム ---------- */
/** "2026-05-16" → "2026年5月16日" */
const jaDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return `${y}年${m}月${d}日`;
};
const articleHref = (a: Article) => a.frontmatter.link || `/articles/${a.slug}`;

/** 冒頭のコラム（スマホは横送り、PCは1本目を大きく） */
export function FeatArticles({ articles }: { articles: Article[] }) {
  return (
    <div className={cx('vg car')}>
      {articles.map((a, i) => (
        <Link prefetch={false} key={a.slug} className={cx('vc')} href={articleHref(a)}>
          {a.frontmatter.thumbnail && (
            <Image
              src={a.frontmatter.thumbnail}
              alt=""
              width={960}
              height={540}
              priority={i === 0}
              sizes={i === 0 ? '(min-width: 1100px) 70vw, 90vw' : '(min-width: 1100px) 30vw, (min-width: 700px) 50vw, 90vw'}
            />
          )}
          <p className={cx('vc-t')}>{a.frontmatter.title}</p>
          <p className={cx('vc-m')}>コラム・{jaDate(a.frontmatter.date)}</p>
        </Link>
      ))}
    </div>
  );
}

/** 下のコラム一覧（絵を上に置いたカード） */
export function ColumnList({ articles }: { articles: Article[] }) {
  return (
    <div className={cx('vg lst')}>
      {articles.map((a) => (
        <Link prefetch={false} key={a.slug} className={cx('vc')} href={articleHref(a)}>
          {a.frontmatter.thumbnail && (
            <Image src={a.frontmatter.thumbnail} alt="" width={960} height={540} sizes="(min-width: 1100px) 30vw, (min-width: 700px) 33vw, 50vw" />
          )}
          <div>
            <p className={cx('vc-t')}>{a.frontmatter.title}</p>
            <p className={cx('vc-m')}>コラム・{jaDate(a.frontmatter.date)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
