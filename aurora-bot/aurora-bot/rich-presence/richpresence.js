import 'dotenv/config';
import { ActivityType } from "discord.js";
import mongoose from "mongoose";

const ACTIVITY_TYPE_MAP = {
  WATCHING: ActivityType.Watching,
  LISTEN: ActivityType.Listening,
  LISTENING: ActivityType.Listening,
  PLAYING: ActivityType.Playing,
  PLAY: ActivityType.Playing,
  COMPETING: ActivityType.Competing,
  STREAMING: ActivityType.Streaming
};

let presenceInterval = null;
let statusIndex = 0;

export default async function dcrichpresense(client) {
  async function updatePresence() {
    // 0. Guarantee Mongoose connection if MONGODB_URI is available
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      if (process.env.MONGODB_URI) {
        try {
          await mongoose.connect(process.env.MONGODB_URI);
        } catch (connErr) {
          console.error('[Rich Presence] MongoDB connect attempt error:', connErr.message);
        }
      }
    }

    let dbSettings = null;
    try {
      if (mongoose.connection && mongoose.connection.db) {
        dbSettings = await mongoose.connection.db.collection('settings').findOne({ _id: 'site_config' });
      }
    } catch (err) {
      console.error('[Rich Presence] Error fetching settings from DB:', err);
    }

    let isEnabled = false;
    let status = "online";
    let displayItems = [];

    const webMode = dbSettings?.presenceMode;
    const webEnabled = dbSettings?.presenceEnabled;

    if (webMode === 'enabled' || webEnabled === true) {
      // 1. Web Override: Enabled
      isEnabled = true;
      if (dbSettings?.presenceStatus) status = dbSettings.presenceStatus;

      // Extract displayItems (each item has name + type)
      if (Array.isArray(dbSettings?.presenceItems) && dbSettings.presenceItems.length > 0) {
        displayItems = dbSettings.presenceItems
          .filter(i => i && typeof i.name === 'string' && i.name.trim().length > 0)
          .map(i => ({
            name: i.name.trim(),
            type: i.type || 'Watching'
          }));
      } else if (Array.isArray(dbSettings?.presenceStatuses) && dbSettings.presenceStatuses.length > 0) {
        displayItems = dbSettings.presenceStatuses
          .filter(s => typeof s === 'string' && s.trim().length > 0)
          .map(s => ({
            name: s.trim(),
            type: dbSettings?.presenceType || 'Watching'
          }));
      } else if (dbSettings?.presenceStatusesText) {
        displayItems = dbSettings.presenceStatusesText
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean)
          .map(s => ({
            name: s,
            type: dbSettings?.presenceType || 'Watching'
          }));
      } else if (dbSettings?.presenceName) {
        displayItems = dbSettings.presenceName
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean)
          .map(s => ({
            name: s,
            type: dbSettings?.presenceType || 'Watching'
          }));
      }
    } else if (webMode === 'disabled' || webEnabled === false) {
      // 2. Web Override: Disabled
      isEnabled = false;
    } else {
      // 3. Unset on Web -> Fallback to .env configuration
      const envEnabled = (process.env.RICH_PRESENCE_ENABLED || process.env.PRESENCE_ENABLED || '').trim().toLowerCase();
      if (envEnabled === 'true' || envEnabled === '1') {
        isEnabled = true;
        
        const envNameStr = process.env.RICH_PRESENCE_NAME || process.env.RICH_PRESENCE_NAMES || process.env.PRESENCE_NAME || process.env.PRESENCE_NAMES || '';
        const envType = process.env.RICH_PRESENCE_TYPE || process.env.PRESENCE_TYPE || 'Watching';

        if (envNameStr) {
          // Comma, semicolon, or newline separated list in .env
          displayItems = envNameStr
            .split(/[,;\n]/)
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => ({
              name: s,
              type: envType
            }));
        }

        if (process.env.RICH_PRESENCE_STATUS || process.env.PRESENCE_STATUS) {
          status = process.env.RICH_PRESENCE_STATUS || process.env.PRESENCE_STATUS;
        }
      } else {
        // 4. Default: Toggled OFF
        isEnabled = false;
      }
    }

    if (!isEnabled) {
      client.user.setPresence({
        activities: [],
        status: status || "online"
      });
      return;
    }

    // Default fallback if enabled but list is empty
    if (displayItems.length === 0) {
      displayItems = [
        { name: "{servers} servers", type: "Watching" },
        { name: "24/7 Music Playback", type: "Listening" }
      ];
    }

    const currentItem = displayItems[statusIndex % displayItems.length];
    const typeUpper = (currentItem.type || 'WATCHING').trim().toUpperCase();
    const activityType = ACTIVITY_TYPE_MAP[typeUpper] ?? ActivityType.Watching;

    const guildCount = client.guilds?.cache?.size || 0;
    const currentName = currentItem.name.replace(/{servers}/g, guildCount.toString());

    client.user.setPresence({
      activities: [{
        name: currentName,
        type: activityType
      }],
      status: status || "online"
    });

    statusIndex++;
  }

  // Initial presence update
  await updatePresence();

  // Periodic refresh loop every 15 seconds
  if (presenceInterval) clearInterval(presenceInterval);
  presenceInterval = setInterval(async () => {
    try {
      await updatePresence();
    } catch (e) {
      console.error('[Rich Presence] Error in presence update loop:', e);
    }
  }, 15000);

  console.log(`✅ Discord Rich Presence initialized (Priority: Web > .env, Default: OFF)`);
}