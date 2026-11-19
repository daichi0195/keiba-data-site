'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import { FilterBox, ListChips } from './Nav';
import { cx } from './cx';

export type Surface = 'turf' | 'dirt' | 'steeplechase';
export interface CourseCell {
  href: string;
  /** 距離（m） */
  d: number;
  /** 内・外（無ければ空） */
  v: string;
}
export interface VenueData {
  id: string;
  /** 「東京」（競馬場を付けない） */
  name: string;
  week: boolean;
  rows: { sf: Surface; cells: CourseCell[] }[];
}

const LABEL: Record<Surface, string> = { turf: '芝', dirt: 'ダート', steeplechase: '障害' };
const SHORT: Record<Surface, string> = { turf: '芝', dirt: 'ダ', steeplechase: '障' };
const SURFS: Surface[] = ['turf', 'dirt', 'steeplechase'];

/**
 * コースデータ一覧（見本 list-courses.mjs と list.js の「コース：馬場と距離で絞り込む」）
 * - 馬場（すべて／芝／ダート／障害）と距離の先頭一致で絞り込む。数字以外が混じったら件数の横に案内を出す
 * - 700px以上は板1枚の表（競馬場｜芝・ダート・障害の行｜距離のマス）を途中の広告で2枚に分ける。
 *   絞り込み中と、途中の広告を出さない幅（1800px以上。広告は右列にある）は1枚につなげる
 * - スマホの絞り込み中は「競馬場名｜札｜距離」を1行にまとめた板1枚にする（CSS）
 */
export default function CourseIndex({ venues, children }: { venues: VenueData[]; children: React.ReactNode }) {
  const [q, setQ] = useState('');
  const [sf, setSf] = useState<'' | Surface>('');
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mq = matchMedia('(min-width:1800px)');
    const fn = () => setWide(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const parse = (raw: string, s: '' | Surface) => {
    const r = raw.normalize('NFKC');
    const d = r.replace(/\D/g, '');
    return { d, bad: /\D/.test(r), on: !!(d || s) };
  };
  const { d, bad, on } = parse(q, sf);

  // 一致の判定（コースごと）
  const hit = (row: VenueData['rows'][number], c: CourseCell) => (!sf || row.sf === sf) && (!d || String(c.d).indexOf(d) === 0);
  const nOf = (v: VenueData) => v.rows.reduce((s, r) => s + r.cells.filter((c) => hit(r, c)).length, 0);
  const total = venues.reduce((s, v) => s + nOf(v), 0);
  const vn = venues.filter((v) => nOf(v) > 0).length;

  const all = venues.reduce((s, v) => s + v.rows.reduce((t, r) => t + r.cells.length, 0), 0);
  const nSurf = (s: Surface) => venues.reduce((t, v) => t + v.rows.filter((r) => r.sf === s).reduce((u, r) => u + r.cells.length, 0), 0);

  const chips = useMemo(() => venues.map((v) => ({ id: `rc-${v.id}`, label: v.name, dot: v.week })), [venues]);
  const merged = on || wide;
  const half = Math.ceil(venues.length / 2);
  const panels = merged ? [venues, []] : [venues.slice(0, half), venues.slice(half)];

  const venue = (v: VenueData, first: boolean) => {
    const n = nOf(v);
    return (
      <section key={v.id} className={cx('lc-v', first && 'first')} id={`rc-${v.id}`} aria-label={`${v.name}競馬場`} hidden={!n}>
        <div className={cx('lc-h')}>
          <h2>
            {v.name}
            <span>競馬場</span>
          </h2>
          {v.week && (
            <span className={cx('lw')} title="今週開催">
              <i className={cx('lw-d')} />
              今週開催
            </span>
          )}
          <span className={cx('lc-n')}>
            <b className={cx('num')}>{v.rows.reduce((t, r) => t + r.cells.length, 0)}</b>コース
          </span>
        </div>
        <div className={cx('ds')}>
          {v.rows.map((r) => {
            const m = r.cells.filter((c) => hit(r, c)).length;
            return (
              <div key={r.sf} className={cx('ds-r')} hidden={!m}>
                <span className={cx(`sf ${r.sf}`)} data-short={SHORT[r.sf]}>
                  <span>{LABEL[r.sf]}</span>
                </span>
                <div className={cx('ds-c')}>
                  {r.cells.map((c) => (
                    <Link key={c.href} href={c.href} className={cx(c.v && 'v') || undefined} aria-label={`${v.name}${LABEL[r.sf]}${c.d}m${c.v}`} hidden={!hit(r, c)}>
                      {c.d}
                      <span className={cx('u')}>m</span>
                      {c.v}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };
  const panel = (list: VenueData[], extra?: string) => {
    const firstShown = list.find((v) => nOf(v) > 0);
    return (
      <div className={cx('lc', extra)} hidden={!firstShown}>
        {list.map((v) => venue(v, v === firstShown))}
      </div>
    );
  };

  const note =
    on || bad ? (
      <>
        {on && (
          <span>
            {sf ? LABEL[sf] : ''}
            {d ? `「${d}」で始まる距離` : ''}：<b>{total}</b>コース（{vn}競馬場）
          </span>
        )}
        {bad && <span className={cx('warn')}>距離は数字で入力してください（例：1600）</span>}
      </>
    ) : null;

  return (
    <div className={cx(on && 'lfon') || undefined}>
      <FilterBox
        mode="course"
        label="距離で絞り込む"
        placeholder="距離で絞り込む（例：1600）"
        numeric
        onRun={(raw) => {
          setQ(raw);
          return parse(raw, sf).on;
        }}
        note={note}
      >
        <div className={cx('lf-s')} role="group" aria-label="馬場で絞り込む">
          {(['', ...SURFS] as ('' | Surface)[]).map((s) => (
            <button key={s || 'all'} type="button" aria-pressed={sf === s} onClick={() => setSf(s)}>
              {s ? LABEL[s] : 'すべて'}
              <span className={cx('num')}>{s ? nSurf(s) : all}</span>
            </button>
          ))}
        </div>
      </FilterBox>
      <ListChips items={chips} label="競馬場へ移動" filtering={on} />

      <section className={cx('sc l1')} id="all">
        <h2 className={cx('vh')}>競馬場ごとのコース</h2>
        {panel(panels[0])}
        <div className={cx('lx lc-ad')} hidden={on}>
          <div className={cx('ad')}>
            <AdSlot unit="list" />
          </div>
        </div>
        {panel(panels[1], 'lc2')}
        <p className={cx('lc-0')} hidden={total > 0}>
          一致するコースが見つかりませんでした。
        </p>
      </section>

      {children}
    </div>
  );
}
