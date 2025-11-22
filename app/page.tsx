import { Metadata } from 'next';
import RaceTabs from '@/components/RaceTabs';

export const metadata: Metadata = {
  title: '競馬データ.com | 全国の競馬場・コース別データ分析',
  description: '全国の競馬場・コース別の詳細データを分析。中央競馬・地方競馬の人気別成績、枠順別成績、脚質傾向、騎手・種牡馬・調教師の成績など、豊富な統計データで予想をサポート。',
  openGraph: {
    title: '競馬データ.com | 全国の競馬場・コース別データ分析',
    description: '全国の競馬場・コース別の詳細データを分析。中央競馬・地方競馬の人気別成績、枠順別成績、脚質傾向、騎手・種牡馬・調教師の成績など、豊富な統計データで予想をサポート。',
    url: 'https://www.keibadata.com',
    siteName: '競馬データ.com',
    locale: 'ja_JP',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#fbfcfd' }}>
      <RaceTabs />
    </div>
  );
}
