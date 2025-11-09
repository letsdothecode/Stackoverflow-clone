import express from 'express';
import { 
  getRewardStatus, 
  transferPoints, 
  getLeaderboard,
  searchUsers
} from '../controller/reward.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get user's reward status
router.get('/status', auth, getRewardStatus);

// Transfer points to another user
router.post('/transfer', auth, transferPoints);

// Get leaderboard
router.get('/leaderboard', getLeaderboard);

// Search users for point transfer
router.get('/search-users', auth, searchUsers);

export default router;