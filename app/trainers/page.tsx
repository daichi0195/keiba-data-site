import { Metadata } from 'next';
import NameIndex from '@/components/v6/list/NameIndex';
import { Hero, Tail, toNameGroups } from '@/components/v6/list/parts';
import { ROOT } from '@/components/v6/list/cx';
import { TRAINER_GROUPS } from '@/components/datapage/list/kana';
import { ALL_TRAINERS } from '@/lib/trainers';
import { getTrainerLeading, getLeadingYear } from '@/lib/getLeadingData';

export const metadata: Metadata = {
  title: '調教師（厩舎）別データ一覧｜成績・特徴を比較【毎週更新】',
  description: 'JRA調教師（厩舎）の成績・特徴を比較できるデータ一覧。直近3年のデータで、得意条件や騎手との相性まで分析。毎週更新。',
  alternates: {
    canonical: 'https://www.keibadata.com/trainers',
  },
};

const GROUPS = toNameGroups(TRAINER_GROUPS, new Map(ALL_TRAINERS.map((x) => [x.id, x.kana])), false);

export default async function Page() {
  const [rows, year] = await Promise.all([getTrainerLeading(), getLeadingYear()]);
  const total = GROUPS.reduce((s, g) => s + g.items.length, 0);

  return (
    <main className={ROOT}>
      <Hero title="調教師データ一覧" lead="過去3年間に30レース以上出走している現役中央調教師のデータを集計しています。" count={`${total.toLocaleString('ja-JP')}名`} />
      <NameIndex
        groups={GROUPS}
        unit="名"
        noun="調教師"
        placeholder="調教師名・よみで絞り込む（例：やはぎ）"
        hrefPrefix="/trainers/"
        leading={{ title: '調教師リーディング（勝ち数順）', year, rows: rows.slice(0, 10), ridesLabel: '出走' }}
      >
        <Tail current="trainer" />
      </NameIndex>
    </main>
  );
}
