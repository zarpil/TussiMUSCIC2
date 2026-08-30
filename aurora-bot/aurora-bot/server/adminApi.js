import express from 'express';
import Admin from '../models/Admin.js';

export function setupAdminRoutes(app) {
  const router = express.Router();

  // Ensure default admin user (1018617208554934332) exists in MongoDB on startup
  (async () => {
    try {
      const defaultAdminId = process.env.INITIAL_ADMIN_ID || '1018617208554934332';
      const existing = await Admin.findOne({ userId: defaultAdminId });
      if (!existing) {
        await Admin.create({
          userId: defaultAdminId,
          username: 'zarpil',
          addedBy: 'auto-seed',
          permissions: ['view_stats', 'manage_servers', 'view_users', 'manage_admins']
        });
        console.log(`[Admin Seed] Successfully registered ${defaultAdminId} as Admin in MongoDB!`);
      }
    } catch (e) {
      console.error('[Admin Seed] Error seeding admin:', e.message);
    }
  })();

  // Check if user is admin
  router.get('/check/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const admin = await Admin.findOne({ userId });
      
      res.json({ 
        isAdmin: !!admin,
        admin: admin ? {
          userId: admin.userId,
          username: admin.username,
          permissions: admin.permissions,
          addedAt: admin.addedAt
        } : null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all admins
  router.get('/list', async (req, res) => {
    try {
      const admins = await Admin.find().sort({ addedAt: -1 });
      res.json(admins);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add new admin
  router.post('/add', async (req, res) => {
    try {
      const { userId, username, addedBy } = req.body;
      
      if (!userId || !username) {
        return res.status(400).json({ error: 'userId and username are required' });
      }

      // Check if already admin
      const existing = await Admin.findOne({ userId });
      if (existing) {
        return res.status(400).json({ error: 'User is already an admin' });
      }

      const admin = new Admin({
        userId,
        username,
        addedBy: addedBy || 'system'
      });

      await admin.save();
      res.json({ success: true, admin });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove admin
  router.delete('/remove/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const result = await Admin.deleteOne({ userId });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      res.json({ success: true, message: 'Admin removed successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update admin permissions
  router.patch('/permissions/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { permissions } = req.body;

      const admin = await Admin.findOneAndUpdate(
        { userId },
        { permissions },
        { new: true }
      );

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      res.json({ success: true, admin });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all nodelink nodes & active statuses (combining config.json and MongoDB database nodes)
  router.get('/nodelink/nodes', async (req, res) => {
    try {
      const NodelinkNode = (await import('../models/NodelinkNode.js')).default;
      const dbNodes = await NodelinkNode.find().sort({ createdAt: -1 });
      
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const configPath = path.join(__dirname, '../config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      const client = req.app.get('discordClient');
      
      // Start with config.json nodes
      const mergedNodes = new Map();
      if (config.nodelink?.nodes) {
        for (const n of config.nodelink.nodes) {
          const activeNode = client?.moonlink?.nodes?.nodes?.get(n.identifier);
          mergedNodes.set(n.identifier, {
            id: 'config_' + n.identifier,
            identifier: n.identifier,
            host: n.host,
            port: Number(n.port),
            password: n.password,
            secure: n.secure ?? false,
            userType: 'all',
            priority: n.priority ?? 1,
            isActive: true,
            isConfigJson: true,
            connected: activeNode ? activeNode.connected : false,
            stats: activeNode ? activeNode.stats : null
          });
        }
      }

      // Override or add database nodes
      for (const dbNode of dbNodes) {
        const activeNode = client?.moonlink?.nodes?.nodes?.get(dbNode.identifier);
        mergedNodes.set(dbNode.identifier, {
          id: dbNode._id,
          identifier: dbNode.identifier,
          host: dbNode.host,
          port: dbNode.port,
          password: dbNode.password,
          secure: dbNode.secure,
          userType: dbNode.userType,
          priority: dbNode.priority,
          isActive: dbNode.isActive,
          isConfigJson: false,
          connected: activeNode ? activeNode.connected : false,
          stats: activeNode ? activeNode.stats : null
        });
      }

      res.json(Array.from(mergedNodes.values()));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add new nodelink node
  router.post('/nodelink/nodes', async (req, res) => {
    try {
      const { identifier, host, port, password, secure, userType, priority } = req.body;
      if (!identifier || !host || !port || !password) {
        return res.status(400).json({ error: 'identifier, host, port, and password are required' });
      }
      
      const NodelinkNode = (await import('../models/NodelinkNode.js')).default;
      const existing = await NodelinkNode.findOne({ identifier });
      if (existing) {
        return res.status(400).json({ error: `Node with identifier '${identifier}' already exists.` });
      }
      
      const dbNode = new NodelinkNode({
        identifier,
        host,
        port: Number(port),
        password,
        secure: !!secure,
        userType: userType || 'all',
        priority: Number(priority) || 1,
        isActive: true
      });
      await dbNode.save();
      
      // Dynamically add to moonlink
      const client = req.app.get('discordClient');
      if (client?.moonlink) {
        try {
          client.moonlink.nodes.add({
            identifier,
            host,
            port: Number(port),
            password,
            secure: !!secure,
            priority: Number(priority) || 1
          });
          const node = client.moonlink.nodes.nodes.get(identifier);
          if (node) {
            node.userType = userType || 'all';
            node.priority = Number(priority) || 1;
            await node.connect();
          }
        } catch (err) {
          console.error('[Moonlink Dynamic Add] Error adding node:', err.message);
        }
      }
      
      res.json({ success: true, node: dbNode });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update nodelink node (handles database overrides for config.json nodes too)
  router.put('/nodelink/nodes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { identifier, host, port, password, secure, userType, priority, isActive } = req.body;
      
      const NodelinkNode = (await import('../models/NodelinkNode.js')).default;
      let dbNode;
      let oldIdentifier;

      if (id.startsWith('config_')) {
        oldIdentifier = id.substring(7);
        dbNode = await NodelinkNode.findOne({ identifier: oldIdentifier });
        if (!dbNode) {
          dbNode = new NodelinkNode({
            identifier: oldIdentifier,
            host: host,
            port: Number(port),
            password: password,
            secure: secure,
            userType: userType || 'all',
            priority: Number(priority) || 1,
            isActive: isActive !== undefined ? !!isActive : true
          });
        }
      } else {
        dbNode = await NodelinkNode.findById(id);
      }

      if (!dbNode) {
        return res.status(404).json({ error: 'Node not found' });
      }

      oldIdentifier = oldIdentifier || dbNode.identifier;
      
      dbNode.identifier = identifier || dbNode.identifier;
      dbNode.host = host || dbNode.host;
      dbNode.port = port !== undefined ? Number(port) : dbNode.port;
      dbNode.password = password || dbNode.password;
      dbNode.secure = secure !== undefined ? !!secure : dbNode.secure;
      dbNode.userType = userType || dbNode.userType;
      dbNode.priority = priority !== undefined ? Number(priority) : dbNode.priority;
      dbNode.isActive = isActive !== undefined ? !!isActive : dbNode.isActive;
      
      await dbNode.save();
      
      // Update moonlink node dynamically
      const client = req.app.get('discordClient');
      if (client?.moonlink) {
        try {
          // Remove old node
          client.moonlink.nodes.remove(oldIdentifier);
          
          if (dbNode.isActive) {
            // Re-add and connect if active
            client.moonlink.nodes.add({
              identifier: dbNode.identifier,
              host: dbNode.host,
              port: dbNode.port,
              password: dbNode.password,
              secure: dbNode.secure,
              priority: dbNode.priority
            });
            const node = client.moonlink.nodes.nodes.get(dbNode.identifier);
            if (node) {
              node.userType = dbNode.userType;
              node.priority = dbNode.priority;
              await node.connect();
            }
          }
        } catch (err) {
          console.error('[Moonlink Dynamic Update] Error updating node:', err.message);
        }
      }
      
      res.json({ success: true, node: dbNode });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete nodelink node (deactivates config.json nodes via override DB document)
  router.delete('/nodelink/nodes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const NodelinkNode = (await import('../models/NodelinkNode.js')).default;
      let dbNode;
      let identifier;

      if (id.startsWith('config_')) {
        identifier = id.substring(7);
        dbNode = await NodelinkNode.findOne({ identifier });
        if (!dbNode) {
          const fs = await import('fs');
          const path = await import('path');
          const { fileURLToPath } = await import('url');
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          const configPath = path.join(__dirname, '../config.json');
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          const confNode = config.nodelink?.nodes?.find(n => n.identifier === identifier);

          dbNode = new NodelinkNode({
            identifier,
            host: confNode?.host || 'localhost',
            port: Number(confNode?.port) || 3008,
            password: confNode?.password || 'youshallnotpass',
            secure: confNode?.secure ?? false,
            isActive: false
          });
        } else {
          dbNode.isActive = false;
        }
        await dbNode.save();
      } else {
        dbNode = await NodelinkNode.findById(id);
        if (dbNode) {
          identifier = dbNode.identifier;
          await NodelinkNode.deleteOne({ _id: id });
        }
      }

      if (!dbNode) {
        return res.status(404).json({ error: 'Node not found' });
      }
      
      // Remove from moonlink
      const client = req.app.get('discordClient');
      if (client?.moonlink) {
        try {
          client.moonlink.nodes.remove(identifier);
        } catch (err) {
          console.error('[Moonlink Dynamic Delete] Error deleting node:', err.message);
        }
      }
      
      res.json({ success: true, message: 'Node deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.use('/api/admin', router);
}
