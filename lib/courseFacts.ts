/**
 * 競馬場のコース形状（JRA 公式サイト「コース紹介」 https://www.jra.go.jp/facilities/race/ の記載値）
 *
 * - 芝の1周距離・直線は A コース使用時の値
 * - 高低差・坂は公式に記載のあるものだけ入れる（記載がないものは undefined のまま表示しない）
 * - 回り（右・左）と内回り・外回りの別は、レースデータ（course_profile）を正とする
 */

export interface TrackFacts {
  /** 1周距離（m） */
  lap?: number;
  /** 最後の直線の長さ（m） */
  straight?: number;
  /** コース全体の高低差（m） */
  elevation?: number;
  /** ゴール前の坂の説明（短文） */
  slope?: string;
}

interface VenueFacts {
  turf?: TrackFacts;
  turfInner?: TrackFacts;
  turfOuter?: TrackFacts;
  dirt?: TrackFacts;
  /** ダートで芝スタートになる距離 */
  dirtTurfStart?: number[];
}

const FACTS: Record<string, VenueFacts> = {
  sapporo: {
    turf: { lap: 1640.9, straight: 266.1, slope: 'ほぼ平坦' },
    dirt: { lap: 1487, straight: 264.3, slope: 'ほぼ平坦' },
  },
  hakodate: {
    turf: { lap: 1626.6, straight: 262.1, elevation: 3.5, slope: '4コーナーから直線へなだらかな下り' },
    dirt: { lap: 1475.8, straight: 260.3, elevation: 3.5 },
  },
  fukushima: {
    turf: { lap: 1600, straight: 292, elevation: 1.9, slope: 'ゴール前に上り（高低差1.2m）' },
    dirt: { lap: 1444.6, straight: 295.7, elevation: 2.1 },
    dirtTurfStart: [1150],
  },
  niigata: {
    turfInner: { lap: 1623, straight: 358.7 },
    turfOuter: { lap: 2223, straight: 658.7, slope: '3〜4コーナーに緩やかな下り' },
    dirt: { straight: 353.9 },
    dirtTurfStart: [1200],
  },
  tokyo: {
    turf: { lap: 2083.1, straight: 525.9, slope: '直線の残り460〜300mに上り（高低差約2m）' },
    dirt: { lap: 1899, straight: 501.6, slope: '直線に上り（高低差2.4m）' },
    dirtTurfStart: [1600],
  },
  nakayama: {
    turfInner: { lap: 1667.1, straight: 310, elevation: 5.3, slope: 'ゴール前に急坂（高低差2.2m・勾配2.24%）' },
    turfOuter: { lap: 1839.7, straight: 310, elevation: 5.3, slope: 'ゴール前に急坂（高低差2.2m・勾配2.24%）' },
    dirt: { lap: 1493, straight: 308, elevation: 4.5, slope: 'ゴール前に急坂' },
    dirtTurfStart: [1200],
  },
  chukyo: {
    turf: { lap: 1705.9, straight: 412.5, elevation: 3.5, slope: '直線入口に上り（高低差約2m・勾配約2%）' },
    dirt: { lap: 1530, straight: 410.7, elevation: 3.4, slope: '直線入口に上り' },
    dirtTurfStart: [1400],
  },
  kyoto: {
    turfInner: { lap: 1782.8, straight: 328.4, elevation: 3.1, slope: '3コーナーに上り下りの坂' },
    turfOuter: { lap: 1894.3, straight: 403.7, elevation: 4.3, slope: '3コーナーに上り下りの坂' },
    dirt: { lap: 1607.6, straight: 329.1 },
    dirtTurfStart: [1400],
  },
  hanshin: {
    turfInner: { lap: 1689, straight: 356.5, slope: 'ゴール前に急坂（高低差1.8m・勾配1.5%）' },
    turfOuter: { lap: 2089, straight: 473.6, slope: 'ゴール前に急坂（高低差1.8m・勾配1.5%）' },
    dirt: { lap: 1517.6, straight: 352.7, slope: 'ゴール前に上り（高低差1.6m）' },
    dirtTurfStart: [1400, 2000],
  },
  kokura: {
    turf: { lap: 1615.1, straight: 293, elevation: 3, slope: '直線は平坦' },
    dirt: { lap: 1445.4, straight: 291.3, elevation: 2.9, slope: '直線に緩やかな上り（高低差0.6m）' },
  },
};

/** 内回り・外回りの区別がある競馬場（芝） */
export function hasTurfVariants(venue: string): boolean {
  return Boolean(FACTS[venue]?.turfInner);
}

/**
 * コースの形状を返す。variant はレースデータ上の内外（'内' | '外'）
 * 新潟の芝1000mは直線コースなので専用の値を返す
 */
export function getTrackFacts(venue: string, surface: string, distance: number, variant?: string | null): TrackFacts | undefined {
  const v = FACTS[venue];
  if (!v) return undefined;
  if (surface === 'dirt') return v.dirt;
  if (surface !== 'turf') return undefined;
  if (venue === 'niigata' && distance === 1000) return { straight: 1000, slope: '直線のみのコース' };
  if (v.turfInner) return variant === '外' ? v.turfOuter : v.turfInner;
  return v.turf;
}

export function isDirtTurfStart(venue: string, surface: string, distance: number): boolean {
  return surface === 'dirt' && Boolean(FACTS[venue]?.dirtTurfStart?.includes(distance));
}

/** 直線の長さの目安（JRA 10場の芝・ダートの直線 約260〜660m を3段階に） */
export function straightLabel(m: number | undefined): string | null {
  if (!m) return null;
  if (m >= 400) return '直線が長い';
  if (m >= 320) return '直線は標準的';
  return '直線が短い';
}
