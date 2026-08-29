import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback';
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.INTERNAL_API_URL || 'http://bot:3001';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/?error=no_code`);
  }

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || DISCORD_CLIENT_SECRET === 'YOUR_CLIENT_SECRET_HERE') {
    console.error('[OAuth] Client ID or Secret not configured');
    return NextResponse.redirect(`${BASE_URL}/?error=oauth_not_configured`);
  }

  try {
    // Exchange code for access token
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
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // Generate session ID
    const sessionId = randomBytes(32).toString('hex');

    // Create session in MongoDB via API
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
      console.error('[OAuth] Failed to create session:', error);
      throw new Error('Failed to create session');
    }

    // Parse state to get guild ID
    let guildId = '';
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        guildId = stateData.guildId || '';
      } catch (e) {
        console.error('Failed to parse state:', e);
      }
    }

    // Create response with redirect using BASE_URL (no userId in URL for security)
    const redirectPath = guildId
      ? `/dashboard/${guildId}`
      : `/?loggedIn=true`;

    const redirectUrl = `${BASE_URL}${redirectPath}`;

    const response = NextResponse.redirect(redirectUrl);

    // Set session cookie (httpOnly for security)
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Discord OAuth error:', error);
    return NextResponse.redirect(`${BASE_URL}/?error=auth_failed`);
  }
}
