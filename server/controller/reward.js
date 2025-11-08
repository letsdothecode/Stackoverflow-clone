import Reward from '../models/reward.js';
import User from '../models/auth.js';
import mongoose from 'mongoose';

// Function to grant points and badges
export const grantReward = async (userId, points, badge) => {
  try {
    let userReward = await Reward.findOne({ userId });

    if (!userReward) {
      userReward = new Reward({
        userId,
        points: 0,
        totalPointsEarned: 0,
        badges: []
      });
    }

    if (points) {
      userReward.points += points;
      userReward.totalPointsEarned += points;
    }

    if (badge) {
      userReward.badges.push(badge);
    }

    await userReward.save();
    return { success: true, message: 'Reward granted successfully' };
  } catch (error) {
    console.error('Error granting reward:', error);
    return { success: false, message: 'Error granting reward' };
  }
};

// Get user's reward status
export const getRewardStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const userReward = await Reward.findOne({ userId }).populate('userId', 'name email');

    if (!userReward) {
      return res.status(200).json({
        success: true,
        reward: {
          points: 0,
          badges: [],
          totalPointsEarned: 0
        },
        message: 'No rewards found for this user'
      });
    }

    res.status(200).json({
      success: true,
      reward: userReward
    });
  } catch (error) {
    console.error('Get reward status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reward status',
      error: error.message
    });
  }
};

// Transfer points to another user
export const transferPoints = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const senderId = req.user.id;
    const { recipientId, points } = req.body;

    if (senderId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot transfer points to yourself'
      });
    }

    if (points <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Points to transfer must be positive'
      });
    }

    // Get sender and recipient rewards
    const senderReward = await Reward.findOne({ userId: senderId }).session(session);
    const recipientReward = await Reward.findOne({ userId: recipientId }).session(session);

    if (!senderReward || senderReward.points < points) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Insufficient points to transfer'
      });
    }

    if (!recipientReward) {
      // Create reward profile for recipient if it doesn't exist
      const newRecipientReward = new Reward({
        userId: recipientId,
        points: points,
        totalPointsEarned: points
      });
      await newRecipientReward.save({ session });
    } else {
      recipientReward.points += points;
      recipientReward.totalPointsEarned += points;
      await recipientReward.save({ session });
    }

    // Deduct points from sender
    senderReward.points -= points;
    senderReward.totalPointsSpent += points;
    await senderReward.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Successfully transferred ${points} points`
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Transfer points error:', error);
    res.status(500).json({
      success: false,
      message: 'Error transferring points',
      error: error.message
    });
  }
};

// Get leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Reward.find()
      .sort({ totalPointsEarned: -1 })
      .limit(10)
      .populate('userId', 'name');

    res.status(200).json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
};

export default {
  grantReward,
  getRewardStatus,
  transferPoints,
  getLeaderboard
};