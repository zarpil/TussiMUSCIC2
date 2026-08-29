import { REST, Routes } from 'discord.js';
import 'dotenv/config';

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

export default async function deleteslash() {
  if (!process.env.GUILD_ID || !process.env.DISCORD_CLIENT_ID) {
    return;
  }

  try {
    console.log(`🧹 Deleting commands for guild ${process.env.GUILD_ID}...`);

    const guildCommands = await rest.get(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.GUILD_ID)
    );

    if (Array.isArray(guildCommands)) {
      for (const command of guildCommands) {
        await rest.delete(
          Routes.applicationGuildCommand(
            process.env.DISCORD_CLIENT_ID,
            process.env.GUILD_ID,
            command.id
          )
        );
        console.log(`🗑️ Deleted guild command: ${command.name}`);
      }
    }

    console.log('✅ Guild commands cleaned.');
  } catch (error) {
    console.error('❌ Failed to delete guild commands:', error.message);
  }
}