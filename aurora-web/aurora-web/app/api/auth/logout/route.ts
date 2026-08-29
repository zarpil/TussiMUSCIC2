import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('session_id');

  if (sessionCookie) {
    try {
      // Delete session from MongoDB
      await fetch(`${API_URL}/api/auth/session/${sessionCookie.value}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('[Logout] Failed to delete session:', error);
    }
  }

  // Clear session cookie
  const response = NextResponse.json({ success: true });
  response.cookies.delete('session_id');

  return response;
}
