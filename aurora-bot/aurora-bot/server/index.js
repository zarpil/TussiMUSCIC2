import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import SocketHandler from './socketHandler.js';
import { setupAPIRoutes } from './api.js';
import { setupAdminRoutes } from './adminApi.js';
import { setupLyricsRoutes } from './lyricsApi.js';
import { setupUserGuildsRoutes } from './userGuildsApi.js';
import { setupSessionRoutes } from './sessionApi.js';
import likedSongsRouter from './likedSongsApi.js';
import playlistRouter from './playlistApi.js';
import { loadEmojisFromDB } from '../emoji/emoji.js';
import { setupPremiumRoutes } from './premiumApi.js';

class WebServer {
  constructor(client, manager) {
    this.client = client;
    this.manager = manager;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-User-Id']
      }
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.connectDatabase();
  }

  setupMiddleware() {
    this.app.use(cors({
      origin: function (origin, callback) {
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-User-Id']
    }));
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Store Discord client reference for API access
    this.app.set('discordClient', this.client);

    // Setup Session routes (must be first for auth)
    setupSessionRoutes(this.app);
    
    // Setup API routes with socketHandler getter
    setupAPIRoutes(this.app, this.client, this.manager, () => this.socketHandler);
    
    // Setup Admin routes
    setupAdminRoutes(this.app);

    // Setup Premium routes
    setupPremiumRoutes(this.app);
    
    // Setup Lyrics routes (fallback REST API, primary method is Socket.io events)
    setupLyricsRoutes(this.app);
    
    // Setup User Guilds routes
    setupUserGuildsRoutes(this.app);
    
    // Setup Liked Songs routes
    this.app.use('/api/liked-songs', likedSongsRouter);
    
    // Setup Playlists routes
    this.app.use('/api/playlists', playlistRouter);
  }

  async connectDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('[MongoDB] Connected successfully');
      await loadEmojisFromDB();
      
      // Load premium users cache, database nodes, and restore active player states
      const { initializeDbFeatures } = await import('../moonlink/moonlink.js');
      await initializeDbFeatures(this.client);
    } catch (error) {
      console.error('[MongoDB] Connection error:', error.message);
      console.log('[MongoDB] The bot will continue running, but /setup command will not work until MongoDB is connected.');
    }
  }

  start(port = 3001) {
    this.socketHandler = new SocketHandler(this.io, this.client, this.manager);
    
    this.server.listen(port, '0.0.0.0', () => {
      console.log(`[Web Server] Running on http://0.0.0.0:${port}`);
      console.log(`[Web Server] CORS enabled for: ${process.env.WEB_DASHBOARD_URL || 'http://localhost:3000'}`);
      console.log(`[Web Server] Test the API: curl http://localhost:${port}/health`);
    });
  }
}

export default WebServer;
