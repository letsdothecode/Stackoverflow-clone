import mongoose from 'mongoose';

const dailyPostLimitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  postCount: {
    type: Number,
    default: 0,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  },
  maxPosts: {
    type: Number,
    default: 1,
    min: 0
  }
});

dailyPostLimitSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyPostLimitSchema.index({ date: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model('DailyPostLimit', dailyPostLimitSchema);