import { Metadata } from 'next';
import NameIndex from '@/components/v6/list/NameIndex';
import { Hero, Tail, toNameGroups } from '@/components/v6/list/parts';
import { ROOT } from '@/components/v6/list/cx';
import { SIRE_GROUPS } from '@/components/datapage/list/kana';
import { getSireLeading, getLeadingYear } from '@/lib/getLeadingData';

export const metadata: Metadata = {
  title: '種牡馬別データ一覧｜産駒の特徴・成績を血統ごとに比較【毎週更新】',
  description: '種牡馬（血統）別に産駒の特徴と成績を比較できるデータ一覧。直近3年のデータで、得意距離・コース・重馬場成績まで分析。毎週更新。',
  alternates: {
    canonical: 'https://www.keibadata.com/sires',
  },
};

const GROUPS = toNameGroups(SIRE_GROUPS, new Map<number, string | undefined>(), true);

export default async function Page() {
  const [rows, year] = await Promise.all([getSireLeading(), getLeadingYear()]);
  const total = GROUPS.reduce((s, g) => s + g.items.length, 0);

  return (
    <main className={ROOT}>
      <Hero title="血統（種牡馬）別データ一覧" lead="過去3年間に産駒が50レース以上出走し、かつ産駒が10頭以上いる種牡馬のデータを集計しています。" count={`${total.toLocaleString('ja-JP')}頭`} />
      <NameIndex
        groups={GROUPS}
        unit="頭"
        noun="種牡馬"
        placeholder="種牡馬名で絞り込む（例：きずな）"
        hrefPrefix="/sires/"
        wide
        leading={{ title: '種牡馬リーディング（勝ち数順）', year, rows: rows.slice(0, 10), ridesLabel: '出走' }}
      >
        <Tail current="sire" />
      </NameIndex>
    </main>
  );
}
