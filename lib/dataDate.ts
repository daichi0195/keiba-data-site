import fs from 'fs';
import path from 'path';

/**
 * データの更新日まわりの共通処理
 *
 * データ更新日の基準は週次パイプライン（gcs/v2/weekly.sh）が書き出す public/data/leading.json の last_updated。
 * 検索エンジンに正しい更新日を伝えるため、表示・構造化データ・サイトマップはすべてここから日付を取る。
 */

/** データの最終更新日時（取得できなければ null） */
export function getDataUpdatedAt(): Date | null {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'leading.json');
    const { last_updated } = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const d = new Date(last_updated);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/** Date → 「2026年10月18日」（JST） */
export function formatJaDate(d: Date): string {
  const [y, m, day] = toIsoDate(d).split('-').map(Number);
  return `${y}年${m}月${day}日`;
}

/** Date → 「2026-10-18」（JST） */
export function toIsoDate(d: Date): string {
  return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 「2026年10月18日」→「2026-10-18」（解釈できなければ undefined） */
export function jaDateToIso(ja?: string): string | undefined {
  const m = ja?.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!m) return undefined;
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

/**
 * 集計期間の表記を短くする
 * 「2023年10月17日〜2026年10月17日」→「2023年10月〜2026年10月17日」
 * 3年前の日付が日単位で何度も出ると、検索結果にその古い日付が表示されやすいため、開始日は年月までにする。
 */
export function shortenPeriod(periodText?: string): string | undefined {
  if (!periodText) return periodText;
  return periodText.replace(/^(\d{4}年\d{1,2}月)\d{1,2}日(\s*〜)/, '$1$2');
}

/** data_period（「直近3年間分（A〜B）」）から括弧内の期間を取り出して短縮する */
export function periodFromDataPeriod(dataPeriod?: string): string | undefined {
  return shortenPeriod(dataPeriod?.match(/（([^）]+)）/)?.[1]);
}

/**
 * データページ用の構造化データ（WebPage）
 * dateModified を明示して、検索エンジンにデータの更新日を伝える
 */
export function buildWebPageJsonLd({ url, name, description, dateModified }: {
  url: string;
  name: string;
  description?: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    name,
    ...(description ? { description } : {}),
    inLanguage: 'ja',
    ...(dateModified ? { dateModified } : {}),
    isPartOf: { '@type': 'WebSite', name: '競馬データ.com', url: 'https://www.keibadata.com' },
    publisher: { '@type': 'Organization', name: '競馬データ.com', url: 'https://www.keibadata.com' },
  };
}
