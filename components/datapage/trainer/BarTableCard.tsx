import s from '@/components/course/course.module.css';
import AnimateOnView from '@/components/course/AnimateOnView';
import { formatStat } from '@/components/course/statColumns';
import LinkStatsTable, { type LinkStatRow } from './LinkStatsTable';

const MIN_RACES_FOR_BAR_HIGHLIGHT = 30;

/**
 * ConditionCard と同じ見た目（複勝率の横棒＋「全項目を見る」で13項目の表）で、
 * 表に集計行（中央・ローカル）やリンクを含められるカード。
 * 横棒は集計行を除いた行だけを描く。
 */
export default function BarTableCard({
  rows,
  keyLabel,
  extra,
}: {
  rows: LinkStatRow[];
  keyLabel: string;
  extra?: React.ReactNode;
}) {
  const barRows = rows.filter((r) => !r.summary && typeof r.races === 'number');
  if (rows.length === 0) {
    return (
      <div className={s.card}>
        <p className={s.note}>該当データがありません。</p>
      </div>
    );
  }
  const scaleMax = Math.max(...barRows.map((r) => r.place_rate ?? 0), 0) || 1;
  const enough = barRows.filter((r) => (r.races ?? 0) >= MIN_RACES_FOR_BAR_HIGHLIGHT);
  const top = enough.length ? Math.max(...enough.map((r) => r.place_rate ?? 0)) : null;
  const best = top !== null ? enough.find((r) => r.place_rate === top) : undefined;

  return (
    <div className={s.card}>
      <div className={s.cHead}>
        <p className={s.note}>
          {best ? (
            <>
              複勝率が最も高いのは<b>{best.label}の{formatStat(best.place_rate, 'pct')}</b>
            </>
          ) : (
            '出走数が少ないため、数値は参考程度にご覧ください'
          )}
        </p>
        <span className={s.note}>複勝率</span>
      </div>
      <AnimateOnView className={s.bars}>
        {barRows.map((r, i) => {
          const isTop = top !== null && r.place_rate === top && (r.races ?? 0) >= MIN_RACES_FOR_BAR_HIGHLIGHT;
          return (
            <div key={`${r.label}-${i}`} className={`${s.br} ${isTop ? s.hl : ''}`} style={{ ['--i' as string]: i }}>
              <span className={s.lb}>
                {r.label}
                {(r.races ?? 0) < MIN_RACES_FOR_BAR_HIGHLIGHT && <small className={s.num}>出走{r.races}</small>}
              </span>
              <span className={s.bt}>
                <span className={s.bf} style={{ ['--w' as string]: `${((r.place_rate ?? 0) / scaleMax) * 100}%` }} />
              </span>
              <span className={`${s.vl} ${s.num}`}>{formatStat(r.place_rate, 'pct')}</span>
            </div>
          );
        })}
      </AnimateOnView>
      {extra}
      <details className={s.more}>
        <summary>
          全項目を見る<small>13項目・横にスクロール</small>
        </summary>
        <LinkStatsTable rows={rows} keyLabel={keyLabel} />
      </details>
    </div>
  );
}
