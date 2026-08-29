import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const API_URL = process.env.INTERNAL_API_URL || 'http://bot:3001';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || DISCORD_CLIENT_SECRET === 'YOUR_CLIENT_SECRET_HERE') {
      return NextResponse.json({ error: 'OAuth credentials not configured' }, { status: 500 });
    }

    // Exchange code for access token for the embedded app
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: 'Failed to get access token', details: tokenData }, { status: 400 });
    }

    // Fetch user info to create a session
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();
    const sessionId = randomBytes(32).toString('hex');

    // Create session in backend
    try {
      await fetch(`${API_URL}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: userData.id,
          username: userData.username,
          discriminator: userData.discriminator,
          avatar: userData.avatar
        })
      });
    } catch (error) {
      console.error('[Token] Failed to create session:', error);
    }

    const response = NextResponse.json({ access_token: tokenData.access_token });

    // Set session cookie
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Important for iframe/embedded app cross-site cookies
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

