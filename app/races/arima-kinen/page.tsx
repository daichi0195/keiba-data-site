import { Metadata } from 'next';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import GateTable from '@/components/GateTable';
import RunningStyleTable from '@/components/RunningStyleTable';
import PopularityTable from '@/components/PopularityTable';
import HighlightsSection from '@/components/HighlightsSection';
import BarChartAnimation from '@/components/BarChartAnimation';
import VolatilityExplanation from '@/components/VolatilityExplanation';
import GatePositionExplanation from '@/components/GatePositionExplanation';
import RunningStyleExplanation from '@/components/RunningStyleExplanation';
import RunningStyleDefinition from '@/components/RunningStyleDefinition';
import HeaderMenu from '@/components/HeaderMenu';
import BottomNav from '@/components/BottomNav';
import { getCourseDataFromGCS } from '@/lib/getCourseDataFromGCS';
import { ALL_COURSES, getCourseUrl, getCourseDisplayName } from '@/lib/courses';

// ISR: 週1回（604800秒）再生成
export const revalidate = 604800;

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
            gate_position: 4,
            trifecta_avg_payback_rank: 8,
            trifecta_median_payback: 3850,
            trifecta_all_median_payback: 3200,
            total_courses: 64
          },
          buying_points: {
            jockey: {
              strong: [
                { name: '武豊', record: '75-58-42', win_rate: '31.3%', place_rate: '61.2%', win_payback: '115%', place_payback: '108%' },
                { name: '岡部幸雄', record: '68-55-39', win_rate: '28.5%', place_rate: '59.8%', win_payback: '112%', place_payback: '106%' }
              ],
              upset: [
                { name: '川田将雅', record: '25-20-15', win_rate: '8.5%', place_rate: '9.8%', win_payback: '25%', place_payback: '28%' },
                { name: '池添謙一', record: '22-18-12', win_rate: '7.2%', place_rate: '8.6%', win_payback: '28%', place_payback: '29%' }
              ],
              weak: [
                { name: '横山典弘', record: '22-18-15', win_rate: '12.3%', place_rate: '35.5%', win_payback: '85%', place_payback: '92%' },
                { name: '藤岡佑介', record: '28-22-18', win_rate: '14.1%', place_rate: '38.2%', win_payback: '88%', place_payback: '95%' }
              ]
            },
            pedigree: {
              sire: {
                strong: [
                  { name: 'キングカメハメハ', record: '89-68-51', win_rate: '34.4%', place_rate: '62.3%', win_payback: '118%', place_payback: '110%' },
                  { name: 'ディープインパクト', record: '76-61-47', win_rate: '29.8%', place_rate: '58.9%', win_payback: '114%', place_payback: '107%' }
                ],
                weak: [
                  { name: 'サンデーサイレンス', record: '31-24-19', win_rate: '15.2%', place_rate: '40.1%', win_payback: '86%', place_payback: '93%' },
                  { name: 'ハーツクライ', record: '35-28-22', win_rate: '16.7%', place_rate: '42.5%', win_payback: '89%', place_payback: '94%' }
                ]
              },
              dam_sire: {
                strong: [],
                weak: []
              }
            },
            trainer: {
              strong: [
                { name: '国枝栄', record: '72-57-43', win_rate: '32.1%', place_rate: '60.5%', win_payback: '116%', place_payback: '109%' },
                { name: '音無秀孝', record: '68-54-41', win_rate: '29.5%', place_rate: '57.8%', win_payback: '113%', place_payback: '105%' }
              ],
              weak: [
                { name: '高橋亮', record: '20-16-12', win_rate: '11.8%', place_rate: '34.2%', win_payback: '84%', place_payback: '91%' },
                { name: '藤岡健一', record: '25-20-15', win_rate: '13.4%', place_rate: '37.1%', win_payback: '87%', place_payback: '93%' }
              ]
            }
          }
        },
        popularity_stats: {
          fav1:      { races: 240, wins: 86, places_2: 62, places_3: 38, win_rate: 35.8, quinella_rate: 61.7, place_rate: 77.5, win_payback: 82,  place_payback: 88 },
          fav2:      { races: 240, wins: 58, places_2: 60, places_3: 46, win_rate: 24.2, quinella_rate: 49.2, place_rate: 68.3, win_payback: 90,  place_payback: 92 },
          fav3:      { races: 240, wins: 37, places_2: 48, places_3: 52, win_rate: 15.4, quinella_rate: 35.8, place_rate: 57.5, win_payback: 94,  place_payback: 96 },
          fav4:      { races: 240, wins: 25, places_2: 36, places_3: 45, win_rate: 10.4, quinella_rate: 25.4, place_rate: 44.2, win_payback: 96,  place_payback: 98 },
          fav5:      { races: 240, wins: 18, places_2: 28, places_3: 36, win_rate: 7.5,  quinella_rate: 19.2, place_rate: 34.2, win_payback: 98,  place_payback: 100 },
          fav6to9:   { races: 480, wins: 28, places_2: 52, places_3: 74, win_rate: 5.8,  quinella_rate: 16.7, place_rate: 32.1, win_payback: 102, place_payback: 104 },
          fav10plus: { races: 360, wins: 12, places_2: 24, places_3: 42, win_rate: 3.3,  quinella_rate: 10.0, place_rate: 21.7, win_payback: 108, place_payback: 110 },
        },        
        gate_stats: [
          {
            gate: 1,
            color: '#FFFFFF',
            races: 245,
            wins: 28,
            places_2: 30,
            places_3: 32,
            win_rate: 11.4,
            place_rate: 32.2, quinella_rate: 23.7,
            win_payback: 85,
            place_payback: 92
          },
          {
            gate: 2,
            color: '#222222',
            races: 245,
            wins: 32,
            places_2: 28,
            places_3: 30,
            win_rate: 13.1,
            place_rate: 32.7, quinella_rate: 24.5,
            win_payback: 95,
            place_payback: 88
          },
          {
            gate: 3,
            color: '#C62927',
            races: 245,
            wins: 35,
            places_2: 31,
            places_3: 28,
            win_rate: 14.3,
            place_rate: 33.5, quinella_rate: 26.9,
            win_payback: 102,
            place_payback: 95
          },
          {
            gate: 4,
            color: '#2573CD',
            races: 245,
            wins: 30,
            places_2: 33,
            places_3: 29,
            win_rate: 12.2,
            place_rate: 32.7, quinella_rate: 25.7,
            win_payback: 88,
            place_payback: 90
          },
          {
            gate: 5,
            color: '#E4CA3C',
            races: 245,
            wins: 29,
            places_2: 32,
            places_3: 31,
            win_rate: 11.8,
            place_rate: 32.7, quinella_rate: 24.9,
            win_payback: 83,
            place_payback: 89
          },
          {
            gate: 6,
            color: '#58AF4A',
            races: 245,
            wins: 31,
            places_2: 29,
            places_3: 30,
            win_rate: 12.7,
            place_rate: 32.7, quinella_rate: 24.5,
            win_payback: 91,
            place_payback: 87
          },
          {
            gate: 7,
            color: '#FAA727',
            races: 245,
            wins: 33,
            places_2: 30,
            places_3: 28,
            win_rate: 13.5,
            place_rate: 32.2, quinella_rate: 25.7,
            win_payback: 98,
            place_payback: 93
          },
          {
            gate: 8,
            color: '#DC6179',
            races: 245,
            wins: 27,
            places_2: 32,
            places_3: 37,
            win_rate: 11.0,
            place_rate: 33.9, quinella_rate: 24.1,
            win_payback: 80,
            place_payback: 94
          },
        ],
        running_style_stats: [
          {
            style: 'escape',
            style_label: '逃げ',
            races: 180,
            wins: 38,
            places_2: 32,
            places_3: 28,
            win_rate: 21.1,
            place_rate: 54.4, quinella_rate: 38.9,
            win_payback: 95,
            place_payback: 88
          },
          {
            style: 'lead',
            style_label: '先行',
            races: 320,
            wins: 72,
            places_2: 65,
            places_3: 58,
            win_rate: 22.5,
            place_rate: 60.9, quinella_rate: 42.8,
            win_payback: 102,
            place_payback: 93
          },
          {
            style: 'pursue',
            style_label: '差し',
            races: 280,
            wins: 58,
            places_2: 62,
            places_3: 54,
            win_rate: 20.7,
            place_rate: 62.1, quinella_rate: 42.9,
            win_payback: 88,
            place_payback: 90
          },
          {
            style: 'close',
            style_label: '追込',
            races: 150,
            wins: 22,
            places_2: 26,
            places_3: 28,
            win_rate: 14.7,
            place_rate: 50.7, quinella_rate: 32.0,
            win_payback: 75,
            place_payback: 82
          },
        ],
        jockey_stats: [
          { rank: 1, name: '武豊', races: 48, wins: 15, places_2: 8, places_3: 6, win_rate: 31.3, place_rate: 60.4, quinella_rate: 47.9, win_payback: 95, place_payback: 88 },
          { rank: 2, name: '川田将雅', races: 42, wins: 13, places_2: 7, places_3: 5, win_rate: 31.0, place_rate: 59.5, quinella_rate: 47.6, win_payback: 92, place_payback: 85 },
          { rank: 3, name: 'ルメール', races: 35, wins: 12, places_2: 6, places_3: 4, win_rate: 34.3, place_rate: 62.9, quinella_rate: 51.4, win_payback: 105, place_payback: 95 },
          { rank: 4, name: '横山典弘', races: 52, wins: 11, places_2: 9, places_3: 7, win_rate: 21.2, place_rate: 51.9, quinella_rate: 38.5, win_payback: 78, place_payback: 82 },
          { rank: 5, name: '戸崎圭太', races: 45, wins: 10, places_2: 8, places_3: 6, win_rate: 22.2, place_rate: 53.3, quinella_rate: 40.0, win_payback: 85, place_payback: 86 },
          { rank: 6, name: '三浦皇成', races: 38, wins: 8, places_2: 6, places_3: 5, win_rate: 21.1, place_rate: 50.0, quinella_rate: 36.8, win_payback: 72, place_payback: 79 },
          { rank: 7, name: '福永祐一', races: 33, wins: 8, places_2: 5, places_3: 4, win_rate: 24.2, place_rate: 51.5, quinella_rate: 39.4, win_payback: 88, place_payback: 83 },
          { rank: 8, name: '田辺裕信', races: 41, wins: 7, places_2: 7, places_3: 6, win_rate: 17.1, place_rate: 48.8, quinella_rate: 34.1, win_payback: 65, place_payback: 75 },
          { rank: 9, name: '松山弘平', races: 29, wins: 7, places_2: 4, places_3: 3, win_rate: 24.1, place_rate: 48.3, quinella_rate: 37.9, win_payback: 82, place_payback: 78 },
          { rank: 10, name: '大野拓弥', races: 36, wins: 6, places_2: 5, places_3: 4, win_rate: 16.7, place_rate: 41.7, quinella_rate: 30.6, win_payback: 68, place_payback: 71 },
          { rank: 11, name: '岩田康誠', races: 34, wins: 6, places_2: 5, places_3: 3, win_rate: 17.6, place_rate: 41.2, quinella_rate: 32.4, win_payback: 70, place_payback: 73 },
          { rank: 12, name: '池添謙一', races: 31, wins: 5, places_2: 6, places_3: 4, win_rate: 16.1, place_rate: 48.4, quinella_rate: 35.5, win_payback: 75, place_payback: 80 },
          { rank: 13, name: '吉田隼人', races: 39, wins: 5, places_2: 5, places_3: 6, win_rate: 12.8, place_rate: 41.0, quinella_rate: 25.6, win_payback: 58, place_payback: 68 },
          { rank: 14, name: '丸山元気', races: 28, wins: 5, places_2: 4, places_3: 3, win_rate: 17.9, place_rate: 42.9, quinella_rate: 32.1, win_payback: 72, place_payback: 74 },
          { rank: 15, name: '石橋脩', races: 26, wins: 4, places_2: 5, places_3: 3, win_rate: 15.4, place_rate: 46.2, quinella_rate: 34.6, win_payback: 65, place_payback: 72 },
          { rank: 16, name: '丸田恭介', races: 32, wins: 4, places_2: 4, places_3: 5, win_rate: 12.5, place_rate: 40.6, quinella_rate: 25.0, win_payback: 55, place_payback: 66 },
          { rank: 17, name: '内田博幸', races: 35, wins: 4, places_2: 4, places_3: 4, win_rate: 11.4, place_rate: 34.3, quinella_rate: 22.9, win_payback: 52, place_payback: 63 },
          { rank: 18, name: '北村宏司', races: 24, wins: 4, places_2: 3, places_3: 3, win_rate: 16.7, place_rate: 41.7, quinella_rate: 29.2, win_payback: 68, place_payback: 70 },
          { rank: 19, name: '柴田善臣', races: 27, wins: 3, places_2: 5, places_3: 4, win_rate: 11.1, place_rate: 44.4, quinella_rate: 29.6, win_payback: 60, place_payback: 71 },
          { rank: 20, name: '津村明秀', races: 30, wins: 3, places_2: 4, places_3: 3, win_rate: 10.0, place_rate: 33.3, quinella_rate: 23.3, win_payback: 48, place_payback: 62 },
          { rank: 21, name: '柴田大知', races: 22, wins: 3, places_2: 3, places_3: 2, win_rate: 13.6, place_rate: 36.4, quinella_rate: 27.3, win_payback: 58, place_payback: 65 },
          { rank: 22, name: '蛯名正義', races: 25, wins: 3, places_2: 3, places_3: 3, win_rate: 12.0, place_rate: 36.0, quinella_rate: 24.0, win_payback: 55, place_payback: 64 },
          { rank: 23, name: '石川裕紀人', races: 28, wins: 3, places_2: 2, places_3: 4, win_rate: 10.7, place_rate: 32.1, quinella_rate: 17.9, win_payback: 50, place_payback: 60 },
          { rank: 24, name: '木幡巧也', races: 20, wins: 2, places_2: 4, places_3: 2, win_rate: 10.0, place_rate: 40.0, quinella_rate: 30.0, win_payback: 52, place_payback: 68 },
          { rank: 25, name: '野中悠太郎', races: 18, wins: 2, places_2: 3, places_3: 2, win_rate: 11.1, place_rate: 38.9, quinella_rate: 27.8, win_payback: 48, place_payback: 63 },
          { rank: 26, name: '武士沢友治', races: 23, wins: 2, places_2: 2, places_3: 3, win_rate: 8.7, place_rate: 30.4, quinella_rate: 17.4, win_payback: 42, place_payback: 58 },
        ],
        pedigree_stats: [
          { rank: 1, name: 'キングカメハメハ', races: 64, wins: 22, places_2: 12, places_3: 8, win_rate: 34.4, place_rate: 65.6, quinella_rate: 53.1, win_payback: 112, place_payback: 98 },
          { rank: 2, name: 'ディープインパクト', races: 58, wins: 18, places_2: 11, places_3: 7, win_rate: 31.0, place_rate: 62.1, quinella_rate: 50.0, win_payback: 105, place_payback: 95 },
          { rank: 3, name: 'ハーツクライ', races: 52, wins: 16, places_2: 10, places_3: 6, win_rate: 30.8, place_rate: 61.5, quinella_rate: 50.0, win_payback: 98, place_payback: 92 },
          { rank: 4, name: 'ステイゴールド', races: 48, wins: 14, places_2: 9, places_3: 7, win_rate: 29.2, place_rate: 62.5, quinella_rate: 47.9, win_payback: 95, place_payback: 88 },
          { rank: 5, name: 'オルフェーヴル', races: 45, wins: 13, places_2: 8, places_3: 6, win_rate: 28.9, place_rate: 60.0, quinella_rate: 46.7, win_payback: 92, place_payback: 86 },
          { rank: 6, name: 'ゴールドシップ', races: 42, wins: 11, places_2: 8, places_3: 6, win_rate: 26.2, place_rate: 59.5, quinella_rate: 45.2, win_payback: 88, place_payback: 84 },
          { rank: 7, name: 'ロードカナロア', races: 39, wins: 10, places_2: 7, places_3: 5, win_rate: 25.6, place_rate: 56.4, quinella_rate: 43.6, win_payback: 85, place_payback: 82 },
          { rank: 8, name: 'ダイワメジャー', races: 37, wins: 9, places_2: 7, places_3: 5, win_rate: 24.3, place_rate: 56.8, quinella_rate: 43.2, win_payback: 82, place_payback: 80 },
          { rank: 9, name: 'クロフネ', races: 35, wins: 8, places_2: 6, places_3: 5, win_rate: 22.9, place_rate: 54.3, quinella_rate: 40.0, win_payback: 78, place_payback: 76 },
          { rank: 10, name: 'マンハッタンカフェ', races: 33, wins: 7, places_2: 6, places_3: 4, win_rate: 21.2, place_rate: 51.5, quinella_rate: 39.4, win_payback: 75, place_payback: 74 },
          { rank: 11, name: 'スクリーンヒーロー', races: 31, wins: 6, places_2: 5, places_3: 4, win_rate: 19.4, place_rate: 48.4, quinella_rate: 35.5, win_payback: 72, place_payback: 71 },
          { rank: 12, name: 'ルーラーシップ', races: 29, wins: 6, places_2: 4, places_3: 4, win_rate: 20.7, place_rate: 48.3, quinella_rate: 34.5, win_payback: 70, place_payback: 69 },
          { rank: 13, name: 'エンパイアメーカー', races: 28, wins: 5, places_2: 5, places_3: 3, win_rate: 17.9, place_rate: 46.4, quinella_rate: 35.7, win_payback: 68, place_payback: 68 },
          { rank: 14, name: 'ネオユニヴァース', races: 26, wins: 5, places_2: 4, places_3: 3, win_rate: 19.2, place_rate: 46.2, quinella_rate: 34.6, win_payback: 65, place_payback: 66 },
          { rank: 15, name: 'ゼンノロブロイ', races: 25, wins: 4, places_2: 4, places_3: 3, win_rate: 16.0, place_rate: 44.0, quinella_rate: 32.0, win_payback: 62, place_payback: 64 },
        ],
        dam_sire_stats: [
          { rank: 1,  name: 'サンデーサイレンス', races: 62, wins: 18, places_2: 12, places_3: 9, win_rate: 29.0, quinella_rate: 48.4, place_rate: 62.9, win_payback: 102, place_payback: 95 },
          { rank: 2,  name: 'キングカメハメハ', races: 58, wins: 15, places_2: 10, places_3: 8, win_rate: 25.9, quinella_rate: 43.1, place_rate: 56.9, win_payback: 97, place_payback: 91 },
          { rank: 3,  name: 'クロフネ', races: 55, wins: 13, places_2: 9, places_3: 7, win_rate: 23.6, quinella_rate: 40.0, place_rate: 52.7, win_payback: 95, place_payback: 90 },
          { rank: 4,  name: 'マンハッタンカフェ', races: 50, wins: 12, places_2: 8, places_3: 6, win_rate: 24.0, quinella_rate: 40.0, place_rate: 52.0, win_payback: 94, place_payback: 88 },
          { rank: 5,  name: 'フレンチデピュティ', races: 49, wins: 11, places_2: 8, places_3: 5, win_rate: 22.4, quinella_rate: 38.8, place_rate: 49.0, win_payback: 92, place_payback: 86 },
          { rank: 6,  name: 'ダイワメジャー', races: 47, wins: 10, places_2: 8, places_3: 5, win_rate: 21.3, quinella_rate: 38.3, place_rate: 48.9, win_payback: 90, place_payback: 85 },
          { rank: 7,  name: 'ゼンノロブロイ', races: 45, wins: 10, places_2: 7, places_3: 5, win_rate: 22.2, quinella_rate: 37.8, place_rate: 48.9, win_payback: 93, place_payback: 87 },
          { rank: 8,  name: 'ネオユニヴァース', races: 43, wins: 9, places_2: 7, places_3: 5, win_rate: 20.9, quinella_rate: 37.2, place_rate: 48.8, win_payback: 91, place_payback: 86 },
          { rank: 9,  name: 'スペシャルウィーク', races: 41, wins: 9, places_2: 6, places_3: 4, win_rate: 22.0, quinella_rate: 36.6, place_rate: 46.3, win_payback: 90, place_payback: 84 },
          { rank: 10, name: 'ハーツクライ', races: 40, wins: 8, places_2: 6, places_3: 4, win_rate: 20.0, quinella_rate: 35.0, place_rate: 45.0, win_payback: 88, place_payback: 83 },
          { rank: 11, name: 'ブライアンズタイム', races: 39, wins: 8, places_2: 6, places_3: 4, win_rate: 20.5, quinella_rate: 35.9, place_rate: 46.1, win_payback: 86, place_payback: 82 },
          { rank: 12, name: 'シンボリクリスエス', races: 38, wins: 7, places_2: 5, places_3: 4, win_rate: 18.4, quinella_rate: 31.6, place_rate: 42.1, win_payback: 85, place_payback: 80 },
          { rank: 13, name: 'マーベラスサンデー', races: 36, wins: 7, places_2: 5, places_3: 4, win_rate: 19.4, quinella_rate: 33.3, place_rate: 44.4, win_payback: 84, place_payback: 80 },
          { rank: 14, name: 'アグネスタキオン', races: 35, wins: 6, places_2: 5, places_3: 3, win_rate: 17.1, quinella_rate: 31.4, place_rate: 40.0, win_payback: 82, place_payback: 78 },
          { rank: 15, name: 'タニノギムレット', races: 34, wins: 6, places_2: 5, places_3: 3, win_rate: 17.6, quinella_rate: 32.3, place_rate: 41.1, win_payback: 83, place_payback: 79 },
          { rank: 16, name: 'ステイゴールド', races: 33, wins: 6, places_2: 4, places_3: 3, win_rate: 18.2, quinella_rate: 30.3, place_rate: 39.4, win_payback: 81, place_payback: 77 },
          { rank: 17, name: 'マツリダゴッホ', races: 32, wins: 5, places_2: 4, places_3: 3, win_rate: 15.6, quinella_rate: 28.1, place_rate: 37.5, win_payback: 80, place_payback: 76 },
          { rank: 18, name: 'ゴールドアリュール', races: 31, wins: 5, places_2: 4, places_3: 3, win_rate: 16.1, quinella_rate: 29.0, place_rate: 38.7, win_payback: 79, place_payback: 75 },
          { rank: 19, name: 'フジキセキ', races: 30, wins: 5, places_2: 4, places_3: 2, win_rate: 16.7, quinella_rate: 30.0, place_rate: 36.7, win_payback: 78, place_payback: 74 },
          { rank: 20, name: 'エルコンドルパサー', races: 29, wins: 4, places_2: 3, places_3: 2, win_rate: 13.8, quinella_rate: 24.1, place_rate: 31.0, win_payback: 77, place_payback: 73 },
        ],
        trainer_stats: [
          { rank: 1,  name: '矢作芳人', races: 60, wins: 15, places_2: 10, places_3: 8, win_rate: 25.0, quinella_rate: 41.7, place_rate: 55.0, win_payback: 98, place_payback: 92 },
          { rank: 2,  name: '国枝栄', races: 58, wins: 14, places_2: 9, places_3: 7, win_rate: 24.1, quinella_rate: 39.7, place_rate: 51.7, win_payback: 96, place_payback: 90 },
          { rank: 3,  name: '友道康夫', races: 56, wins: 13, places_2: 9, places_3: 6, win_rate: 23.2, quinella_rate: 39.3, place_rate: 50.0, win_payback: 95, place_payback: 89 },
          { rank: 4,  name: '堀宣行', races: 54, wins: 13, places_2: 8, places_3: 6, win_rate: 24.1, quinella_rate: 38.9, place_rate: 50.0, win_payback: 93, place_payback: 88 },
          { rank: 5,  name: '中内田充正', races: 52, wins: 12, places_2: 8, places_3: 6, win_rate: 23.1, quinella_rate: 38.5, place_rate: 50.0, win_payback: 92, place_payback: 87 },
          { rank: 6,  name: '安田隆行', races: 50, wins: 11, places_2: 8, places_3: 5, win_rate: 22.0, quinella_rate: 38.0, place_rate: 48.0, win_payback: 90, place_payback: 85 },
          { rank: 7,  name: '池江泰寿', races: 49, wins: 10, places_2: 7, places_3: 5, win_rate: 20.4, quinella_rate: 34.7, place_rate: 44.9, win_payback: 89, place_payback: 84 },
          { rank: 8,  name: '藤原英昭', races: 48, wins: 10, places_2: 7, places_3: 4, win_rate: 20.8, quinella_rate: 35.4, place_rate: 43.8, win_payback: 88, place_payback: 83 },
          { rank: 9,  name: '木村哲也', races: 47, wins: 9, places_2: 7, places_3: 4, win_rate: 19.1, quinella_rate: 34.0, place_rate: 42.6, win_payback: 87, place_payback: 82 },
          { rank: 10, name: '高野友和', races: 46, wins: 9, places_2: 7, places_3: 4, win_rate: 19.6, quinella_rate: 34.8, place_rate: 43.5, win_payback: 86, place_payback: 81 },
          { rank: 11, name: '斎藤誠', races: 45, wins: 8, places_2: 7, places_3: 4, win_rate: 17.8, quinella_rate: 33.3, place_rate: 42.2, win_payback: 85, place_payback: 80 },
          { rank: 12, name: '手塚貴久', races: 44, wins: 8, places_2: 6, places_3: 4, win_rate: 18.2, quinella_rate: 31.8, place_rate: 40.9, win_payback: 84, place_payback: 79 },
          { rank: 13, name: '田中博康', races: 43, wins: 7, places_2: 6, places_3: 4, win_rate: 16.3, quinella_rate: 30.2, place_rate: 39.5, win_payback: 83, place_payback: 78 },
          { rank: 14, name: '西村真幸', races: 42, wins: 7, places_2: 6, places_3: 3, win_rate: 16.7, quinella_rate: 31.0, place_rate: 38.1, win_payback: 82, place_payback: 77 },
          { rank: 15, name: '鹿戸雄一', races: 41, wins: 7, places_2: 5, places_3: 3, win_rate: 17.1, quinella_rate: 29.3, place_rate: 36.6, win_payback: 81, place_payback: 76 },
          { rank: 16, name: '中竹和也', races: 40, wins: 6, places_2: 5, places_3: 3, win_rate: 15.0, quinella_rate: 27.5, place_rate: 35.0, win_payback: 80, place_payback: 75 },
          { rank: 17, name: '奥村豊', races: 39, wins: 6, places_2: 5, places_3: 3, win_rate: 15.4, quinella_rate: 28.2, place_rate: 35.9, win_payback: 79, place_payback: 74 },
          { rank: 18, name: '松永幹夫', races: 38, wins: 6, places_2: 4, places_3: 3, win_rate: 15.8, quinella_rate: 26.3, place_rate: 34.2, win_payback: 78, place_payback: 73 },
          { rank: 19, name: '加藤征弘', races: 37, wins: 5, places_2: 4, places_3: 3, win_rate: 13.5, quinella_rate: 24.3, place_rate: 32.4, win_payback: 77, place_payback: 72 },
          { rank: 20, name: '松田国英', races: 36, wins: 5, places_2: 4, places_3: 2, win_rate: 13.9, quinella_rate: 25.0, place_rate: 30.6, win_payback: 76, place_payback: 71 },
        ]        
      },
    },
  },
};

const racecourseNames: Record<string, string> = {
  nakayama: '中山',
  tokyo: '東京',
  hanshin: '阪神',
  kyoto: '京都',
  kokura: '小倉',
  fukushima: '福島',
  niigata: '新潟',
  hakodate: '函館',
  sapporo: '札幌',
  chukyo: '中京',
};

const surfaceNames: Record<string, string> = {
  turf: '芝',
  dirt: 'ダート',
  steeplechase: '障害',
};

export async function generateMetadata(): Promise<Metadata> {
  const title = '有馬記念の傾向・特徴まとめ｜騎手や血統などのデータをどこよりも見やすく';
  const description = '有馬記念の傾向や特徴がまるわかり！騎手、血統、枠順、脚質、調教師など、豊富な統計データで予想をサポート。';
  const url = 'https://www.keibadata.com/races/arima-kinen';

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: '競馬データ.com',
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function ArimaKinenPage() {
  // 有馬記念の固定値（とりあえず中山ダート1800のデータを使用）
  const resolvedParams = {
    racecourse: 'nakayama',
    surface: 'dirt',
    distance: '1800'
  };

  // 競馬場名と路面名の取得
  const racecourseJa = '中山';
  const surfaceJa = 'ダート';

  // 内回り・外回りの判定
  const distanceStr = '1800';
  const distanceNum = 1800;
  const distanceDisplay = '1800';
  let trackVariant = '';
  let trackVariantLabel = '';

  // デフォルトデータ構造（GCSから取得できない場合のフォールバック）
  let data: any = {
    course_info: {
      racecourse: racecourseJa + '競馬場',
      racecourse_en: resolvedParams.racecourse,
      surface: surfaceJa,
      surface_en: resolvedParams.surface,
      distance: distanceNum,
      total_races: 0,
      characteristics: {
        volatility: 3,
        gate_position: 3,
        running_style_trend_position: 3,
        trifecta_avg_payback_rank: 0,
        trifecta_median_payback: 0,
        trifecta_all_median_payback: 0,
        total_courses: 0
      }
    },
    gate_stats: [],
    popularity_stats: {},
    jockey_stats: [],
    trainer_stats: [],
    pedigree_stats: [],
    dam_sire_stats: [],
    running_style_stats: [],
    running_style_trends: []
  };

  // ===== GCSから全データを取得 =====

  try {
    // distanceが "-inner" または "-outer" を含む場合は文字列のまま、そうでない場合は数値化
    const distanceParam = resolvedParams.distance.includes('-inner') || resolvedParams.distance.includes('-outer')
      ? resolvedParams.distance
      : parseInt(resolvedParams.distance);

    const gcsData = await getCourseDataFromGCS(
      resolvedParams.racecourse,
      resolvedParams.surface,
      distanceParam
    );

    // GCSデータで完全上書き
    data.gate_stats = gcsData.gate_stats || [];
    data.popularity_stats = gcsData.popularity_stats || {};
    data.jockey_stats = gcsData.jockey_stats || [];
    data.trainer_stats = gcsData.trainer_stats || [];
    data.pedigree_stats = gcsData.pedigree_stats || [];
    data.dam_sire_stats = gcsData.dam_sire_stats || [];
    data.running_style_stats = gcsData.running_style_stats || [];
    data.running_style_trends = gcsData.running_style_trends || [];
    if (gcsData.characteristics) {
      if (!data.course_info) {
        data.course_info = {};
      }
      data.course_info.characteristics = gcsData.characteristics;

      // characteristics から ranking フィールドを抽出して course_info.ranking をセット
      if (gcsData.characteristics.trifecta_median_payback !== undefined) {
        data.course_info.ranking = {
          trifecta_avg_payback_rank: gcsData.characteristics.trifecta_avg_payback_rank,
          trifecta_median_payback: gcsData.characteristics.trifecta_median_payback,
          trifecta_all_median_payback: gcsData.characteristics.trifecta_all_median_payback,
          total_courses: gcsData.characteristics.total_courses,
          // trifecta_avg_payback は元のモックデータから保持
          trifecta_avg_payback: data.course_info.ranking?.trifecta_avg_payback || 0,
        };
      }
    }

    // gate_position を gate_stats から計算（内枠有利〜外枠有利）
    if (data.gate_stats && Array.isArray(data.gate_stats) && data.gate_stats.length > 0) {
      const innerGates = data.gate_stats.filter(g => g.gate >= 1 && g.gate <= 4);
      const outerGates = data.gate_stats.filter(g => g.gate >= 5 && g.gate <= 8);

      if (innerGates.length > 0 && outerGates.length > 0) {
        const innerAvgPlaceRate = innerGates.reduce((sum, g) => sum + (g.place_rate || 0), 0) / innerGates.length;
        const outerAvgPlaceRate = outerGates.reduce((sum, g) => sum + (g.place_rate || 0), 0) / outerGates.length;

        const diff = innerAvgPlaceRate - outerAvgPlaceRate;
        let gatePosition = 3; // デフォルト: 互角

        if (diff >= 5) gatePosition = 1;         // 内有利
        else if (diff >= 2) gatePosition = 2;    // やや内有利
        else if (diff <= -5) gatePosition = 5;   // 外有利
        else if (diff <= -2) gatePosition = 4;   // やや外有利

        if (!data.course_info) {
          data.course_info = {};
        }
        if (!data.course_info.characteristics) {
          data.course_info.characteristics = {};
        }
        data.course_info.characteristics.gate_position = gatePosition;
      }
    }

    // running_style_trend_position を running_style_trends から計算（逃げ・先行有利〜差し・追込有利）
    if (data.running_style_trends && Array.isArray(data.running_style_trends) && data.running_style_trends.length === 2) {
      const earlyLead = data.running_style_trends.find(t => t.trend_group === 'early_lead');
      const comeback = data.running_style_trends.find(t => t.trend_group === 'comeback');

      if (earlyLead && comeback) {
        const diff = (earlyLead.place_rate || 0) - (comeback.place_rate || 0);
        let runningStyleTrendPosition = 3; // デフォルト: 互角

        if (diff >= 5) runningStyleTrendPosition = 1;         // 逃げ・先行有利
        else if (diff >= 2) runningStyleTrendPosition = 2;    // やや逃げ・先行有利
        else if (diff <= -5) runningStyleTrendPosition = 5;   // 差し・追込有利
        else if (diff <= -2) runningStyleTrendPosition = 4;   // やや差し・追込有利

        if (!data.course_info) {
          data.course_info = {};
        }
        if (!data.course_info.characteristics) {
          data.course_info.characteristics = {};
        }
        data.course_info.characteristics.running_style_trend_position = runningStyleTrendPosition;
      }
    }
    // Handle both root-level total_races and course_info.total_races
    if (gcsData.total_races) {
      if (!data.course_info) {
        data.course_info = {};
      }
      data.course_info.total_races = gcsData.total_races;
    } else if (gcsData.course_info?.total_races) {
      if (!data.course_info) {
        data.course_info = {};
      }
      data.course_info.total_races = gcsData.course_info.total_races;
    }
    console.log('✅ All data loaded from GCS successfully');

  } catch (error) {
    console.error('❌ Failed to load data from GCS:', error);
    // GCSからデータが取得できない場合はエラーページを表示
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>データ取得エラー</h1>
        <p>このコースのデータを取得できませんでした。</p>
        <p>コース: {racecourseJa}競馬場 {surfaceJa} {distanceNum}m{trackVariant}</p>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          エラー詳細: {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }
  // ===== ここまで =====

  // ビルド時の動的な日付を設定
  const today = new Date();

  // data_period: 前日〜3年前
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const threeYearsAgo = new Date(yesterday);
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1);
    const day = String(date.getDate());
    return `${year}年${month}月${day}日`;
  };

  const dataPeriod = `直近3年間分（${formatDate(threeYearsAgo)}〜${formatDate(yesterday)}）`;

  // last_updated: ビルド時の日付
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1);
  const day = String(today.getDate());
  const formattedDate = `${year}年${month}月${day}日`;

  if (!data.course_info) {
    data.course_info = {};
  }
  data.course_info.data_period = dataPeriod;
  data.course_info.last_updated = formattedDate;

  const { course_info, gate_stats, running_style_stats, running_style_trends, popularity_stats, jockey_stats, pedigree_stats, dam_sire_stats, trainer_stats } = data;

  const top5Jockeys = jockey_stats.slice(0, 5);
  const top5Pedigrees = pedigree_stats.slice(0, 5);

  // 競馬場名の末尾「競馬場」を省いた短縮名（例：中山競馬場 -> 中山）
  const courseShort =
    (racecourseNames[resolvedParams.racecourse] ??
      String(course_info.racecourse || '').replace(/競馬場$/, ''));

  // 「中山芝1800m」のようなSEO用接頭辞
  const seoPrefix = `${courseShort}${course_info.surface}${distanceDisplay}m${trackVariantLabel}`;

  // ナビゲーション用のセクションアイテム
  const navigationItems = [
    { id: 'characteristics-section', label: 'コース特性' },
    { id: 'highlights-section', label: '注目ポイント' },
    { id: 'popularity-section', label: '人気別' },
    { id: 'gate-section', label: '枠順別' },
    { id: 'running-style-section', label: '脚質別' },
    { id: 'jockey-section', label: '騎手別' },
    { id: 'bloodline-section', label: '血統別(種牡馬)' },
    { id: 'dam-sire-section', label: '血統別(母父)' },
    { id: 'trainer-section', label: '調教師別' },
  ];

  // 構造化データ - BreadcrumbList
  const baseUrl = 'https://www.keibadata.com';
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'ホーム',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'コース一覧',
        item: `${baseUrl}/courses`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${racecourseJa}競馬場 ${surfaceJa}${distanceDisplay}m${trackVariantLabel}`,
        item: `${baseUrl}/courses/${resolvedParams.racecourse}/${resolvedParams.surface}/${resolvedParams.distance}`,
      },
    ],
  };

  return (
    <>
      {/* 構造化データの埋め込み */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HeaderMenu />
      <BottomNav items={navigationItems} />
      <main>
        <article>
        {/* レース数が少ない場合の警告 */}
        {course_info.total_races <= 10 && (
          <div style={{
            padding: '1rem 1.5rem',
            background: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '8px',
            color: '#856404',
            fontSize: '0.95rem',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.5rem' }}></i>
            対象レース数が少ないコースです
          </div>
        )}

        <div className="page-header">
          <h1>{course_info.racecourse} {course_info.surface}{distanceDisplay}m{trackVariantLabel}</h1>

          {/* === データ情報セクション === */}
          <div className="course-meta-section">
            <div className="meta-item">
              <span className="meta-label">データ取得期間</span>
              <span>
                直近3年間分
                <span className="meta-sub-text">
                  {course_info.data_period.match(/（[^）]+）/)?.[0] || course_info.data_period}
                </span>
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">対象レース数</span>
              <span>{course_info.total_races}レース</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">最終更新日</span>
              <span>{course_info.last_updated}</span>
            </div>
          </div>
        </div>

        {/* === コース特性セクション === */}
        <section id="characteristics-section" aria-label="コース特性">
        <BarChartAnimation>
        <div className="characteristics-box">
          <h2 className="section-title">コース特性</h2>

          {/* 荒れやすさ */}
          <div className="gauge-item">
            <div className="gauge-header">
              <h3 className="gauge-label">荒れやすさ</h3>
              <VolatilityExplanation />
            </div>
            <div className="gauge-track">
              <div className="gauge-indicator" style={{ left: `${(course_info.characteristics.volatility - 1) * 25}%` }}></div>
              <div className="gauge-horse-icon" style={{ left: `${(course_info.characteristics.volatility - 1) * 25}%` }}>🏇</div>
            </div>
            <div className="gauge-labels">
              <span>堅い</span>
              <span>標準</span>
              <span>荒れやすい</span>
            </div>
            <div className="gauge-result">
              {course_info.characteristics.volatility === 1 && '堅い'}
              {course_info.characteristics.volatility === 2 && 'やや堅い'}
              {course_info.characteristics.volatility === 3 && '標準'}
              {course_info.characteristics.volatility === 4 && 'やや荒れやすい'}
              {course_info.characteristics.volatility === 5 && '荒れやすい'}
            </div>
            <div className="gauge-ranking">
              <div className="ranking-item">
                <span className="ranking-label">三連単平均配当ランキング</span>
                <span className="ranking-value">
                  {course_info.characteristics.trifecta_avg_payback_rank > 0 && course_info.characteristics.total_courses > 0
                    ? `${course_info.characteristics.trifecta_avg_payback_rank}位/${course_info.characteristics.total_courses}コース`
                    : 'データなし'}
                </span>
              </div>
              <div className="ranking-detail">
                <div className="ranking-detail-title">三連単配当</div>
                <div className="detail-row">
                  <span className="detail-label">このコースの中央値</span>
                  <span className="detail-value">
                    {course_info.characteristics.trifecta_median_payback > 0
                      ? `¥${course_info.characteristics.trifecta_median_payback.toLocaleString()}`
                      : 'データなし'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">全コースの中央値</span>
                  <span className="detail-value">
                    {course_info.characteristics.trifecta_all_median_payback > 0
                      ? `¥${course_info.characteristics.trifecta_all_median_payback.toLocaleString()}`
                      : 'データなし'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* 区切り線 */}
          <div className="section-divider"></div>

          {/* 枠順傾向 */}
          <div className="gauge-item">
            <div className="gauge-header">
              <h3 className="gauge-label">枠順傾向</h3>
              <GatePositionExplanation />
            </div>
            <div className="gauge-track">
              <div className="gauge-indicator" style={{ left: `${(course_info.characteristics.gate_position - 1) * 25}%` }}></div>
              <div className="gauge-horse-icon" style={{ left: `${(course_info.characteristics.gate_position - 1) * 25}%` }}>🏇</div>
            </div>
            <div className="gauge-labels">
              <span>内有利</span>
              <span>互角</span>
              <span>外有利</span>
            </div>
            <div className="gauge-result">
              {course_info.characteristics.gate_position === 1 && '内有利'}
              {course_info.characteristics.gate_position === 2 && 'やや内有利'}
              {course_info.characteristics.gate_position === 3 && '互角'}
              {course_info.characteristics.gate_position === 4 && 'やや外有利'}
              {course_info.characteristics.gate_position === 5 && '外有利'}
            </div>

            {/* 枠順別複勝率グラフ */}
            <div className="gate-place-rate-detail">
              <div className="gate-detail-title">枠順別複勝率</div>
              <div className="gate-chart">
                {gate_stats.map((gate) => (
                  <div key={gate.gate} className="gate-chart-item">
                    <div
                      className="gate-number-badge"
                      style={{
                        backgroundColor: gate.color,
                        color: gate.gate === 1 ? '#000' : '#fff'
                      }}
                    >
                      {gate.gate}
                    </div>
                    <div className="gate-bar-container">
                      <div
                        className="gate-bar"
                        style={{
                          width: `${gate.place_rate}%`
                        }}
                      ></div>
                    </div>
                    <div className="gate-rate">{gate.place_rate}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 区切り線 */}
          <div className="section-divider"></div>

          {/* 脚質傾向（2分化） */}
          {running_style_trends && running_style_trends.length > 0 && course_info.characteristics.running_style_trend_position && (
            <div className="gauge-item">
              <div className="gauge-header">
                <h3 className="gauge-label">脚質傾向</h3>
                <RunningStyleExplanation />
              </div>
              <div className="gauge-track">
                <div className="gauge-indicator" style={{ left: `${(course_info.characteristics.running_style_trend_position - 1) * 25}%` }}></div>
                <div className="gauge-horse-icon" style={{ left: `${(course_info.characteristics.running_style_trend_position - 1) * 25}%` }}>🏇</div>
              </div>
              <div className="gauge-labels">
                <span>逃げ・先行有利</span>
                <span>互角</span>
                <span>差し・追込有利</span>
              </div>
              <div className="gauge-result">
                {course_info.characteristics.running_style_trend_position === 1 && '逃げ・先行有利'}
                {course_info.characteristics.running_style_trend_position === 2 && 'やや逃げ・先行有利'}
                {course_info.characteristics.running_style_trend_position === 3 && '互角'}
                {course_info.characteristics.running_style_trend_position === 4 && 'やや差し・追込有利'}
                {course_info.characteristics.running_style_trend_position === 5 && '差し・追込有利'}
              </div>

              {/* 脚質別複勝率グラフ */}
              <div className="running-style-place-rate-detail">
                <div className="running-style-detail-title">脚質別複勝率</div>
                <div className="running-style-chart">
                  {running_style_stats.map((style) => {
                    // アイコンマッピング
                    const styleIcons: { [key: string]: string } = {
                      'escape': '逃',
                      'lead': '先',
                      'pursue': '差',
                      'close': '追'
                    };

                    return (
                      <div key={style.style} className="running-style-chart-item">
                        <div className="running-style-badge">
                          {styleIcons[style.style] || style.style_label}
                        </div>
                        <div className="running-style-bar-container">
                          <div
                            className="running-style-bar"
                            style={{
                              width: `${style.place_rate ?? 0}%`
                            }}
                          ></div>
                        </div>
                        <div className="running-style-rate">{(style.place_rate ?? 0).toFixed(1)}%</div>
                      </div>
                    );
                  })}
                </div>
                <RunningStyleDefinition />
              </div>
            </div>
          )}
        </div>
        </BarChartAnimation>
        </section>

        {/* === 注目ポイント === */}
        <section id="highlights-section" aria-label="注目ポイント">
          <HighlightsSection
            jockey_stats={jockey_stats}
            pedigree_stats={pedigree_stats}
            dam_sire_stats={dam_sire_stats}
            trainer_stats={trainer_stats}
          />
        </section>
        {/* === 人気別 === */}
<section id="popularity-section" aria-label="人気別データ">
  <PopularityTable
    title={`${seoPrefix} 人気別データ`}
    data={popularity_stats}
  />
</section>

{/* === 枠順別 === */}
<section id="gate-section" aria-label="枠順別データ">
  <GateTable
    title={`${seoPrefix} 枠順別データ`}
    data={gate_stats}
  />
</section>

{/* === 脚質別 === */}
<section id="running-style-section" aria-label="脚質別データ">
  <RunningStyleTable
    title={`${seoPrefix} 脚質別データ`}
    data={running_style_stats}
  />
</section>

{/* === 騎手別 === */}
<section id="jockey-section" aria-label="騎手別データ">
  <DataTable
    title={`${seoPrefix} 騎手別データ`}
    data={jockey_stats}
    initialShow={10}
    nameLabel="騎手"
    note="最大50件まで表示/引退騎手を除く"
  />
</section>

{/* === 血統別（種牡馬） === */}
<section id="bloodline-section" aria-label="血統別（種牡馬）データ">
  <DataTable
    title={`${seoPrefix} 血統別(種牡馬)データ`}
    data={pedigree_stats}
    initialShow={10}
    nameLabel="種牡馬"
    note="最大50件まで表示"
  />
</section>

{/* === 血統別（母父） === */}
<section id="dam-sire-section" aria-label="血統別（母父）データ">
  <DataTable
    title={`${seoPrefix} 血統別(母父)データ`}
    data={dam_sire_stats}
    initialShow={10}
    nameLabel="母父"
    note="最大50件まで表示"
  />
</section>

{/* === 調教師別 === */}
<section id="trainer-section" aria-label="調教師別データ">
  <DataTable
    title={`${seoPrefix} 調教師別データ`}
    data={trainer_stats}
    initialShow={10}
    nameLabel="調教師"
    note="最大50件まで表示/引退調教師を除く"
  />
</section>

{/* === 他のコースデータ一覧 === */}
<section id="other-courses-section" className="section" aria-label="他のコースデータ一覧" style={{ marginBottom: '0 !important' }}>
  <h2 className="section-title" style={{ marginBottom: '1rem' }}>{courseShort}競馬場のコースデータ一覧</h2>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    {/* 芝コース */}
    {ALL_COURSES.filter(course => course.racecourse === resolvedParams.racecourse && course.surface === 'turf').length > 0 && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {ALL_COURSES
          .filter(course => course.racecourse === resolvedParams.racecourse && course.surface === 'turf')
          .sort((a, b) => {
            if (a.distance !== b.distance) return a.distance - b.distance;
            const variantOrder = { undefined: 0, inner: 1, outer: 2 };
            return (variantOrder[a.variant as keyof typeof variantOrder] || 0) - (variantOrder[b.variant as keyof typeof variantOrder] || 0);
          })
          .map(course => (
            <Link key={`${course.surface}-${course.distance}-${course.variant || 'default'}`} href={getCourseUrl(course)} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#e2f7eb',
                border: '1px solid #bbe7d3',
                color: '#0c532a',
                padding: '6px 12px',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box'
              }}>
                {getCourseDisplayName(course)}
              </div>
            </Link>
          ))}
      </div>
    )}

    {/* ダートコース */}
    {ALL_COURSES.filter(course => course.racecourse === resolvedParams.racecourse && course.surface === 'dirt').length > 0 && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {ALL_COURSES
          .filter(course => course.racecourse === resolvedParams.racecourse && course.surface === 'dirt')
          .sort((a, b) => {
            if (a.distance !== b.distance) return a.distance - b.distance;
            const variantOrder = { undefined: 0, inner: 1, outer: 2 };
            return (variantOrder[a.variant as keyof typeof variantOrder] || 0) - (variantOrder[b.variant as keyof typeof variantOrder] || 0);
          })
          .map(course => (
            <Link key={`${course.surface}-${course.distance}-${course.variant || 'default'}`} href={getCourseUrl(course)} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#fde9d7',
                border: '1px solid #ffd7ae',
                color: '#633d1e',
                padding: '6px 12px',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box'
              }}>
                {getCourseDisplayName(course)}
              </div>
            </Link>
          ))}
      </div>
    )}

    {/* 障害コース */}
    {ALL_COURSES.filter(course => course.racecourse === resolvedParams.racecourse && course.surface === 'steeplechase').length > 0 && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {ALL_COURSES
          .filter(course => course.racecourse === resolvedParams.racecourse && course.surface === 'steeplechase')
          .sort((a, b) => {
            if (a.distance !== b.distance) return a.distance - b.distance;
            const variantOrder = { undefined: 0, inner: 1, outer: 2 };
            return (variantOrder[a.variant as keyof typeof variantOrder] || 0) - (variantOrder[b.variant as keyof typeof variantOrder] || 0);
          })
          .map(course => (
            <Link key={`${course.surface}-${course.distance}-${course.variant || 'default'}`} href={getCourseUrl(course)} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#f2f2f2',
                border: '1px solid #c0c0c0',
                color: '#4a4a4a',
                padding: '6px 12px',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box'
              }}>
                {getCourseDisplayName(course)}
              </div>
            </Link>
          ))}
      </div>
    )}
  </div>
</section>

        </article>
      </main>

      {/* === パンくず（フルワイド） === */}
      <nav aria-label="パンくずリスト" className="breadcrumb-footer">
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <li><Link href="/">ホーム</Link></li>
          <li aria-hidden="true">&gt;</li>
          <li><Link href="/courses">コース一覧</Link></li>
          <li aria-hidden="true">&gt;</li>
          <li aria-current="page">{course_info.racecourse} {course_info.surface}{course_info.distance}m</li>
        </ol>
      </nav>
    </>
  );
}