import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  try {
    // Fetch user info from Discord API
    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${process.env.BOT_TOKEN}`,
      },
    });

    if (!response.ok) {
      // Return default avatar on error
      const discriminator = parseInt(userId.slice(-4)) % 5;
      return NextResponse.redirect(
        `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`
      );
    }

    const data = await response.json();

    if (data.avatar) {
      // User has a custom avatar
      const ext = data.avatar.startsWith('a_') ? 'gif' : 'png';
      return NextResponse.redirect(
        `https://cdn.discordapp.com/avatars/${userId}/${data.avatar}.${ext}?size=256`
      );
    } else {
      // User has default avatar
      const discriminator = data.discriminator 
        ? parseInt(data.discriminator) % 5 
        : parseInt(userId.slice(-4)) % 5;
      return NextResponse.redirect(
        `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`
      );
    }
  } catch (error) {
    console.error('Error fetching Discord avatar:', error);
    // Return default avatar on error
    const discriminator = parseInt(userId.slice(-4)) % 5;
    return NextResponse.redirect(
      `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`
    );
  }
}
