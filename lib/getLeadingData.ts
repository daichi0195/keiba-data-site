import fs from 'fs';
import path from 'path';

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
 * public/data/leading.jsonから読み込み
 */
function getLeadingDataFromFile(): LeadingJsonData {
  const filePath = path.join(process.cwd(), 'public', 'data', 'leading.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
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
