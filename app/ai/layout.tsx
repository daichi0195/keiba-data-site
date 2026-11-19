import RailAiOff from '@/components/layout/RailAiOff';
import { RailAdOff } from '@/components/layout/RailAd';

/** AI予測の区画：右列の「AI勝率予測」の案内は出さない（自分自身の案内になるため） */
export default function AiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RailAiOff />
      <RailAdOff />
    </>
  );
}
