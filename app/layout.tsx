import type { Metadata } from "next";
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
      <body>
        <header>
          <div className="site-name">🏇 KEIBA DATA LAB</div>
        </header>
        {children}
      </body>
    </html>
  );
}