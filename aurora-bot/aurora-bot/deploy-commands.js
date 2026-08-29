import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { playcmd } from './commands/music/play.js';
import { pausecmd } from './commands/music/pause.js';
import { stopcmd } from './commands/music/stop.js';
import { loopenablecmd } from './commands/music/repeat.js';
import { skipcmd } from "./commands/music/skip.js";
import { resumecmd } from './commands/music/resume.js';
import { volume_cmd } from './commands/music/volume.js';
import { listqueuecmd } from './commands/music/listqueue.js';
import { invitecmd } from "./utils/invite.js";
import { seekcmd } from './commands/music/seek.js';
import { autoplaycmd } from './commands/music/autoplay.js';
import { shufflecmd } from './commands/music/shuffle.js';
import { weblinkcmd } from './commands/music/weblink.js';
import { redeemcmd } from './commands/music/redeem.js';
dotenv.config();

const commands = [
  playcmd, pausecmd, stopcmd, loopenablecmd, skipcmd, resumecmd, listqueuecmd,
  seekcmd, autoplaycmd, shufflecmd, volume_cmd, weblinkcmd, redeemcmd, invitecmd
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

export default async function commands_deploy() {
  if (!process.env.DISCORD_CLIENT_ID || !process.env.BOT_TOKEN) {
    console.warn('⚠️ Missing DISCORD_CLIENT_ID or BOT_TOKEN for command deployment.');
    return;
  }

  try {
    console.log('⏳ Registering global slash commands...');
    
    // Fetch existing commands to preserve the Activity Entry Point command (type 4)
    let entryPointCommand = null;
    try {
      const existingCommands = await rest.get(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID));
      if (Array.isArray(existingCommands)) {
        entryPointCommand = existingCommands.find(cmd => cmd.type === 4);
      }
    } catch (e) {
      // Ignore if cannot fetch existing commands
    }
    
    // Convert builders to JSON
    const payload = commands.map(c => typeof c?.toJSON === 'function' ? c.toJSON() : c).filter(Boolean);
    
    // Append the entry point command if it exists
    if (entryPointCommand) {
      payload.push(entryPointCommand);
    }

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: payload }
    );
    console.log('✅ Global slash commands registered successfully!');

    // Guild-specific commands only if GUILD_ID is provided
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID,
          process.env.GUILD_ID
        ),
        { body: [invitecmd] }
      );
    }
  } catch (error) {
    console.error('❌ Failed to register commands:', error.message || error);
  }
}