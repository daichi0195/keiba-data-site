import type { Metadata } from "next";
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
      <body suppressHydrationWarning>
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