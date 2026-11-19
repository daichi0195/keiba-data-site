'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FrameIcon } from '@/components/layout/icons';
import { cx } from './cx';

export interface ChipItem {
  id: string;
  label: string;
  /** 件数（行ごとの人数など） */
  n?: number;
  /** 今週開催の点 */
  dot?: boolean;
}

const header = () => document.querySelector('header');
const shown = (el: Element) => el.getClientRects().length > 0;

/**
 * ページ内の移動（見本 list.js の「ページ内の移動と現在地」）
 * - 現在地は「固定されている物（ヘッダーと、PCでは固定のチップ）の下端を最後に越えた節」。ページの一番下では最後の節
 * - 押すと節へ移動し、移動が終わるまで押したチップを現在地に固定。移動先が末尾で線まで届かないときは、送り直すまで押したチップのまま
 * - 現在地のチップは帯の中央へすぐに送る（なめらかに送ると本文の移動に打ち消される）
 * - スマホでは移動先の行（details）を開いてから位置を測る
 * filtering が変わったとき（絞り込みでチップが隠れる・戻る）にも現在地を測り直す。
 */
export function ListChips({ items, label, filtering }: { items: ChipItem[]; label: string; filtering: boolean }) {
  const [cur, setCur] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const spyRef = useRef<() => void>(() => {});

  useEffect(() => {
    const nav = navRef.current!;
    const bar = barRef.current!;
    const hdr = header();
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 節は絞り込み・幅の切り替えで描き直されることがあるので、要素は毎回 id で引く
    const chips = items.map((x) => ({
      id: x.id,
      get el() {
        return document.getElementById(x.id);
      },
      a: bar.querySelector<HTMLElement>(`a[data-to="${x.id}"]`)!,
    }));
    type Chip = (typeof chips)[number];
    let now: Chip | null = null;
    let lock = 0;
    let lockTo: Chip | null = null;
    let pin: Chip | null = null;
    let pinY = 0;
    const fixedBottom = () => {
      let b = hdr ? hdr.getBoundingClientRect().bottom : 0;
      if (getComputedStyle(nav).position === 'sticky' && nav.offsetHeight) b += nav.offsetHeight;
      return b;
    };
    const setChip = (c: Chip | null) => {
      const changed = c !== now;
      now = c;
      setCur(c ? c.id : null);
      if (c) {
        const l = c.a.offsetLeft - bar.offsetLeft;
        const out = l < bar.scrollLeft || l + c.a.offsetWidth > bar.scrollLeft + bar.clientWidth;
        if (changed || out) bar.scrollTo({ left: c.a.offsetLeft - (bar.clientWidth - c.a.offsetWidth) / 2, behavior: 'auto' });
      } else if (changed) bar.scrollTo({ left: 0, behavior: 'auto' });
    };
    const spy = () => {
      if (Date.now() < lock) {
        setChip(lockTo);
        return;
      }
      if (!shown(nav)) return;
      if (pin) {
        if (Math.abs(scrollY - pinY) < 3 && pin.el && shown(pin.el)) {
          setChip(pin);
          return;
        }
        pin = null;
      }
      const line = fixedBottom() + 12;
      let hit: Chip | null = null;
      let last: Chip | null = null;
      chips.forEach((c) => {
        if (!c.el || !shown(c.el)) return;
        last = c;
        if (c.el.getBoundingClientRect().top <= line) hit = c;
      });
      const lastC = last as Chip | null;
      if (lastC && scrollY > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 2 && lastC.el!.getBoundingClientRect().top < innerHeight) hit = lastC;
      setChip(hit);
    };
    let tick = 0;
    const onScroll = () => {
      if (!tick)
        tick = requestAnimationFrame(() => {
          tick = 0;
          spy();
        });
    };
    spyRef.current = onScroll;
    const unlock = () => {
      if (!lock) return;
      lock = 0;
      if (lockTo && lockTo.el && shown(lockTo.el) && lockTo.el.getBoundingClientRect().top > fixedBottom() + 12) {
        pin = lockTo;
        pinY = scrollY;
      }
      spy();
    };
    const timers: number[] = [];
    const clicks = chips.map((c) => {
      const fn = (e: MouseEvent) => {
        if (!c.el) return;
        e.preventDefault();
        const d = c.el.querySelector('details');
        if (d && shown(d)) d.open = true;
        pin = null;
        lockTo = c;
        lock = Date.now() + 1500;
        setChip(c);
        scrollTo({ top: Math.max(0, c.el.getBoundingClientRect().top + scrollY - fixedBottom() - 8), behavior: calm ? 'auto' : 'smooth' });
        timers.push(
          window.setTimeout(() => {
            if (lock && Date.now() >= lock) unlock();
          }, 1550)
        );
      };
      c.a.addEventListener('click', fn);
      return fn;
    });
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    addEventListener('scrollend', unlock);
    spy();
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      removeEventListener('scrollend', unlock);
      chips.forEach((c, i) => c.a.removeEventListener('click', clicks[i]));
      timers.forEach(clearTimeout);
      cancelAnimationFrame(tick);
    };
  }, [items]);

  // 絞り込みの開始・終了で、チップの表示が変わるので測り直す
  useEffect(() => {
    spyRef.current();
  }, [filtering]);

  return (
    <nav ref={navRef} className={cx('chips lj')} aria-label={label}>
      <div ref={barRef}>
        {items.map((x) => (
          <a key={x.id} href={`#${x.id}`} data-to={x.id} className={cx(cur === x.id && 'on') || undefined} aria-current={cur === x.id ? 'true' : undefined}>
            {x.dot && <i className={cx('lw-d')} />}
            {x.label}
            {x.n ? <span className={cx('num')}>{x.n}</span> : null}
          </a>
        ))}
      </div>
    </nav>
  );
}

/**
 * 絞り込みの入力欄（見本 list.js の「絞り込みの共通」）
 * - 日本語入力の変換中は、まだ確定していない末尾の英字（ローマ字の打ちかけ）を除いて判定する。打ちかけだけなら表示を変えない
 * - 文字を打って絞り込みが始まったときと、入力欄にフォーカスしたとき、スマホ・タブレットでは入力欄をヘッダーのすぐ下へ寄せる
 * onRun は絞り込みの結果を反映し、絞り込み中かどうかを返す（反映は同期で行い、寄せる位置は反映後の画面で測る）
 */
export function FilterBox({
  mode,
  label,
  placeholder,
  numeric,
  onRun,
  note,
  children,
  unit,
  noun,
}: {
  mode: 'name' | 'course';
  label: string;
  placeholder: string;
  numeric?: boolean;
  onRun: (raw: string) => boolean;
  note: React.ReactNode;
  children?: React.ReactNode;
  unit?: string;
  noun?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const qRef = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const wasOn = useRef(false);
  const [hasValue, setHasValue] = useState(false);

  const dock = useCallback(() => {
    const box = boxRef.current;
    const hdr = header();
    if (!box || !hdr || innerWidth >= 1100) return;
    const top = box.getBoundingClientRect().top + scrollY - hdr.getBoundingClientRect().bottom;
    if (Math.abs(top - scrollY) > 2) scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  }, []);

  const typed = () => {
    const raw = (qRef.current?.value ?? '').trim();
    if (!composing.current) return raw;
    const cut = raw.replace(/[a-zA-Zａ-ｚＡ-Ｚ]+$/, '');
    return cut || !raw ? cut : null;
  };

  const run = (fromInput: boolean) => {
    setHasValue(!!qRef.current?.value);
    const raw = typed();
    if (raw === null) return;
    let on = false;
    flushSync(() => {
      on = onRun(raw);
    });
    if (fromInput && on && !wasOn.current) dock();
    wasOn.current = on;
  };

  const hasChildren = !!children;
  return (
    <div ref={boxRef} className={cx('lf')} data-mode={mode} data-unit={unit} data-noun={noun}>
      <div className={cx('lf-b')}>
        {children}
        <label className={cx('lf-i')}>
          <FrameIcon icon={faMagnifyingGlass} className={cx('ic')} />
          <span className={cx('vh')}>{label}</span>
          <input
            ref={qRef}
            id="lf-q"
            type="text"
            inputMode={numeric ? 'numeric' : undefined}
            enterKeyHint="search"
            autoComplete="off"
            autoCapitalize={hasChildren ? undefined : 'off'}
            spellCheck={hasChildren ? undefined : false}
            maxLength={numeric ? 6 : undefined}
            placeholder={placeholder}
            onFocus={() => setTimeout(dock, 0)}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
              run(false);
            }}
            onInput={(e) => {
              if ((e.nativeEvent as InputEvent).isComposing) composing.current = true;
              run(true);
            }}
          />
          <button
            className={cx('lf-x')}
            type="button"
            aria-label="入力を消す"
            hidden={!hasValue}
            onClick={() => {
              if (qRef.current) qRef.current.value = '';
              composing.current = false;
              run(false);
              qRef.current?.focus();
            }}
          >
            <FrameIcon icon={faXmark} className={cx('ic')} />
          </button>
        </label>
      </div>
      <p className={cx('lf-n')} role="status" hidden={!note}>
        {note}
      </p>
    </div>
  );
}
