'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './NextRaceSection.module.css';

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

const getSurfaceLabel = (surface: 'turf' | 'dirt' | 'steeplechase'): string => {
  switch (surface) {
    case 'turf': return '芝';
    case 'dirt': return 'ダ';
    case 'steeplechase': return '障';
  }
};

const getSurfaceFullLabel = (surface: 'turf' | 'dirt' | 'steeplechase'): string => {
  switch (surface) {
    case 'turf': return '芝';
    case 'dirt': return 'ダート';
    case 'steeplechase': return '障害';
  }
};

const formatStartTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  return `${hours}時${minutes}分発走`;
};

const getEffectiveSurface = (race: NextRace): 'turf' | 'dirt' | 'steeplechase' => {
  if (race.raceName.includes('障害')) return 'steeplechase';
  return race.surface;
};

const formatRaceName = (name: string, maxLength: number = 8): string => {
  const formatted = name
    .replace(/クラス/g, 'C')
    .replace(/ステークス/g, 'S');
  if (formatted.length > maxLength) {
    return formatted.slice(0, maxLength) + '...';
  }
  return formatted;
};

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

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

export default function NextRaceSection() {
  const [scheduleData, setScheduleData] = useState<RaceSchedule[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const today = formatDateToYYYYMMDD(new Date());
        const res = await fetch(`/api/race-schedule/${today}`);
        if (res.ok) {
          const data = await res.json();
          setScheduleData([data]);
        } else {
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const raceStatus = useMemo(() => {
    if (scheduleData.length === 0) {
      return { hasSchedule: false, allRacesFinished: false, nextRaces: [] };
    }

    const now = currentTime;
    const allVenuesWithNextRace: Array<{ id: string; name: string; date: string; nextRace: NextRace }> = [];
    let hasAnyRace = false;

    scheduleData.forEach((schedule) => {
      Object.entries(schedule.venues).forEach(([venueId, venueData]) => {
        hasAnyRace = true;
        const nextRace = venueData.races.find((race) => {
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

  if (isLoading || !raceStatus.hasSchedule) return null;

  return (
    <section className={`section ${styles.section}`}>
      <h2 className={`section-title is-visible ${styles.title}`}>次のレース</h2>

      {raceStatus.allRacesFinished && (
        <div className={styles.allRacesFinishedMessage}>
          本日のレースは全て終了しました
        </div>
      )}

      {!raceStatus.allRacesFinished && raceStatus.nextRaces.length > 0 && (
        <div className={styles.grid}>
          {raceStatus.nextRaces.map((venue) => {
            const effectiveSurface = getEffectiveSurface(venue.nextRace);
            return (
              <div key={`next-race-${venue.date}-${venue.id}`} className={styles.item}>
                <Link
                  href={`/courses/${venue.id}/${effectiveSurface}/${venue.nextRace.distance}${venue.nextRace.variant ? `-${venue.nextRace.variant}` : ''}`}
                  className={`${styles.card} ${
                    effectiveSurface === 'turf' ? styles.cardTurf :
                    effectiveSurface === 'dirt' ? styles.cardDirt :
                    styles.cardSteeplechase
                  }`}
                >
                  <div className={styles.courseName}>{venue.nextRace.racecourse} {venue.nextRace.raceNumber}R</div>
                  <div className={styles.raceDetails}>{formatRaceName(venue.nextRace.raceName)}</div>
                  <div className={`${styles.courseInfo} ${
                    effectiveSurface === 'turf' ? styles.turfBadge :
                    effectiveSurface === 'dirt' ? styles.dirtBadge :
                    styles.steeplechaseBadge
                  }`}>
                    <span className={styles.surfaceLabelShort}>
                      {getSurfaceLabel(effectiveSurface)}{venue.nextRace.distance}m
                    </span>
                    <span className={styles.surfaceLabelFull}>
                      {getSurfaceFullLabel(effectiveSurface)}{venue.nextRace.distance}m
                    </span>
                  </div>
                  <div className={styles.startTime}>{formatStartTime(venue.nextRace.startTime)}</div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
