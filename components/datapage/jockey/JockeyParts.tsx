import Link from 'next/link';
import s from '@/components/course/course.module.css';
import AnimateOnView from '@/components/course/AnimateOnView';
import { STAT_COLUMNS, formatStat, maxByColumn, type StatRowLike } from '@/components/course/statColumns';
import j from './jockey.module.css';

// ------------------------------------------------------------
// 13項目の表（1列目にリンクを付けられる版）
// ------------------------------------------------------------

export interface LinkStatRow extends StatRowLike {
  label: string;
  href?: string;
}

/**
 * 13項目の表（course の StatsTable と同じ見た目）
 * - 1列目の名前を詳細ページへリンクできる
 * - summaryRows（中央・ローカルなどの集計行）は表の下にまとめて表示し、最大値の判定から外す（現行の競馬場別の仕様）
 */
export function LinkStatsTable({
  rows,
  keyLabel,
  summaryRows = [],
}: {
  rows: LinkStatRow[];
  keyLabel: string;
  summaryRows?: LinkStatRow[];
}) {
  const max = maxByColumn(rows);
  const renderRow = (row: LinkStatRow, i: number, cls?: string, highlight = true) => (
    <tr key={`${row.label}-${i}`} className={cls}>
      <td className={s.key}>
        {row.href ? (
          <Link href={row.href} className={s.textLink}>
            {row.label}
          </Link>
        ) : (
          row.label
        )}
      </td>
      {STAT_COLUMNS.map((c) => {
        const v = row[c.key];
        const text = formatStat(v, c.format);
        const isMax = highlight && c.highlight && typeof v === 'number' && v > 0 && v === max[c.key];
        return <td key={c.key}>{isMax ? <span className={s.hlCell}>{text}</span> : text}</td>;
      })}
    </tr>
  );
  return (
    <div className={s.tbl}>
      <table>
        <thead>
          <tr>
            <th className={s.key}>{keyLabel}</th>
            {STAT_COLUMNS.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => renderRow(row, i))}
          {summaryRows.map((row, i) =>
            renderRow(row, rows.length + i, `${j.sumRow} ${i === 0 ? j.sumFirst : ''}`, false)
          )}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------
// 競馬場別：複勝率の横棒＋「全項目を見る」（集計行つき）
// ------------------------------------------------------------

const MIN_RACES_FOR_BAR_HIGHLIGHT = 30;

/**
 * course の ConditionCard と同じ見た目で、表の下に集計行（中央・ローカル）を足せる版。
 * 横棒と最大値ハイライトは個別の行（競馬場）だけで判定する。
 */
export function SummaryConditionCard({
  rows,
  summaryRows,
  keyLabel,
}: {
  rows: LinkStatRow[];
  summaryRows: LinkStatRow[];
  keyLabel: string;
}) {
  const rates = rows.map((r) => r.place_rate ?? 0);
  const scaleMax = Math.max(0, ...rates) || 1;
  const enough = rows.filter((r) => (r.races ?? 0) >= MIN_RACES_FOR_BAR_HIGHLIGHT);
  const top = enough.length ? Math.max(...enough.map((r) => r.place_rate ?? 0)) : null;
  const isTop = (r: LinkStatRow) => top !== null && (r.races ?? 0) >= MIN_RACES_FOR_BAR_HIGHLIGHT && r.place_rate === top;
  const best = rows.find(isTop);

  return (
    <div className={s.card}>
      <div className={s.cHead}>
        <p className={s.note}>
          {best ? (
            <>
              出走{MIN_RACES_FOR_BAR_HIGHLIGHT}以上で複勝率が最も高いのは<b>{best.label}の{formatStat(best.place_rate, 'pct')}</b>
            </>
          ) : (
            '出走数が少ないため、数値は参考程度にご覧ください'
          )}
        </p>
        <span className={s.note}>複勝率</span>
      </div>
      <AnimateOnView className={s.bars}>
        {rows.map((r, i) => (
          <div key={`${r.label}-${i}`} className={`${s.br} ${isTop(r) ? s.hl : ''}`} style={{ ['--i' as string]: i }}>
            <span className={s.lb}>
              {r.label}
              {(r.races ?? 0) < MIN_RACES_FOR_BAR_HIGHLIGHT && <small className={s.num}>出走{r.races ?? 0}</small>}
            </span>
            <span className={s.bt}>
              <span className={s.bf} style={{ ['--w' as string]: `${((r.place_rate ?? 0) / scaleMax) * 100}%` }} />
            </span>
            <span className={`${s.vl} ${s.num}`}>{formatStat(r.place_rate, 'pct')}</span>
          </div>
        ))}
      </AnimateOnView>
      <details className={s.more}>
        <summary>
          全項目を見る<small>13項目・横にスクロール</small>
        </summary>
        <LinkStatsTable rows={rows} summaryRows={summaryRows} keyLabel={keyLabel} />
      </details>
    </div>
  );
}

// ------------------------------------------------------------
// コース別成績（競馬場ごとに開閉）
// ------------------------------------------------------------

export interface CourseGroup {
  key: string;
  title: string;
  rows: LinkStatRow[];
}

/** 競馬場ごとの開閉リスト。中の表は現行どおり競馬場ごとに最大値を判定する */
export function CourseGroupsCard({ groups }: { groups: CourseGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className={s.card}>
        <p className={s.note}>該当データがありません。</p>
      </div>
    );
  }
  return (
    <div className={`${s.card} ${j.acc}`}>
      {groups.map((g) => (
        <details key={g.key}>
          <summary>
            {g.title}
            <small>{g.rows.length}コース</small>
          </summary>
          <div className={j.accBody}>
            <LinkStatsTable rows={g.rows} keyLabel="コース" />
          </div>
        </details>
      ))}
    </div>
  );
}

// 注目ポイント（得意・苦手なコース）は3ページ共通の部品へ移動
// （components/datapage/shared/HighlightCoursesCard）
