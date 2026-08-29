import express from 'express';
import PremiumUser from '../models/PremiumUser.js';
import PremiumCode from '../models/PremiumCode.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import fetch from 'node-fetch';

// Simple helper to generate random codes: e.g. AUR-XXXX-XXXX
function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `AUR-${part1}-${part2}`;
}

export function setupPremiumRoutes(app) {
  const router = Router();

  function Router() {
    return express.Router();
  }

  // Helper: check if premium system is active (on/off setting)
  const isPremiumSystemActive = async () => {
    try {
      if (mongoose.connection && mongoose.connection.db) {
        const settings = await mongoose.connection.db.collection('settings').findOne({ _id: 'site_config' });
        if (settings && typeof settings.premiumEnabled !== 'undefined') {
          return settings.premiumEnabled;
        }
      }
    } catch (e) {
      console.error('[Premium API] Error reading site settings:', e);
    }
    return false; // Default: OFF (all can use features)
  };

  // Check if a user is premium
  router.get('/check/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const isSystemActive = await isPremiumSystemActive();

      if (!isSystemActive) {
        // If premium toggle is OFF, everyone is treated as premium!
        return res.json({ isPremium: true, systemActive: false });
      }

      const premiumUser = await PremiumUser.findOne({ userId });
      const now = new Date();

      if (premiumUser) {
        // Check expiration
        if (!premiumUser.expiresAt || premiumUser.expiresAt > now) {
          return res.json({ isPremium: true, expiresAt: premiumUser.expiresAt, systemActive: true });
        }
      }

      res.json({ isPremium: false, systemActive: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Redeem a premium code
  router.post('/redeem', async (req, res) => {
    try {
      const { userId, username, code } = req.body;

      if (!userId || !code) {
        return res.status(400).json({ error: 'userId and code are required' });
      }

      const codeDoc = await PremiumCode.findOne({ code: code.toUpperCase() });

      if (!codeDoc) {
        return res.status(404).json({ error: 'Invalid premium code' });
      }

      if (codeDoc.isRedeemed) {
        return res.status(400).json({ error: 'This code has already been redeemed' });
      }

      // Redeem code
      codeDoc.isRedeemed = true;
      codeDoc.redeemedBy = userId;
      codeDoc.redeemedAt = new Date();
      await codeDoc.save();

      // Check if user already has premium
      const existingUser = await PremiumUser.findOne({ userId });
      const durationMs = codeDoc.durationDays * 24 * 60 * 60 * 1000;
      let newExpiresAt = new Date(Date.now() + durationMs);

      if (existingUser) {
        // Extend existing premium
        const currentExpires = existingUser.expiresAt ? new Date(existingUser.expiresAt) : null;
        if (currentExpires && currentExpires > new Date()) {
          newExpiresAt = new Date(currentExpires.getTime() + durationMs);
        }
        existingUser.expiresAt = newExpiresAt;
        existingUser.premiumCode = codeDoc.code;
        if (username) existingUser.username = username;
        await existingUser.save();
      } else {
        // Create new premium user
        const newPremiumUser = new PremiumUser({
          userId,
          username: username || 'Unknown User',
          expiresAt: newExpiresAt,
          premiumCode: codeDoc.code,
          addedBy: 'redeem_code'
        });
        await newPremiumUser.save();
      }

      const client = req.app.get('discordClient');
      if (client?.premiumUsers) {
        client.premiumUsers.add(userId);
      }

      res.json({
        success: true,
        message: `Successfully redeemed code! Premium activated/extended until ${newExpiresAt.toLocaleDateString()}`,
        expiresAt: newExpiresAt
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET all premium users
  router.get('/users/list', async (req, res) => {
    try {
      const users = await PremiumUser.find().sort({ createdAt: -1 });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST add premium user manually
  router.post('/users/add', async (req, res) => {
    try {
      const { userId, username, durationDays, addedBy } = req.body;

      if (!userId || !username) {
        return res.status(400).json({ error: 'userId and username are required' });
      }

      const expiresAt = durationDays && Number(durationDays) > 0
        ? new Date(Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000)
        : null; // null means lifetime

      // Check if already premium user
      let premiumUser = await PremiumUser.findOne({ userId });

      if (premiumUser) {
        premiumUser.expiresAt = expiresAt;
        premiumUser.username = username;
        premiumUser.addedBy = addedBy || 'admin';
        await premiumUser.save();
      } else {
        premiumUser = new PremiumUser({
          userId,
          username,
          expiresAt,
          addedBy: addedBy || 'admin'
        });
        await premiumUser.save();
      }

      const client = req.app.get('discordClient');
      if (client?.premiumUsers) {
        client.premiumUsers.add(userId);
      }

      res.json({ success: true, premiumUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE remove premium user manually
  router.delete('/users/remove/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await PremiumUser.deleteOne({ userId });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Premium user not found' });
      }

      const client = req.app.get('discordClient');
      if (client?.premiumUsers) {
        client.premiumUsers.delete(userId);
      }

      res.json({ success: true, message: 'Premium user removed successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET all premium codes
  router.get('/codes/list', async (req, res) => {
    try {
      const codes = await PremiumCode.find().sort({ createdAt: -1 });
      res.json(codes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST generate premium codes
  router.post('/codes/generate', async (req, res) => {
    try {
      const { durationDays, count, createdBy } = req.body;
      const codeCount = Number(count) || 1;
      const days = Number(durationDays) || 30;

      const generatedDocs = [];

      for (let i = 0; i < codeCount; i++) {
        let code = generateRandomCode();
        // Check uniqueness
        let attempts = 0;
        while (attempts < 5 && await PremiumCode.findOne({ code })) {
          code = generateRandomCode();
          attempts++;
        }

        const newCode = new PremiumCode({
          code,
          durationDays: days,
          createdBy: createdBy || 'admin'
        });

        await newCode.save();
        generatedDocs.push(newCode);
      }

      res.json({ success: true, count: generatedDocs.length, codes: generatedDocs });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE remove premium code
  router.delete('/codes/remove/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const result = await PremiumCode.deleteOne({ code: code.toUpperCase() });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Premium code not found' });
      }

      res.json({ success: true, message: 'Premium code removed successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/checkout/create-order', async (req, res) => {
    try {
      const { coupon, userId, username } = req.body;
      let keyId = process.env.RAZORPAY_KEY_ID;
      let keySecret = process.env.RAZORPAY_KEY_SECRET;
      let supportLink = process.env.SUPPORT_SERVER_LINK || 'https://discord.gg/jPrg8Zhb4';
      let price = 299; // Default 299
      let currency = 'INR';

      // Read from DB settings if exists
      if (mongoose.connection && mongoose.connection.db) {
        const settings = await mongoose.connection.db.collection('settings').findOne({ _id: 'site_config' });
        if (settings) {
          if (settings.razorpayKeyId) keyId = settings.razorpayKeyId;
          if (settings.razorpayKeySecret) keySecret = settings.razorpayKeySecret;
          if (settings.premiumSupportLink) supportLink = settings.premiumSupportLink;
          if (typeof settings.premiumPrice !== 'undefined' && settings.premiumPrice !== null) price = Number(settings.premiumPrice);
          if (settings.premiumCurrency) currency = settings.premiumCurrency;
        }
      }

      // Apply coupon code discounts
      let discountPercent = 0;
      if (coupon) {
        const couponClean = coupon.toUpperCase().trim();
        if (couponClean === 'TUSSI50' || couponClean === 'AURORA50') {
          discountPercent = 50;
        } else if (couponClean === 'TUSSI100' || couponClean === 'AURORA100' || couponClean === 'FREEPREM') {
          discountPercent = 100;
        }
      }

      const finalPrice = Math.max(0, price - (price * discountPercent / 100));

      if (discountPercent === 100) {
        if (!userId) {
          return res.status(400).json({ error: 'User ID is required for 100% coupon activation' });
        }
        // Activate Premium instantly (30 days)
        const durationMs = 30 * 24 * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + durationMs);

        const existingUser = await PremiumUser.findOne({ userId });
        if (existingUser) {
          existingUser.expiresAt = expiresAt;
          existingUser.premiumCode = `COUPON_${coupon.toUpperCase()}`;
          if (username) existingUser.username = username;
          await existingUser.save();
        } else {
          const newPremiumUser = new PremiumUser({
            userId,
            username: username || 'Premium User',
            expiresAt,
            premiumCode: `COUPON_${coupon.toUpperCase()}`,
            addedBy: 'coupon_redeem'
          });
          await newPremiumUser.save();
        }
        return res.json({ success: true, activated: true });
      }

      if (!keyId || !keySecret) {
        // Razorpay not configured: instruct client to redirect to support server
        return res.json({ requiresSupportLink: true, supportLink });
      }

      // Call Razorpay API to create order
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          amount: Math.round(finalPrice * 100),
          currency: currency || 'INR',
          receipt: `rcpt_prem_${Date.now()}`
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        console.error('[Razorpay Order Error]', errData);
        return res.json({ requiresSupportLink: true, supportLink });
      }

      const orderData = await response.json();
      res.json({
        success: true,
        orderId: orderData.id,
        keyId,
        amount: orderData.amount
      });
    } catch (error) {
      console.error('[Premium Checkout Error]', error);
      res.json({
        requiresSupportLink: true,
        supportLink: process.env.SUPPORT_SERVER_LINK || 'https://discord.gg/jPrg8Zhb4'
      });
    }
  });

  // POST Verify Razorpay Signature
  router.post('/checkout/verify', async (req, res) => {
    try {
      const { userId, username, paymentId, orderId, signature } = req.body;
      let keySecret = process.env.RAZORPAY_KEY_SECRET;

      // Read from DB settings if exists
      if (mongoose.connection && mongoose.connection.db) {
        const settings = await mongoose.connection.db.collection('settings').findOne({ _id: 'site_config' });
        if (settings && settings.razorpayKeySecret) {
          keySecret = settings.razorpayKeySecret;
        }
      }

      if (!keySecret) {
        return res.status(500).json({ error: 'Razorpay keys not configured' });
      }

      const hmac = crypto.createHmac('sha256', keySecret);
      hmac.update(`${orderId}|${paymentId}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== signature) {
        return res.status(400).json({ error: 'Invalid signature verification failed' });
      }

      // Successfully verified. Activate premium status (30 days)
      const durationMs = 30 * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + durationMs);

      let premiumUser = await PremiumUser.findOne({ userId });

      if (premiumUser) {
        const currentExpires = premiumUser.expiresAt ? new Date(premiumUser.expiresAt) : null;
        const baseTime = (currentExpires && currentExpires > new Date()) ? currentExpires.getTime() : Date.now();
        premiumUser.expiresAt = new Date(baseTime + durationMs);
        if (username) premiumUser.username = username;
        premiumUser.addedBy = 'razorpay_checkout';
        await premiumUser.save();
      } else {
        premiumUser = new PremiumUser({
          userId,
          username: username || 'Unknown User',
          expiresAt,
          addedBy: 'razorpay_checkout'
        });
        await premiumUser.save();
      }

      res.json({
        success: true,
        message: 'Payment verified and Premium activated successfully!',
        expiresAt
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.use('/api/premium', router);
}
