import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  discriminator: {
    type: String
  },
  avatar: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // 7 days in seconds
  }
});

export default mongoose.model('Session', sessionSchema);
