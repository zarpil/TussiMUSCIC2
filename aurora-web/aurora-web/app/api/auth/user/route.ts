import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.INTERNAL_API_URL || 'http://bot:3001';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('session_id');

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let attempts = 0;
  while (attempts < 3) {
    try {
      attempts++;
      const response = await fetch(`${API_URL}/api/auth/session/${sessionCookie.value}`, {
        cache: 'no-store',
        headers: { 'Connection': 'close' },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }

      const userData = await response.json();
      return NextResponse.json(userData);
    } catch (error: any) {
      if (attempts >= 3) {
        console.error('[Auth] Failed to get session after 3 attempts:', error?.message || error);
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
      await new Promise(r => setTimeout(r, 100));
    }
  }
}
