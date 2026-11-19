import { Metadata } from 'next';
import StaticPage, { P, type StaticSection } from '@/components/v6/static/StaticPage';

export const metadata: Metadata = {
  title: '免責事項 | 競馬データ.com',
  description: '競馬データ.comの免責事項です。当サイトのご利用にあたっての注意事項をご確認ください。',
};

// 見本：docs/redesign/src/pages/disclaimer.mjs
const sections: StaticSection[] = [
  {
    title: 'データの利用について',
    body: <P>当サイトで提供する情報は、過去のレース結果に基づく統計データであり、将来のレース結果を保証するものではありません。馬券の購入は自己責任で行ってください。</P>,
  },
  {
    title: '免責について',
    body: (
      <>
        <P>当サイトの情報を利用して生じたいかなる損害についても、当サイトは一切の責任を負いかねます。また、掲載している情報は予告なく変更される場合があります。</P>
        <P>データの正確性には最善を尽くしていますが、誤りや最新性の欠如がある可能性がございます。重要な情報については、必ず公式データをご確認ください。</P>
      </>
    ),
  },
  {
    title: '外部リンクについて',
    body: <P>当サイトから外部サイトへのリンクが含まれる場合がありますが、リンク先のサイトの内容について当サイトは一切の責任を負いません。</P>,
  },
  {
    title: 'サービスの中断・停止について',
    body: <P>当サイトは、メンテナンスやシステム障害等により、予告なくサービスを一時的に中断または停止する場合があります。これにより生じた損害について、当サイトは一切の責任を負いません。</P>,
  },
];

export default function DisclaimerPage() {
  return <StaticPage pageKey="disclaimer" title="免責事項" crumbs={[{ label: '免責事項' }]} sections={sections} toc={false} />;
}
