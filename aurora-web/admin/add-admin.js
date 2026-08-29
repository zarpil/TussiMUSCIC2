import mongoose from 'mongoose';
import Admin from './models/Admin.js';
import 'dotenv/config';

async function addAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get user input from command line
    const userId = process.argv[2];
    const username = process.argv[3];

    if (!userId || !username) {
      console.log('\n❌ Usage: node add-admin.js <DISCORD_USER_ID> <USERNAME>');
      console.log('\nExample: node add-admin.js 123456789012345678 "YourName#1234"');
      console.log('\n💡 To get your Discord User ID:');
      console.log('   1. Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)');
      console.log('   2. Right-click your username → Copy User ID\n');
      process.exit(1);
    }

    // Check if user is already admin
    const existing = await Admin.findOne({ userId });
    if (existing) {
      console.log(`\n⚠️  User ${username} (${userId}) is already an admin!`);
      console.log(`   Added on: ${existing.addedAt}`);
      console.log(`   Added by: ${existing.addedBy}\n`);
      process.exit(0);
    }

    // Add new admin
    const admin = new Admin({
      userId,
      username,
      addedBy: 'setup-script',
      permissions: ['view_stats', 'manage_servers', 'view_users', 'manage_admins']
    });

    await admin.save();
    
    console.log('\n✅ Admin added successfully!');
    console.log(`   User ID: ${userId}`);
    console.log(`   Username: ${username}`);
    console.log(`   Permissions: ${admin.permissions.join(', ')}`);
    console.log('\n🎉 You can now login to the dashboard and access the admin panel!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

addAdmin();
