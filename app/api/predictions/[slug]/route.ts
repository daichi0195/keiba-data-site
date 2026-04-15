import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const url = `https://storage.googleapis.com/umadata/predictions/${slug}.json`;
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return Response.json(
        { error: 'Prediction not found' },
        { status: 404 }
      );
    }

    const data = await res.json();

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching prediction:', error);
    return Response.json(
      { error: 'Failed to fetch prediction' },
      { status: 500 }
    );
  }
}
