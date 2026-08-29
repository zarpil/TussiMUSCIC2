import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  userId: { type: String, required: true },
  creatorName: { type: String, required: true },
  creatorAvatar: { type: String, default: null },
  isPublic: { type: Boolean, default: false },
  tracks: [{
    title: String,
    author: String,
    duration: Number,
    artwork: String,
    url: String,
    identifier: String
  }],
  coverImage: { type: String, default: 'https://via.placeholder.com/400' },
  likes: [{ type: String }],
  tags: [{ type: String }],
  comments: [{
    id: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    avatar: { type: String, default: null },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: String }],
    replies: [{
      id: { type: String, required: true },
      userId: { type: String, required: true },
      username: { type: String, required: true },
      avatar: { type: String, default: null },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      likes: [{ type: String }]
    }]
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Playlist = mongoose.models.Playlist || mongoose.model('Playlist', playlistSchema);

export default Playlist;
