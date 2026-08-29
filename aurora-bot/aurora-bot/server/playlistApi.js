import express from 'express';
import Playlist from './models/Playlist.js';
import PremiumUser from '../models/PremiumUser.js';
import Session from '../models/Session.js';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

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
    console.error('[Playlist API] Error verifying premium status:', e);
  }
  return true; // Default to true (unlocked) if system is inactive
}

// Helper to update playlist creators dynamically from Session cache / Discord client
async function populateLatestCreators(playlists, client = null) {
  try {
    const userIds = [...new Set(playlists.map(p => p.userId))];
    const sessions = await Session.find({ userId: { $in: userIds } });
    const sessionMap = new Map(sessions.map(s => [s.userId, s]));

    const populated = [];
    for (const p of playlists) {
      const plObj = p.toObject ? p.toObject() : p;
      const session = sessionMap.get(p.userId);
      
      let resolvedUsername = null;
      let resolvedAvatar = null;
      
      if (session) {
        resolvedUsername = session.username;
        const ext = session.avatar?.startsWith('a_') ? 'gif' : 'png';
        resolvedAvatar = session.avatar 
          ? `https://cdn.discordapp.com/avatars/${p.userId}/${session.avatar}.${ext}`
          : (p.userId ? `https://cdn.discordapp.com/embed/avatars/${parseInt(p.userId.slice(-4)) % 5}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png');
      }

      if (!resolvedUsername && client && p.userId) {
        try {
          const user = await client.users.fetch(p.userId);
          if (user) {
            resolvedUsername = user.username;
            const ext = user.avatar?.startsWith('a_') ? 'gif' : 'png';
            resolvedAvatar = user.avatar 
              ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}`
              : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id.slice(-4)) % 5}.png`;
          }
        } catch (fetchErr) {
          console.warn(`[Playlist API] Failed to fetch Discord user ${p.userId}:`, fetchErr.message);
        }
      }

      if (resolvedUsername) {
        plObj.creatorName = resolvedUsername;
        plObj.creatorAvatar = resolvedAvatar;
      }
      populated.push(plObj);
    }
    return populated;
  } catch (e) {
    console.error('[Playlist API] Error in populateLatestCreators:', e);
    return playlists.map(p => p.toObject ? p.toObject() : p);
  }
}

// Get public playlists
router.get('/public', async (req, res) => {
  try {
    const playlists = await Playlist.find({ isPublic: true }).sort({ createdAt: -1 });
    const client = req.app.get('discordClient');
    const populated = await populateLatestCreators(playlists, client);
    res.json(populated);
  } catch (error) {
    console.error('[Playlists] Error fetching public playlists:', error);
    res.status(500).json({ error: 'Failed to fetch public playlists' });
  }
});

// Get user playlists
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const playlists = await Playlist.find({ userId }).sort({ createdAt: -1 });
    const client = req.app.get('discordClient');
    const populated = await populateLatestCreators(playlists, client);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user playlists' });
  }
});

// Create playlist
router.post('/create', async (req, res) => {
  try {
    const { name, description, isPublic, userId, creatorName, creatorAvatar, tracks, coverImage, tags } = req.body;
    
    if (!name || !userId) {
      return res.status(400).json({ error: 'Name and userId are required' });
    }

    // Verify premium status
    const isPremium = await checkPremiumStatus(userId);
    if (!isPremium) {
      return res.status(403).json({ error: '🔒 Creating playlists is a Premium-only feature!' });
    }

    let actualCreatorName = creatorName || 'Unknown';
    let actualCreatorAvatar = creatorAvatar || null;

    try {
      const session = await Session.findOne({ userId });
      if (session) {
        actualCreatorName = session.username;
        const ext = session.avatar?.startsWith('a_') ? 'gif' : 'png';
        actualCreatorAvatar = session.avatar 
          ? `https://cdn.discordapp.com/avatars/${userId}/${session.avatar}.${ext}`
          : (userId ? `https://cdn.discordapp.com/embed/avatars/${parseInt(userId.slice(-4)) % 5}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png');
      }
    } catch (e) {}

    // If session lookup yielded default/unknown, use Discord API client to fetch user profile dynamically
    if ((actualCreatorName === 'User' || actualCreatorName === 'Unknown') && userId) {
      const client = req.app.get('discordClient');
      if (client) {
        try {
          const user = await client.users.fetch(userId);
          if (user) {
            actualCreatorName = user.username;
            const ext = user.avatar?.startsWith('a_') ? 'gif' : 'png';
            actualCreatorAvatar = user.avatar 
              ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}`
              : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id.slice(-4)) % 5}.png`;
          }
        } catch (e) {
          console.error('[Playlist API] Discord user fetch error on playlist creation:', e.message);
        }
      }
    }

    const playlist = new Playlist({
      id: uuidv4(),
      name,
      description,
      isPublic,
      userId,
      creatorName: actualCreatorName,
      creatorAvatar: actualCreatorAvatar,
      tracks: tracks || [],
      coverImage: coverImage || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
      tags: tags || [],
      likes: [],
      comments: []
    });

    await playlist.save();
    res.status(201).json(playlist);
  } catch (error) {
    console.error('[Playlists] Error creating playlist:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Get single playlist
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ id: req.params.id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    const client = req.app.get('discordClient');
    const populated = await populateLatestCreators([playlist], client);
    res.json(populated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

// Add track to playlist
router.post('/:id/tracks', async (req, res) => {
  try {
    const { track } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verify premium status
    const isPremium = await checkPremiumStatus(userId);
    if (!isPremium) {
      return res.status(403).json({ error: '🔒 Editing playlists is a Premium-only feature!' });
    }
    
    const playlist = await Playlist.findOne({ id: req.params.id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    
    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to modify this playlist' });
    }

    playlist.tracks.push(track);
    playlist.updatedAt = Date.now();
    await playlist.save();
    
    res.json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add track' });
  }
});

// Remove track from playlist
router.delete('/:id/tracks/:trackIndex', async (req, res) => {
  try {
    const { id, trackIndex } = req.params;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Verify premium status
    const isPremium = await checkPremiumStatus(userId);
    if (!isPremium) {
      return res.status(403).json({ error: '🔒 Editing playlists is a Premium-only feature!' });
    }
    
    const playlist = await Playlist.findOne({ id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    
    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to modify this playlist' });
    }

    playlist.tracks.splice(parseInt(trackIndex), 1);
    playlist.updatedAt = Date.now();
    await playlist.save();
    
    res.json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove track' });
  }
});

// Delete playlist
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    
    const playlist = await Playlist.findOne({ id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    
    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this playlist' });
    }

    await Playlist.deleteOne({ id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

// Toggle privacy
router.patch('/:id/privacy', async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    const userId = req.headers['x-user-id'];
    
    const playlist = await Playlist.findOne({ id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    
    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    playlist.isPublic = isPublic;
    playlist.updatedAt = Date.now();
    await playlist.save();
    
    res.json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update privacy' });
  }
});

// Toggle playlist like
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const playlist = await Playlist.findOne({ id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    const likeIndex = playlist.likes.indexOf(userId);
    if (likeIndex > -1) {
      playlist.likes.splice(likeIndex, 1);
    } else {
      playlist.likes.push(userId);
    }

    playlist.updatedAt = Date.now();
    await playlist.save();
    res.json({ success: true, likes: playlist.likes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Update tags
router.post('/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;
    const userId = req.headers['x-user-id'];

    const playlist = await Playlist.findOne({ id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    if (playlist.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    playlist.tags = tags || [];
    playlist.updatedAt = Date.now();
    await playlist.save();
    res.json({ success: true, tags: playlist.tags });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tags' });
  }
});

// Add comment
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, username, avatar } = req.body;
    const userId = req.headers['x-user-id'];
    if (!userId || !text || !username) return res.status(400).json({ error: 'Missing fields' });

    const playlist = await Playlist.findOne({ id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    const comment = {
      id: uuidv4(),
      userId,
      username,
      avatar: avatar || null,
      text,
      createdAt: Date.now(),
      likes: [],
      replies: []
    };

    playlist.comments.push(comment);
    playlist.updatedAt = Date.now();
    await playlist.save();
    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete comment
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.headers['x-user-id'];
    const isAdmin = req.headers['x-is-admin'] === 'true';

    const playlist = await Playlist.findOne({ id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    const commentIndex = playlist.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return res.status(404).json({ error: 'Comment not found' });

    const comment = playlist.comments[commentIndex];
    if (comment.userId !== userId && playlist.userId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    playlist.comments.splice(commentIndex, 1);
    playlist.updatedAt = Date.now();
    await playlist.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Toggle comment like
router.post('/:id/comments/:commentId/like', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const playlist = await Playlist.findOne({ id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    const comment = playlist.comments.find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const likeIndex = comment.likes.indexOf(userId);
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId);
    }

    playlist.updatedAt = Date.now();
    await playlist.save();
    res.json({ success: true, likes: comment.likes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle comment like' });
  }
});

// Add reply
router.post('/:id/comments/:commentId/reply', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text, username, avatar } = req.body;
    const userId = req.headers['x-user-id'];
    if (!userId || !text || !username) return res.status(400).json({ error: 'Missing fields' });

    const playlist = await Playlist.findOne({ id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    const comment = playlist.comments.find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const reply = {
      id: uuidv4(),
      userId,
      username,
      avatar: avatar || null,
      text,
      createdAt: Date.now(),
      likes: []
    };

    comment.replies.push(reply);
    playlist.updatedAt = Date.now();
    await playlist.save();
    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// Delete reply
router.delete('/:id/comments/:commentId/reply/:replyId', async (req, res) => {
  try {
    const { id, commentId, replyId } = req.params;
    const userId = req.headers['x-user-id'];
    const isAdmin = req.headers['x-is-admin'] === 'true';

    const playlist = await Playlist.findOne({ id });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    const comment = playlist.comments.find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const replyIndex = comment.replies.findIndex(r => r.id === replyId);
    if (replyIndex === -1) return res.status(404).json({ error: 'Reply not found' });

    const reply = comment.replies[replyIndex];
    if (reply.userId !== userId && comment.userId !== userId && playlist.userId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    comment.replies.splice(replyIndex, 1);
    playlist.updatedAt = Date.now();
    await playlist.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete reply' });
  }
});

export default router;
