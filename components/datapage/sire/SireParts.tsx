import Link from 'next/link';
import s from '@/components/course/course.module.css';
import AnimateOnView from '@/components/course/AnimateOnView';
import { STAT_COLUMNS, formatStat, maxByColumn, type StatRowLike } from '@/components/course/statColumns';
import { Dots } from '@/components/course/CourseParts';
import x from './sire.module.css';

// ------------------------------------------------------------
// 特徴のメーター（見出しを h3 で残すため、コースページの Meter と同じ見た目で別実装）
// ------------------------------------------------------------

export function SireMeter({
  label,
  result,
  value,
  scale,
  pair,
  children,
}: {
  label: string;
  result: string;
  value: number;
  scale: [string, string, string];
  pair?: [string, string][];
  children?: React.ReactNode;
}) {
  const position = `${(value - 1) * 20 + 10}%`;
  return (
    <AnimateOnView className={s.meter}>
      <div className={x.mHead}>
        <h3>{label}</h3>
        <b>{result}</b>
      </div>
      <div className={s.track} style={{ ['--p' as string]: position }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <i key={n} className={n === value ? s.on : undefined} />
        ))}
        <span className={s.marker} aria-hidden="true" />
      </div>
      <div className={s.scale}>
        <span>{scale[0]}</span>
        <span>{scale[1]}</span>
        <span>{scale[2]}</span>
      </div>
      {pair && pair.length > 0 && (
        <div className={s.pair}>
          {pair.map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <b className={s.num}>{v}</b>
            </div>
          ))}
        </div>
      )}
      {children}
    </AnimateOnView>
  );
}

/** 結論カードの1行（指標名｜5段階｜判定） */
export function VerdictRow({ label, value, result, href }: { label: string; value: number; result: string; href: string }) {
  return (
    <a className={`${s.vRow} ${x.vRowWide}`} href={href}>
      <span className={s.vKey}>{label}</span>
      <Dots value={value} />
      <span className={s.vVal}>{result}</span>
    </a>
  );
}

// ------------------------------------------------------------
// 13項目の表（名前リンク・集計行に対応）
// ------------------------------------------------------------

export interface SireStatRow extends StatRowLike {
  label: string;
  link?: string;
  /** 右回り・中央などの集計行（最大値の判定から外す） */
  summary?: boolean;
  gate?: { number: number; bg: string; fg: string };
}

function GateBadge({ gate }: { gate: NonNullable<SireStatRow['gate']> }) {
  return (
    <span
      className={s.gate}
      style={{
        background: gate.bg,
        color: gate.fg,
        boxShadow: gate.number === 1 ? 'inset 0 0 0 1px #E9E9E9' : undefined,
      }}
    >
      {gate.number}
    </span>
  );
}

/**
 * 13項目の表。最大値ハイライトは現行仕様（出走数〜複勝回収率の9列、0は除外、同値はすべて）。
 * 集計行（summary）は最大値の判定に含めず、ハイライトもしない（現行の競馬場別の表と同じ）。
 */
export function SireStatsTable({ rows, keyLabel, noHighlight = false }: { rows: SireStatRow[]; keyLabel: string; noHighlight?: boolean }) {
  const max = maxByColumn(rows.filter((r) => !r.summary));
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
          {rows.map((row, i) => {
            const firstSummary = row.summary && !rows[i - 1]?.summary;
            return (
              <tr key={`${row.label}-${i}`} className={firstSummary ? x.sumFirst : undefined}>
                <td className={s.key}>
                  {row.gate ? (
                    <GateBadge gate={row.gate} />
                  ) : row.link ? (
                    <Link href={row.link} className={x.keyLink}>{row.label}</Link>
                  ) : (
                    <span className={row.summary ? x.sumLabel : undefined}>{row.label}</span>
                  )}
                </td>
                {STAT_COLUMNS.map((c) => {
                  const v = row[c.key];
                  const text = formatStat(v, c.format);
                  const isMax = !noHighlight && !row.summary && c.highlight && typeof v === 'number' && v > 0 && v === max[c.key];
                  return <td key={c.key}>{isMax ? <span className={s.hlCell}>{text}</span> : text}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------
// 条件別のカード（複勝率の横棒＋「全項目を見る」で13項目の表）
// コースページの ConditionCard と同じ見た目。集計行を横棒から外せるようにしたもの
// ------------------------------------------------------------

const MIN_RACES_FOR_BAR_HIGHLIGHT = 30;

export function SireConditionCard({
  rows,
  keyLabel,
  extra,
}: {
  rows: SireStatRow[];
  keyLabel: string;
  extra?: React.ReactNode;
}) {
  const bars = rows.filter((r) => !r.summary && typeof r.races === 'number');
  if (rows.length === 0) {
    return (
      <div className={s.card}>
        <p className={s.note}>該当データがありません。</p>
      </div>
    );
  }
  const scaleMax = Math.max(...bars.map((r) => r.place_rate ?? 0)) || 1;
  const enough = bars.filter((r) => (r.races ?? 0) >= MIN_RACES_FOR_BAR_HIGHLIGHT);
  const top = enough.length ? Math.max(...enough.map((r) => r.place_rate ?? 0)) : null;
  const best = top !== null ? enough.find((r) => r.place_rate === top) : undefined;

  return (
    <div className={s.card}>
      <div className={s.cHead}>
        <p className={s.note}>
          {best ? (
            <>
              複勝率が最も高いのは<b>{best.gate ? `${best.gate.number}枠` : best.label}の{formatStat(best.place_rate, 'pct')}</b>
            </>
          ) : (
            '出走数が少ないため、数値は参考程度にご覧ください'
          )}
        </p>
        <span className={s.note}>複勝率</span>
      </div>
      <AnimateOnView className={s.bars}>
        {bars.map((r, i) => {
          const isTop = top !== null && r.place_rate === top && (r.races ?? 0) >= MIN_RACES_FOR_BAR_HIGHLIGHT;
          return (
            <div key={`${r.label}-${i}`} className={`${s.br} ${isTop ? s.hl : ''}`} style={{ ['--i' as string]: i }}>
              <span className={s.lb}>
                {r.gate ? <GateBadge gate={r.gate} /> : r.label}
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
        <SireStatsTable rows={rows} keyLabel={keyLabel} />
      </details>
    </div>
  );
}

// ------------------------------------------------------------
// コース別（競馬場ごとに開閉。表の最大値は競馬場ごとに判定＝現行どおり）
// ------------------------------------------------------------

export interface RacecourseCourseGroup {
  racecourse_ja: string;
  racecourse_en: string;
  rows: SireStatRow[];
}

export function CourseGroups({ groups }: { groups: RacecourseCourseGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className={s.card}>
        <p className={s.note}>該当データがありません。</p>
      </div>
    );
  }
  return (
    <div className={`${s.card} ${x.rcList}`}>
      {groups.map((g) => (
        <details key={g.racecourse_en} className={x.rcItem}>
          <summary>
            {g.racecourse_ja}
            <small>{g.rows.length}コース</small>
          </summary>
          <div className={x.rcBody}>
            <SireStatsTable rows={g.rows} keyLabel="コース" />
          </div>
        </details>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// 得意・苦手のチップ（白地＋色の枠。名前は詳細ページへ）
// ------------------------------------------------------------

export interface PickItem {
  name: string;
  link?: string;
}

export function PickChips({ items, kind }: { items: PickItem[]; kind: 'good' | 'bad' }) {
  if (items.length === 0) return <span className={s.none}>該当なし</span>;
  return (
    <div className={s.chips}>
      {items.map((p) =>
        p.link ? (
          <Link key={p.name} href={p.link} className={`${s.nm} ${s[kind]}`}>
            {p.name}
          </Link>
        ) : (
          <span key={p.name} className={`${s.nm} ${s[kind]}`}>
            {p.name}
          </span>
        )
      )}
    </div>
  );
}
