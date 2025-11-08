import mongoose from 'mongoose';

const dailyQuestionLimitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  questionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxQuestions: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for daily limits
dailyQuestionLimitSchema.index({ userId: 1, date: 1 }, { unique: true });

// TTL index for automatic cleanup (keep records for 30 days)
dailyQuestionLimitSchema.index({ date: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('DailyQuestionLimit', dailyQuestionLimitSchema);