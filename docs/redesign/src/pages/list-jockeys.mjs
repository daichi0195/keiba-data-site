// 騎手データ一覧の見本（現行 app/jockeys/page.tsx）
import * as L from '../lib.mjs';
import { namePage } from './list-shared.mjs';

console.log('list-jockeys', namePage({
  current: 'jockey', out: 'v6-list-jockeys.html',
  pageTitle: '騎手データ一覧 見本',
  title: '騎手データ一覧',
  lead: '過去3年間に30レース以上出走している現役中央騎手のデータを集計しています。',
  unit: '名', noun: '騎手', groups: L.GJ,
  leadTitle: '騎手リーディング（勝ち数順）', rows: L.leading.jockey_leading, ridesLabel: '騎乗',
  placeholder: '騎手名・よみで絞り込む（例：よこやま）',
}));
