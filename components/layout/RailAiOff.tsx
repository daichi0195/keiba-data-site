/**
 * 右列（幅1800px以上）の「AI勝率予測」の案内を、このページでは出さない印。
 * 見本 lib.mjs の page({ railAi: false }) に当たる。ページ（または区画の layout）のどこかに置くだけでよい。
 * 枠側の CSS（SiteFrame.module.css の :has([data-rail-ai='off'])）がサーバー描画の時点で案内を隠すので、ちらつかない。
 */
export default function RailAiOff() {
  return <span data-rail-ai="off" hidden />;
}
