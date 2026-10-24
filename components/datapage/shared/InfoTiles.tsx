import s from '@/components/course/course.module.css';
import r from './shared.module.css';

export interface InfoItem {
  label: string;
  value: React.ReactNode;
  /** 値の下に添える補足（例：リーディング順位） */
  sub?: React.ReactNode;
}

/**
 * 基本情報・コース概要のタイル（ラベル→値。特徴カードの「判定の根拠の数値」と同じ見た目）
 * 値が空の項目は出さない
 */
export default function InfoTiles({ items, note }: { items: InfoItem[]; note?: React.ReactNode }) {
  const visible = items.filter((it) => it.value !== null && it.value !== undefined && it.value !== '');
  if (visible.length === 0) return null;
  return (
    <div className={s.card}>
      <dl className={r.info}>
        {visible.map((it) => (
          <div key={it.label}>
            <dt>{it.label}</dt>
            <dd>
              {it.value}
              {it.sub && <small>{it.sub}</small>}
            </dd>
          </div>
        ))}
      </dl>
      {note && <p className={`${s.note} ${r.infoNote}`}>{note}</p>}
    </div>
  );
}
