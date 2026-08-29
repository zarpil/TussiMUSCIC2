import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  addedBy: {
    type: String,
    default: 'system'
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  permissions: {
    type: [String],
    default: ['view_stats', 'manage_servers', 'view_users']
  }
}, {
  timestamps: true
});

export default mongoose.model('Admin', adminSchema);
