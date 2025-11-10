import type { Metadata } from "next";
import Footer from "@/components/Footer";
import HeaderMenu from "@/components/HeaderMenu";
import "./globals.css";

export const metadata: Metadata = {
  title: "KEIBA DATA LAB",
  description: "競馬データ分析メディア",
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
          <div className="site-name">🏇 KEIBA DATA LAB</div>
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