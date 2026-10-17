/**
 * 今週開催の競馬場をAI予測インデックス（最新開催日のレース一覧）から自動算出する
 */
import { ALL_COURSES } from './courses';

export interface VenueCourse {
  distance: number;
  variant?: 'inner' | 'outer';
  label?: string;
}

export interface Venue {
  id: string;
  name: string;
  shortName: string;
  courses: {
    turf: VenueCourse[];
    dirt: VenueCourse[];
    steeplechase?: VenueCourse[];
  };
}

// 競馬場名（表示名）→ URL用ID
const VENUE_IDS: Record<string, string> = {
  札幌: 'sapporo',
  函館: 'hakodate',
  福島: 'fukushima',
  新潟: 'niigata',
  東京: 'tokyo',
  中山: 'nakayama',
  中京: 'chukyo',
  京都: 'kyoto',
  阪神: 'hanshin',
  小倉: 'kokura',
};

// 開催がない場合のフォールバック（主要3場）
const FALLBACK_VENUE_IDS = ['tokyo', 'kyoto', 'niigata'];

interface PredictionIndexEntry {
  date?: string;
  venueLabel?: string;
}

function buildVenue(id: string): Venue | null {
  const courses = ALL_COURSES.filter((c) => c.racecourse === id);
  if (courses.length === 0) return null;
  const toCourse = (c: (typeof ALL_COURSES)[number]): VenueCourse => {
    const variant = (c as { variant?: 'inner' | 'outer' }).variant;
    return {
      distance: c.distance,
      variant,
      label: variant ? `${c.surface_ja}${c.distance}m（${variant === 'inner' ? '内' : '外'}）` : undefined,
    };
  };
  const sortCourses = (a: VenueCourse, b: VenueCourse) =>
    a.distance - b.distance || (a.variant === 'inner' ? -1 : 1);
  return {
    id,
    name: courses[0].racecourse_ja,
    shortName: courses[0].racecourse_ja.replace('競馬場', ''),
    courses: {
      turf: courses.filter((c) => c.surface === 'turf').map(toCourse).sort(sortCourses),
      dirt: courses.filter((c) => c.surface === 'dirt').map(toCourse).sort(sortCourses),
    },
  };
}

/**
 * 最新の開催日に予測が出ている競馬場を「今週開催」として返す。
 * 予測インデックスが取得できない場合はフォールバックの3場を返す。
 */
export async function getThisWeekVenues(): Promise<Venue[]> {
  let ids: string[] = [];
  try {
    const res = await fetch('https://storage.googleapis.com/umadata/predictions/index.json', {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const entries = (await res.json()) as PredictionIndexEntry[];
      const latestDate = entries.reduce<string>((max, e) => (e.date && e.date > max ? e.date : max), '');
      if (latestDate) {
        // 最新開催日と同じ週（土日）の開催場をまとめる
        const latest = new Date(latestDate);
        const weekStart = new Date(latest);
        weekStart.setDate(latest.getDate() - ((latest.getDay() + 1) % 7)); // 直近の土曜日
        const weekStartStr = weekStart.toISOString().slice(0, 10);
        const labels = new Set(
          entries
            .filter((e) => e.date && e.date >= weekStartStr && e.date <= latestDate)
            .map((e) => e.venueLabel ?? '')
        );
        ids = Array.from(labels).map((l) => VENUE_IDS[l]).filter((v): v is string => Boolean(v));
      }
    }
  } catch {
    ids = [];
  }
  if (ids.length === 0) ids = FALLBACK_VENUE_IDS;

  // 北から南の順に並べる
  const order = Object.values(VENUE_IDS);
  ids.sort((a, b) => order.indexOf(a) - order.indexOf(b));

  return ids.map(buildVenue).filter((v): v is Venue => v !== null);
}
