import { getThisWeekVenues } from '@/lib/thisWeekVenues';

/**
 * 左メニューの「今週開催」用。共通の枠（ルートの layout）でデータを取りに行くと、
 * Next がルートの中で一番短い revalidate を採るため全ページの再生成が1時間ごとになる。
 * それを避けるため、今週開催だけをこの小さな JSON にして、ブラウザ側で取りに行く。
 */
export const revalidate = 3600;

export async function GET() {
  const venues = (await getThisWeekVenues()).map((v) => ({ id: v.id, name: v.shortName }));
  return Response.json(venues);
}
