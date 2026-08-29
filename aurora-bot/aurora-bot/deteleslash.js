import { REST, Routes } from 'discord.js';
import 'dotenv/config';

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

export default async function deleteslash() {
  try {
    console.log('🧹 Deleting all guild commands...');

    // Fetch existing guild commands
    const guildCommands = await rest.get(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.GUILD_ID)
    );

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

    console.log('✅ All guild commands deleted.');
  } catch (error) {
    console.error('❌ Failed to delete guild commands:', error);
  }
}

deleteslash();