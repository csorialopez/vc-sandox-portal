import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  const upstreamUrl = `https://midplus.interfase.uy/api/st/v1/${encodeURIComponent(
    id,
  )}/revoke`;

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'PATCH',
    });

    const text = await upstreamRes.text();

    // Pass through status and content type; default to text/plain if missing
    const contentType = upstreamRes.headers.get('content-type') ?? 'text/plain';

    return new NextResponse(text || null, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('Error proxying revoke request', error);
    return NextResponse.json(
      { error: 'Failed to revoke credential' },
      { status: 500 },
    );
  }
}
