// Script to initialize developer avatars in database
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const BOT_TOKEN = process.env.BOT_TOKEN || '';

const developers = [
  {
    userId: '775429424979378216',
    name: 'Saravanan',
    role: 'Lead Developer'
  },
  {
    userId: '775015391487197206',
    name: 'Zilm',
    role: 'Core Developer'
  }
];

async function fetchDiscordAvatar(userId) {
  try {
    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch user ${userId}: ${response.status}`);
      return null;
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

    return {
      avatarUrl,
      username: data.username,
      discriminator: data.discriminator
    };
  } catch (error) {
    console.error(`Error fetching avatar for ${userId}:`, error);
    return null;
  }
}

async function initializeDevelopers() {
  console.log('Connecting to MongoDB...');
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('aurora');
  
  console.log('Fetching developer avatars from Discord...');
  
  for (const dev of developers) {
    console.log(`Processing ${dev.name} (${dev.userId})...`);
    
    const discordData = await fetchDiscordAvatar(dev.userId);
    
    if (discordData) {
      await db.collection('developers').updateOne(
        { userId: dev.userId },
        { 
          $set: { 
            userId: dev.userId,
            name: dev.name,
            role: dev.role,
            avatarUrl: discordData.avatarUrl,
            username: discordData.username,
            discriminator: discordData.discriminator,
            updatedAt: new Date()
          } 
        },
        { upsert: true }
      );
      console.log(`✓ ${dev.name} avatar saved: ${discordData.avatarUrl}`);
    } else {
      console.log(`✗ Failed to fetch avatar for ${dev.name}`);
    }
  }
  
  await client.close();
  console.log('\nDeveloper avatars initialized successfully!');
}

initializeDevelopers().catch(console.error);
