import Link from '@/components/HardLink';
import AdSlot from '@/components/AdSlot';
import { FrameIcon, FRAME_ICONS } from '@/components/layout/icons';
import { ALL_COURSES } from '@/lib/courses';
import { ALL_JOCKEYS } from '@/lib/jockeys';
import { ALL_SIRES } from '@/lib/sires';
import { ALL_TRAINERS } from '@/lib/trainers';
import { getDataUpdatedAt, formatJaDate, toIsoDate } from '@/lib/dataDate';
import type { KanaGroup } from '@/components/datapage/list/kana';
import type { NameGroup } from './NameIndex';
import { Head } from './Head';
import { cellClass, yomi } from './text';
import { cx } from './cx';

/** 冒頭：パンくず・h1・掲載件数と更新日・リード文（見本 list-shared.mjs の hero()） */
export function Hero({ title, lead, count }: { title: string; lead: string; count: string }) {
  const updatedAt = getDataUpdatedAt();
  return (
    <div className={cx('lh')}>
      <nav className={cx('lh-c')} aria-label="パンくず">
        <Link prefetch={false} href="/">HOME</Link>
        <span aria-hidden="true">/</span>
        <span>{title}</span>
      </nav>
      <div className={cx('lh-t')}>
        <h1>{title}</h1>
        <p className={cx('lh-m')}>
          <span>
            掲載 <b>{count}</b>
          </span>
          {updatedAt && (
            <span>
              更新{' '}
              <b>
                <time dateTime={toIsoDate(updatedAt)}>{formatJaDate(updatedAt)}</time>
              </b>
            </span>
          )}
        </p>
      </div>
      <p className={cx('lh-l')}>{lead}</p>
    </div>
  );
}

type ListKey = 'course' | 'jockey' | 'sire' | 'trainer';
const LISTS: [ListKey, string, string, string][] = [
  ['course', '/courses', 'コースデータ一覧', `${ALL_COURSES.length}コース`],
  ['jockey', '/jockeys', '騎手データ一覧', `${ALL_JOCKEYS.length}名`],
  ['sire', '/sires', '血統（種牡馬）別データ一覧', `${ALL_SIRES.length}頭`],
  ['trainer', '/trainers', '調教師データ一覧', `${ALL_TRAINERS.length}名`],
];

/** 末尾：ほかの一覧への案内、AI予測の案内、ブックマークの案内、広告（見本 list-shared.mjs の tail()） */
export function Tail({ current }: { current: ListKey }) {
  return (
    <>
      <section className={cx('sc')} id="others">
        <Head title="ほかのデータ一覧" />
        <div className={cx('lp lo')}>
          {LISTS.filter(([k]) => k !== current).map(([k, href, label, n]) => (
            <Link prefetch={false} key={k} href={href}>
              <FrameIcon icon={FRAME_ICONS[k]} className={cx('ic')} />
              <b>{label}</b>
              <span>{n}</span>
              <FrameIcon icon={FRAME_ICONS.chevronRight} className={cx('ic')} />
            </Link>
          ))}
        </div>
        <div className={cx('lp la')}>
          <div>
            <p className={cx('la-k')}>AI勝率予測</p>
            <h2>出走馬ごとの勝率をAIで予測</h2>
            <p className={cx('la-p')}>独自のモデルで出走馬の勝率を算出し、対象レースの約5分前に無料で公開しています。</p>
          </div>
          <Link prefetch={false} className={cx('la-b')} href="/ai">
            予測を見る
          </Link>
        </div>
        <p className={cx('lb')}>
          毎週の予想に活用しよう！<kbd>Ctrl+D</kbd> / <kbd>⌘+D</kbd> でブックマークに登録！
        </p>
      </section>
      <div className={cx('ad')}>
        <AdSlot unit="list" />
      </div>
    </>
  );
}

/** 五十音の行（kana.ts の KanaGroup）に、絞り込み用の読みと長い名前の2マス判定を足す */
export function toNameGroups(groups: KanaGroup[], kanaOf: Map<number, string | undefined>, wide: boolean): NameGroup[] {
  return groups.map((g) => ({
    kana: g.kana,
    slug: g.slug,
    items: g.items.map((x) => ({ id: x.id, name: x.name, k: yomi(kanaOf.get(x.id) || x.name), cls: cellClass(x.name, wide) })),
  }));
}
