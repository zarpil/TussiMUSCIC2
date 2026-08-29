import mongoose from 'mongoose';

const trackStateSchema = new mongoose.Schema({
  encoded: { type: String, required: true },
  requester: { type: mongoose.Schema.Types.Mixed },
  position: { type: Number, default: 0 }
}, { _id: false });

const playerStateSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  voiceChannelId: {
    type: String,
    required: true
  },
  textChannelId: {
    type: String,
    default: null
  },
  currentTrack: {
    type: trackStateSchema,
    default: null
  },
  queue: {
    type: [trackStateSchema],
    default: []
  },
  loop: {
    type: String,
    enum: ['off', 'track', 'queue'],
    default: 'off'
  },
  volume: {
    type: Number,
    default: 100
  },
  paused: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('PlayerState', playerStateSchema);
