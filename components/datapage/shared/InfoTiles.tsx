import s from '@/components/course/course.module.css';
import r from './shared.module.css';

export interface InfoItem {
  label: string;
  value: React.ReactNode;
  /** 値の後ろに添える補足（例：リーディング順位） */
  sub?: React.ReactNode;
}

/**
 * 基本情報・コース概要の表（項目名｜値 の2列。表の共通仕様と同じ枠線・見出し色）
 * 値が空の項目は出さない
 */
export default function InfoTiles({ items, note }: { items: InfoItem[]; note?: React.ReactNode }) {
  const visible = items.filter((it) => it.value !== null && it.value !== undefined && it.value !== '');
  if (visible.length === 0) return null;
  return (
    <div className={s.card}>
      <table className={r.infoTable}>
        <tbody>
          {visible.map((it) => (
            <tr key={it.label}>
              <th scope="row">{it.label}</th>
              <td>
                {it.value}
                {it.sub && <small>{it.sub}</small>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {note && <p className={`${s.note} ${r.infoNote}`}>{note}</p>}
    </div>
  );
}
