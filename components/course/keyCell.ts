import styles from './course.module.css';

// 1列目の見出しがこの文字数以下なら、横スクロールしても縮めない（「2026年」「1番人気」など。縮めると1文字だけ欠けて読みにくい）
const SHORT_LABEL = 5;

/** 1列目の中身に付けるクラス。長い見出しだけ、横スクロール時に先頭3文字分へ縮める（.keyIn） */
export function keyInClass(label: unknown): string {
  return String(label ?? '').length > SHORT_LABEL ? styles.keyIn : '';
}
