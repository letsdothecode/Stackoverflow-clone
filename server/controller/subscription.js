import { SubscriptionPlan, UserSubscription, DailyQuestionLimit, User } from '../models/index.js';
import Razorpay from 'razorpay';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Op } from 'sequelize';
dotenv.config();

// Initialize payment gateway (Razorpay only) - conditional initialization
let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized successfully');
  } catch (error) {
    console.warn('⚠️ Razorpay initialization failed:', error.message);
  }
} else {
  console.warn('⚠️ Razorpay credentials not found. Payment features will be disabled.');
}

// Configure email transporter - conditional initialization
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('✅ Email transporter initialized successfully');
  } catch (error) {
    console.warn('⚠️ Email transporter initialization failed:', error.message);
  }
} else {
  console.warn('⚠️ Email credentials not found. Email features will be disabled.');
}

// Check if payment time is allowed (10 AM to 11 AM IST)
const isPaymentTimeAllowed = () => {
  try {
    const now = new Date();
    // Get IST time using Intl.DateTimeFormat
    const istFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    
    const parts = istFormatter.formatToParts(now);
    const hour = parseInt(parts.find(part => part.type === 'hour').value, 10);
    const minute = parseInt(parts.find(part => part.type === 'minute').value, 10);
    const currentTime = hour * 60 + minute;
    const startTime = 10 * 60; // 10:00 AM
    const endTime = 11 * 60; // 11:00 AM
    
    return currentTime >= startTime && currentTime < endTime;
  } catch (error) {
    console.error('Error checking payment time:', error);
    return false;
  }
};

// Get all subscription plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { isActive: true },
      order: [['price', 'ASC']]
    });
    
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
    const userId = parseInt(req.user.id);
    
    const userSubscription = await UserSubscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      },
      include: [{ model: SubscriptionPlan, as: 'plan' }]
    });

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
    const userId = parseInt(req.user.id);
    const planId = parseInt(req.body.planId);
    const { paymentProvider } = req.body;

    // Check if payment time is allowed
    if (!isPaymentTimeAllowed()) {
      return res.status(400).json({
        success: false,
        message: 'Payments are only allowed between 10 AM to 11 AM IST'
      });
    }

    // Validate plan
    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive subscription plan'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await UserSubscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let orderId;

    // Check if Razorpay is configured
    if (!razorpayInstance) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway is not configured. Please contact administrator.'
      });
    }

    // Razorpay-only payment initiation
    const order = await razorpayInstance.orders.create({
      amount: parseFloat(plan.price) * 100, // Convert to paise
      currency: 'INR',
      receipt: `sub_${userId}_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        planId: planId.toString(),
        planName: plan.name
      }
    });
    orderId = order.id;

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    // Create pending subscription
    const userSubscription = await UserSubscription.create({
      userId,
      planId,
      status: 'pending',
      startDate,
      endDate,
      paymentId: orderId,
      paymentProvider: 'razorpay',
      paymentAmount: plan.price,
      paymentCurrency: 'INR'
    });

    res.status(200).json({
      success: true,
      message: 'Payment initiated successfully',
      paymentDetails: {
        provider: 'razorpay',
        orderId,
        amount: plan.price,
        currency: 'INR',
        subscriptionId: userSubscription.id
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
    const subscriptionId = parseInt(req.body.subscriptionId);
    const { paymentId, paymentStatus } = req.body;

    // Find subscription
    const subscription = await UserSubscription.findByPk(subscriptionId, {
      include: [{ model: SubscriptionPlan, as: 'plan' }]
    });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Razorpay-only simplified verification (in production verify signature)
    const isPaymentValid = paymentStatus === 'paid';

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

    // Send confirmation email with invoice (if email is configured)
    if (transporter) {
      await sendSubscriptionConfirmationEmail(subscription.userId, subscription, subscription.plan);
    }

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

// Send subscription confirmation email with invoice
const sendSubscriptionConfirmationEmail = async (userId, subscription, plan) => {
  try {
    if (!transporter) {
      console.warn('Email transporter not configured. Skipping email send.');
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) return;

    const invoiceNumber = `INV-${subscription.id}-${Date.now()}`;
    const paymentDate = new Date().toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Subscription Activated - Invoice - StackOverflow Clone',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f48024;">Subscription Activated!</h2>
          <p>Hello ${user.name},</p>
          <p>Your subscription has been successfully activated. Here are the details:</p>
          
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Invoice Details</h3>
            <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
            <p><strong>Payment Date:</strong> ${paymentDate}</p>
            <p><strong>Payment ID:</strong> ${subscription.paymentId}</p>
            <p><strong>Payment Provider:</strong> ${subscription.paymentProvider.toUpperCase()}</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
            <h3 style="margin-top: 0;">Subscription Details</h3>
            <p><strong>Plan:</strong> ${plan.name}</p>
            <p><strong>Price:</strong> ₹${plan.price}</p>
            <p><strong>Currency:</strong> ${plan.currency}</p>
            <p><strong>Questions per day:</strong> ${plan.maxQuestionsPerDay === 999 ? 'Unlimited' : plan.maxQuestionsPerDay}</p>
            <p><strong>Start Date:</strong> ${new Date(subscription.startDate).toLocaleDateString('en-IN')}</p>
            <p><strong>End Date:</strong> ${new Date(subscription.endDate).toLocaleDateString('en-IN')}</p>
            ${plan.features && plan.features.length > 0 ? `
            <p><strong>Features:</strong></p>
            <ul>
              ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
            ` : ''}
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
            <p style="text-align: right;"><strong>Total Amount:</strong> ₹${plan.price}</p>
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
    const userId = parseInt(req.user.id);

    // Get user's current subscription
    const userSubscription = await UserSubscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      },
      include: [{ model: SubscriptionPlan, as: 'plan' }]
    });

    if (!userSubscription) {
      // Default to free plan limits
      const freePlan = await SubscriptionPlan.findOne({ where: { name: 'Free' } });
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
      const todayStr = today.toISOString().split('T')[0];
      
      let dailyLimit = await DailyQuestionLimit.findOne({ 
        where: { userId, date: todayStr } 
      });
      if (!dailyLimit) {
        dailyLimit = await DailyQuestionLimit.create({
          userId,
          date: todayStr,
          maxQuestions: freePlan.maxQuestionsPerDay
        });
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
    const todayStr = today.toISOString().split('T')[0];
    
    let dailyLimit = await DailyQuestionLimit.findOne({ 
      where: { userId, date: todayStr } 
    });
    if (!dailyLimit) {
      dailyLimit = await DailyQuestionLimit.create({
        userId,
        date: todayStr,
        maxQuestions: userSubscription.plan.maxQuestionsPerDay
      });
    } else {
      // Update max questions based on current plan
      dailyLimit.maxQuestions = userSubscription.plan.maxQuestionsPerDay;
      await dailyLimit.save();
    }

    res.status(200).json({
      success: true,
      canPost: dailyLimit.questionCount < dailyLimit.maxQuestions,
      currentCount: dailyLimit.questionCount,
      maxQuestions: dailyLimit.maxQuestions,
      plan: userSubscription.plan.name
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
    const todayStr = today.toISOString().split('T')[0];
    
    const dailyLimit = await DailyQuestionLimit.findOne({ 
      where: { userId, date: todayStr } 
    });
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
    const userId = parseInt(req.user.id);

    const subscription = await UserSubscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
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