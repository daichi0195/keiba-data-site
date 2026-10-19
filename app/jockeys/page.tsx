import { Metadata } from 'next';
import NameIndexPage from '@/components/datapage/list/NameIndexPage';
import { JOCKEY_GROUPS } from '@/components/datapage/list/kana';
import { getJockeyLeading } from '@/lib/getLeadingData';

export const metadata: Metadata = {
  title: '騎手別データ一覧｜成績・特徴・回収率を比較【毎週更新】',
  description: 'JRA騎手の成績・特徴・回収率を比較できるデータ一覧。直近3年のデータで、得意なコース・距離まで分析。毎週更新。',
  alternates: {
    canonical: 'https://www.keibadata.com/jockeys',
  },
};

export default async function JockeysPage() {
  const jockeyLeading = await getJockeyLeading();

  return (
    <NameIndexPage
      crumb="騎手データ一覧"
      title="騎手データ一覧"
      lead="過去3年間に30レース以上出走している現役中央騎手のデータを集計しています。"
      unit="名"
      groups={JOCKEY_GROUPS}
      hrefPrefix="/jockeys/"
      leading={{ title: '騎手リーディング（勝ち数順）', data: jockeyLeading }}
    />
  );
}
