import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookies = request.cookies.getAll();
  const userCookie = request.cookies.get('discord_user');
  
  return NextResponse.json({
    allCookies: cookies,
    discordUserCookie: userCookie ? 'found' : 'not found',
    cookieValue: userCookie?.value ? JSON.parse(userCookie.value) : null,
    headers: {
      cookie: request.headers.get('cookie')
    }
  });
}