import { Metadata } from 'next';
import NameIndexPage from '@/components/datapage/list/NameIndexPage';
import { TRAINER_GROUPS } from '@/components/datapage/list/kana';

export const metadata: Metadata = {
  title: '調教師（厩舎）別データ一覧｜成績・特徴を比較【毎週更新】',
  description: 'JRA調教師（厩舎）の成績・特徴を比較できるデータ一覧。直近3年のデータで、得意条件や騎手との相性まで分析。毎週更新。',
  alternates: {
    canonical: 'https://www.keibadata.com/trainers',
  },
};

export default function TrainersPage() {
  // 現行仕様どおり、調教師一覧にはリーディングを載せない（五十音順の一覧のみ）
  return (
    <NameIndexPage
      crumb="調教師データ一覧"
      title="調教師データ一覧"
      lead="過去3年間に30レース以上出走している現役中央調教師のデータを集計しています。"
      unit="名"
      groups={TRAINER_GROUPS}
      hrefPrefix="/trainers/"
    />
  );
}
