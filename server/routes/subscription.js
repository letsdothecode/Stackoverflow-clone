import express from 'express';
import { 
  getSubscriptionPlans, 
  getUserSubscription, 
  createSubscriptionPayment, 
  verifySubscriptionPayment, 
  canUserPostQuestion, 
  cancelSubscription 
} from '../controller/subscription.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all subscription plans
router.get('/plans', getSubscriptionPlans);

// Get user's current subscription
router.get('/user-subscription', auth, getUserSubscription);

// Check if user can post question
router.get('/can-post-question', auth, canUserPostQuestion);

// Create subscription payment
router.post('/create-payment', auth, createSubscriptionPayment);

// Verify payment and activate subscription
router.post('/verify-payment', auth, verifySubscriptionPayment);

// Cancel subscription
router.post('/cancel', auth, cancelSubscription);

export default router;