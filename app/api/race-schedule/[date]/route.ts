import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const { date } = params;

    // GCS公開URLからJSONを取得
    const url = `https://storage.googleapis.com/umadata/race_schedule/${date}.json`;
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // 1時間キャッシュ
    });

    if (!res.ok) {
      return Response.json(
        { error: 'Race schedule not found' },
        { status: 404 }
      );
    }

    const data = await res.json();

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error fetching race schedule:', error);
    return Response.json(
      { error: 'Failed to fetch race schedule' },
      { status: 500 }
    );
  }
}
