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
import {invitecmd} from "./utils/invite.js"
import { seekcmd } from './commands/music/seek.js';
import { autoplaycmd } from './commands/music/autoplay.js';
import { shufflecmd } from './commands/music/shuffle.js';
import { weblinkcmd } from './commands/music/weblink.js';
import { redeemcmd } from './commands/music/redeem.js';
dotenv.config();

const commands = [
  playcmd, pausecmd, stopcmd, loopenablecmd, skipcmd, resumecmd, listqueuecmd,
  seekcmd, autoplaycmd, shufflecmd, volume_cmd, weblinkcmd, redeemcmd
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

export default async function commands_deploy() {
  try {
    console.log('⏳ Registering global slash commands...');
    
    // Fetch existing commands to preserve the Activity Entry Point command (type 4)
    const existingCommands = await rest.get(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID));
    const entryPointCommand = existingCommands.find(cmd => cmd.type === 4);
    
    // Convert builders to JSON
    const payload = commands.map(c => typeof c.toJSON === 'function' ? c.toJSON() : c);
    
    // Append the entry point command if it exists
    if (entryPointCommand) {
      payload.push(entryPointCommand);
    }

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), // <-- Global commands, no guild ID
      { body: payload }
    );
      
      await rest.put(
  Routes.applicationGuildCommands(
    process.env.DISCORD_CLIENT_ID,
    process.env.GUILD_ID
  ),
  { body: [invitecmd]}
);
    console.log('✅ Global slash commands registered!');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
}