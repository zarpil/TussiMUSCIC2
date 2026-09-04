import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  userId: String,
  username: String,
  avatar: String,
  count: { type: Number, default: 0 }
}, { _id: false });

const topSongSchema = new mongoose.Schema({
  title: String,
  author: String,
  artwork: String,
  url: String,
  count: { type: Number, default: 0 }
}, { _id: false });

const historySongSchema = new mongoose.Schema({
  title: String,
  author: String,
  artwork: String,
  url: String,
  duration: Number,
  requestedBy: {
    userId: String,
    username: String,
    avatar: String
  },
  playedAt: { type: Date, default: Date.now }
}, { _id: false });

const guildConfigSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  requestChannel: {
    channelId: { type: String, default: null },
    messageId: { type: String, default: null }
  },
  settings: {
    autoplay: {
      type: Boolean,
      default: false
    },
    volume: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    loopMode: {
      type: String,
      enum: ['off', 'track', 'queue'],
      default: 'off'
    },
    twentyFourSeven: {
      enabled: { type: Boolean, default: false },
      voiceChannelId: { type: String, default: null },
      textChannelId: { type: String, default: null }
    }
  },
  stats: {
    totalVcMs: { type: Number, default: 0 },
    vcConnectedAt: { type: Date, default: null },
    userActivity: [userActivitySchema],
    topSongs: [topSongSchema],
    history: [historySongSchema]
  }
}, {
  timestamps: true
});

export default mongoose.model('GuildConfig', guildConfigSchema);
