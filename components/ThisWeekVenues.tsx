'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './ThisWeekVenues.module.css';

interface Course {
  distance: number;
  variant?: 'inner' | 'outer';
  label?: string;
}

interface Race {
  raceNumber: number;
  raceName: string;
  surface: 'turf' | 'dirt' | 'steeplechase';
  distance: number;
  startTime: string;
  variant?: 'inner' | 'outer';
}

interface VenueData {
  name: string;
  races: Race[];
}

interface RaceSchedule {
  date: string;
  venues: {
    [venueId: string]: VenueData;
  };
}

interface NextRace {
  racecourse: string;
  raceNumber: number;
  raceName: string;
  startTime: string;
  surface: 'turf' | 'dirt' | 'steeplechase';
  distance: number;
  variant?: 'inner' | 'outer';
}

interface Venue {
  id: string;
  name: string;
  nextRace?: NextRace;
  courses: {
    turf: Course[];
    dirt: Course[];
    steeplechase?: Course[];
  };
}

// モックデータ（後でAPIから取得）
const mockVenues: Venue[] = [
  {
    id: 'nakayama',
    name: '中山競馬場',
    nextRace: {
      racecourse: '中山',
      raceNumber: 1,
      raceName: '3歳未勝利',
      startTime: '10:05',
      surface: 'dirt',
      distance: 1800,
    },
    courses: {
      turf: [
        { distance: 1200 },
        { distance: 1600 },
        { distance: 1800 },
        { distance: 2000 },
        { distance: 2200 },
        { distance: 2500 },
      ],
      dirt: [
        { distance: 1200 },
        { distance: 1800 },
      ],
      steeplechase: [
        { distance: 2880 },
        { distance: 3270 },
        { distance: 3600 },
      ],
    },
  },
  {
    id: 'hanshin',
    name: '阪神競馬場',
    nextRace: {
      racecourse: '阪神',
      raceNumber: 1,
      raceName: '3歳未勝利',
      startTime: '09:50',
      surface: 'dirt',
      distance: 1800,
    },
    courses: {
      turf: [
        { distance: 1200 },
        { distance: 1400 },
        { distance: 1600 },
        { distance: 1800 },
        { distance: 2000 },
        { distance: 2200 },
        { distance: 2400 },
        { distance: 2600 },
        { distance: 3000 },
      ],
      dirt: [
        { distance: 1200 },
        { distance: 1400 },
        { distance: 1800 },
        { distance: 2000 },
      ],
      steeplechase: [
        { distance: 2970 },
        { distance: 3110 },
        { distance: 3140 },
        { distance: 3900 },
      ],
    },
  },
];

// コース区分の略称を取得
const getSurfaceLabel = (surface: 'turf' | 'dirt' | 'steeplechase'): string => {
  switch (surface) {
    case 'turf':
      return '芝';
    case 'dirt':
      return 'ダ';
    case 'steeplechase':
      return '障';
  }
};

// コース区分のフルネームを取得
const getSurfaceFullLabel = (surface: 'turf' | 'dirt' | 'steeplechase'): string => {
  switch (surface) {
    case 'turf':
      return '芝';
    case 'dirt':
      return 'ダート';
    case 'steeplechase':
      return '障害';
  }
};

// 時刻を「X時X分発走」形式に変換
const formatStartTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  return `${hours}時${minutes}分発走`;
};

// 障害レースはレース名で判定してsteeplechaseを返す（JSONのsurfaceがturfになるケースがあるため）
const getEffectiveSurface = (race: NextRace): 'turf' | 'dirt' | 'steeplechase' => {
  if (race.raceName.includes('障害')) return 'steeplechase';
  return race.surface;
};

// レース名を略称化（最大8文字に制限）
const formatRaceName = (name: string, maxLength: number = 8): string => {
  const formatted = name
    .replace(/クラス/g, 'C')
    .replace(/ステークス/g, 'S');

  if (formatted.length > maxLength) {
    return formatted.slice(0, maxLength) + '...';
  }

  return formatted;
};

// 日付をYYYYMMDD形式に変換
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// 日数を加算
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// 競馬場IDから日本語名を取得
const getVenueName = (venueId: string): string => {
  const venueNames: { [key: string]: string } = {
    'tokyo': '東京',
    'kyoto': '京都',
    'kokura': '小倉',
    'nakayama': '中山',
    'hanshin': '阪神',
    'sapporo': '札幌',
    'hakodate': '函館',
    'fukushima': '福島',
    'niigata': '新潟',
    'chukyo': '中京',
  };
  return venueNames[venueId] || venueId;
};

export default function ThisWeekVenues({ noWrapper = false }: { noWrapper?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [scheduleData, setScheduleData] = useState<RaceSchedule[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('nakayama');

  // データ取得（当日のみ）
  useEffect(() => {
    async function fetchSchedule() {
      try {
        const today = formatDateToYYYYMMDD(new Date());

        const res = await fetch(`/api/race-schedule/${today}`);

        if (res.ok) {
          const data = await res.json();
          console.log(`✓ レーススケジュール取得成功: ${today}`);
          setScheduleData([data]);
        } else {
          console.log(`ℹ️ 当日のレーススケジュールがありません: ${today}`);
          setScheduleData([]);
        }
      } catch (error) {
        console.error('Failed to fetch race schedule:', error);
        setScheduleData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchedule();
  }, []);

  // 1分ごとに現在時刻を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1分ごと

    return () => clearInterval(timer);
  }, []);

  // Intersection Observer（アニメーション用）
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // レースの状態を判定
  const raceStatus = useMemo(() => {
    console.log('🔍 raceStatus計算:', {
      scheduleDataLength: scheduleData.length,
      isLoading,
      scheduleData
    });

    if (scheduleData.length === 0) {
      console.log('⚠️ scheduleDataが空です');
      return { hasSchedule: false, allRacesFinished: false, nextRaces: [] };
    }

    const now = currentTime;
    const allVenuesWithNextRace: Array<{ id: string; name: string; date: string; nextRace: NextRace }> = [];
    let hasAnyRace = false;

    scheduleData.forEach((schedule) => {
      Object.entries(schedule.venues).forEach(([venueId, venueData]) => {
        hasAnyRace = true;

        // レースの日時を考慮して比較
        const nextRace = venueData.races.find((race) => {
          // レースの日時を構築（例: "2026-02-14T10:05:00"）
          const raceDateTime = new Date(`${schedule.date}T${race.startTime}:00`);
          return raceDateTime > now;
        });

        if (nextRace) {
          allVenuesWithNextRace.push({
            id: venueId,
            name: getVenueName(venueId),
            date: schedule.date,
            nextRace: {
              racecourse: getVenueName(venueId),
              raceNumber: nextRace.raceNumber,
              raceName: nextRace.raceName,
              startTime: nextRace.startTime,
              surface: nextRace.surface,
              distance: nextRace.distance,
              variant: nextRace.variant,
            },
          });
        }
      });
    });

    // 開始日時順にソート
    const sortedRaces = allVenuesWithNextRace.sort((a, b) => {
      const aDateTime = new Date(`${a.date}T${a.nextRace.startTime}:00`);
      const bDateTime = new Date(`${b.date}T${b.nextRace.startTime}:00`);
      return aDateTime.getTime() - bDateTime.getTime();
    });

    return {
      hasSchedule: true,
      allRacesFinished: hasAnyRace && sortedRaces.length === 0,
      nextRaces: sortedRaces,
    };
  }, [scheduleData, currentTime]);

  console.log('🎨 レンダリング:', {
    isLoading,
    hasSchedule: raceStatus.hasSchedule,
    allRacesFinished: raceStatus.allRacesFinished,
    nextRacesCount: raceStatus.nextRaces.length,
    showSection: !isLoading && raceStatus.hasSchedule
  });

  const inner = (
    <div style={{ width: '100%' }}>
      {/* 次のレースセクション */}
      {false && !isLoading && raceStatus.hasSchedule && (
        <div className={styles.nextRaceSection}>
            <h3 className={styles.nextRaceTitle}>次のレース</h3>

            {/* 全レース終了時のメッセージ */}
            {raceStatus.allRacesFinished && (
              <div className={styles.allRacesFinishedMessage}>
                本日のレースは全て終了しました
              </div>
            )}

            {/* 次のレース表示 */}
            {!raceStatus.allRacesFinished && raceStatus.nextRaces.length > 0 && (
              <div className={styles.upcomingRaceGrid}>
                {raceStatus.nextRaces.map((venue) => (
                  <div key={`next-race-${venue.date}-${venue.id}`} className={styles.upcomingRaceItem}>
                    {(() => {
                      const effectiveSurface = getEffectiveSurface(venue.nextRace);
                      return (
                        <Link
                          href={`/courses/${venue.id}/${effectiveSurface}/${venue.nextRace.distance}${venue.nextRace.variant ? `-${venue.nextRace.variant}` : ''}`}
                          className={`${styles.upcomingRaceCard} ${
                            effectiveSurface === 'turf' ? styles.upcomingRaceCardTurf :
                            effectiveSurface === 'dirt' ? styles.upcomingRaceCardDirt :
                            styles.upcomingRaceCardSteeplechase
                          }`}
                        >
                          <div className={styles.raceCourseName}>{venue.nextRace.racecourse} {venue.nextRace.raceNumber}R</div>
                          <div className={styles.raceDetails}>{formatRaceName(venue.nextRace.raceName)}</div>
                          <div
                            className={`${styles.raceCourseInfo} ${
                              effectiveSurface === 'turf' ? styles.turfBadge :
                              effectiveSurface === 'dirt' ? styles.dirtBadge :
                              styles.steeplechaseBadge
                            }`}
                          >
                            <span className={styles.surfaceLabelShort}>
                              {getSurfaceLabel(effectiveSurface)}{venue.nextRace.distance}m
                            </span>
                            <span className={styles.surfaceLabelFull}>
                              {getSurfaceFullLabel(effectiveSurface)}{venue.nextRace.distance}m
                            </span>
                          </div>
                          <div className={styles.raceStartTime}>{formatStartTime(venue.nextRace.startTime)}</div>
                        </Link>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!noWrapper && <h2 className={`section-title is-visible ${styles.mainTitle}`}>今週開催の競馬場</h2>}

        {/* 競馬場タブ */}
        <div className={styles.venueTabs}>
          {mockVenues.map((venue) => (
            <button
              key={venue.id}
              className={`${styles.venueTab} ${selectedVenueId === venue.id ? styles.venueTabActive : ''}`}
              onClick={() => setSelectedVenueId(venue.id)}
            >
              {venue.name}
            </button>
          ))}
        </div>

        {/* 選択された競馬場のコース一覧 */}
        {mockVenues.filter((v) => v.id === selectedVenueId).map((venue) => (
          <div key={venue.id} className={styles.venueContent}>
            <div className={styles.courseList}>
              <div className={`${styles.surfaceGroup} ${styles.surfaceGroupTurf}`}>
                <div className={styles.distanceLinks}>
                  {venue.courses.turf.map((course, idx) => (
                    <Link
                      key={`${course.distance}-${course.variant || idx}`}
                      href={`/courses/${venue.id}/turf/${course.distance}${course.variant ? `-${course.variant}` : ''}`}
                      className={`${styles.distanceLink} ${styles.turfLink}`}
                    >
                      {course.label || `芝${course.distance}m`}
                    </Link>
                  ))}
                </div>
              </div>

              <div className={`${styles.surfaceGroup} ${styles.surfaceGroupDirt}`}>
                <div className={styles.distanceLinks}>
                  {venue.courses.dirt.map((course, idx) => (
                    <Link
                      key={`${course.distance}-${course.variant || idx}`}
                      href={`/courses/${venue.id}/dirt/${course.distance}`}
                      className={`${styles.distanceLink} ${styles.dirtLink}`}
                    >
                      {course.label || `ダート${course.distance}m`}
                    </Link>
                  ))}
                </div>
              </div>

              {venue.courses.steeplechase && venue.courses.steeplechase.length > 0 && (
                <div className={`${styles.surfaceGroup} ${styles.surfaceGroupSteeplechase}`}>
                  <div className={styles.distanceLinks}>
                    {venue.courses.steeplechase.map((course, idx) => (
                      <Link
                        key={`${course.distance}-${course.variant || idx}`}
                        href={`/courses/${venue.id}/steeplechase/${course.distance}`}
                        className={`${styles.distanceLink} ${styles.steeplechaseLink}`}
                      >
                        {course.label || `障害${course.distance}m`}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );

  return noWrapper ? inner : (
    <section ref={sectionRef} className="section section-this-week-venues">
      {inner}
    </section>
  );
}
