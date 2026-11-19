import type { Metadata } from "next";
import Script from "next/script";
import SiteFrame from "@/components/layout/SiteFrame";
import GaugeAnimationObserver from "@/components/GaugeAnimationObserver";
import "./globals.css";

export const metadata: Metadata = {
  title: "競馬データ.com - どこよりも使いやすい競馬データサイト",
  description: "競馬に関するあらゆるデータを網羅した、どこよりも使いやすい競馬データ分析サイト。コース別成績、騎手・調教師・血統データなど充実した情報で予想をサポートします。",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.png', sizes: '500x500', type: 'image/png' },
    ],
    apple: '/icon.png',
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 左メニューの「今週開催」：トップページと同じ AI予測インデックスから算出（lib/thisWeekVenues）

  return (
    <html lang="ja">
      <head>
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N3DT5GPQ');`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: '競馬データ.com',
              url: 'https://www.keibadata.com',
              logo: 'https://www.keibadata.com/logo.png',
              description: '競馬の予想に役立つあらゆるデータを網羅した競馬分析サイト',
            }),
          }}
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5897385083912635"
          crossOrigin="anonymous"
        />
        {/* AdSense 広告ブロックによる損失収益の回復タグ（プライバシーとメッセージ → タグ設定） */}
        <script async src="https://fundingchoicesmessages.google.com/i/pub-5897385083912635?ers=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {function signalGooglefcPresent() {if (!window.frames['googlefcPresent']) {if (document.body) {const iframe = document.createElement('iframe'); iframe.style = 'width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;'; iframe.style.display = 'none'; iframe.name = 'googlefcPresent'; document.body.appendChild(iframe);} else {setTimeout(signalGooglefcPresent, 0);}}}signalGooglefcPresent();})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N3DT5GPQ"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <SiteFrame>{children}</SiteFrame>
        <GaugeAnimationObserver />
      </body>
    </html>
  );
}