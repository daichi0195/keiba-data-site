import Link from 'next/link';
import styles from './course.module.css';
import AnimateOnView from './AnimateOnView';
import { STAT_COLUMNS, formatStat, maxByColumn, type StatRowLike } from './statColumns';

// ------------------------------------------------------------
// 判定の5段階表示
// ------------------------------------------------------------

/** 結論カードの小さな5段階表示（該当段階をテーマカラーで塗る） */
export function Dots({ value }: { value: number }) {
  return (
    <span className={styles.dots} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n === value ? styles.on : undefined} />
      ))}
    </span>
  );
}

/** コースの特徴のメーター（5段階のトラック＋マーカー＋根拠の数値2つ） */
export function Meter({
  label,
  result,
  value,
  scale,
  pair,
}: {
  label: string;
  result: string;
  value: number;
  scale: [string, string, string];
  pair?: [string, string][];
}) {
  const position = `${(value - 1) * 20 + 10}%`;
  return (
    <AnimateOnView className={styles.meter}>
      <div className={styles.mHead}>
        <span>{label}</span>
        <b>{result}</b>
      </div>
      <div className={styles.track} style={{ ['--p' as string]: position }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <i key={n} className={n === value ? styles.on : undefined} />
        ))}
        <span className={styles.marker} aria-hidden="true" />
      </div>
      <div className={styles.scale}>
        <span>{scale[0]}</span>
        <span>{scale[1]}</span>
        <span>{scale[2]}</span>
      </div>
      {pair && pair.length > 0 && (
        <div className={styles.pair}>
          {pair.map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <b className={styles.num}>{v}</b>
            </div>
          ))}
        </div>
      )}
    </AnimateOnView>
  );
}

// ------------------------------------------------------------
// 条件別（人気・枠順・脚質・性別・馬体重）
// ------------------------------------------------------------

export interface ConditionRow extends StatRowLike {
  label: string;
  gate?: { number: number; bg: string; fg: string };
}

const MIN_RACES_FOR_BAR_HIGHLIGHT = 30;

function GateBadge({ gate }: { gate: NonNullable<ConditionRow['gate']> }) {
  return (
    <span
      className={styles.gate}
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

/** 13項目の表（1列目固定・現行仕様の最大値ハイライト） */
export function StatsTable({ rows, keyLabel }: { rows: ConditionRow[]; keyLabel: string }) {
  const max = maxByColumn(rows);
  return (
    <div className={styles.tbl}>
      <table>
        <thead>
          <tr>
            <th className={styles.key}>{keyLabel}</th>
            {STAT_COLUMNS.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.label}-${i}`}>
              <td className={styles.key}>{row.gate ? <GateBadge gate={row.gate} /> : row.label}</td>
              {STAT_COLUMNS.map((c) => {
                const v = row[c.key];
                const text = formatStat(v, c.format);
                const isMax = c.highlight && typeof v === 'number' && v > 0 && v === max[c.key];
                return <td key={c.key}>{isMax ? <span className={styles.hlCell}>{text}</span> : text}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 条件別のカード：複勝率の横棒（ラベル｜横棒｜数値 の1行）と、
 * 「全項目を見る」で開く13項目の表
 */
export function ConditionCard({
  rows,
  keyLabel,
  extra,
}: {
  rows: ConditionRow[];
  keyLabel: string;
  extra?: React.ReactNode;
}) {
  const visible = rows.filter((r) => typeof r.races === 'number');
  if (visible.length === 0) {
    return (
      <div className={styles.card}>
        <p className={styles.note}>該当データがありません。</p>
      </div>
    );
  }
  const rates = visible.map((r) => r.place_rate ?? 0);
  const scaleMax = Math.max(...rates) || 1;
  const enough = visible.filter((r) => (r.races ?? 0) >= MIN_RACES_FOR_BAR_HIGHLIGHT);
  const top = enough.length ? Math.max(...enough.map((r) => r.place_rate ?? 0)) : null;
  const best = top !== null ? visible.find((r) => (r.races ?? 0) >= MIN_RACES_FOR_BAR_HIGHLIGHT && r.place_rate === top) : undefined;

  return (
    <div className={styles.card}>
      <div className={styles.cHead}>
        <p className={styles.note}>
          {best ? (
            <>
              複勝率が最も高いのは<b>{best.gate ? `${best.gate.number}枠` : best.label}の{formatStat(best.place_rate, 'pct')}</b>
            </>
          ) : (
            '出走数が少ないため、数値は参考程度にご覧ください'
          )}
        </p>
        <span className={styles.note}>複勝率</span>
      </div>
      <AnimateOnView className={styles.bars}>
        {visible.map((r, i) => (
          <div key={`${r.label}-${i}`} className={`${styles.br} ${r.place_rate === top && (r.races ?? 0) >= MIN_RACES_FOR_BAR_HIGHLIGHT ? styles.hl : ''}`} style={{ ['--i' as string]: i }}>
            <span className={styles.lb}>
              {r.gate ? <GateBadge gate={r.gate} /> : r.label}
              {(r.races ?? 0) < MIN_RACES_FOR_BAR_HIGHLIGHT && <small className={styles.num}>出走{r.races}</small>}
            </span>
            <span className={styles.bt}>
              <span className={styles.bf} style={{ ['--w' as string]: `${((r.place_rate ?? 0) / scaleMax) * 100}%` }} />
            </span>
            <span className={`${styles.vl} ${styles.num}`}>{formatStat(r.place_rate, 'pct')}</span>
          </div>
        ))}
      </AnimateOnView>
      {extra}
      <details className={styles.more}>
        <summary>
          全項目を見る<small>13項目・横にスクロール</small>
        </summary>
        <StatsTable rows={visible} keyLabel={keyLabel} />
      </details>
    </div>
  );
}

// ------------------------------------------------------------
// データ概要の本文（**強調** と名前のリンク）
// ------------------------------------------------------------

export interface NameLink {
  name: string;
  href: string;
}

function linkify(text: string, links: NameLink[], keyPrefix: string): React.ReactNode[] {
  if (!links.length) return [text];
  // 長い名前から順に照合し、同じ名前の重複リンクは最初の1回だけにする
  const sorted = [...links].sort((a, b) => b.name.length - a.name.length);
  const pattern = new RegExp(`(${sorted.map((l) => l.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const used = new Set<string>();
  return text.split(pattern).map((part, i) => {
    const link = sorted.find((l) => l.name === part);
    if (link && !used.has(link.name)) {
      used.add(link.name);
      return (
        <Link key={`${keyPrefix}-${i}`} href={link.href} className={styles.textLink}>
          {part}
        </Link>
      );
    }
    return part;
  });
}

export function RichText({ text, links = [] }: { text: string; links?: NameLink[] }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <b key={i} className={styles.em}>
            {linkify(part.slice(2, -2), links, `b${i}`)}
          </b>
        ) : (
          <span key={i}>{linkify(part, links, `t${i}`)}</span>
        )
      )}
    </>
  );
}

// ------------------------------------------------------------
// 注目ポイント
// ------------------------------------------------------------

export interface PickPerson {
  name: string;
  link?: string;
}

function PickChips({ items, kind }: { items: PickPerson[]; kind: 'good' | 'hole' | 'bad' }) {
  if (items.length === 0) return <span className={styles.none}>該当なし</span>;
  return (
    <div className={styles.chips}>
      {items.map((p) =>
        p.link ? (
          <Link key={p.name} href={p.link} className={`${styles.nm} ${styles[kind]}`}>
            {p.name}
          </Link>
        ) : (
          <span key={p.name} className={`${styles.nm} ${styles[kind]}`}>
            {p.name}
          </span>
        )
      )}
    </div>
  );
}

export function PickCard({
  title,
  label,
  strong,
  upset,
  weak,
}: {
  title: string;
  label: string;
  strong: PickPerson[];
  upset?: PickPerson[];
  weak: PickPerson[];
}) {
  return (
    <div className={`${styles.card} ${styles.pick}`}>
      <h3>{title}</h3>
      <div className={styles.grp}>
        <span className={styles.gl}>このコースが得意な{label}</span>
        <PickChips items={strong} kind="good" />
      </div>
      {upset && upset.length > 0 && (
        <div className={styles.grp}>
          <span className={styles.gl}>このコースでよく穴をあける{label}</span>
          <PickChips items={upset} kind="hole" />
        </div>
      )}
      <div className={styles.grp}>
        <span className={styles.gl}>このコースが苦手な{label}</span>
        <PickChips items={weak} kind="bad" />
      </div>
    </div>
  );
}
