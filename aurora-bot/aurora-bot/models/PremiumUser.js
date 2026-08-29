import mongoose from 'mongoose';

const premiumUserSchema = new mongoose.Schema({
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
  expiresAt: {
    type: Date,
    default: null // null means lifetime
  },
  premiumCode: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('PremiumUser', premiumUserSchema);
