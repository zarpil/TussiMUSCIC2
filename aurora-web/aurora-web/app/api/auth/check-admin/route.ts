import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('session_id');

  if (!sessionCookie) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  try {
    // Get session from MongoDB via API
    const sessionResponse = await fetch(`${API_URL}/api/auth/session/${sessionCookie.value}`, {
      cache: 'no-store',
      headers: { 'Connection': 'close' },
      signal: AbortSignal.timeout(5000)
    });

    if (!sessionResponse.ok) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const userData = await sessionResponse.json();

    // Check if user is admin via API
    const adminResponse = await fetch(`${API_URL}/api/admin/check/${userData.id}`, {
      cache: 'no-store',
      headers: { 'Connection': 'close' },
      signal: AbortSignal.timeout(5000)
    });

    if (!adminResponse.ok) {
      return NextResponse.json({ isAdmin: false });
    }

    const adminData = await adminResponse.json();
    return NextResponse.json({ isAdmin: adminData.isAdmin });
  } catch (error) {
    console.error('[Auth] Failed to check admin status:', error);
    return NextResponse.json({ isAdmin: false });
  }
}
