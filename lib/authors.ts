/**
 * 執筆者情報の定義
 */

export interface Author {
  id: string;
  name: string;
  image: string;
  bio: string;
  twitter?: string; // X(Twitter)のURL
  rss?: string; // RSSフィードのURL
  aboutUrl?: string; // サイト情報・運営者情報のURL
}

/**
 * 執筆者情報マスターデータ
 */
export const AUTHORS: Record<string, Author> = {
  daichi: {
    id: 'daichi',
    name: 'ダイチ',
    image: '/images/authors/daichi.jpg', // public/images/authors/daichi.jpg に配置
    bio: '競馬とサウナが好きな27歳🐴<br>好きな馬はグランアレグリア。菱田Jを応援しています！<br>一口馬主はじめました✌️',
    twitter: 'https://x.com/daichikeibadata', // XのURL
    rss: '/rss.xml', // RSSフィードのURLに置き換えてください
    aboutUrl: '/about', // サイト情報・運営者情報ページのURL
  },
};

/**
 * 執筆者IDから執筆者情報を取得
 */
export function getAuthorById(authorId: string): Author | null {
  return AUTHORS[authorId] || null;
}

/**
 * 執筆者名から執筆者情報を取得（後方互換性のため）
 */
export function getAuthorByName(authorName: string): Author | null {
  const author = Object.values(AUTHORS).find((a) => a.name === authorName);
  return author || null;
}
