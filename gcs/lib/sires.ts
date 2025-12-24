/**
 * 全種牡馬のIDリスト
 *
 * 過去3年間に産駒が出走している主要種牡馬のリスト
 */

export interface SireInfo {
  id: number;
  name: string;
  name_en: string;
}

export const ALL_SIRES: SireInfo[] = [
  { id: 1, name: 'ディープインパクト', name_en: 'Deep Impact' },
  { id: 2, name: 'ロードカナロア', name_en: 'Lord Kanaloa' },
  { id: 3, name: 'キングカメハメハ', name_en: 'King Kamehameha' },
  // 実際の種牡馬リストはBigQueryから生成される想定
  // ここでは最小限のサンプルデータを配置
];
