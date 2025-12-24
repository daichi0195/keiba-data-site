import Link from 'next/link';
import HeaderMenu from '@/components/HeaderMenu';
import BottomNav from '@/components/BottomNav';
import GenderTable from '@/components/GenderTable';
import IntervalTable from '@/components/IntervalTable';

export default function TrainerTestPage() {
  // テスト用のモックデータ
  const trainer = {
    id: '1',
    name: 'テスト調教師',
    kana: 'てすとちょうきょうし',
    stable: '美浦',
    debut_year: 2000,
    total_stats: {
      races: 2489,
      wins: 453,
      places_2: 382,
      places_3: 312,
      win_rate: 18.2,
      place_rate: 46.1,
      quinella_rate: 33.5,
    },
    data_period: '2022-01-01〜2024-12-31',
    last_updated: '2024-12-23',
    total_races: 2489,
    yearly_leading: [],
    yearly_stats: [],
    distance_stats: [],
    surface_stats: [],
    popularity_stats: [],
    running_style_stats: [],
    gate_stats: [],
    course_stats: [],
    jockey_stats: [],
    class_stats: [],
    track_condition_stats: [],
    owner_stats: [],
    racecourse_stats: [],
    gender_stats: [
      { name: '牡馬', races: 1456, wins: 268, places_2: 225, places_3: 185, win_rate: 18.4, place_rate: 46.6, quinella_rate: 33.9, win_payback: 102, place_payback: 97 },
      { name: '牝馬', races: 856, wins: 145, places_2: 120, places_3: 98, win_rate: 16.9, place_rate: 42.4, quinella_rate: 31.0, win_payback: 98, place_payback: 93 },
      { name: 'セン馬', races: 177, wins: 40, places_2: 37, places_3: 29, win_rate: 22.6, place_rate: 59.9, quinella_rate: 43.5, win_payback: 108, place_payback: 103 },
    ],
    interval_stats: [
      { interval: '連闘', races: 245, wins: 52, places_2: 41, places_3: 35, win_rate: 21.2, place_rate: 52.2, quinella_rate: 38.0, win_payback: 105, place_payback: 101 },
      { interval: '1-3週', races: 1523, wins: 285, places_2: 238, places_3: 195, win_rate: 18.7, place_rate: 47.1, quinella_rate: 34.3, win_payback: 103, place_payback: 98 },
      { interval: '4-7週', races: 456, wins: 75, places_2: 62, places_3: 51, win_rate: 16.4, place_rate: 41.2, quinella_rate: 30.0, win_payback: 97, place_payback: 92 },
      { interval: '8-10週', races: 198, wins: 28, places_2: 25, places_3: 21, win_rate: 14.1, place_rate: 37.4, quinella_rate: 26.8, win_payback: 92, place_payback: 88 },
      { interval: '11週-', races: 267, wins: 33, places_2: 30, places_3: 25, win_rate: 12.4, place_rate: 33.0, quinella_rate: 23.6, win_payback: 89, place_payback: 85 },
    ],
    characteristics: {
      volatility: 3,
      trifecta_avg_payback_rank: 50,
      total_courses: 100,
      trifecta_median_payback: 65.8,
      trifecta_all_median_payback: 58.3,
      gate_position: 0,
      distance_trend: 0,
    },
  };

  const sections = [
    { id: 'gender-stats', label: '性別' },
    { id: 'interval-stats', label: 'レース間隔' },
  ];

  return (
    <>
      <HeaderMenu items={[]} />
      <BottomNav items={sections} />

      <main style={{ paddingTop: '20px' }}>
        <div style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
          <h1>{trainer.name}調教師 - テストページ</h1>

          {/* 性別データセクション */}
          <section id="gender-stats" aria-label="性別データ">
            <GenderTable
              title={`${trainer.name}調教師 性別データ`}
              data={trainer.gender_stats}
            />
          </section>

          {/* レース間隔別データセクション */}
          <section id="interval-stats" aria-label="レース間隔別データ">
            <IntervalTable
              title={`${trainer.name}調教師 レース間隔別データ`}
              data={trainer.interval_stats}
            />
          </section>

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <Link href="/trainers/399" style={{ color: '#52af77', textDecoration: 'underline' }}>
              実際の調教師ページに戻る
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
