import s from './Home.module.css';

/** 見本のクラス名（"rk-n t3 m1" など）を CSS Modules のクラス名に置き換える */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names
    .filter(Boolean)
    .flatMap((n) => String(n).split(' '))
    .map((n) => s[n] ?? n)
    .join(' ');
}

export { s };
