import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback';
  
  // Debug logging
  console.log('Discord OAuth - Client ID:', clientId);
  console.log('Discord OAuth - Redirect URI:', redirectUri);
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'DISCORD_CLIENT_ID is not configured in environment variables' },
      { status: 500 }
    );
  }
  
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20guilds`;
  
  console.log('Redirecting to:', discordAuthUrl);
  
  return NextResponse.redirect(discordAuthUrl);
}
