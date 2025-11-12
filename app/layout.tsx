import type { Metadata } from "next";
import Script from "next/script";
import Footer from "@/components/Footer";
import HeaderMenu from "@/components/HeaderMenu";
import "./globals.css";

export const metadata: Metadata = {
  title: "競馬データ.com",
  description: "競馬データ分析サイト - 全国の競馬場・コース別の詳細データ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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

        <header>
          <div className="site-name">
            <img src="/logo.png" alt="競馬データ.com" style={{ height: '32px', marginRight: '8px', verticalAlign: 'middle' }} />
            競馬データ.com
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <HeaderMenu items={[]} />
          </div>
        </header>
        {children}
        <Footer />
      </body>
    </html>
  );
}