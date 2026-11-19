import s from './ai.module.css';

export type MarkKey = 'honmei' | 'himo' | 'kiken';

/**
 * 予測データの印を正規化する。
 * 旧形式（'honmei' / 'himo' / 'kiken'）と現行形式（'【本命】' / '【紐】' / '【危険】'）の両方に対応。
 */
export function normalizeMark(mark?: string | null): MarkKey | null {
  if (!mark) return null;
  if (mark === 'honmei' || mark.includes('本命')) return 'honmei';
  if (mark === 'himo' || mark.includes('紐')) return 'himo';
  if (mark === 'kiken' || mark.includes('危険')) return 'kiken';
  return null;
}

export const MARKS: Record<MarkKey, { sym: string; text: string }> = {
  honmei: { sym: '◎', text: '本命' },
  himo: { sym: '△', text: '紐' },
  kiken: { sym: '×', text: '危険' },
};
export const MARK_KEYS: MarkKey[] = ['honmei', 'himo', 'kiken'];

/** 印の説明（現行 /ai「印について」の文面そのまま） */
export const MARK_DESC: Record<MarkKey, [string, string]> = {
  honmei: ['予測勝率が高く、オッズとの乖離から期待値が高いと判定された馬です。単勝候補として推奨します。', '予測は参考情報であり、的中や回収率を保証するものではありません。'],
  himo: ['人気はないものの、予測勝率に対してオッズが高く、市場に過小評価されていると判定された馬です。', 'ワイドや3連系馬券の相手候補として推奨します。'],
  kiken: ['人気を集めているものの、予測勝率が低く過大評価されていると判定された馬です。', 'テスト期間では単勝回収率60%を下回っており、長期的に購入するとマイナスになる可能性が高いです。'],
};

/** 印：丸い形＋濃い塗り（本命＝赤、紐＝濃い灰、危険＝濃い紫）＋白い文字。記号と文字を併記して色だけに頼らない */
export default function Mark({ mark }: { mark: MarkKey }) {
  const m = MARKS[mark];
  return (
    <span className={`${s['p-mk']} ${s[mark]}`}>
      <b aria-hidden="true">{m.sym}</b>
      {m.text}
    </span>
  );
}
