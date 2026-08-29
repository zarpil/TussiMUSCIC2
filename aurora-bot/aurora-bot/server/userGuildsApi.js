import express from 'express';

export function setupUserGuildsRoutes(app) {
  const router = express.Router();

  // Get user's guilds from Discord (optimized version)
  router.get('/user-guilds/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const client = app.get('discordClient');
      if (!client) {
        return res.status(500).json({ error: 'Discord client not available' });
      }

      console.log(`[User Guilds API] Checking guilds for user ${userId}`);
      console.log(`[User Guilds API] Bot is in ${client.guilds.cache.size} guilds`);

      const userGuilds = [];
      
      // Use Promise.all for parallel processing with timeout
      const guildChecks = Array.from(client.guilds.cache.values()).map(async (guild) => {
        try {
          // First check cache
          let member = guild.members.cache.get(userId);
          
          // If not in cache, try to fetch
          if (!member) {
            try {
              member = await guild.members.fetch(userId);
            } catch (fetchError) {
              // User is not a member of this guild
              return null;
            }
          }
          
          if (member) {
            return {
              id: guild.id,
              name: guild.name,
              icon: guild.iconURL(),
            };
          }
          return null;
        } catch (error) {
          console.error(`[User Guilds API] Error checking guild ${guild.id}:`, error.message);
          return null;
        }
      });

      // Wait for all checks with a timeout
      const results = await Promise.race([
        Promise.all(guildChecks),
        new Promise((resolve) => setTimeout(() => resolve([]), 10000)) // 10 second timeout
      ]);

      // Filter out null results
      const validGuilds = results.filter(g => g !== null);
      
      console.log(`[User Guilds API] User is in ${validGuilds.length} guilds with the bot`);
      
      res.json(validGuilds);
    } catch (error) {
      console.error('[User Guilds API] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.use('/api', router);
}
