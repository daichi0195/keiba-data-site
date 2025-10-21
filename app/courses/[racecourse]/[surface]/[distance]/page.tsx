import { Metadata } from 'next';
import DataTable from '@/components/DataTable';

// モックデータ
const mockData = {
  nakayama: {
    dirt: {
      '1800': {
        course_info: {
          racecourse: '中山競馬場',
          racecourse_en: 'nakayama',
          surface: 'ダート',
          surface_en: 'dirt',
          distance: 1800,
          total_races: 245,
          summary: '武豊騎手が勝率31.3%でトップ。キングカメハメハ産駒が勝率34.4%で好走。フェブラリーステークスの舞台。',
          characteristics: {
            running_style: 4,
            volatility: 2,
            gate_position: 4
          },
          buying_points: {
            positive: {
              jockey: {
                name: '武豊',
                value: '31.3%'
              },
              pedigree: {
                name: 'キングカメハメハ産駒',
                value: '34.4%'
              }
            },
            negative: {
              gate: {
                name: '内枠',
                note: '不利'
              },
              running_style: {
                name: '先行馬',
                note: '苦戦傾向'
              }
            }
          }
        },
        jockey_stats: [
          { rank: 1, name: '武豊', races: 48, wins: 15, places_2: 8, places_3: 6, win_rate: 31.3, place_rate: 47.9, quinella_rate: 60.4, win_payback: 95, place_payback: 88 },
          { rank: 2, name: '川田将雅', races: 42, wins: 13, places_2: 7, places_3: 5, win_rate: 31.0, place_rate: 47.6, quinella_rate: 59.5, win_payback: 92, place_payback: 85 },
          { rank: 3, name: 'ルメール', races: 35, wins: 12, places_2: 6, places_3: 4, win_rate: 34.3, place_rate: 51.4, quinella_rate: 62.9, win_payback: 105, place_payback: 95 },
          { rank: 4, name: '横山典弘', races: 52, wins: 11, places_2: 9, places_3: 7, win_rate: 21.2, place_rate: 38.5, quinella_rate: 51.9, win_payback: 78, place_payback: 82 },
          { rank: 5, name: '戸崎圭太', races: 45, wins: 10, places_2: 8, places_3: 6, win_rate: 22.2, place_rate: 40.0, quinella_rate: 53.3, win_payback: 85, place_payback: 86 },
          { rank: 6, name: '三浦皇成', races: 38, wins: 8, places_2: 6, places_3: 5, win_rate: 21.1, place_rate: 36.8, quinella_rate: 50.0, win_payback: 72, place_payback: 79 },
          { rank: 7, name: '福永祐一', races: 33, wins: 8, places_2: 5, places_3: 4, win_rate: 24.2, place_rate: 39.4, quinella_rate: 51.5, win_payback: 88, place_payback: 83 },
          { rank: 8, name: '田辺裕信', races: 41, wins: 7, places_2: 7, places_3: 6, win_rate: 17.1, place_rate: 34.1, quinella_rate: 48.8, win_payback: 65, place_payback: 75 },
          { rank: 9, name: '松山弘平', races: 29, wins: 7, places_2: 4, places_3: 3, win_rate: 24.1, place_rate: 37.9, quinella_rate: 48.3, win_payback: 82, place_payback: 78 },
          { rank: 10, name: '大野拓弥', races: 36, wins: 6, places_2: 5, places_3: 4, win_rate: 16.7, place_rate: 30.6, quinella_rate: 41.7, win_payback: 68, place_payback: 71 },
          { rank: 11, name: '岩田康誠', races: 34, wins: 6, places_2: 5, places_3: 3, win_rate: 17.6, place_rate: 32.4, quinella_rate: 41.2, win_payback: 70, place_payback: 73 },
          { rank: 12, name: '池添謙一', races: 31, wins: 5, places_2: 6, places_3: 4, win_rate: 16.1, place_rate: 35.5, quinella_rate: 48.4, win_payback: 75, place_payback: 80 },
          { rank: 13, name: '吉田隼人', races: 39, wins: 5, places_2: 5, places_3: 6, win_rate: 12.8, place_rate: 25.6, quinella_rate: 41.0, win_payback: 58, place_payback: 68 },
          { rank: 14, name: '丸山元気', races: 28, wins: 5, places_2: 4, places_3: 3, win_rate: 17.9, place_rate: 32.1, quinella_rate: 42.9, win_payback: 72, place_payback: 74 },
          { rank: 15, name: '石橋脩', races: 26, wins: 4, places_2: 5, places_3: 3, win_rate: 15.4, place_rate: 34.6, quinella_rate: 46.2, win_payback: 65, place_payback: 72 },
          { rank: 16, name: '丸田恭介', races: 32, wins: 4, places_2: 4, places_3: 5, win_rate: 12.5, place_rate: 25.0, quinella_rate: 40.6, win_payback: 55, place_payback: 66 },
          { rank: 17, name: '内田博幸', races: 35, wins: 4, places_2: 4, places_3: 4, win_rate: 11.4, place_rate: 22.9, quinella_rate: 34.3, win_payback: 52, place_payback: 63 },
          { rank: 18, name: '北村宏司', races: 24, wins: 4, places_2: 3, places_3: 3, win_rate: 16.7, place_rate: 29.2, quinella_rate: 41.7, win_payback: 68, place_payback: 70 },
          { rank: 19, name: '柴田善臣', races: 27, wins: 3, places_2: 5, places_3: 4, win_rate: 11.1, place_rate: 29.6, quinella_rate: 44.4, win_payback: 60, place_payback: 71 },
          { rank: 20, name: '津村明秀', races: 30, wins: 3, places_2: 4, places_3: 3, win_rate: 10.0, place_rate: 23.3, quinella_rate: 33.3, win_payback: 48, place_payback: 62 },
          { rank: 21, name: '柴田大知', races: 22, wins: 3, places_2: 3, places_3: 2, win_rate: 13.6, place_rate: 27.3, quinella_rate: 36.4, win_payback: 58, place_payback: 65 },
          { rank: 22, name: '蛯名正義', races: 25, wins: 3, places_2: 3, places_3: 3, win_rate: 12.0, place_rate: 24.0, quinella_rate: 36.0, win_payback: 55, place_payback: 64 },
          { rank: 23, name: '石川裕紀人', races: 28, wins: 3, places_2: 2, places_3: 4, win_rate: 10.7, place_rate: 17.9, quinella_rate: 32.1, win_payback: 50, place_payback: 60 },
          { rank: 24, name: '木幡巧也', races: 20, wins: 2, places_2: 4, places_3: 2, win_rate: 10.0, place_rate: 30.0, quinella_rate: 40.0, win_payback: 52, place_payback: 68 },
          { rank: 25, name: '野中悠太郎', races: 18, wins: 2, places_2: 3, places_3: 2, win_rate: 11.1, place_rate: 27.8, quinella_rate: 38.9, win_payback: 48, place_payback: 63 },
          { rank: 26, name: '武士沢友治', races: 23, wins: 2, places_2: 2, places_3: 3, win_rate: 8.7, place_rate: 17.4, quinella_rate: 30.4, win_payback: 42, place_payback: 58 },
          { rank: 27, name: '江田照男', races: 21, wins: 2, places_2: 2, places_3: 2, win_rate: 9.5, place_rate: 19.0, quinella_rate: 28.6, win_payback: 45, place_payback: 60 },
          { rank: 28, name: '菊沢一樹', races: 19, wins: 2, places_2: 1, places_3: 3, win_rate: 10.5, place_rate: 15.8, quinella_rate: 31.6, win_payback: 48, place_payback: 62 },
          { rank: 29, name: '松岡正海', races: 17, wins: 1, places_2: 3, places_3: 2, win_rate: 5.9, place_rate: 23.5, quinella_rate: 35.3, win_payback: 38, place_payback: 62 },
          { rank: 30, name: '木幡育也', races: 16, wins: 1, places_2: 2, places_3: 2, win_rate: 6.3, place_rate: 18.8, quinella_rate: 31.3, win_payback: 35, place_payback: 58 },
        ],
        pedigree_stats: [
          { rank: 1, name: 'キングカメハメハ', races: 32, wins: 11, places_2: 6, places_3: 4, win_rate: 34.4, place_rate: 53.1, quinella_rate: 65.6, win_payback: 98, place_payback: 92 },
          { rank: 2, name: 'ゴールドアリュール', races: 28, wins: 9, places_2: 5, places_3: 3, win_rate: 32.1, place_rate: 50.0, quinella_rate: 60.7, win_payback: 95, place_payback: 88 },
          { rank: 3, name: 'ハーツクライ', races: 35, wins: 10, places_2: 6, places_3: 5, win_rate: 28.6, place_rate: 45.7, quinella_rate: 60.0, win_payback: 88, place_payback: 85 },
          { rank: 4, name: 'クロフネ', races: 25, wins: 8, places_2: 4, places_3: 3, win_rate: 32.0, place_rate: 48.0, quinella_rate: 60.0, win_payback: 92, place_payback: 87 },
          { rank: 5, name: 'ディープインパクト', races: 40, wins: 9, places_2: 7, places_3: 6, win_rate: 22.5, place_rate: 40.0, quinella_rate: 55.0, win_payback: 78, place_payback: 82 },
          { rank: 6, name: 'オルフェーヴル', races: 22, wins: 6, places_2: 4, places_3: 3, win_rate: 27.3, place_rate: 45.5, quinella_rate: 59.1, win_payback: 85, place_payback: 84 },
          { rank: 7, name: 'ステイゴールド', races: 30, wins: 7, places_2: 5, places_3: 4, win_rate: 23.3, place_rate: 40.0, quinella_rate: 53.3, win_payback: 80, place_payback: 83 },
          { rank: 8, name: 'エンパイアメーカー', races: 18, wins: 5, places_2: 3, places_3: 2, win_rate: 27.8, place_rate: 44.4, quinella_rate: 55.6, win_payback: 82, place_payback: 81 },
          { rank: 9, name: 'ロードカナロア', races: 20, wins: 5, places_2: 3, places_3: 3, win_rate: 25.0, place_rate: 40.0, quinella_rate: 55.0, win_payback: 78, place_payback: 80 },
          { rank: 10, name: 'ダイワメジャー', races: 26, wins: 5, places_2: 4, places_3: 3, win_rate: 19.2, place_rate: 34.6, quinella_rate: 46.2, win_payback: 72, place_payback: 76 },
          { rank: 11, name: 'マンハッタンカフェ', races: 24, wins: 5, places_2: 3, places_3: 3, win_rate: 20.8, place_rate: 37.5, quinella_rate: 45.8, win_payback: 74, place_payback: 78 },
          { rank: 12, name: 'ネオユニヴァース', races: 21, wins: 4, places_2: 4, places_3: 3, win_rate: 19.0, place_rate: 38.1, quinella_rate: 52.4, win_payback: 70, place_payback: 79 },
          { rank: 13, name: 'ルーラーシップ', races: 27, wins: 4, places_2: 4, places_3: 4, win_rate: 14.8, place_rate: 29.6, quinella_rate: 44.4, win_payback: 62, place_payback: 72 },
          { rank: 14, name: 'キンシャサノキセキ', races: 19, wins: 4, places_2: 3, places_3: 2, win_rate: 21.1, place_rate: 36.8, quinella_rate: 47.4, win_payback: 75, place_payback: 77 },
          { rank: 15, name: 'スクリーンヒーロー', races: 23, wins: 4, places_2: 3, places_3: 3, win_rate: 17.4, place_rate: 30.4, quinella_rate: 43.5, win_payback: 68, place_payback: 73 },
          { rank: 16, name: 'シンボリクリスエス', races: 20, wins: 3, places_2: 4, places_3: 3, win_rate: 15.0, place_rate: 35.0, quinella_rate: 50.0, win_payback: 65, place_payback: 78 },
          { rank: 17, name: 'サクラバクシンオー', races: 17, wins: 3, places_2: 3, places_3: 2, win_rate: 17.6, place_rate: 35.3, quinella_rate: 47.1, win_payback: 68, place_payback: 75 },
          { rank: 18, name: 'ゼンノロブロイ', races: 22, wins: 3, places_2: 3, places_3: 3, win_rate: 13.6, place_rate: 27.3, quinella_rate: 40.9, win_payback: 58, place_payback: 70 },
          { rank: 19, name: 'ブラックタイド', races: 18, wins: 3, places_2: 2, places_3: 3, win_rate: 16.7, place_rate: 27.8, quinella_rate: 44.4, win_payback: 62, place_payback: 72 },
          { rank: 20, name: 'ヴィクトワールピサ', races: 16, wins: 3, places_2: 2, places_3: 2, win_rate: 18.8, place_rate: 31.3, quinella_rate: 43.8, win_payback: 70, place_payback: 74 },
          { rank: 21, name: 'ワークフォース', races: 15, wins: 2, places_2: 3, places_3: 2, win_rate: 13.3, place_rate: 33.3, quinella_rate: 46.7, win_payback: 58, place_payback: 75 },
          { rank: 22, name: 'ダンスインザダーク', races: 19, wins: 2, places_2: 3, places_3: 2, win_rate: 10.5, place_rate: 26.3, quinella_rate: 36.8, win_payback: 52, place_payback: 68 },
          { rank: 23, name: 'タニノギムレット', races: 14, wins: 2, places_2: 2, places_3: 2, win_rate: 14.3, place_rate: 28.6, quinella_rate: 42.9, win_payback: 60, place_payback: 70 },
          { rank: 24, name: 'スペシャルウィーク', races: 17, wins: 2, places_2: 2, places_3: 2, win_rate: 11.8, place_rate: 23.5, quinella_rate: 35.3, win_payback: 55, place_payback: 67 },
          { rank: 25, name: 'アグネスタキオン', races: 13, wins: 2, places_2: 1, places_3: 2, win_rate: 15.4, place_rate: 23.1, quinella_rate: 38.5, win_payback: 62, place_payback: 68 },
          { rank: 26, name: 'フジキセキ', races: 16, wins: 2, places_2: 1, places_3: 2, win_rate: 12.5, place_rate: 18.8, quinella_rate: 31.3, win_payback: 58, place_payback: 65 },
          { rank: 27, name: 'サンデーサイレンス', races: 12, wins: 1, places_2: 3, places_3: 1, win_rate: 8.3, place_rate: 33.3, quinella_rate: 41.7, win_payback: 48, place_payback: 72 },
          { rank: 28, name: 'メイショウサムソン', races: 11, wins: 1, places_2: 2, places_3: 1, win_rate: 9.1, place_rate: 27.3, quinella_rate: 36.4, win_payback: 45, place_payback: 68 },
          { rank: 29, name: 'アドマイヤムーン', races: 10, wins: 1, places_2: 1, places_3: 2, win_rate: 10.0, place_rate: 20.0, quinella_rate: 40.0, win_payback: 52, place_payback: 70 },
          { rank: 30, name: 'バゴ', races: 9, wins: 1, places_2: 1, places_3: 1, win_rate: 11.1, place_rate: 22.2, quinella_rate: 33.3, win_payback: 55, place_payback: 68 },
        ]
      }
    }
  }
};

const racecourseNames: Record<string, string> = {
  nakayama: '中山競馬場',
  tokyo: '東京競馬場',
  kyoto: '京都競馬場',
  hanshin: '阪神競馬場',
};

const surfaceNames: Record<string, string> = {
  turf: '芝',
  dirt: 'ダート',
};

type Props = {
  params: {
    racecourse: string;
    surface: string;
    distance: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const racecourse = racecourseNames[params.racecourse] || params.racecourse;
  const surface = surfaceNames[params.surface] || params.surface;
  
  return {
    title: `${racecourse} ${surface}${params.distance}m コース攻略データ | KEIBA DATA LAB`,
    description: `${racecourse}の${surface}${params.distance}mのコースデータ。騎手別・血統別の詳細な成績を分析。`,
  };
}

export default function CoursePage({ params }: Props) {
  const data = mockData[params.racecourse as keyof typeof mockData]?.[params.surface as 'dirt' | 'turf']?.[params.distance];
  
  if (!data) {
    return <div>データが見つかりません</div>;
  }

  const { course_info, jockey_stats, pedigree_stats } = data;
  
  const top5Jockeys = jockey_stats.slice(0, 5);
  const top5Pedigrees = pedigree_stats.slice(0, 5);

  return (
    <>
      <div className="breadcrumb">
        <a href="/">ホーム</a> &gt; <a href="/courses">コース</a> &gt; <a href={`/courses/${params.racecourse}`}>{course_info.racecourse}</a> &gt; {course_info.surface} &gt; {course_info.distance}m
      </div>
      
      <main>
        <div className="course-header">
          <h1>{course_info.racecourse} {course_info.surface}{course_info.distance}m</h1>
          <div className="course-meta">
            <div className="meta-item">
              <span className="meta-label">馬場:</span>
              <span>{course_info.surface}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">距離:</span>
              <span>{course_info.distance}m</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">総レース数:</span>
              <span>{course_info.total_races}レース</span>
            </div>
          </div>
        </div>
        
        <div className="summary-box">
          <div className="summary-box-title">このコースのポイント</div>
          <div className="summary-box-content">{course_info.summary}</div>
        </div>
        
        <div className="characteristics-box">
          <div className="characteristics-title">コース特性</div>
          
          <div className="gauge-item">
            <div className="gauge-label">脚質傾向</div>
            <div className="gauge-track">
              <div className="gauge-indicator" style={{ left: `${(course_info.characteristics.running_style - 1) * 25}%` }}></div>
            </div>
            <div className="gauge-labels">
              <span>逃げ有利</span>
              <span>差し有利</span>
            </div>
            <div className="gauge-result">
              {course_info.characteristics.running_style >= 4 ? '差し有利' : 
               course_info.characteristics.running_style <= 2 ? '逃げ有利' : '普通'}
            </div>
          </div>
          
          <div className="gauge-item">
            <div className="gauge-label">荒れ度</div>
            <div className="gauge-track">
              <div className="gauge-indicator" style={{ left: `${(course_info.characteristics.volatility - 1) * 25}%` }}></div>
            </div>
            <div className="gauge-labels">
              <span>堅い</span>
              <span>荒れる</span>
            </div>
            <div className="gauge-result">
              {course_info.characteristics.volatility >= 4 ? '荒れやすい' : 
               course_info.characteristics.volatility <= 2 ? 'やや堅い' : '普通'}
            </div>
          </div>
          
          <div className="gauge-item">
            <div className="gauge-label">枠順</div>
            <div className="gauge-track">
              <div className="gauge-indicator" style={{ left: `${(course_info.characteristics.gate_position - 1) * 25}%` }}></div>
            </div>
            <div className="gauge-labels">
              <span>内有利</span>
              <span>外有利</span>
            </div>
            <div className="gauge-result">
              {course_info.characteristics.gate_position >= 4 ? '外枠有利' : 
               course_info.characteristics.gate_position <= 2 ? '内枠有利' : '普通'}
            </div>
          </div>
        </div>
        
        <div className="buying-rules-container">
          <div className="buying-rules-section positive-section">
            <div className="buying-rules-header positive-header">
              買いの法則
            </div>
            <div className="buying-cards">
              <div className="buying-card positive-card">
                <div className="card-label">買い騎手</div>
                <div className="card-name">{course_info.buying_points.positive.jockey.name}</div>
                <div className="card-value">{course_info.buying_points.positive.jockey.value}</div>
              </div>
              <div className="buying-card positive-card">
                <div className="card-label">買い血統</div>
                <div className="card-name">{course_info.buying_points.positive.pedigree.name}</div>
                <div className="card-value">{course_info.buying_points.positive.pedigree.value}</div>
              </div>
            </div>
          </div>
          
          <div className="buying-rules-section negative-section">
            <div className="buying-rules-header negative-header">
              消しの法則
            </div>
            <div className="buying-cards">
              <div className="buying-card negative-card">
                <div className="card-label">消し枠</div>
                <div className="card-name">{course_info.buying_points.negative.gate.name}</div>
                <div className="card-note">{course_info.buying_points.negative.gate.note}</div>
              </div>
              <div className="buying-card negative-card">
                <div className="card-label">消し脚質</div>
                <div className="card-name">{course_info.buying_points.negative.running_style.name}</div>
                <div className="card-note">{course_info.buying_points.negative.running_style.note}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="section">
          <h2 className="section-title">騎手別成績</h2>
          
          <div className="chart-container">
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#2d3748', fontWeight: 600 }}>TOP5 勝率</h3>
            <div className="bar-chart">
              {top5Jockeys.map((jockey) => (
                <div key={jockey.rank} className="bar-item">
                  <div className="bar-label">{jockey.name}</div>
                  <div className="bar-visual">
                    <div className="bar-fill-container">
                      <div className="bar-fill" style={{ width: `${jockey.win_rate * 2.5}%` }}></div>
                    </div>
                    <div className="bar-value">{jockey.win_rate}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DataTable 
          title="騎手別成績 詳細データ"
          data={jockey_stats}
          initialShow={10}
        />
        
        <div className="section">
          <h2 className="section-title">血統別成績</h2>
          
          <div className="chart-container">
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#2d3748', fontWeight: 600 }}>TOP5 勝率</h3>
            <div className="bar-chart">
              {top5Pedigrees.map((pedigree) => (
                <div key={pedigree.rank} className="bar-item">
                <div className="bar-label">{pedigree.name}</div>
                <div className="bar-visual">
                  <div className="bar-fill-container">
                    <div className="bar-fill" style={{ width: `${pedigree.win_rate * 2.5}%` }}></div>
                  </div>
                  <div className="bar-value">{pedigree.win_rate}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <DataTable 
        title="血統別成績 詳細データ"
        data={pedigree_stats}
        initialShow={10}
      />
    </main>
  </>
);
}