import mongoose from 'mongoose';

const userLanguageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'hi'] // Example languages
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
userLanguageSchema.index({ userId: 1 });

// Update timestamp on save
userLanguageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const UserLanguage = mongoose.model('UserLanguage', userLanguageSchema);

export default UserLanguage;