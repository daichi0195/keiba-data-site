'use client';

import { useState, useRef, useEffect } from 'react';

type DataRow = {
  rank: number;
  name: string;
  races: number;
  wins: number;
  places_2: number;
  places_3: number;
  win_rate: number;
  place_rate: number;
  quinella_rate: number;
  win_payback: number;
  place_payback: number;
};

type Props = {
  title: string;
  data: DataRow[];
  initialShow?: number;
};

export default function DataTable({ title, data, initialShow = 10 }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const prevShowAllRef = useRef(false);
  
  const displayData = showAll ? data : data.slice(0, initialShow);
  
  // 名前を制限する関数
  const truncateName = (name: string, isNarrow: boolean) => {
    if (isNarrow) {
      // スクロール時は3文字に制限
      return name.substring(0, 3);
    }
    // 非スクロール時は10文字以上なら9文字+「...」
    if (name.length >= 10) {
      return name.substring(0, 9) + '...';
    }
    return name;
  };
  
  // スクロール検知
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      const scrollLeft = target.scrollLeft;
      setIsScrolled(scrollLeft > 5);
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // テーブル折畳時（閉じる時）のみボタンを視界に入れる
  useEffect(() => {
    // 閉じる時のみスクロール（showAll が true から false へ）
    if (prevShowAllRef.current === true && showAll === false) {
      if (buttonRef.current) {
        buttonRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    prevShowAllRef.current = showAll;
  }, [showAll]);
  
  // 各カラムの最大値を取得（全カラム対応）
  const maxRaces = Math.max(...data.map(d => d.races));
  const maxWins = Math.max(...data.map(d => d.wins));
  const maxPlaces2 = Math.max(...data.map(d => d.places_2));
  const maxPlaces3 = Math.max(...data.map(d => d.places_3));
  const maxWinRate = Math.max(...data.map(d => d.win_rate));
  const maxPlaceRate = Math.max(...data.map(d => d.place_rate));
  const maxQuinellaRate = Math.max(...data.map(d => d.quinella_rate));
  const maxWinPayback = Math.max(...data.map(d => d.win_payback));
  const maxPlacePayback = Math.max(...data.map(d => d.place_payback));
  
  // セルがハイライト対象かチェック
  const isHighlight = (value: number, maxValue: number) => value === maxValue;

  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>
      
      {/* テーブルコンテナ */}
      <div className="mobile-table-container">
        {/* 横スクロール可能エリア */}
        <div className="mobile-table-scroll" ref={scrollRef}>
          <table className="mobile-data-table">
            <thead>
              <tr>
                {/* 固定列: 順位（ヘッダーテキストなし） */}
                <th className="mobile-sticky-col mobile-col-rank"></th>
                {/* 固定列: 名前 */}
                <th className={`mobile-sticky-col mobile-col-name mobile-col-name-header ${isScrolled ? 'mobile-col-name-narrow' : ''}`}>
                  名前
                </th>
                
                {/* スクロール列 */}
                <th className="mobile-scroll-col">出走数</th>
                <th className="mobile-scroll-col">1着</th>
                <th className="mobile-scroll-col">2着</th>
                <th className="mobile-scroll-col">3着</th>
                <th className="mobile-scroll-col mobile-col-rate">勝率</th>
                <th className="mobile-scroll-col mobile-col-rate">連対率</th>
                <th className="mobile-scroll-col mobile-col-rate">複勝率</th>
                <th className="mobile-scroll-col mobile-col-payback">単勝回収率</th>
                <th className="mobile-scroll-col mobile-col-payback">複勝回収率</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, index) => (
                <tr key={row.rank} className={index % 2 === 0 ? 'mobile-row-even' : 'mobile-row-odd'}>
                  {/* 固定列: 順位 */}
                  <td className="mobile-sticky-col mobile-col-rank mobile-sticky-body">
                    {row.rank <= 3 ? (
                      <span className={`mobile-rank-badge mobile-rank-${row.rank}`}>
                        {row.rank}
                      </span>
                    ) : (
                      <span className="mobile-rank-normal">{row.rank}</span>
                    )}
                  </td>
                  
                  {/* 固定列: 名前 */}
                  <td className={`mobile-sticky-col mobile-col-name mobile-sticky-body mobile-name-cell ${isScrolled ? 'mobile-col-name-narrow' : ''}`}>
                    {truncateName(row.name, isScrolled)}
                  </td>
                  
                  {/* スクロール列 - 数値のみハイライト */}
                  <td className="mobile-scroll-col">
                    <span className={isHighlight(row.races, maxRaces) ? 'mobile-highlight' : ''}>
                      {row.races}
                    </span>
                  </td>
                  <td className="mobile-scroll-col mobile-col-wins">
                    <span className={isHighlight(row.wins, maxWins) ? 'mobile-highlight' : ''}>
                      {row.wins}
                    </span>
                  </td>
                  <td className="mobile-scroll-col">
                    <span className={isHighlight(row.places_2, maxPlaces2) ? 'mobile-highlight' : ''}>
                      {row.places_2}
                    </span>
                  </td>
                  <td className="mobile-scroll-col">
                    <span className={isHighlight(row.places_3, maxPlaces3) ? 'mobile-highlight' : ''}>
                      {row.places_3}
                    </span>
                  </td>
                  <td className="mobile-scroll-col mobile-col-rate">
                    <span className={isHighlight(row.win_rate, maxWinRate) ? 'mobile-highlight' : ''}>
                      {row.win_rate}%
                    </span>
                  </td>
                  <td className="mobile-scroll-col mobile-col-rate">
                    <span className={isHighlight(row.quinella_rate, maxQuinellaRate) ? 'mobile-highlight' : ''}>
                      {row.quinella_rate}%
                    </span>
                  </td>
                  <td className="mobile-scroll-col mobile-col-rate">
                    <span className={isHighlight(row.place_rate, maxPlaceRate) ? 'mobile-highlight' : ''}>
                      {row.place_rate}%
                    </span>
                  </td>
                  <td className="mobile-scroll-col mobile-col-payback">
                    <span className={isHighlight(row.win_payback, maxWinPayback) ? 'mobile-highlight' : ''}>
                      {row.win_payback}%
                    </span>
                  </td>
                  <td className="mobile-scroll-col mobile-col-payback">
                    <span className={isHighlight(row.place_payback, maxPlacePayback) ? 'mobile-highlight' : ''}>
                      {row.place_payback}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {data.length > initialShow && (
        <div className="show-more-container">
          <button
            ref={buttonRef}
            className="show-more-button"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? '▲ 閉じる' : `▼ さらに表示（残り${data.length - initialShow}件）`}
          </button>
        </div>
      )}
    </div>
  );
}