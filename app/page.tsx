import { Metadata } from 'next';
import AdSlot from '@/components/AdSlot';
import TopChips from '@/components/v6/home/TopChips';
import { AiCards, ColumnList, COURSE_TOTAL, Head, People, VENUES, VenueList, WeekVenues, type RaceSummary } from '@/components/v6/home/parts';
import { WeekBanners, WeekRaceList } from '@/components/v6/race/WeekRaces';
import wk from '@/components/v6/race/week.module.css';
import { WEEK_RACES, weekSpan } from '@/lib/weekRaces';
import { cx } from '@/components/v6/home/cx';
import { JOCKEY_GROUPS, SIRE_GROUPS, TRAINER_GROUPS } from '@/components/datapage/list/kana';
import { getJockeyLeading, getTrainerLeading, getSireLeading, getLeadingYear } from '@/lib/getLeadingData';
import { getAllArticles } from '@/lib/articles';
import { getThisWeekVenues } from '@/lib/thisWeekVenues';
import { ALL_JOCKEYS } from '@/lib/jockeys';
import { ALL_SIRES } from '@/lib/sires';
import { ALL_TRAINERS } from '@/lib/trainers';

// AI予測（index.json）を反映するため60秒ごとに再生成。no-store だと毎リクエスト SSR になり表示が遅くなる
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.keibadata.com',
  },
  title: '競馬データ.com｜コース・騎手・血統の競馬データ分析【毎週更新】',
  description: '競馬データ.comは、競馬の予想に役立つあらゆるデータを網羅した競馬分析サイトです。コース別成績、騎手・調教師・種牡馬データ、人気・枠順・脚質傾向など、豊富な統計情報で競馬予想を徹底サポート。',
  openGraph: {
    title: '競馬データ.com｜コース・騎手・血統の競馬データ分析【毎週更新】',
    description: '競馬データ.comは、競馬の予想に役立つあらゆるデータを網羅した競馬分析サイトです。コース別成績、騎手・調教師・種牡馬データ、人気・枠順・脚質傾向など、豊富な統計情報で競馬予想を徹底サポート。',
    url: 'https://www.keibadata.com',
    siteName: '競馬データ.com',
    locale: 'ja_JP',
    type: 'website',
  },
};

async function fetchPredictions(): Promise<RaceSummary[]> {
  try {
    const url = `https://storage.googleapis.com/umadata/predictions/index.json?t=${Date.now()}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(0, 10);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  // サーバー側でリーディングデータ・記事・予測を読み込む
  const [jockeyLeading, trainerLeading, sireLeading, year, predictions, thisWeekVenues] = await Promise.all([
    getJockeyLeading(),
    getTrainerLeading(),
    getSireLeading(),
    getLeadingYear(),
    fetchPredictions(),
    getThisWeekVenues(),
  ]);
  // コラムは新着順（冒頭と下の一覧の両方）
  const articles = getAllArticles().sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
  const columns = articles.filter((a) => !a.frontmatter.link);
  const weekVenues = thisWeekVenues.map((v) => VENUES.find((x) => x.id === v.id)).filter((v): v is (typeof VENUES)[number] => Boolean(v));

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '競馬データ.com｜コース・騎手・血統の競馬データ分析【毎週更新】',
    description: '競馬データ.comは、競馬の予想に役立つあらゆるデータを網羅した競馬分析サイトです。コース別成績、騎手・調教師・種牡馬データ、人気・枠順・脚質傾向など、豊富な統計情報で競馬予想を徹底サポート。',
    url: 'https://www.keibadata.com',
    publisher: {
      '@type': 'Organization',
      name: '競馬データ.com',
      logo: 'https://www.keibadata.com/logo.png',
    },
  };

  // 見出しのチップ（見本 top.mjs の CHIPS）。節が出ないときはチップも出さない
  const weekDates = [...new Set(WEEK_RACES.map((r) => r.date))].sort();
  const chips = [
    predictions.length > 0 && { id: 'ai', label: 'AI勝率予測' },
    WEEK_RACES.length > 0 && { id: 'races', label: 'ピックアップレース' },
    weekVenues.length > 0 && { id: 'week', label: '今週開催' },
    { id: 'courses', label: 'コース' },
    { id: 'jockeys', label: '騎手' },
    { id: 'sires', label: '血統' },
    { id: 'trainers', label: '調教師' },
    { id: 'columns', label: 'コラム' },
  ].filter((x): x is { id: string; label: string } => Boolean(x));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className={cx('root')}>
        <h1 className={cx('vh')}>競馬データ.com｜コース・騎手・血統の競馬データ分析</h1>
        {/* 今週の重賞のバナー（見出しなしでページの一番上。その下にナビゲーションのチップ） */}
        <section className={`${cx('feat')} ${wk.top}`} id="top" aria-label="今週の重賞">
          <WeekBanners />
        </section>

        <TopChips items={chips} />

        {/* ナビのすぐ下の節は上の余白を詰める（ナビの下端から見出しまでを、ほかのページの最初の節と同じくらいに） */}
        {predictions.length > 0 && (
          <section className={cx('sc band')} id="ai" style={{ paddingTop: 8 }}>
            <Head title="AI勝率予測" sub="対象レースの約5分前に公開" more={{ href: '/ai', label: 'もっとみる' }} />
            <AiCards races={predictions} />
          </section>
        )}

        {WEEK_RACES.length > 0 && (
          <section className={cx('sc')} id="races" style={predictions.length > 0 ? undefined : { paddingTop: 8 }}>
            <Head title="今週のピックアップレース" sub={`オープン・リステッド以上（${weekSpan(weekDates)}）`} more={{ href: '/races', label: 'もっとみる' }} />
            <WeekRaceList />
          </section>
        )}

        {weekVenues.length > 0 && (
          <section className={cx('sc')} id="week">
            <Head title="今週開催の競馬場" />
            <WeekVenues venues={weekVenues} />
          </section>
        )}

        <div className={cx('ad')}>
          <AdSlot unit="list" />
        </div>

        <section className={cx('sc')} id="courses">
          <Head title="コース別データ" sub={`${VENUES.length}競馬場・${COURSE_TOTAL}コース`} more={{ href: '/courses', label: 'コース一覧' }} />
          <VenueList />
        </section>

        <People
          id="jockeys"
          title="騎手別データ"
          leadTitle="騎手リーディング"
          year={year}
          rows={jockeyLeading}
          ridesLabel="騎乗"
          groups={JOCKEY_GROUPS}
          unit="名"
          total={ALL_JOCKEYS.length}
          desc="過去3年間に30レース以上出走している現役中央騎手のデータを集計しています。"
          list={{ href: '/jockeys', label: '騎手一覧' }}
          hrefPrefix="/jockeys/"
        />
        <People
          id="sires"
          title="血統（種牡馬）別データ"
          leadTitle="種牡馬リーディング"
          year={year}
          rows={sireLeading}
          ridesLabel="出走"
          groups={SIRE_GROUPS}
          unit="頭"
          total={ALL_SIRES.length}
          desc="過去3年間に産駒が50レース以上出走し、かつ産駒が10頭以上いる種牡馬のデータを集計しています。"
          list={{ href: '/sires', label: '種牡馬一覧' }}
          hrefPrefix="/sires/"
        />
        <People
          id="trainers"
          title="調教師別データ"
          leadTitle="調教師リーディング"
          year={year}
          rows={trainerLeading}
          ridesLabel="出走"
          groups={TRAINER_GROUPS}
          unit="名"
          total={ALL_TRAINERS.length}
          desc="過去3年間に30レース以上出走している現役中央調教師のデータを集計しています。"
          list={{ href: '/trainers', label: '調教師一覧' }}
          hrefPrefix="/trainers/"
        />

        <div className={cx('ad')}>
          <AdSlot unit="list" />
        </div>

        <section className={cx('sc')} id="columns">
          <Head title="コラム" more={{ href: '/articles', label: 'もっとみる' }} />
          <ColumnList articles={columns} />
        </section>
      </main>
    </>
  );
}
