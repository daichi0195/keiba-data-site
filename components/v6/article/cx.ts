import s from './article.module.css';

/** 見本と同じクラス名で CSS Modules のクラスを引く（cx('cl-i', on && 'on')） */
export function cx(...names: (string | number | false | null | undefined)[]): string {
  return names
    .filter((n): n is string => typeof n === 'string' && n !== '')
    .flatMap((n) => n.split(' '))
    .filter(Boolean)
    .map((n) => s[n] ?? n)
    .join(' ');
}

/** querySelector 用のセレクタ（'ch' → '.article-module__xxx__ch'） */
export const sel = (name: string) => `.${s[name]}`;

export { s };
