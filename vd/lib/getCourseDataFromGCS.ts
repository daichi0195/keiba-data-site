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

export async function getCourseDataFromGCS(
  racecourse: string,
  surface: string,
  distance: string | number
) {
  // 内回り・外回り対応: distanceが "1400-inner" のような形式の場合、JSONファイルパスを調整
  let filePath: string;
  const distanceStr = String(distance);

  if (distanceStr.includes('-inner')) {
    const baseDistance = distanceStr.replace('-inner', '');
    filePath = `${baseDistance}-inner.json`;
  } else if (distanceStr.includes('-outer')) {
    const baseDistance = distanceStr.replace('-outer', '');
    filePath = `${baseDistance}-outer.json`;
  } else {
    filePath = `${distance}.json`;
  }

  // キャッシュバスターを付けてCDNキャッシュを回避
  const timestamp = Math.floor(Date.now() / 3600000); // 1時間単位
  const url = `${BASE_URL}/course/${racecourse}/${surface}/${filePath}?v=${timestamp}`;

  console.log('🔍 Fetching course data from GCS:', url);

  try {
    const response = await fetch(url, {
      next: { revalidate: false }, // ビルド時のみ取得、自動リバリデートなし
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    let data: any = {};

    // JSON形式（統合JSON）またはNDJSON形式（複数行のJSON）に対応
    // 統合JSON形式を優先して試す（複数行でもOK）
    try {
      if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
        // 統合JSON形式（1つのJSONオブジェクト）
        data = JSON.parse(text);
      } else if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
        // JSON配列形式
        data.gate_stats = JSON.parse(text);
      } else {
        throw new Error('Not JSON format');
      }
    } catch {
      // NDJSON形式（複数行のJSON）の場合
      const lines = text.trim().split('\n').filter(line => line.trim());

      // 最初の行がgate_statsと判定（"gate"フィールドを持つ）
      if (lines.length > 0) {
        const firstLine = JSON.parse(lines[0]);
        if (firstLine.gate !== undefined) {
          // gate_stats として処理
          data.gate_stats = lines.map(line => JSON.parse(line));
        }
      }
    }

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

    // running_style_trends を処理（型変換）
    if (data.running_style_trends && Array.isArray(data.running_style_trends)) {
      data.running_style_trends = data.running_style_trends.map((item: any) => ({
        trend_group: item.trend_group || '',
        trend_label: item.trend_label || '',
        races: typeof item.races === 'string' ? parseInt(item.races, 10) : item.races,
        wins: typeof item.wins === 'string' ? parseInt(item.wins, 10) : item.wins,
        places_2: typeof item.places_2 === 'string' ? parseInt(item.places_2, 10) : item.places_2,
        places_3: typeof item.places_3 === 'string' ? parseInt(item.places_3, 10) : item.places_3,
        win_rate: typeof item.win_rate === 'string' ? parseFloat(item.win_rate) : item.win_rate,
        place_rate: typeof item.place_rate === 'string' ? parseFloat(item.place_rate) : item.place_rate,
        quinella_rate: typeof item.quinella_rate === 'string' ? parseFloat(item.quinella_rate) : item.quinella_rate,
        win_payback: typeof item.win_payback === 'string' ? parseFloat(item.win_payback) : item.win_payback,
        place_payback: typeof item.place_payback === 'string' ? parseFloat(item.place_payback) : item.place_payback,
        trend_value: typeof item.trend_value === 'string' ? parseInt(item.trend_value, 10) : item.trend_value,
      }));
    }

    // characteristics データを処理（数値型に変換）
    if (data.characteristics) {
      data.characteristics = {
        running_style: typeof data.characteristics.running_style === 'string'
          ? parseInt(data.characteristics.running_style, 10)
          : data.characteristics.running_style,
        volatility: typeof data.characteristics.volatility === 'string'
          ? parseInt(data.characteristics.volatility, 10)
          : data.characteristics.volatility,
        gate_position: typeof data.characteristics.gate_position === 'string'
          ? parseInt(data.characteristics.gate_position, 10)
          : data.characteristics.gate_position,
        trifecta_median_payback: typeof data.characteristics.trifecta_median_payback === 'string'
          ? parseInt(data.characteristics.trifecta_median_payback, 10)
          : data.characteristics.trifecta_median_payback,
        trifecta_all_median_payback: typeof data.characteristics.trifecta_all_median_payback === 'string'
          ? parseInt(data.characteristics.trifecta_all_median_payback, 10)
          : data.characteristics.trifecta_all_median_payback,
        trifecta_avg_payback_rank: typeof data.characteristics.trifecta_avg_payback_rank === 'string'
          ? parseInt(data.characteristics.trifecta_avg_payback_rank, 10)
          : data.characteristics.trifecta_avg_payback_rank,
        total_courses: typeof data.characteristics.total_courses === 'string'
          ? parseInt(data.characteristics.total_courses, 10)
          : data.characteristics.total_courses,
      };
    }

    // course_info の data_period、last_updated、total_races を処理
    if (data.course_info) {
      if (data.data_period) {
        data.course_info.data_period = data.data_period;
      }
      if (data.last_updated) {
        data.course_info.last_updated = data.last_updated;
      }
      if (data.total_races) {
        data.course_info.total_races = typeof data.total_races === 'string'
          ? parseInt(data.total_races, 10)
          : data.total_races;
      }
    }

    console.log('✅ Course data loaded from GCS');
    console.log('  - Gate stats:', data.gate_stats?.length || 0, 'gates');
    console.log('  - Popularity stats:', Object.keys(data.popularity_stats || {}).length, 'groups');
    console.log('  - Jockey stats:', data.jockey_stats?.length || 0, 'jockeys');
    console.log('  - Trainer stats:', data.trainer_stats?.length || 0, 'trainers');
    console.log('  - Characteristics:', data.characteristics ? '✓' : '✗');
    console.log('  - Data period:', data.data_period ? '✓' : '✗');
    console.log('  - Total races:', data.total_races || data.course_info?.total_races || '✗');

    return data;

  } catch (error) {
    console.error('❌ Failed to fetch course data:', error);
    throw error;
  }
}
