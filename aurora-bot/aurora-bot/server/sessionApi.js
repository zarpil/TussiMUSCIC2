import express from 'express';
import Session from '../models/Session.js';

export function setupSessionRoutes(app) {
  const router = express.Router();

  // Create session
  router.post('/auth/session', async (req, res) => {
    try {
      const { sessionId, userId, username, discriminator, avatar } = req.body;
      
      if (!sessionId || !userId || !username) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Delete any existing sessions for this user
      await Session.deleteMany({ userId });

      // Create new session
      const session = new Session({
        sessionId,
        userId,
        username,
        discriminator,
        avatar
      });

      await session.save();
      
      console.log(`[Session] Created session for user ${userId}`);
      res.json({ success: true });
    } catch (error) {
      console.error('[Session] Error creating session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get session
  router.get('/auth/session/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = await Session.findOne({ sessionId });
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({
        id: session.userId,
        username: session.username,
        discriminator: session.discriminator,
        avatar: session.avatar
      });
    } catch (error) {
      console.error('[Session] Error getting session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete session (logout)
  router.delete('/auth/session/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      await Session.deleteOne({ sessionId });
      
      console.log(`[Session] Deleted session ${sessionId}`);
      res.json({ success: true });
    } catch (error) {
      console.error('[Session] Error deleting session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.use('/api', router);
}
