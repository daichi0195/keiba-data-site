/** 一覧4ページの文字まわりの小さな処理（サーバー・ブラウザの両方で使う） */

/** 絞り込み用の読み：カタカナはひらがなに、英字は小文字に、空白と記号は取り除く（見本 list-shared.mjs・list.js の yomi と同じ） */
export const yomi = (s: string) =>
  String(s)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s.・]/g, '');

/** 名前の幅の目安（em）。英字は0.55字ぶん、ほかは1字ぶん */
const em = (n: string) => [...n].reduce((w, c) => w + (/[\x20-\x7e]/.test(c) ? 0.55 : 1), 0);

/**
 * 長い名前は2マスぶん使って切らない（見本 list-shared.mjs の cls()。文字の大きさは変えない）。
 * w8／w11 はスマホの3列（種牡馬は2列）、p2 は700px以上でも1マスに収まらない種牡馬（wide のときだけ）
 */
export const cellClass = (name: string, wide: boolean) =>
  [em(name) > 6.7 && 'w8', em(name) > 10.7 && 'w11', wide && em(name) >= 12 && 'p2'].filter(Boolean).join(' ');
