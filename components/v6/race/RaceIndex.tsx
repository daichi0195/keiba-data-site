'use client';

import { useMemo, useState } from 'react';
import Link from '@/components/HardLink';
import AdSlot from '@/components/AdSlot';
import { FRAME_ICONS, FrameIcon } from '@/components/layout/icons';
import { FilterBox, ListChips } from '@/components/v6/list/Nav';
import { Head } from '@/components/v6/list/Head';
import { yomi } from '@/components/v6/list/text';
import { cx } from '@/components/v6/list/cx';
import w from './week.module.css';

export interface RaceRow {
  slug: string;
  name: string;
  grade: string;
  month: number;
  venue: string;
  surf: string;
  distance: number;
  course: string;
}

const GROUPS = [
  { grade: 'G1', label: 'G1', id: 'g1' },
  { grade: 'G2', label: 'G2', id: 'g2' },
  { grade: 'G3', label: 'G3', id: 'g3' },
  { grade: 'L', label: 'リステッド（L）', id: 'gl' },
  { grade: 'OP', label: 'オープン特別（OP）', id: 'gop' },
];
const GRADE_CLASS: Record<string, string> = { G1: w.g1, G2: w.g2, G3: w.g3, L: w.gl, OP: w.gop };
/** 格付けごとに最初に見せる件数。残りは「もっと見る」で開く */
const FIRST = 10;

/**
 * レースデータ一覧（/races）。ほかの一覧ページ（騎手・コース）と同じ作り：
 * 絞り込み（レース名・格付け）→ ページ内の移動 → 格付けごとの板（10件＋もっと見る）
 * 絞り込み中は、一致したレースを全部出し、もっと見るのボタンと途中の広告をたたむ。
 */
export default function RaceIndex({ rows, week, children }: { rows: RaceRow[]; week?: React.ReactNode; children: React.ReactNode }) {
  const [q, setQ] = useState('');
  const [grade, setGrade] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const v = yomi(q);
  const on = !!(v || grade);
  const hit = (r: RaceRow) => (!grade || r.grade === grade) && (!v || yomi(r.name).includes(v) || yomi(r.venue).includes(v));
  const found = rows.filter(hit).length;

  const groups = useMemo(() => GROUPS.map((g) => ({ ...g, rows: rows.filter((r) => r.grade === g.grade) })).filter((g) => g.rows.length), [rows]);
  // 格付けの移動は上の絞り込みボタンと重なるので、チップは今週の節と全レースへの移動だけ
  const chips = useMemo(
    () => [...(week ? [{ id: 'week', label: '今週の重賞' }, { id: 'pickup', label: 'ピックアップレース' }] : []), { id: groups[0]?.id ?? 'g1', label: '全レース', n: rows.length }],
    [week, groups, rows.length]
  );

  const row = (r: RaceRow, hidden: boolean) => (
    <li key={r.slug} hidden={hidden}>
      <div className={w['wl-n']}>
        <i className={`${w.gr} ${GRADE_CLASS[r.grade]}`}>{r.grade}</i>
        <Link prefetch={false} href={`/races/${r.slug}`}>
          {r.name}
        </Link>
      </div>
      <div className={w['wl-m']}>
        <span className={w.mo}>{r.month}月・</span>
        {r.venue}
        {r.surf}
        {r.distance}m
      </div>
      <div className={w['wl-a']}>
        <Link prefetch={false} href={`/races/${r.slug}`}>
          過去10年<span className={w.lg}>のデータを見る</span>
        </Link>
        <Link prefetch={false} href={r.course}>
          コース<span className={w.lg}>データを見る</span>
        </Link>
      </div>
    </li>
  );

  return (
    <div className={cx(on && 'lfon') || undefined}>
      <FilterBox
        mode="name"
        unit="レース"
        noun="レース"
        label="レース名で絞り込む"
        placeholder="レース名・競馬場で絞り込む（例：有馬、中山）"
        onRun={(raw) => {
          setQ(raw);
          return !!(yomi(raw) || grade);
        }}
        note={
          on ? (
            <span>
              一致：<b>{found}</b>レース
            </span>
          ) : null
        }
      >
        <div className={`${cx('lf-s')} ${w.gf}`} role="group" aria-label="格付けで絞り込む">
          {[{ grade: '', label: 'すべて' }, ...GROUPS].map((g) => (
            <button key={g.grade || 'all'} type="button" aria-pressed={grade === g.grade} onClick={() => setGrade(g.grade)}>
              {g.grade || "すべて"}
              <span className={cx('num')}>{g.grade ? rows.filter((r) => r.grade === g.grade).length : rows.length}</span>
            </button>
          ))}
        </div>
      </FilterBox>
      <ListChips items={chips} label="格付けへ移動" filtering={on} />

      {/* 今週の重賞・ピックアップレース（絞り込み中はたたむ） */}
      {week && (
        <div className={cx('lx')} hidden={on}>
          {week}
        </div>
      )}

      {groups.map((g, gi) => {
        const shown = g.rows.filter(hit);
        const expanded = on || open[g.id];
        return (
          <div key={g.id}>
            <section className={cx('sc', gi === 0 && !week && 'l1')} id={g.id} aria-label={`${g.label}の過去10年データ`} hidden={!shown.length}>
              <Head title={`${g.label}の過去10年データ`} sub={on ? `${shown.length}レース` : `${g.rows.length}レース・開催時期の順`} />
              <div className={`${cx('lp')} ${w.ri}`}>
                <ul className={w['wl-d']}>{g.rows.map((r, i) => row(r, !hit(r) || (!expanded && i >= FIRST)))}</ul>
                {!on && g.rows.length > FIRST && (
                  <button
                    type="button"
                    className={w.more}
                    aria-expanded={!!open[g.id]}
                    onClick={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))}
                  >
                    {open[g.id] ? `${FIRST}レースまでにする` : `残り${g.rows.length - FIRST}レースを表示`}
                    <FrameIcon icon={FRAME_ICONS.chevronDown} className={`${w.ic}${open[g.id] ? ` ${w.up}` : ''}`} />
                  </button>
                )}
              </div>
            </section>
            {gi === 1 && (
              <div className={cx('lx')} hidden={on}>
                <div className={cx('ad')}>
                  <AdSlot unit="list" />
                </div>
              </div>
            )}
          </div>
        );
      })}
      <p className={cx('lc-0')} hidden={!on || found > 0}>
        一致するレースが見つかりませんでした。
      </p>

      {children}
    </div>
  );
}
