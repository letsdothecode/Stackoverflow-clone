import express from 'express';
import { 
  createPost, 
  getPosts, 
  likePost, 
  commentOnPost, 
  sharePost, 
  getDailyPostStatus,
  uploadMiddleware 
} from '../controller/post.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Public space routes
router.post('/create', auth, uploadMiddleware, createPost);
router.get('/feed', getPosts);
router.post('/:postId/like', auth, likePost);
router.post('/:postId/comment', auth, commentOnPost);
router.post('/:postId/share', auth, sharePost);
router.get('/daily-status', auth, getDailyPostStatus);

export default router;