const BASE_URL = 'https://storage.googleapis.com/umadata';

// 枠番ごとの色を定義
const GATE_COLORS: Record<number, string> = {
  1: '#FFFFFF',
  2: '#222222',
  3: '#C62927',
  4: '#2573CD',
  5: '#E4CA3C',
  6: '#58AF4A',
  7: '#FAA727',
  8: '#DC6179',
};

export async function getTrainerDataFromGCS(trainerId: string | number) {
  // 調教師IDを5桁にゼロパディング（例: 1075 → 01075）
  const paddedId = String(trainerId).padStart(5, '0');

  // キャッシュバスターを付けてCDNキャッシュを回避
  const timestamp = Math.floor(Date.now() / 3600000); // 1時間単位
  const url = `${BASE_URL}/trainer/${paddedId}.json?v=${timestamp}`;

  console.log('🔍 Fetching trainer data from GCS:', url);

  try {
    const response = await fetch(url, {
      next: { revalidate: false }, // ビルド時のみ取得（no-store だと毎リクエスト SSR になり表示が遅くなる）
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // gate_stats に color フィールドを追加
    if (data.gate_stats && Array.isArray(data.gate_stats)) {
      data.gate_stats = data.gate_stats.map((gate: any) => {
        const gateNumber = typeof gate.gate === 'string' ? parseInt(gate.gate, 10) : gate.gate;
        return {
          gate: gateNumber,
          color: GATE_COLORS[gateNumber] || '#999999',
          races: typeof gate.races === 'string' ? parseInt(gate.races, 10) : gate.races,
          wins: typeof gate.wins === 'string' ? parseInt(gate.wins, 10) : gate.wins,
          places_2: typeof gate.places_2 === 'string' ? parseInt(gate.places_2, 10) : gate.places_2,
          places_3: typeof gate.places_3 === 'string' ? parseInt(gate.places_3, 10) : gate.places_3,
          win_rate: typeof gate.win_rate === 'string' ? parseFloat(gate.win_rate) : gate.win_rate,
          place_rate: typeof gate.place_rate === 'string' ? parseFloat(gate.place_rate) : gate.place_rate,
          quinella_rate: typeof gate.quinella_rate === 'string' ? parseFloat(gate.quinella_rate) : gate.quinella_rate,
          win_payback: typeof gate.win_payback === 'string' ? parseInt(gate.win_payback, 10) : gate.win_payback,
          place_payback: typeof gate.place_payback === 'string' ? parseInt(gate.place_payback, 10) : gate.place_payback,
        };
      });
    }

    // popularity_stats を配列からオブジェクト形式に変換
    if (data.popularity_stats && Array.isArray(data.popularity_stats)) {
      const popularityObject: Record<string, any> = {};
      data.popularity_stats.forEach((item: any) => {
        const key = item.popularity_group || item.key;
        if (key) {
          popularityObject[key] = {
            races: typeof item.races === 'string' ? parseInt(item.races, 10) : item.races,
            wins: typeof item.wins === 'string' ? parseInt(item.wins, 10) : item.wins,
            places_2: typeof item.places_2 === 'string' ? parseInt(item.places_2, 10) : item.places_2,
            places_3: typeof item.places_3 === 'string' ? parseInt(item.places_3, 10) : item.places_3,
            win_rate: typeof item.win_rate === 'string' ? parseFloat(item.win_rate) : item.win_rate,
            place_rate: typeof item.place_rate === 'string' ? parseFloat(item.place_rate) : item.place_rate,
            quinella_rate: typeof item.quinella_rate === 'string' ? parseFloat(item.quinella_rate) : item.quinella_rate,
            win_payback: typeof item.win_payback === 'string' ? parseInt(item.win_payback, 10) : item.win_payback,
            place_payback: typeof item.place_payback === 'string' ? parseInt(item.place_payback, 10) : item.place_payback,
          };
        }
      });
      data.popularity_stats = popularityObject;
    }

    // running_style_stats を処理（型変換）
    if (data.running_style_stats && Array.isArray(data.running_style_stats)) {
      data.running_style_stats = data.running_style_stats.map((item: any) => ({
        style: item.style || '',
        style_label: item.style_label || '',
        races: typeof item.races === 'string' ? parseInt(item.races, 10) : item.races,
        wins: typeof item.wins === 'string' ? parseInt(item.wins, 10) : item.wins,
        places_2: typeof item.places_2 === 'string' ? parseInt(item.places_2, 10) : item.places_2,
        places_3: typeof item.places_3 === 'string' ? parseInt(item.places_3, 10) : item.places_3,
        win_rate: typeof item.win_rate === 'string' ? parseFloat(item.win_rate) : item.win_rate,
        place_rate: typeof item.place_rate === 'string' ? parseFloat(item.place_rate) : item.place_rate,
        quinella_rate: typeof item.quinella_rate === 'string' ? parseFloat(item.quinella_rate) : item.quinella_rate,
        win_payback: typeof item.win_payback === 'string' ? parseFloat(item.win_payback) : item.win_payback,
        place_payback: typeof item.place_payback === 'string' ? parseFloat(item.place_payback) : item.place_payback,
      }));
    }

    // characteristics データを処理（数値型に変換）
    if (data.characteristics) {
      data.characteristics = {
        gate_position: typeof data.characteristics.gate_position === 'string'
          ? parseInt(data.characteristics.gate_position, 10)
          : data.characteristics.gate_position,
        distance_trend_position: typeof data.characteristics.distance_trend_position === 'string'
          ? parseInt(data.characteristics.distance_trend_position, 10)
          : data.characteristics.distance_trend_position,
      };
    }

    // 他の統計データの処理（avg_popularity、avg_rank、median_popularity、median_rankを含める）
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
      'distance_stats',
      'surface_stats',
      'racecourse_stats',
      'gender_stats',
      'class_stats',
      'course_stats',
      'interval_stats'
    ];

    for (const arrayName of statsArrays) {
      if (data[arrayName] && Array.isArray(data[arrayName])) {
        data[arrayName] = processStatsArray(data[arrayName]);
      }
    }

    console.log('✅ Trainer data loaded from GCS');
    console.log('  - Trainer:', data.name || '(unknown)');
    console.log('  - Total races:', data.total_stats?.races || 0);
    console.log('  - Gate stats:', data.gate_stats?.length || 0, 'gates');
    console.log('  - Popularity stats:', Object.keys(data.popularity_stats || {}).length, 'groups');
    console.log('  - Course stats:', data.course_stats?.length || 0, 'courses');
    console.log('  - Jockey stats:', data.jockey_stats?.length || 0, 'jockeys');

    return data;

  } catch (error) {
    console.error('❌ Failed to fetch trainer data:', error);
    throw error;
  }
}
