import MainClient from './cluster/structure.js';
import dcrichpresense from './rich-presence/richpresence.js';
import commands_deploy from './deploy-commands.js';
import 'dotenv/config';
import commands_handler from './commands/handler/handler.js';
import deleteslash from './deteleslash.js';
import { send_log } from './log/log.js';
import { tick_emoji } from './emoji/emoji.js';
import connectMoonlink,{moonlinkInit} from './moonlink/moonlink.js';
import { eventHandler } from './events/eventHandler.js';
import { AutoPoster } from 'topgg-autoposter';
import WebServer from './server/index.js';
import { TextChannel, NewsChannel, DMChannel, BaseInteraction, MessageFlags } from 'discord.js';
import { schedulePoTokenSync } from './utils/potokenSync.js';

// Global patch to ensure EVERY message sent by the bot in Discord is a silent message (SuppressNotifications)
const patchSilentMessages = () => {
  const addSilentFlag = (options) => {
    if (!options) options = {};
    if (typeof options === 'string') {
      options = { content: options };
    }
    if (Array.isArray(options.flags)) {
      if (!options.flags.includes(MessageFlags.SuppressNotifications) && !options.flags.includes(4096)) {
        options.flags.push(MessageFlags.SuppressNotifications);
      }
    } else if (typeof options.flags === 'number') {
      options.flags = options.flags | MessageFlags.SuppressNotifications;
    } else {
      options.flags = [MessageFlags.SuppressNotifications];
    }
    return options;
  };

  const origTextSend = TextChannel.prototype.send;
  TextChannel.prototype.send = function (options, ...args) {
    return origTextSend.call(this, addSilentFlag(options), ...args);
  };

  const origDmSend = DMChannel.prototype.send;
  DMChannel.prototype.send = function (options, ...args) {
    return origDmSend.call(this, addSilentFlag(options), ...args);
  };

  const origNewsSend = NewsChannel.prototype.send;
  NewsChannel.prototype.send = function (options, ...args) {
    return origNewsSend.call(this, addSilentFlag(options), ...args);
  };

  const origReply = BaseInteraction.prototype.reply;
  BaseInteraction.prototype.reply = function (options, ...args) {
    return origReply.call(this, addSilentFlag(options), ...args);
  };

  const origFollowUp = BaseInteraction.prototype.followUp;
  BaseInteraction.prototype.followUp = function (options, ...args) {
    return origFollowUp.call(this, addSilentFlag(options), ...args);
  };
};

patchSilentMessages();

export const client = new MainClient()

// Initialize PoToken Sync before connecting Moonlink
try {
  // schedulePoTokenSync is async now so we can await it
  await schedulePoTokenSync(process.env.NODELINK_HOST || 'nodelink', process.env.NODELINK_PORT || '2333', process.env.NODELINK_PASSWORD || 'youshallnotpass');
  console.log('🔄 Scheduled PoToken sync with NodeLink');
} catch (err) {
  console.error('❌ Failed to schedule PoToken sync:', err);
}

await connectMoonlink(client)
eventHandler(client)
if(process?.env?.TOPGG_TOKEN)
{
  const topgg= AutoPoster(process.env.TOPGG_TOKEN,client)

topgg.on('posted', () => {
  console.log('Posted stats to Top.gg!')
})
}

// Automatically toggle OFF 24/7 mode if the voice channel is deleted on Discord
client.on('channelDelete', async (channel) => {
  if (!channel || !channel.guild) return;
  try {
    const GuildConfig = (await import('./models/Guild.js')).default;
    const config = await GuildConfig.findOne({ guildId: channel.guild.id });
    if (config && config.settings?.twentyFourSeven?.enabled && config.settings?.twentyFourSeven?.voiceChannelId === channel.id) {
      console.log(`[24/7] 🗑️ Voice channel #${channel.name} deleted in ${channel.guild.name}. Toggling 24/7 mode OFF.`);
      config.settings.twentyFourSeven.enabled = false;
      config.settings.twentyFourSeven.voiceChannelId = null;
      await config.save();

      const player = client.moonlink?.players?.get(channel.guild.id);
      if (player) {
        player.destroy();
      }
    }
  } catch (e) {
    console.error('[24/7] Channel delete listener error:', e.message);
  }
});

client.once('clientReady', async() => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  send_log(`${tick_emoji} ${client.user.tag} Has Successfuly Started And All Modules Are Loaded `);
  await moonlinkInit(client)
  // Initialize Web Server
  try {
    const manager = client.moonlink;
    const webServer = new WebServer(client, manager);
    webServer.start(process.env.BACKEND_PORT || 3001);
    
    // Store webServer reference on client for access in commands
    client.webServer = webServer;
    
    console.log('🌐 Web Dashboard server started successfully!');
  } catch (error) {
    console.error('❌ Failed to start web server:', error);
  }

  // Setup Discord Rich Presence
  await dcrichpresense(client);
  //clear previous commands
  await deleteslash();
  // Deploy commands
  await commands_deploy();
});

await commands_handler(client);

await client.connect();
