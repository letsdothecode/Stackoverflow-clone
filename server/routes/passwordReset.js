import express from 'express';
import { 
  requestPasswordReset, 
  resetPassword, 
  verifyResetToken 
} from '../controller/passwordReset.js';

const router = express.Router();

// Password reset routes
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/verify-token/:resetToken', verifyResetToken);

export default router;