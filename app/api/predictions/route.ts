export async function GET() {
  try {
    const url = `https://storage.googleapis.com/umadata/predictions/index.json?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      return Response.json([], {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    const data = await res.json();

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching predictions index:', error);
    return Response.json([], { status: 500 });
  }
}
