import h from '@/components/v6/home/Home.module.css';
import l from './list.module.css';

/**
 * 見本のクラス名（"sc l1" など）を CSS Modules のクラス名に置き換える。
 * 共通の見た目（top.css → themes.css）はトップの Home.module.css、一覧固有（list.css）は list.module.css にあるので、
 * 両方に同じ名前があれば両方を付ける（見本では1つのクラスに両方の規則が効いているため）。
 */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names
    .filter(Boolean)
    .flatMap((n) => String(n).split(' '))
    .map((n) => [h[n], l[n]].filter(Boolean).join(' ') || n)
    .join(' ');
}

/** ページの <main> に付ける：Home.module.css の .root（変数・文字・globals.css の打ち消し）＋ list.module.css の .L */
export const ROOT = `${h.root} ${l.L}`;
