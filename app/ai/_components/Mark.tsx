import a from './ai.module.css';

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

const MARKS: Record<MarkKey, { symbol: string; text: string; className: string }> = {
  honmei: { symbol: '◎', text: '本命', className: a.mkHonmei },
  himo: { symbol: '△', text: '紐', className: a.mkHimo },
  kiken: { symbol: '×', text: '危険', className: a.mkKiken },
};

/** 印のチップ（白地＋黒文字＋枠。本命＝緑の枠、紐＝点線の枠、危険＝赤系の枠。記号と文字を併記して色だけに頼らない） */
export default function Mark({ mark }: { mark: MarkKey }) {
  const m = MARKS[mark];
  return (
    <span className={`${a.mk} ${m.className}`}>
      <span className={a.mkSym} aria-hidden="true">
        {m.symbol}
      </span>
      {m.text}
    </span>
  );
}
