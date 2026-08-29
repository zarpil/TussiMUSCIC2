import express from 'express';
import LikedSong from '../models/LikedSong.js';
import PremiumUser from '../models/PremiumUser.js';
import mongoose from 'mongoose';

const router = express.Router();

async function checkPremiumStatus(userId) {
  try {
    if (mongoose.connection && mongoose.connection.db) {
      const settings = await mongoose.connection.db.collection('settings').findOne({ _id: 'site_config' });
      if (settings && settings.premiumEnabled) {
        // Premium system is active, check user
        const premiumUser = await PremiumUser.findOne({ userId });
        const now = new Date();
        if (premiumUser && (!premiumUser.expiresAt || premiumUser.expiresAt > now)) {
          return true; // Is premium
        }
        return false; // Not premium
      }
    }
  } catch (e) {
    console.error('[Liked Songs API] Error verifying premium status:', e);
  }
  return true; // Default to true (unlocked) if system is inactive
}

// Get all liked songs for a user in a guild
router.get('/:guildId/:userId', async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const likedSongs = await LikedSong.find({ userId, guildId }).sort({ likedAt: -1 });
    res.json(likedSongs);
  } catch (error) {
    console.error('[Liked Songs API] Error fetching liked songs:', error);
    res.status(500).json({ error: 'Failed to fetch liked songs' });
  }
});

// Check if a song is liked
router.get('/:guildId/:userId/check/:identifier', async (req, res) => {
  try {
    const { guildId, userId, identifier } = req.params;
    const liked = await LikedSong.findOne({ 
      userId, 
      guildId, 
      'track.identifier': identifier 
    });
    res.json({ liked: !!liked });
  } catch (error) {
    console.error('[Liked Songs API] Error checking liked song:', error);
    res.status(500).json({ error: 'Failed to check liked song' });
  }
});

// Like a song
router.post('/:guildId/:userId', async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const { track } = req.body;

    // Verify premium status
    const isPremium = await checkPremiumStatus(userId);
    if (!isPremium) {
      return res.status(403).json({ error: '🔒 Liking songs is a Premium-only feature!' });
    }

    // Check if already liked
    const existing = await LikedSong.findOne({
      userId,
      guildId,
      'track.identifier': track.identifier
    });

    if (existing) {
      return res.status(400).json({ error: 'Song already liked' });
    }

    const likedSong = new LikedSong({
      userId,
      guildId,
      track
    });

    await likedSong.save();
    res.json({ success: true, likedSong });
  } catch (error) {
    console.error('[Liked Songs API] Error liking song:', error);
    res.status(500).json({ error: 'Failed to like song' });
  }
});

// Unlike a song
router.delete('/:guildId/:userId/:identifier', async (req, res) => {
  try {
    const { guildId, userId, identifier } = req.params;
    
    const result = await LikedSong.deleteOne({
      userId,
      guildId,
      'track.identifier': identifier
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Liked song not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Liked Songs API] Error unliking song:', error);
    res.status(500).json({ error: 'Failed to unlike song' });
  }
});

export default router;
