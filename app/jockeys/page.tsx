import { Metadata } from 'next';
import NameIndex from '@/components/v6/list/NameIndex';
import { Hero, Tail, toNameGroups } from '@/components/v6/list/parts';
import { ROOT } from '@/components/v6/list/cx';
import { JOCKEY_GROUPS } from '@/components/datapage/list/kana';
import { ALL_JOCKEYS } from '@/lib/jockeys';
import { getJockeyLeading, getLeadingYear } from '@/lib/getLeadingData';

export const metadata: Metadata = {
  title: '騎手別データ一覧｜成績・特徴・回収率を比較【毎週更新】',
  description: 'JRA騎手の成績・特徴・回収率を比較できるデータ一覧。直近3年のデータで、得意なコース・距離まで分析。毎週更新。',
  alternates: {
    canonical: 'https://www.keibadata.com/jockeys',
  },
};

const GROUPS = toNameGroups(JOCKEY_GROUPS, new Map(ALL_JOCKEYS.map((x) => [x.id, x.kana])), false);

export default async function Page() {
  const [rows, year] = await Promise.all([getJockeyLeading(), getLeadingYear()]);
  const total = GROUPS.reduce((s, g) => s + g.items.length, 0);

  return (
    <main className={ROOT}>
      <Hero title="騎手データ一覧" lead="過去3年間に30レース以上出走している現役中央騎手のデータを集計しています。" count={`${total.toLocaleString('ja-JP')}名`} />
      <NameIndex
        groups={GROUPS}
        unit="名"
        noun="騎手"
        placeholder="騎手名・よみで絞り込む（例：よこやま）"
        hrefPrefix="/jockeys/"
        leading={{ title: '騎手リーディング（勝ち数順）', year, rows: rows.slice(0, 10), ridesLabel: '騎乗' }}
      >
        <Tail current="jockey" />
      </NameIndex>
    </main>
  );
}
