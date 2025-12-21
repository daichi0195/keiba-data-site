'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type DataRow = {
  rank?: number;
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
  link?: string;
};

type Props = {
  title: string;
  data: DataRow[];
  initialShow?: number;
  nameLabel?: string;
  note?: string;
  disableHighlight?: boolean;
  showRank?: boolean;
  showGradeBadge?: boolean; // G1/G2/G3のバッジ表示
  showCourseBadge?: boolean; // コース名をバッジ表示
  courseBadgeType?: 'good' | 'bad'; // バッジの種類
};

export default function DataTable({ title, data, initialShow = 10, nameLabel = '名前', note, disableHighlight = false, showRank = true, showGradeBadge = false, showCourseBadge = false, courseBadgeType = 'good' }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const prevShowAllRef = useRef(false);

  // dataがundefinedまたは空の場合は空配列を使用
  const safeData = data || [];
  const displayData = showAll ? safeData : safeData.slice(0, initialShow);

  // 数値を3桁カンマ区切りでフォーマット
  const formatNumber = (num: number) => {
    return num.toLocaleString('ja-JP');
  };

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
  const maxRaces = Math.max(...safeData.map(d => d.races ?? 0));
  const maxWins = Math.max(...safeData.map(d => d.wins ?? 0));
  const maxPlaces2 = Math.max(...safeData.map(d => d.places_2 ?? 0));
  const maxPlaces3 = Math.max(...safeData.map(d => d.places_3 ?? 0));
  const maxWinRate = Math.max(...safeData.map(d => d.win_rate ?? 0));
  const maxPlaceRate = Math.max(...safeData.map(d => d.place_rate ?? 0));
  const maxQuinellaRate = Math.max(...safeData.map(d => d.quinella_rate ?? 0));
  const maxWinPayback = Math.max(...safeData.map(d => d.win_payback ?? 0));
  const maxPlacePayback = Math.max(...safeData.map(d => d.place_payback ?? 0));
  
  // セルがハイライト対象かチェック
  const isHighlight = (value: number, maxValue: number) => !disableHighlight && value === maxValue;

  // グレードバッジのスタイルを取得（枠順バッジと同じスタイル）
  const getGradeBadgeStyle = (name: string) => {
    if (!showGradeBadge) return null;

    switch (name) {
      case 'G1':
        return {
          backgroundColor: '#464EB7',
          color: '#fff',
          display: 'inline-block',
          width: '28px',
          height: '28px',
          lineHeight: '28px',
          textAlign: 'center' as const,
          borderRadius: '4px',
          fontWeight: '700',
          fontSize: '13px',
          border: '1px solid #ddd',
          verticalAlign: 'middle'
        };
      case 'G2':
        return {
          backgroundColor: '#E53032',
          color: '#fff',
          display: 'inline-block',
          width: '28px',
          height: '28px',
          lineHeight: '28px',
          textAlign: 'center' as const,
          borderRadius: '4px',
          fontWeight: '700',
          fontSize: '13px',
          border: '1px solid #ddd',
          verticalAlign: 'middle'
        };
      case 'G3':
        return {
          backgroundColor: '#5AAA49',
          color: '#fff',
          display: 'inline-block',
          width: '28px',
          height: '28px',
          lineHeight: '28px',
          textAlign: 'center' as const,
          borderRadius: '4px',
          fontWeight: '700',
          fontSize: '13px',
          border: '1px solid #ddd',
          verticalAlign: 'middle'
        };
      default:
        return null;
    }
  };

  const tableContent = (
    <>
      {title && <h2 className="section-title">{title}</h2>}

      {/* テーブルコンテナ */}
      <div className="mobile-table-container">
        {/* 横スクロール可能エリア */}
        <div className="mobile-table-scroll" ref={scrollRef}>
          <table className={`mobile-data-table ${!showRank ? 'no-rank-column' : ''}`}>
            <thead>
              <tr>
                {/* 固定列: 順位（ヘッダーテキストなし） */}
                {showRank && <th className="mobile-sticky-col mobile-col-rank"></th>}
                {/* 固定列: 名前 */}
                <th className={`mobile-sticky-col mobile-col-name mobile-col-name-header ${showRank && isScrolled ? 'mobile-col-name-narrow' : ''} ${!showRank ? 'mobile-col-name-first' : ''}`}>
                  {nameLabel}
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
                <tr key={row.rank ?? row.name ?? index} className={index % 2 === 0 ? 'mobile-row-even' : 'mobile-row-odd'}>
                  {/* 固定列: 順位 */}
                  {showRank && (
                    <td className="mobile-sticky-col mobile-col-rank mobile-sticky-body">
                      {index + 1 <= 3 ? (
                        <span className={`mobile-rank-badge mobile-rank-${index + 1}`}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="mobile-rank-normal">{index + 1}</span>
                      )}
                    </td>
                  )}

                  {/* 固定列: 名前 */}
                  <td className={`mobile-sticky-col mobile-col-name mobile-sticky-body mobile-name-cell ${showRank && isScrolled ? 'mobile-col-name-narrow' : ''} ${!showRank ? 'mobile-col-name-first' : ''}`}>
                    {(() => {
                      const gradeBadgeStyle = getGradeBadgeStyle(row.name);
                      const displayName = showRank ? truncateName(row.name, isScrolled) : row.name;

                      // グレードバッジ表示
                      if (gradeBadgeStyle) {
                        return <span style={gradeBadgeStyle}>{displayName}</span>;
                      }

                      // コースバッジ表示
                      if (showCourseBadge) {
                        const badgeClass = courseBadgeType === 'good' ? 'course-badge-good' : 'course-badge-bad';
                        return <span className={badgeClass}>{displayName}</span>;
                      }

                      // リンク付き表示
                      if (row.link) {
                        return (
                          <Link href={row.link} style={{ color: '#2563eb', textDecoration: 'underline' }}>
                            {displayName}
                          </Link>
                        );
                      }

                      return displayName;
                    })()}
                  </td>
                  
                  {/* スクロール列 - 数値のみハイライト */}
                  <td className="mobile-scroll-col">
                    <span className={isHighlight(row.races, maxRaces) ? 'mobile-highlight' : ''}>
                      {formatNumber(row.races)}
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
                    <span className={isHighlight(row.win_rate ?? 0, maxWinRate) ? 'mobile-highlight' : ''}>
                      {(row.win_rate ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="mobile-scroll-col mobile-col-rate">
                    <span className={isHighlight(row.quinella_rate ?? 0, maxQuinellaRate) ? 'mobile-highlight' : ''}>
                      {(row.quinella_rate ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="mobile-scroll-col mobile-col-rate">
                    <span className={isHighlight(row.place_rate ?? 0, maxPlaceRate) ? 'mobile-highlight' : ''}>
                      {(row.place_rate ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="mobile-scroll-col mobile-col-payback">
                    <span className={isHighlight(row.win_payback ?? 0, maxWinPayback) ? 'mobile-highlight' : ''}>
                      {(row.win_payback ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="mobile-scroll-col mobile-col-payback">
                    <span className={isHighlight(row.place_payback ?? 0, maxPlacePayback) ? 'mobile-highlight' : ''}>
                      {(row.place_payback ?? 0).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {note && (
        <p className="note-text" style={{ marginTop: '0.75rem' }}>
          {note}
        </p>
      )}

      {safeData.length > initialShow && (
        <div className="show-more-container">
          <button
            ref={buttonRef}
            className="show-more-button"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? '▲ 閉じる' : `▼ さらに表示（残り${safeData.length - initialShow}件）`}
          </button>
        </div>
      )}
    </>
  );

  // データがない場合はnullを返す
  if (safeData.length === 0) {
    return null;
  }

  // タイトルがある場合はsectionで囲む、ない場合は直接返す
  return title ? <div className="section">{tableContent}</div> : tableContent;
}