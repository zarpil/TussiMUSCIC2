import mongoose from 'mongoose';

const likedSongSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  guildId: {
    type: String,
    required: true,
    index: true
  },
  track: {
    title: {
      type: String,
      required: true
    },
    author: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    artwork: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: false
    },
    identifier: {
      type: String,
      required: true
    }
  },
  likedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
likedSongSchema.index({ userId: 1, guildId: 1, 'track.identifier': 1 }, { unique: true });

const LikedSong = mongoose.model('LikedSong', likedSongSchema);

export default LikedSong;
