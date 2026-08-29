import mongoose from 'mongoose';

const premiumCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  durationDays: {
    type: Number,
    required: true,
    default: 30 // duration of premium in days
  },
  isRedeemed: {
    type: Boolean,
    default: false
  },
  redeemedBy: {
    type: String, // userId
    default: null
  },
  redeemedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

export default mongoose.model('PremiumCode', premiumCodeSchema);
