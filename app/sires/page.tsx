import { Metadata } from 'next';
import NameIndexPage from '@/components/datapage/list/NameIndexPage';
import { SIRE_GROUPS } from '@/components/datapage/list/kana';
import { getSireLeading } from '@/lib/getLeadingData';

export const metadata: Metadata = {
  title: '種牡馬別データ一覧｜産駒の特徴・成績を血統ごとに比較【毎週更新】',
  description: '種牡馬（血統）別に産駒の特徴と成績を比較できるデータ一覧。直近3年のデータで、得意距離・コース・重馬場成績まで分析。毎週更新。',
  alternates: {
    canonical: 'https://www.keibadata.com/sires',
  },
};

export default async function SiresPage() {
  const sireLeading = await getSireLeading();

  return (
    <NameIndexPage
      crumb="血統（種牡馬）別データ一覧"
      title="血統（種牡馬）別データ一覧"
      lead="過去3年間に産駒が50レース以上出走し、かつ産駒が10頭以上いる種牡馬のデータを集計しています。"
      unit="頭"
      groups={SIRE_GROUPS}
      hrefPrefix="/sires/"
      leading={{ title: '種牡馬リーディング（勝ち数順）', data: sireLeading }}
    />
  );
}
