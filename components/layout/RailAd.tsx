'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AdSlot from '@/components/AdSlot';

/**
 * 右列（幅1800px以上）の広告。全ページで出す（2026-11-19 オーナー確認：横幅が広いときの右列広告は AI予測・コラムも含めて可）。
 * 中身のない画面（404）だけ、ページ側に <RailAdOff /> を置いて出さない。
 * 印の有無はページの描画後でないと分からないので、広告はマウント後に描く（サーバーの HTML には広告タグを出さない）。
 */
export default function RailAd() {
  const pathname = usePathname() ?? '';
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(!document.querySelector('[data-rail-ad="off"]'));
  }, [pathname]);
  return show ? <AdSlot key={pathname} unit="sidebar" variant="rail" /> : null;
}

/** このページでは右列の広告を出さない印 */
export function RailAdOff() {
  return <span data-rail-ad="off" hidden />;
}
