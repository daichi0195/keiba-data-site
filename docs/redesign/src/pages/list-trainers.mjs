// 調教師データ一覧の見本（現行 app/trainers/page.tsx）
// 現行の調教師一覧にはリーディングが無いが、トップ見本と騎手・種牡馬の一覧にそろえて載せている（public/data/leading.json の trainer_leading）
import * as L from '../lib.mjs';
import { namePage } from './list-shared.mjs';

console.log('list-trainers', namePage({
  current: 'trainer', out: 'v6-list-trainers.html',
  pageTitle: '調教師データ一覧 見本',
  title: '調教師データ一覧',
  lead: '過去3年間に30レース以上出走している現役中央調教師のデータを集計しています。',
  unit: '名', noun: '調教師', groups: L.GT,
  leadTitle: '調教師リーディング（勝ち数順）', rows: L.leading.trainer_leading, ridesLabel: '出走',
  placeholder: '調教師名・よみで絞り込む（例：やはぎ）',
}));
