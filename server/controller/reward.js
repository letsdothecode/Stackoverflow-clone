import { Reward, User, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

// Function to grant points and badges
export const grantReward = async (userId, points, badge) => {
  try {
    let userReward = await Reward.findOne({ where: { userId } });

    if (!userReward) {
      userReward = await Reward.create({
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
      const badges = userReward.badges || [];
      badges.push(badge);
      userReward.badges = badges;
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
    const userId = parseInt(req.user.id);
    const userReward = await Reward.findOne({ 
      where: { userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

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
  const transaction = await sequelize.transaction();

  try {
    const senderId = parseInt(req.user.id);
    const recipientId = parseInt(req.body.recipientId);
    const points = parseInt(req.body.points);

    if (senderId === recipientId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'You cannot transfer points to yourself'
      });
    }

    if (points <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Points to transfer must be positive'
      });
    }

    // Get sender and recipient rewards
    const senderReward = await Reward.findOne({ 
      where: { userId: senderId },
      transaction 
    });
    const recipientReward = await Reward.findOne({ 
      where: { userId: recipientId },
      transaction 
    });

    // Check if sender has at least 10 points (minimum required to transfer)
    if (!senderReward || senderReward.points < 10) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'You need at least 10 points to transfer points to other users'
      });
    }

    if (senderReward.points < points) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Insufficient points to transfer'
      });
    }

    if (!recipientReward) {
      // Create reward profile for recipient if it doesn't exist
      await Reward.create({
        userId: recipientId,
        points: points,
        totalPointsEarned: points
      }, { transaction });
    } else {
      recipientReward.points += points;
      recipientReward.totalPointsEarned += points;
      await recipientReward.save({ transaction });
    }

    // Deduct points from sender
    senderReward.points -= points;
    senderReward.totalPointsSpent += points;
    await senderReward.save({ transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `Successfully transferred ${points} points`
    });

  } catch (error) {
    await transaction.rollback();
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
    const leaderboard = await Reward.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['totalPointsEarned', 'DESC']],
      limit: 10
    });

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

// Search users by name or email for point transfer
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = parseInt(req.user.id);

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: currentUserId },
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'name', 'email'],
      limit: 10
    });

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
};

export default {
  grantReward,
  getRewardStatus,
  transferPoints,
  getLeaderboard,
  searchUsers
};