import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import SectionNav from "@/components/SectionNav";
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
          <Link href="/" className="site-name" style={{ textDecoration: 'none', cursor: 'pointer' }}>
            🏇 KEIBA DATA LAB
          </Link>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SectionNav items={[]} />
          </div>
        </header>
        {children}
        <Footer />
      </body>
    </html>
  );
}