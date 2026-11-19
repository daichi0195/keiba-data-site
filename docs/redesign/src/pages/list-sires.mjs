// 血統（種牡馬）別データ一覧の見本（現行 app/sires/page.tsx）
import * as L from '../lib.mjs';
import { namePage } from './list-shared.mjs';

console.log('list-sires', namePage({
  current: 'sire', out: 'v6-list-sires.html',
  pageTitle: '血統（種牡馬）別データ一覧 見本',
  title: '血統（種牡馬）別データ一覧',
  lead: '過去3年間に産駒が50レース以上出走し、かつ産駒が10頭以上いる種牡馬のデータを集計しています。',
  unit: '頭', noun: '種牡馬', groups: L.GS,
  leadTitle: '種牡馬リーディング（勝ち数順）', rows: L.leading.sire_leading, ridesLabel: '出走',
  placeholder: '種牡馬名で絞り込む（例：きずな）',
  wide: true,
}));
