import { Metadata } from 'next';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import GateTable from '@/components/GateTable';
import SectionNav from '@/components/SectionNav';
import RunningStyleTable from '@/components/RunningStyleTable';
import PopularityTable from '@/components/PopularityTable';
import HighlightsSection from '@/components/HighlightsSection';

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
          ranking: {
            trifecta_avg_payback_rank: 8,
            trifecta_avg_payback: 4520,
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
              weak: [
                { name: '横山典弘', record: '22-18-15', win_rate: '12.3%', place_rate: '35.5%', win_payback: '85%', place_payback: '92%' },
                { name: '藤岡佑介', record: '28-22-18', win_rate: '14.1%', place_rate: '38.2%', win_payback: '88%', place_payback: '95%' }
              ]
            },
            pedigree: {
              strong: [
                { name: 'キングカメハメハ', record: '89-68-51', win_rate: '34.4%', place_rate: '62.3%', win_payback: '118%', place_payback: '110%' },
                { name: 'ディープインパクト', record: '76-61-47', win_rate: '29.8%', place_rate: '58.9%', win_payback: '114%', place_payback: '107%' }
              ],
              weak: [
                { name: 'サンデーサイレンス', record: '31-24-19', win_rate: '15.2%', place_rate: '40.1%', win_payback: '86%', place_payback: '93%' },
                { name: 'ハーツクライ', record: '35-28-22', win_rate: '16.7%', place_rate: '42.5%', win_payback: '89%', place_payback: '94%' }
              ]
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

type Props = {
  params: Promise<{
    racecourse: string;
    surface: string;
    distance: string;
  }>;
};

const racecourseNames: Record<string, string> = {
  nakayama: '中山',
  tokyo: '東京',
  hanshin: '阪神',
  kyoto: '京都',
};

const surfaceNames: Record<string, string> = {
  turf: '芝',
  dirt: 'ダート',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const racecourse = racecourseNames[resolvedParams.racecourse] || resolvedParams.racecourse;
  const surface = surfaceNames[resolvedParams.surface] || resolvedParams.surface;
  
  return {
    title: `${racecourse}競馬場 ${surface}${resolvedParams.distance}m | コースデータ`,
    description: `${racecourse}の${surface}${resolvedParams.distance}mのコースデータ。騎手別・血統別の詳細な成績を分析。`,
  };
}

export default async function CoursePage({ params }: Props) {
  const resolvedParams = await params;
  const data = (mockData as any)[resolvedParams.racecourse]?.[resolvedParams.surface]?.[resolvedParams.distance];
  
  if (!data) {
    return <div>データが見つかりません</div>;
  }

  const { course_info, gate_stats, running_style_stats, popularity_stats, jockey_stats, pedigree_stats, dam_sire_stats, trainer_stats } = data;
  
  const top5Jockeys = jockey_stats.slice(0, 5);
  const top5Pedigrees = pedigree_stats.slice(0, 5);

  // 競馬場名の末尾「競馬場」を省いた短縮名（例：中山競馬場 -> 中山）
const courseShort =
(racecourseNames[resolvedParams.racecourse] ??
  String(course_info.racecourse || '').replace(/競馬場$/, ''));

// 「中山芝1800m」のようなSEO用接頭辞
const seoPrefix = `${courseShort}${course_info.surface}${course_info.distance}m`;

  // セクションナビゲーション用のアイテム
  const navItems = [
    { id: 'characteristics-section', label: 'コース特性' },
    { id: 'highlights-section', label: '注目ポイント' },
    { id: 'popularity-section', label: '人気別' },      // ある場合
    { id: 'gate-section',        label: '枠順別' },
    { id: 'running-style-section', label: '脚質別' },
    { id: 'jockey-section',      label: '騎手別' },
    { id: 'bloodline-section',   label: '血統別(種牡馬)' },
    { id: 'dam-sire-section',    label: '血統別(母父)' },   // ★ 追加
    { id: 'trainer-section',     label: '調教師別' },         // ★ 追加
  ];  

  return (
    <>
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

        <SectionNav items={navItems} />

        {/* === コース特性セクション === */}
        <section id="characteristics-section">
        <div className="characteristics-box">
          <h2 className="section-title">コース特性</h2>

          {/* 荒れやすさ */}
          <div className="gauge-item">
            <h3 className="gauge-label">荒れやすさ</h3>
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
                <span className="ranking-value">{course_info.ranking.trifecta_avg_payback_rank}位/{course_info.ranking.total_courses}コース</span>
              </div>
              <div className="ranking-detail">
                <div className="ranking-detail-title">三連単配当</div>
                <div className="detail-row">
                  <span className="detail-label">このコースの中央値</span>
                  <span className="detail-value">¥{course_info.ranking.trifecta_median_payback.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">全コースの中央値</span>
                  <span className="detail-value">¥{course_info.ranking.trifecta_all_median_payback.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 評価方法の説明 */}
            <details className="evaluation-method">
              <summary className="evaluation-summary">荒れやすさの評価方法について</summary>
              <div className="evaluation-content">
                <p>このコースの「荒れやすさ」は、中央競馬の全てのコースにおける三連単の中央値（配当額）を基準に評価しています。</p>
                <p>三連単の中央値が高いほど、購入者の予想が外れやすく、本来の人気度よりも配当が高くなる傾向があります。これは、馬場状態や競走条件などの要因により、レース展開が予測しづらい（荒れやすい）ことを示しています。</p>
                <p>各コースの中央値を全コースで相対比較し、5段階で評価しています。</p>
              </div>
            </details>
          </div>

          {/* 区切り線 */}
          <div className="section-divider"></div>

          {/* 枠順傾向 */}
          <div className="gauge-item">
            <h3 className="gauge-label">枠順傾向</h3>
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

          {/* 脚質傾向 */}
          <div className="gauge-item">
            <h3 className="gauge-label">脚質傾向</h3>
            <div className="gauge-track">
              <div className="gauge-indicator" style={{ left: `${(course_info.characteristics.running_style - 1) * 25}%` }}></div>
              <div className="gauge-horse-icon" style={{ left: `${(course_info.characteristics.running_style - 1) * 25}%` }}>🏇</div>
            </div>
            <div className="gauge-labels">
              <span>逃げ有利</span>
              <span>互角</span>
              <span>差し有利</span>
            </div>
            <div className="gauge-result">
              {course_info.characteristics.running_style === 1 && '逃げ有利'}
              {course_info.characteristics.running_style === 2 && 'やや逃げ有利'}
              {course_info.characteristics.running_style === 3 && '互角'}
              {course_info.characteristics.running_style === 4 && 'やや差し有利'}
              {course_info.characteristics.running_style === 5 && '差し有利'}
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
                            width: `${style.place_rate}%`
                          }}
                        ></div>
                      </div>
                      <div className="running-style-rate">{style.place_rate.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        </section>

        {/* === 注目ポイント === */}
        <HighlightsSection courseInfo={course_info} />
        {/* === 人気別 === */}
<section id="popularity-section">
  <PopularityTable
    title={`${seoPrefix} 人気別データ`}
    data={popularity_stats}
  />
</section>

{/* === 枠順別 === */}
<section id="gate-section">
  <GateTable
    title={`${seoPrefix} 枠順別データ`}
    data={gate_stats}
  />
</section>

{/* === 脚質別 === */}
<section id="running-style-section">
  <RunningStyleTable
    title={`${seoPrefix} 脚質別データ`}
    data={running_style_stats}
  />
</section>

{/* === 騎手別 === */}
<section id="jockey-section">
  <DataTable
    title={`${seoPrefix} 騎手別データ`}
    data={jockey_stats}
    initialShow={10}
  />
</section>

{/* === 血統別（種牡馬） === */}
<section id="bloodline-section">
  <DataTable
    title={`${seoPrefix} 血統別(種牡馬)データ`}
    data={pedigree_stats}
    initialShow={10}
  />
</section>

{/* === 血統別（母父） === */}
<section id="dam-sire-section">
  <DataTable
    title={`${seoPrefix} 血統別(母父)データ`}
    data={dam_sire_stats}
    initialShow={10}
  />
</section>

{/* === 調教師別 === */}
<section id="trainer-section">
  <DataTable
    title={`${seoPrefix} 調教師別データ`}
    data={trainer_stats}
    initialShow={10}
  />
</section>

{/* === 他のコースデータ一覧 === */}
<section id="other-courses-section" className="section" style={{ marginBottom: '0 !important' }}>
  <h2 className="section-title" style={{ marginBottom: '1rem' }}>{courseShort}競馬場のコースデータ一覧</h2>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
    {/* 芝コース例 */}
    <Link href={`/courses/${resolvedParams.racecourse}/turf/1200`} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#f0fdf4', border: '1px solid #d1f0e5', color: '#0d5c2f', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s ease', cursor: 'pointer' }}>
        芝 1200m
      </div>
    </Link>
    <Link href={`/courses/${resolvedParams.racecourse}/turf/1600`} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#f0fdf4', border: '1px solid #d1f0e5', color: '#0d5c2f', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s ease', cursor: 'pointer' }}>
        芝 1600m
      </div>
    </Link>
    <Link href={`/courses/${resolvedParams.racecourse}/turf/1800`} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#f0fdf4', border: '1px solid #d1f0e5', color: '#0d5c2f', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s ease', cursor: 'pointer' }}>
        芝 1800m
      </div>
    </Link>
    <Link href={`/courses/${resolvedParams.racecourse}/turf/2000`} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#f0fdf4', border: '1px solid #d1f0e5', color: '#0d5c2f', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s ease', cursor: 'pointer' }}>
        芝 2000m
      </div>
    </Link>

    {/* ダートコース例 */}
    <Link href={`/courses/${resolvedParams.racecourse}/dirt/1000`} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#fef3e8', border: '1px solid #ffe5cc', color: '#6b4423', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s ease', cursor: 'pointer' }}>
        ダート 1000m
      </div>
    </Link>
    <Link href={`/courses/${resolvedParams.racecourse}/dirt/1200`} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#fef3e8', border: '1px solid #ffe5cc', color: '#6b4423', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s ease', cursor: 'pointer' }}>
        ダート 1200m
      </div>
    </Link>
    <Link href={`/courses/${resolvedParams.racecourse}/dirt/1400`} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#fef3e8', border: '1px solid #ffe5cc', color: '#6b4423', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s ease', cursor: 'pointer' }}>
        ダート 1400m
      </div>
    </Link>
    <Link href={`/courses/${resolvedParams.racecourse}/dirt/1800`} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#fef3e8', border: '1px solid #ffe5cc', color: '#6b4423', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s ease', cursor: 'pointer' }}>
        ダート 1800m
      </div>
    </Link>
  </div>
</section>

      </main>

      {/* === パンくず（フルワイド） === */}
      <div className="breadcrumb-footer">
        <Link href="/">ホーム</Link> &gt; <Link href="/courses">コース</Link> &gt; <Link href={`/courses/${resolvedParams.racecourse}`}>{course_info.racecourse}</Link> &gt; {course_info.surface} &gt; {course_info.distance}m
      </div>
    </>
  );
}