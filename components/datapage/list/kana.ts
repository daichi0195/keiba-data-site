/**
 * 一覧ページ・トップページ用：名前の五十音グループ化（現行の AllJockeysList などと同じロジック）
 */
import { ALL_JOCKEYS } from '@/lib/jockeys';
import { ALL_SIRES } from '@/lib/sires';
import { ALL_TRAINERS } from '@/lib/trainers';

export interface NameItem {
  id: number;
  name: string;
}

export interface KanaGroup {
  /** 表示名（あ行 / ア行 など） */
  kana: string;
  /** ページ内リンク用の ID（kana-a など） */
  slug: string;
  items: NameItem[];
}

// 行ごとの判定（ひらがな・カタカナの両方）
const ROWS: { slug: string; re: RegExp }[] = [
  { slug: 'a', re: /[あいうえおアイウエオヴ]/ },
  { slug: 'ka', re: /[かきくけこがぎぐげごカキクケコガギグゲゴ]/ },
  { slug: 'sa', re: /[さしすせそざじずぜぞサシスセソザジズゼゾ]/ },
  { slug: 'ta', re: /[たちつてとだぢづでどタチツテトダヂヅデド]/ },
  { slug: 'na', re: /[なにぬねのナニヌネノ]/ },
  { slug: 'ha', re: /[はひふへほばびぶべぼぱぴぷぺぽハヒフヘホバビブベボパピプペポ]/ },
  { slug: 'ma', re: /[まみむめもマミムメモ]/ },
  { slug: 'ya', re: /[やゆよヤユヨ]/ },
  { slug: 'ra', re: /[らりるれろラリルレロ]/ },
  { slug: 'wa', re: /[わをんワヲン]/ },
];
const HIRA_LABELS = ['あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行'];
const KATA_LABELS = ['ア行', 'カ行', 'サ行', 'タ行', 'ナ行', 'ハ行', 'マ行', 'ヤ行', 'ラ行', 'ワ行'];

/**
 * @param list 対象
 * @param keyOf 並び・グループ判定に使う読み（騎手・調教師は kana、種牡馬は name）
 * @param katakana 見出しをカタカナ（ア行）にするか
 */
function groupByKana<T extends NameItem>(list: T[], keyOf: (item: T) => string, katakana: boolean, strictHiragana: boolean): KanaGroup[] {
  const labels = katakana ? KATA_LABELS : HIRA_LABELS;
  const buckets: T[][] = labels.map(() => []);
  const others: T[] = [];

  list.forEach((item) => {
    const first = (keyOf(item) || '').charAt(0);
    const idx = ROWS.findIndex((row, i) => {
      // 現行仕様：騎手・調教師の「あ行」判定にヴは含めない
      if (strictHiragana && i === 0) return /[あいうえおアイウエオ]/.test(first);
      return row.re.test(first);
    });
    if (first && idx >= 0) buckets[idx].push(item);
    else others.push(item);
  });

  const sortFn = (a: T, b: T) => keyOf(a).localeCompare(keyOf(b), 'ja');
  const groups: KanaGroup[] = buckets
    .map((items, i) => ({ kana: labels[i], slug: `kana-${ROWS[i].slug}`, items: items.sort(sortFn).map(({ id, name }) => ({ id, name })) }))
    .filter((g) => g.items.length > 0);
  if (others.length > 0) {
    groups.push({ kana: 'その他', slug: 'kana-other', items: others.sort(sortFn).map(({ id, name }) => ({ id, name })) });
  }
  return groups;
}

export const JOCKEY_GROUPS = groupByKana(ALL_JOCKEYS, (j) => j.kana, false, true);
export const TRAINER_GROUPS = groupByKana(ALL_TRAINERS, (t) => t.kana, false, true);
export const SIRE_GROUPS = groupByKana(ALL_SIRES, (s) => s.name, true, false);
