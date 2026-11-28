// JSON を直接 import してバンドルに含める（Cloudflare Workers 上の ISR 再生成ではファイルを読めないため）
import leadingJson from '@/public/data/leading.json';

export interface LeadingData {
  rank: number;
  id: number;
  name: string;
  wins: number;
  rides: number;
  winRate: number;
}

interface LeadingJsonData {
  year: number;
  last_updated: string;
  jockey_leading: LeadingData[];
  trainer_leading: LeadingData[];
  sire_leading?: LeadingData[];
}

/**
 * 事前生成されたリーディングデータを読み込む
 * public/data/leading.json（ビルド時にバンドル）から読み込み
 */
function getLeadingDataFromFile(): LeadingJsonData {
  return leadingJson as LeadingJsonData;
}

/**
 * リーディングの集計年（例 2026）
 */
export async function getLeadingYear(): Promise<number> {
  return getLeadingDataFromFile().year;
}

/**
 * 騎手リーディングデータを取得
 */
export async function getJockeyLeading(): Promise<LeadingData[]> {
  const data = getLeadingDataFromFile();
  return data.jockey_leading;
}

/**
 * 調教師リーディングデータを取得
 */
export async function getTrainerLeading(): Promise<LeadingData[]> {
  const data = getLeadingDataFromFile();
  return data.trainer_leading;
}

/**
 * 種牡馬リーディングデータを取得
 * 現在は空配列を返す（将来実装予定）
 */
export async function getSireLeading(): Promise<LeadingData[]> {
  const data = getLeadingDataFromFile();
  return data.sire_leading || [];
}
