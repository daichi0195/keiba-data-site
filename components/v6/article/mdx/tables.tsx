// 記事の MDX で使う13項目の表（現行の DataTable・GateTable など）。
// MDX に書かれた props の名前・形はそのまま受け取り、見た目は StatTable（見本のコース詳細の表と同じ作り）に揃える。
import StatTable, { type Stat, type StatRow } from './StatTable';

type Row<K extends string> = Stat & Record<K, string>;

/** 種牡馬・騎手・調教師などのランキング（順位つき。初期10件＋さらに表示） */
export function DataTable({
  title = '',
  data,
  initialShow = 10,
  nameLabel = '名前',
  note,
  disableHighlight = false,
  showRank = true,
  showGradeBadge = false,
}: {
  title?: string;
  data: (Stat & { rank?: number; name: string; link?: string })[];
  initialShow?: number;
  nameLabel?: string;
  note?: string;
  disableHighlight?: boolean;
  showRank?: boolean;
  showGradeBadge?: boolean;
  showCourseBadge?: boolean;
  courseBadgeType?: 'good' | 'bad';
  wideRacesColumn?: boolean;
}) {
  const rows: StatRow[] = (data || []).map((r) => ({
    ...r,
    key: showGradeBadge && /^G[123]$/.test(r.name) ? { kind: 'grade', text: r.name } : { kind: 'text', text: r.name, link: r.link },
  }));
  return <StatTable title={title} keyLabel={nameLabel} rows={rows} rank={showRank} initialShow={initialShow} note={note} disableHighlight={disableHighlight} />;
}

/** 全体の成績1行（1列目なし） */
export function StatsTable({ data }: { data: Stat }) {
  if (!data) return null;
  return <StatTable rows={[data]} disableHighlight />;
}

/** 枠番別（1〜8枠。データがない枠は0で埋める＝現行と同じ） */
export function GateTable({ title, data }: { title?: string; data: (Stat & { gate: number })[] }) {
  const rows: StatRow[] = [1, 2, 3, 4, 5, 6, 7, 8].map((g) => {
    const r = data.find((d) => d.gate === g);
    return { ...(r ?? zero()), key: { kind: 'gate', gate: g } };
  });
  return <StatTable title={title} keyLabel="枠番" rows={rows} />;
}

const CLASSES = ['G1', 'G2', 'G3', 'オープン', '3勝', '2勝', '1勝', '未勝利', '新馬'];
/** クラス別（showOnlyProvidedData でなければ全クラスを並べ、データがないクラスは0で埋める＝現行と同じ） */
export function ClassTable({ title, data, showOnlyProvidedData = false }: { title?: string; data: Row<'class_name'>[]; showOnlyProvidedData?: boolean }) {
  const list = showOnlyProvidedData ? data : CLASSES.map((c) => data.find((d) => d.class_name === c) ?? { ...zero(), class_name: c });
  const rows: StatRow[] = list.map((r) => ({ ...r, key: { kind: 'grade', text: r.class_name } }));
  return <StatTable title={title} keyLabel="クラス" rows={rows} />;
}

const label = <K extends string>(field: K, keyLabel: string) =>
  function Table({ title, data }: { title?: string; data: Row<K>[]; wideColumns?: boolean }) {
    const rows: StatRow[] = (data || []).map((r) => ({ ...r, key: { kind: 'text', text: r[field] } }));
    return <StatTable title={title} keyLabel={keyLabel} rows={rows} />;
  };

export const GenderTable = label('name', '性別');
export const HorseWeightTable = label('weight_category', '馬体重(kg)');
export const PreviousFinishTable = label('finish_category', '前走着順');
export const RunningStyleTable = label('style_label', '脚質');

/** 2つ以上の区分の比較（内枠・外枠など） */
export function ComparisonTable({ title, data, categoryLabel = 'カテゴリー' }: { title?: string; data: Row<'category'>[]; categoryLabel?: string }) {
  const rows: StatRow[] = data.map((r) => ({ ...r, key: { kind: 'text', text: r.category } }));
  return <StatTable title={title} keyLabel={categoryLabel} rows={rows} />;
}

/** 人気別（記事ではまだ使っていないが、現行の部品として残す） */
const BANDS = [
  ['fav1', '1人気'],
  ['fav2', '2人気'],
  ['fav3', '3人気'],
  ['fav4', '4人気'],
  ['fav5', '5人気'],
  ['fav6to9', '6-9人気'],
  ['fav10plus', '10人気-'],
] as const;
export function PopularityTable({ title, data }: { title?: string; data: Partial<Record<(typeof BANDS)[number][0], Stat>> }) {
  const rows: StatRow[] = BANDS.filter(([k]) => data?.[k]).map(([k, l]) => ({ ...(data[k] as Stat), key: { kind: 'text', text: l } }));
  return <StatTable title={title} keyLabel="人気" rows={rows} />;
}

function zero(): Stat {
  return { races: 0, wins: 0, places_2: 0, places_3: 0, win_rate: 0, quinella_rate: 0, place_rate: 0, win_payback: 0, place_payback: 0 };
}
