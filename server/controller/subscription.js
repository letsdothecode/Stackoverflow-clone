import SubscriptionPlan from '../models/subscriptionPlan.js';
import UserSubscription from '../models/userSubscription.js';
import DailyQuestionLimit from '../models/dailyQuestionLimit.js';
import User from '../models/auth.js';
import stripe from 'stripe';
import Razorpay from 'razorpay';
import nodemailer from 'nodemailer';

// Initialize payment gateways
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Configure email transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Check if payment time is allowed (10 AM to 11 AM IST)
const isPaymentTimeAllowed = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  
  const hour = istTime.getUTCHours();
  return hour >= 10 && hour < 11; // 10 AM to 11 AM IST
};

// Get all subscription plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
    
    res.status(200).json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans',
      error: error.message
    });
  }
};

// Get user's current subscription
export const getUserSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userSubscription = await UserSubscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('planId');

    if (!userSubscription) {
      return res.status(200).json({
        success: true,
        subscription: null,
        message: 'No active subscription found'
      });
    }

    res.status(200).json({
      success: true,
      subscription: userSubscription
    });
  } catch (error) {
    console.error('Get user subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user subscription',
      error: error.message
    });
  }
};

// Create subscription payment
export const createSubscriptionPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, paymentProvider } = req.body;

    // Check if payment time is allowed
    if (!isPaymentTimeAllowed()) {
      return res.status(400).json({
        success: false,
        message: 'Payments are only allowed between 10 AM to 11 AM IST'
      });
    }

    // Validate plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive subscription plan'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await UserSubscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let paymentIntent;
    let orderId;

    // Create payment based on provider
    if (paymentProvider === 'stripe') {
      paymentIntent = await stripeInstance.paymentIntents.create({
        amount: plan.price * 100, // Convert to cents
        currency: 'inr',
        metadata: {
          userId: userId.toString(),
          planId: planId.toString(),
          planName: plan.name
        }
      });
    } else if (paymentProvider === 'razorpay') {
      const order = await razorpayInstance.orders.create({
        amount: plan.price * 100, // Convert to paise
        currency: 'INR',
        receipt: `sub_${userId}_${Date.now()}`,
        notes: {
          userId: userId.toString(),
          planId: planId.toString(),
          planName: plan.name
        }
      });
      orderId = order.id;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment provider'
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    // Create pending subscription
    const userSubscription = new UserSubscription({
      userId,
      planId,
      status: 'pending',
      startDate,
      endDate,
      paymentId: paymentIntent?.id || orderId,
      paymentProvider,
      paymentAmount: plan.price,
      paymentCurrency: 'INR'
    });

    await userSubscription.save();

    res.status(200).json({
      success: true,
      message: 'Payment initiated successfully',
      paymentDetails: {
        provider: paymentProvider,
        clientSecret: paymentIntent?.client_secret,
        orderId: orderId,
        amount: plan.price,
        currency: 'INR',
        subscriptionId: userSubscription._id
      }
    });

  } catch (error) {
    console.error('Create subscription payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription payment',
      error: error.message
    });
  }
};

// Verify payment and activate subscription
export const verifySubscriptionPayment = async (req, res) => {
  try {
    const { subscriptionId, paymentId, paymentProvider, paymentStatus } = req.body;

    // Find subscription
    const subscription = await UserSubscription.findById(subscriptionId).populate('planId');
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Verify payment based on provider
    let isPaymentValid = false;
    
    if (paymentProvider === 'stripe') {
      const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentId);
      isPaymentValid = paymentIntent.status === 'succeeded';
    } else if (paymentProvider === 'razorpay') {
      // For Razorpay, you would typically verify the payment signature
      // This is a simplified verification
      isPaymentValid = paymentStatus === 'paid';
    }

    if (!isPaymentValid) {
      // Update subscription as failed
      subscription.status = 'cancelled';
      subscription.paymentStatus = 'failed';
      await subscription.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Activate subscription
    subscription.status = 'active';
    subscription.paymentStatus = 'completed';
    await subscription.save();

    // Send confirmation email
    await sendSubscriptionConfirmationEmail(subscription.userId, subscription.planId);

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: subscription
    });

  } catch (error) {
    console.error('Verify subscription payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying subscription payment',
      error: error.message
    });
  }
};

// Send subscription confirmation email
const sendSubscriptionConfirmationEmail = async (userId, plan) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Subscription Activated - StackOverflow Clone',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f48024;">Subscription Activated!</h2>
          <p>Hello ${user.name},</p>
          <p>Your subscription has been successfully activated. Here are the details:</p>
          
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Subscription Details</h3>
            <p><strong>Plan:</strong> ${plan.name}</p>
            <p><strong>Price:</strong> ₹${plan.price}</p>
            <p><strong>Questions per day:</strong> ${plan.maxQuestionsPerDay === 999 ? 'Unlimited' : plan.maxQuestionsPerDay}</p>
            <p><strong>Features:</strong></p>
            <ul>
              ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
          
          <p>Thank you for subscribing!</p>
          <p>Best regards,<br>StackOverflow Clone Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending subscription confirmation email:', error);
  }
};

// Check if user can post question
export const canUserPostQuestion = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's current subscription
    const userSubscription = await UserSubscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('planId');

    if (!userSubscription) {
      // Default to free plan limits
      const freePlan = await SubscriptionPlan.findOne({ name: 'Free' });
      if (!freePlan) {
        return res.status(200).json({
          success: true,
          canPost: false,
          message: 'Free plan not configured'
        });
      }

      // Check daily limit for free plan
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let dailyLimit = await DailyQuestionLimit.findOne({ userId, date: today });
      if (!dailyLimit) {
        dailyLimit = new DailyQuestionLimit({
          userId,
          date: today,
          maxQuestions: freePlan.maxQuestionsPerDay
        });
        await dailyLimit.save();
      }

      return res.status(200).json({
        success: true,
        canPost: dailyLimit.questionCount < dailyLimit.maxQuestions,
        currentCount: dailyLimit.questionCount,
        maxQuestions: dailyLimit.maxQuestions,
        plan: 'Free'
      });
    }

    // Check daily limit for subscribed user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dailyLimit = await DailyQuestionLimit.findOne({ userId, date: today });
    if (!dailyLimit) {
      dailyLimit = new DailyQuestionLimit({
        userId,
        date: today,
        maxQuestions: userSubscription.planId.maxQuestionsPerDay
      });
      await dailyLimit.save();
    } else {
      // Update max questions based on current plan
      dailyLimit.maxQuestions = userSubscription.planId.maxQuestionsPerDay;
      await dailyLimit.save();
    }

    res.status(200).json({
      success: true,
      canPost: dailyLimit.questionCount < dailyLimit.maxQuestions,
      currentCount: dailyLimit.questionCount,
      maxQuestions: dailyLimit.maxQuestions,
      plan: userSubscription.planId.name
    });

  } catch (error) {
    console.error('Check user can post question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking posting permission',
      error: error.message
    });
  }
};

// Increment user's question count
export const incrementQuestionCount = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyLimit = await DailyQuestionLimit.findOne({ userId, date: today });
    if (dailyLimit) {
      dailyLimit.questionCount += 1;
      await dailyLimit.save();
    }
  } catch (error) {
    console.error('Error incrementing question count:', error);
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await UserSubscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Cancel subscription (will expire at end date)
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully. It will remain active until the end of the current billing period.',
      subscriptionEndDate: subscription.endDate
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};

export default {
  getSubscriptionPlans,
  getUserSubscription,
  createSubscriptionPayment,
  verifySubscriptionPayment,
  canUserPostQuestion,
  incrementQuestionCount,
  cancelSubscription
};