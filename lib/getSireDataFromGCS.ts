import { ALL_SIRES } from './sires';

const BASE_URL = 'https://storage.googleapis.com/umadata';

export async function getSireDataFromGCS(sireId: string | number) {
  // IDから種牡馬情報を取得
  const sire = ALL_SIRES.find(s => s.id === parseInt(String(sireId)));
  if (!sire) {
    throw new Error(`Sire not found: ${sireId}`);
  }

  // ID番号を5桁のゼロパディング形式に変換（調教師・騎手と同じ形式）
  const paddedId = String(sireId).padStart(5, '0');

  // キャッシュバスターを付けてCDNキャッシュを回避
  const timestamp = Math.floor(Date.now() / 3600000); // 1時間単位
  const url = `${BASE_URL}/sires/${paddedId}.json?v=${timestamp}`;

  console.log('🔍 Fetching sire data from GCS:', url);

  try {
    const response = await fetch(url, {
      next: { revalidate: false }, // ビルド時のみ取得（no-store だと毎リクエスト SSR になり表示が遅くなる）
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sire data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 各統計データの処理（avg_popularity、avg_rank、median_popularity、median_rankを含める）
    const processStatsArray = (statsArray: any[]) => {
      return statsArray.map((item: any) => ({
        ...item,
        avg_popularity: typeof item.avg_popularity === 'string' ? parseFloat(item.avg_popularity) : item.avg_popularity,
        avg_rank: typeof item.avg_rank === 'string' ? parseFloat(item.avg_rank) : item.avg_rank,
        median_popularity: typeof item.median_popularity === 'string' ? parseInt(item.median_popularity, 10) : item.median_popularity,
        median_rank: typeof item.median_rank === 'string' ? parseInt(item.median_rank, 10) : item.median_rank,
      }));
    };

    // すべての統計配列を処理
    const statsArrays = [
      'yearly_stats',
      'class_stats',
      'distance_stats',
      'gender_stats',
      'surface_stats',
      'track_change_stats',
      'track_condition_stats',
      'racecourse_stats',
      'running_style_stats',
      'age_stats',
      'gate_stats',
      'course_stats',
      'dam_sire_stats',
      'horse_weight_stats'
    ];

    for (const arrayName of statsArrays) {
      if (data[arrayName] && Array.isArray(data[arrayName])) {
        data[arrayName] = processStatsArray(data[arrayName]);
      }
    }

    // characteristics データを処理（数値型に変換）
    if (data.characteristics) {
      data.characteristics = {
        surface_trend_position: typeof data.characteristics.surface_trend_position === 'string'
          ? parseInt(data.characteristics.surface_trend_position, 10)
          : data.characteristics.surface_trend_position,
        running_style_trend_position: typeof data.characteristics.running_style_trend_position === 'string'
          ? parseInt(data.characteristics.running_style_trend_position, 10)
          : data.characteristics.running_style_trend_position,
        distance_trend_position: typeof data.characteristics.distance_trend_position === 'string'
          ? parseInt(data.characteristics.distance_trend_position, 10)
          : data.characteristics.distance_trend_position,
        turf_condition_trend_position: typeof data.characteristics.turf_condition_trend_position === 'string'
          ? parseInt(data.characteristics.turf_condition_trend_position, 10)
          : data.characteristics.turf_condition_trend_position,
        dirt_condition_trend_position: typeof data.characteristics.dirt_condition_trend_position === 'string'
          ? parseInt(data.characteristics.dirt_condition_trend_position, 10)
          : data.characteristics.dirt_condition_trend_position,
      };
    }

    return data;
  } catch (error) {
    console.error(`Error fetching sire data for ${sireId}:`, error);
    throw error;
  }
}
