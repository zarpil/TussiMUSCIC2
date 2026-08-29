import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';

async function getDatabase() {
  const client = await MongoClient.connect(MONGODB_URI);
  return client.db('aurora');
}

// GET - Fetch all developers with cached avatars
export async function GET() {
  try {
    const db = await getDatabase();
    const developers = await db.collection('developers').find({}).toArray();

    return NextResponse.json(developers);
  } catch (error) {
    console.error('Error fetching developers:', error);
    return NextResponse.json({ error: 'Failed to fetch developers' }, { status: 500 });
  }
}

// POST - Refresh avatars from Discord API
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Fetch user info from Discord API
    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${process.env.BOT_TOKEN}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Discord' }, { status: response.status });
    }

    const data = await response.json();

    let avatarUrl = '';
    if (data.avatar) {
      const ext = data.avatar.startsWith('a_') ? 'gif' : 'png';
      avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${data.avatar}.${ext}?size=256`;
    } else {
      const discriminator = data.discriminator
        ? parseInt(data.discriminator) % 5
        : parseInt(userId.slice(-4)) % 5;
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`;
    }

    // Update database
    const db = await getDatabase();
    await db.collection('developers').updateOne(
      { userId },
      {
        $set: {
          avatarUrl,
          username: data.username,
          discriminator: data.discriminator,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      avatarUrl,
      username: data.username
    });
  } catch (error) {
    console.error('Error refreshing avatar:', error);
    return NextResponse.json({ error: 'Failed to refresh avatar' }, { status: 500 });
  }
}
