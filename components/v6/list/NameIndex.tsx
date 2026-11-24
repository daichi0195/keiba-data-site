'use client';

import { useMemo, useRef, useState } from 'react';
import Link from '@/components/HardLink';
import { FRAME_ICONS, FrameIcon } from '@/components/layout/icons';
import AdSlot from '@/components/AdSlot';
import LeadingRank, { type RankRow } from '@/components/v6/home/LeadingRank';
import { FilterBox, ListChips } from './Nav';
import { Head } from './Head';
import { yomi } from './text';
import { cx } from './cx';

export interface NameCell {
  id: number;
  name: string;
  /** 絞り込み用の読み（yomi(kana || name)） */
  k: string;
  /** 長い名前の2マス判定（w8 / w11 / p2） */
  cls: string;
}
export interface NameGroup {
  kana: string;
  slug: string;
  items: NameCell[];
}

/**
 * 騎手・種牡馬・調教師の一覧（見本 list-shared.mjs の namePage() と list.js の「名前で絞り込む」）
 * 名前で絞り込む → ページ内の移動 → リーディング → 広告 → 五十音順の全件 → tail（ほかの一覧など）
 * - スマホの五十音は行ごとのアコーディオン（全部閉じて始まる）。700px以上は表（左に行、右に名前のマス）
 * - 絞り込み中は、リーディング・途中の広告・チップ・節の見出しをたたみ、行の件数を一致した数にする。
 *   スマホでは一致した名前を行で分けずに1つの並びにまとめる。押して開閉した状態は、絞り込みを解いたあとも保つ
 */
export default function NameIndex({
  groups,
  unit,
  noun,
  placeholder,
  hrefPrefix,
  wide,
  leading,
  children,
}: {
  groups: NameGroup[];
  unit: string;
  noun: string;
  placeholder: string;
  hrefPrefix: string;
  wide?: boolean;
  leading: { title: string; year: number; rows: RankRow[]; ridesLabel: string };
  /** 末尾（ほかの一覧・AI予測・ブックマークの案内と広告） */
  children: React.ReactNode;
}) {
  const total = groups.reduce((s, g) => s + g.items.length, 0);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<boolean[]>(() => groups.map(() => false));
  const saved = useRef<boolean[] | null>(null);
  const v = yomi(q);

  const hitsOf = (val: string) => groups.map((g) => g.items.map((x) => !val || x.k.includes(val) || yomi(x.name).includes(val)));
  const hits = useMemo(() => hitsOf(v), [v]); // eslint-disable-line react-hooks/exhaustive-deps
  const counts = hits.map((h) => h.filter(Boolean).length);
  const found = counts.reduce((a, b) => a + b, 0);
  const on = !!v;

  const run = (raw: string) => {
    const nv = yomi(raw);
    setQ(raw);
    if (!nv) {
      if (saved.current) setOpen(saved.current);
      saved.current = null;
    } else {
      if (!saved.current) saved.current = open;
      const h = hitsOf(nv);
      setOpen(h.map((x) => x.some(Boolean)));
    }
    return !!nv;
  };

  const hasLeading = leading.rows.length > 0;
  const chips = useMemo(
    () => [...(hasLeading ? [{ id: 'leading', label: 'リーディング' }] : []), ...groups.map((g) => ({ id: g.slug, label: g.kana, n: g.items.length }))],
    [hasLeading, groups]
  );

  const cell = (x: NameCell, hidden: boolean) => (
    <Link prefetch={false} key={x.id} href={`${hrefPrefix}${x.id}`} className={cx(x.cls) || undefined} hidden={hidden}>
      {x.name}
    </Link>
  );

  return (
    <div className={cx(on && 'lfon') || undefined}>
      <FilterBox
        mode="name"
        unit={unit}
        noun={noun}
        label={`${noun}名で絞り込む`}
        placeholder={placeholder}
        onRun={run}
        note={
          on ? (
            <span>
              「{q}」に一致：<b>{found}</b>
              {unit}
            </span>
          ) : null
        }
      />
      <ListChips items={chips} label={`${noun}一覧の見出し`} filtering={on} />

      {hasLeading && (
        <section className={cx('sc l1 lx')} id="leading" hidden={on}>
          <Head
            title={leading.title}
            sub={
              <>
                <span>
                  {leading.year}年・勝ち数の上位{Math.min(10, leading.rows.length)}
                  {unit}。
                </span>
                <span>名前をタップすると詳細へ</span>
              </>
            }
          />
          <div className={cx('lp lk')}>
            <LeadingRank rows={leading.rows} unit={leading.ridesLabel} hrefPrefix={hrefPrefix} />
          </div>
        </section>
      )}

      <div className={cx('lx')} hidden={on}>
        <div className={cx('ad')}>
          <AdSlot unit="list" />
        </div>
      </div>

      <section className={cx('sc')} id="all">
        <Head title={`全${noun}データ`} sub={`五十音順・${total.toLocaleString('ja-JP')}${unit}`} />
        <div className={cx('lp ln', wide && 'wide')}>
          {groups.map((g, i) => {
            const n = on ? counts[i] : g.items.length;
            return (
              <section key={g.slug} className={cx('ln-g')} id={g.slug} aria-label={g.kana} hidden={!counts[i]}>
                <details
                  className={cx('ln-d')}
                  open={open[i]}
                  onToggle={(e) => {
                    const o = e.currentTarget.open;
                    setOpen((cur) => (cur[i] === o ? cur : cur.map((x, k) => (k === i ? o : x))));
                  }}
                >
                  <summary>
                    <b>{g.kana}</b>
                    <span>
                      <i className={cx('num')}>{n}</i>
                      {unit}
                    </span>
                    <FrameIcon icon={FRAME_ICONS.chevronDown} className={cx('ic')} />
                  </summary>
                  <div className={cx('ln-a')}>{g.items.map((x, k) => cell(x, !hits[i][k]))}</div>
                </details>
                <div className={cx('ln-r')}>
                  <h3>
                    <b>{g.kana}</b>
                    <span>
                      <i className={cx('num')}>{n}</i>
                      {unit}
                    </span>
                  </h3>
                  <div className={cx('ln-c')}>{g.items.map((x, k) => cell(x, !hits[i][k]))}</div>
                </div>
              </section>
            );
          })}
          <div className={cx('ln-f ln-a')} aria-label="絞り込みの結果">
            {on && groups.flatMap((g, i) => g.items.filter((_, k) => hits[i][k]).map((x) => cell(x, false)))}
          </div>
          <p className={cx('ln-0')} hidden={!on || found > 0}>
            一致する{noun}が見つかりませんでした。
          </p>
        </div>
      </section>

      {children}
    </div>
  );
}
