import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.INTERNAL_API_URL || 'http://bot:3001';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_URL}/api/guilds`, {
      cache: 'no-store',
      headers: { 'Connection': 'close' },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch guilds' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Proxy] Error fetching guilds:', error?.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
