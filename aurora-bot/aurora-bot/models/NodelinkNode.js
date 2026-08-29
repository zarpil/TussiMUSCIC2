import mongoose from "mongoose";

const nodelinkNodeSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    unique: true
  },
  host: {
    type: String,
    required: true
  },
  port: {
    type: Number,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  secure: {
    type: Boolean,
    default: false
  },
  userType: {
    type: String,
    enum: ['all', 'normal', 'premium'],
    default: 'all'
  },
  priority: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('NodelinkNode', nodelinkNodeSchema);
