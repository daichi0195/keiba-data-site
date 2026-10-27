import Link from 'next/link';
import s from '@/components/course/course.module.css';

export type DefinitionAnchor = 'criteria' | 'highlights' | 'running-style' | 'distance';

const LABELS: Record<DefinitionAnchor, string> = {
  criteria: '判定の基準',
  highlights: '得意・苦手の基準',
  'running-style': '脚質の定義',
  distance: '距離の定義',
};

/**
 * 判定基準・用語の定義へのリンク（データページ共通）
 * 定義の本文は /about/data に1か所でまとめ、各ページでは同じ説明文を繰り返さない
 */
export default function DefinitionLink({ anchor, style }: { anchor: DefinitionAnchor; style?: React.CSSProperties }) {
  return (
    <p className={s.note} style={{ marginTop: 12, ...style }}>
      <Link href={`/about/data#${anchor}`}>{LABELS[anchor]}を見る</Link>
    </p>
  );
}
