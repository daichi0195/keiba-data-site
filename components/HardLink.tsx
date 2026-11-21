import type { AnchorHTMLAttributes } from 'react';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  /** next/link との互換のために受け取るだけ（使わない） */
  prefetch?: boolean;
};

/**
 * サイト内リンク。next/link のクライアント遷移を使わず、毎回ページを読み込み直す。
 * - オファーウォール（AdSense プライバシーとメッセージ）は読み込み時にしか表示判定せず、
 *   ページビューの回数（「5ページ目で表示」などの頻度設定）も読み込み単位で数えるため
 * - 全画面広告（vignette）もページ読み込みを伴うリンクでしか出ない
 */
export default function HardLink({ prefetch, ...rest }: Props) {
  void prefetch;
  return <a {...rest} />;
}
