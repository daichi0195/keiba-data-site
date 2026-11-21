'use client';

import { useState } from 'react';
import Link from '@/components/HardLink';
import { FrameIcon } from '@/components/layout/icons';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { cx } from './cx';
import type { KanaGroup } from '@/components/datapage/list/kana';

/**
 * 全件の名前を五十音から探す（見本 lib.mjs の kana()）
 * - 700px以上：行のマス（あ行 12 …）を押すと、その行の名前のマスを下に出す。選択中をもう一度押しても閉じない
 * - スマホ：行ごとのアコーディオン（details）。全員のリンクを HTML に含める
 */
export default function KanaIndex({ groups, unit, label, hrefPrefix }: { groups: KanaGroup[]; unit: string; label: string; hrefPrefix: string }) {
  const [sel, setSel] = useState(0);
  const [all, setAll] = useState<Record<number, boolean>>({});

  return (
    <div className={cx('kn')}>
      <div className={cx('kn-g')} role="group" aria-label={`${label}を五十音から探す`}>
        {groups.map((g, i) => (
          <button key={g.slug} type="button" aria-expanded={sel === i} onClick={() => setSel(i)}>
            {g.kana}
            <span>{g.items.length}</span>
          </button>
        ))}
      </div>
      <div className={cx('kn-acc')}>
        {groups.map((g) => (
          <details key={g.slug}>
            <summary>
              <b>{g.kana}</b>
              <span>
                {g.items.length}
                {unit}
              </span>
              <FrameIcon icon={faChevronDown} className={cx('ic')} />
            </summary>
            <div className={cx('kn-a')}>
              {g.items.map((x) => (
                <Link prefetch={false} key={x.id} href={`${hrefPrefix}${x.id}`} className={cx(x.name.length >= 11 ? 'w8 w11' : x.name.length >= 8 && 'w8') || undefined}>
                  {x.name}
                </Link>
              ))}
            </div>
          </details>
        ))}
      </div>
      {groups.map((g, i) => (
        <div key={g.slug} className={cx('kn-p', all[i] && 'all')} hidden={sel !== i}>
          {g.items.map((x) => (
            <Link prefetch={false} key={x.id} href={`${hrefPrefix}${x.id}`}>
              {x.name}
            </Link>
          ))}
          {g.items.length > 12 && (
            <button type="button" className={cx('kn-more')} aria-expanded={!!all[i]} onClick={() => setAll({ ...all, [i]: !all[i] })}>
              {all[i] ? '12件までにする' : `すべて表示（${g.items.length}件）`}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
