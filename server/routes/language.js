import express from 'express';
import { 
  getUserLanguage, 
  requestChangeLanguage, 
  verifyAndChangeLanguage 
} from '../controller/language.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get user's language preference
router.get('/', auth, getUserLanguage);

// Request to change language and send OTP
router.post('/request-change', auth, requestChangeLanguage);

// Verify OTP and change language
router.post('/verify-change', auth, verifyAndChangeLanguage);

export default router;