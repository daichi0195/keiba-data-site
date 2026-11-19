import { cx } from './cx';

/** 節の見出し（地の上）。見本 lib.mjs の head() */
export function Head({ title, sub }: { title: string; sub?: React.ReactNode }) {
  return (
    <div className={cx('hd')}>
      <h2>
        {title}
        {sub && <small>{sub}</small>}
      </h2>
    </div>
  );
}
