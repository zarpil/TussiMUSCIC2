import mongoose from 'mongoose';

const lyricsSchema = new mongoose.Schema({
  trackIdentifier: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  lyrics: [{
    id: Number,
    time: Number, // in seconds
    text: String
  }],
  synced: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    default: 'deezer'
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// TTL index to auto-delete old lyrics after 30 days
lyricsSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('Lyrics', lyricsSchema);
