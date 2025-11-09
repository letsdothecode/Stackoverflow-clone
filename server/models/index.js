import sequelize from '../config/database.js';
import User from './User.js';
import Question from './Question.js';
import Answer from './Answer.js';
import Post from './Post.js';
import PostLike from './PostLike.js';
import PostComment from './PostComment.js';
import PostShare from './PostShare.js';
import Reward from './Reward.js';
import SubscriptionPlan from './SubscriptionPlan.js';
import UserSubscription from './UserSubscription.js';
import Friendship from './Friendship.js';
import DailyPostLimit from './DailyPostLimit.js';
import DailyQuestionLimit from './DailyQuestionLimit.js';
import PasswordReset from './PasswordReset.js';
import LoginHistory from './LoginHistory.js';
import UserLanguage from './UserLanguage.js';

// Define relationships
// User relationships
User.hasMany(Question, { foreignKey: 'userid', as: 'questions' });
User.hasMany(Answer, { foreignKey: 'userid', as: 'answers' });
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
User.hasOne(Reward, { foreignKey: 'userId', as: 'reward' });
User.hasOne(UserSubscription, { foreignKey: 'userId', as: 'subscription' });
User.hasMany(Friendship, { foreignKey: 'requester', as: 'sentFriendRequests' });
User.hasMany(Friendship, { foreignKey: 'recipient', as: 'receivedFriendRequests' });
User.hasMany(DailyPostLimit, { foreignKey: 'userId', as: 'dailyPostLimits' });
User.hasMany(DailyQuestionLimit, { foreignKey: 'userId', as: 'dailyQuestionLimits' });
User.hasMany(PasswordReset, { foreignKey: 'userId', as: 'passwordResets' });
User.hasMany(LoginHistory, { foreignKey: 'userId', as: 'loginHistories' });
User.hasOne(UserLanguage, { foreignKey: 'userId', as: 'language' });

// Question relationships
Question.belongsTo(User, { foreignKey: 'userid', as: 'user' });
Question.hasMany(Answer, { foreignKey: 'questionId', as: 'answers', onDelete: 'CASCADE' });

// Answer relationships
Answer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });
Answer.belongsTo(User, { foreignKey: 'userid', as: 'user' });

// Post relationships
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Post.hasMany(PostLike, { foreignKey: 'postId', as: 'likes', onDelete: 'CASCADE' });
Post.hasMany(PostComment, { foreignKey: 'postId', as: 'comments', onDelete: 'CASCADE' });
Post.hasMany(PostShare, { foreignKey: 'postId', as: 'shares', onDelete: 'CASCADE' });

// PostLike relationships
PostLike.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
PostLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// PostComment relationships
PostComment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
PostComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// PostShare relationships
PostShare.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
PostShare.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Reward relationships
Reward.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// SubscriptionPlan relationships
SubscriptionPlan.hasMany(UserSubscription, { foreignKey: 'planId', as: 'subscriptions' });

// UserSubscription relationships
UserSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });

// Friendship relationships
Friendship.belongsTo(User, { foreignKey: 'requester', as: 'requesterUser' });
Friendship.belongsTo(User, { foreignKey: 'recipient', as: 'recipientUser' });

// DailyPostLimit relationships
DailyPostLimit.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// DailyQuestionLimit relationships
DailyQuestionLimit.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// PasswordReset relationships
PasswordReset.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// LoginHistory relationships
LoginHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// UserLanguage relationships
UserLanguage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Initialize database - create tables
export const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync all models (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synchronized');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

export {
  sequelize,
  User,
  Question,
  Answer,
  Post,
  PostLike,
  PostComment,
  PostShare,
  Reward,
  SubscriptionPlan,
  UserSubscription,
  Friendship,
  DailyPostLimit,
  DailyQuestionLimit,
  PasswordReset,
  LoginHistory,
  UserLanguage
};

