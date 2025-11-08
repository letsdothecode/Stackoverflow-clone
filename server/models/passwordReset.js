import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resetToken: {
    type: String,
    required: true,
    unique: true
  },
  resetType: {
    type: String,
    enum: ['email', 'phone'],
    required: true
  },
  resetValue: {
    type: String,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3 // Maximum 3 attempts per token
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 3600000) // 1 hour from now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for automatic cleanup
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for daily limit checking
passwordResetSchema.index({ userId: 1, createdAt: 1 });

export default mongoose.model('PasswordReset', passwordResetSchema);