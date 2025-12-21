'use client';

import { useMemo } from 'react';
import DataTable from '@/components/DataTable';

interface StatItem {
  rank?: number;
  name: string;
  racecourse?: string;
  racecourse_en?: string;
  surface?: string;
  surface_en?: string;
  distance?: number;
  variant?: string;
  races: number;
  wins?: number;
  places_2?: number;
  places_3?: number;
  win_rate: number;
  place_rate: number;
  quinella_rate?: number;
  win_payback: number;
  place_payback: number;
  link?: string;
}

interface JockeyTrainerHighlightsProps {
  course_stats?: StatItem[];
}

export default function JockeyTrainerHighlights({
  course_stats
}: JockeyTrainerHighlightsProps) {

  // TOP5とBOTTOM5を取得する関数（DataTable用に整形）
  const getTopAndBottomCourses = (items: StatItem[] | undefined) => {
    if (!items || items.length === 0) {
      return { top: [], bottom: [] };
    }

    // 出走回数10回以上のアイテムのみ対象
    const filteredItems = items.filter(item => item.races >= 10);

    if (filteredItems.length === 0) {
      return { top: [], bottom: [] };
    }

    // 複勝率で降順ソート
    const sortedByPlaceRate = [...filteredItems].sort((a, b) => b.place_rate - a.place_rate);

    // 得意なコース: 複勝率TOP5（rankを付与、コース名を整形）
    const top = sortedByPlaceRate.slice(0, 5).map((item, index) => ({
      ...item,
      name: item.name
        .replace(/競馬場/g, '')
        .replace(/\s+/g, '')
        .replace(/ダート/g, 'ダ')
        .replace(/（外回り）/g, '外')
        .replace(/（内回り）/g, '内'),
      rank: index + 1,
      wins: item.wins ?? 0,
      places_2: item.places_2 ?? 0,
      places_3: item.places_3 ?? 0,
      quinella_rate: item.quinella_rate ?? 0,
      link: item.link, // コース別ページへのリンクを明示的に保持
    }));

    // 苦手なコース: 複勝率BOTTOM5（rankを付与、コース名を整形）
    const bottom = sortedByPlaceRate.slice(-5).reverse().map((item, index) => ({
      ...item,
      name: item.name
        .replace(/競馬場/g, '')
        .replace(/\s+/g, '')
        .replace(/ダート/g, 'ダ')
        .replace(/（外回り）/g, '外')
        .replace(/（内回り）/g, '内'),
      rank: index + 1,
      wins: item.wins ?? 0,
      places_2: item.places_2 ?? 0,
      places_3: item.places_3 ?? 0,
      quinella_rate: item.quinella_rate ?? 0,
      link: item.link, // コース別ページへのリンクを明示的に保持
    }));

    return { top, bottom };
  };

  // コース評価結果をmemo化
  const courseEvaluation = useMemo(() => getTopAndBottomCourses(course_stats), [course_stats]);

  if (courseEvaluation.top.length === 0 && courseEvaluation.bottom.length === 0) {
    return null;
  }

  return (
    <section id="highlights-section" aria-label="注目ポイント">
      <div className="highlights-box">
        <h2 className="section-title">注目ポイント</h2>

        <div className="highlights-content">
          {courseEvaluation.top.length > 0 && (
            <div className="highlight-table">
              <h3 className="table-title">得意なコース TOP5</h3>
              <DataTable
                title=""
                data={courseEvaluation.top}
                initialShow={5}
                nameLabel="コース"
                showRank={false}
                disableHighlight={true}
              />
            </div>
          )}

          {courseEvaluation.bottom.length > 0 && (
            <div className="highlight-table">
              <h3 className="table-title">苦手なコース TOP5</h3>
              <DataTable
                title=""
                data={courseEvaluation.bottom}
                initialShow={5}
                nameLabel="コース"
                showRank={false}
                disableHighlight={true}
              />
            </div>
          )}
        </div>

        <p className="note-text">※出走回数10回以上のコースを対象に、複勝率で評価しています</p>
      </div>
    </section>
  );
}
