import express from 'express';
import { 
  getRewardStatus, 
  transferPoints, 
  getLeaderboard 
} from '../controller/reward.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get user's reward status
router.get('/status', auth, getRewardStatus);

// Transfer points to another user
router.post('/transfer', auth, transferPoints);

// Get leaderboard
router.get('/leaderboard', getLeaderboard);

export default router;