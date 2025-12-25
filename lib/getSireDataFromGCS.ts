import { ALL_SIRES } from './sires';

const BASE_URL = 'https://storage.googleapis.com/umadata';

export async function getSireDataFromGCS(sireId: string | number) {
  // IDから種牡馬情報を取得
  const sire = ALL_SIRES.find(s => s.id === parseInt(String(sireId)));
  if (!sire) {
    throw new Error(`Sire not found: ${sireId}`);
  }

  // 種牡馬名をURLエンコード（GCSファイル名と一致させる）
  const encodedName = encodeURIComponent(sire.name);

  // キャッシュバスターを付けてCDNキャッシュを回避
  const timestamp = Math.floor(Date.now() / 1000);
  const url = `${BASE_URL}/sires/${encodedName}.json?v=${timestamp}`;

  console.log('🔍 Fetching sire data from GCS:', url);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sire data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching sire data for ${sireId}:`, error);
    throw error;
  }
}
