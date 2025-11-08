import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  badges: [{
    name: String,
    description: String,
    icon: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalPointsEarned: {
    type: Number,
    default: 0
  },
  totalPointsSpent: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
rewardSchema.index({ userId: 1 });

// Update timestamp on save
rewardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Reward = mongoose.model('Reward', rewardSchema);

export default Reward;