import s from './static.module.css';

/** 見本のクラス名（"st-pn st-art" など）を CSS Modules のクラス名に置き換える */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names
    .filter(Boolean)
    .flatMap((n) => String(n).split(' '))
    .map((n) => s[n] ?? n)
    .join(' ');
}

export { s };
