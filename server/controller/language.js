import UserLanguage from '../models/userLanguage.js';
import User from '../models/auth.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Configure email transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Configure Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get user's language preference
export const getUserLanguage = async (req, res) => {
  try {
    const userId = req.user.id;
    let userLanguage = await UserLanguage.findOne({ userId });

    if (!userLanguage) {
      userLanguage = new UserLanguage({ userId });
      await userLanguage.save();
    }

    res.status(200).json({
      success: true,
      language: userLanguage.language
    });
  } catch (error) {
    console.error('Get user language error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user language',
      error: error.message
    });
  }
};

// Request to change language
export const requestChangeLanguage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { language, method } = req.body; // method can be 'email' or 'sms'

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    let userLanguage = await UserLanguage.findOne({ userId });
    if (!userLanguage) {
      userLanguage = new UserLanguage({ userId });
    }

    userLanguage.otp = { code: otp, expiresAt };
    await userLanguage.save();

    // Send OTP via email or SMS
    if (method === 'email') {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Language Change Verification - StackOverflow Clone',
        text: `Your OTP to change language is: ${otp}`
      };
      await transporter.sendMail(mailOptions);
    } else if (method === 'sms' && user.phone) {
      await twilioClient.messages.create({
        body: `Your StackOverflow Clone language change OTP is: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid verification method or missing phone number' });
    }

    res.status(200).json({
      success: true,
      message: `OTP sent to your ${method}`
    });

  } catch (error) {
    console.error('Request change language error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting language change',
      error: error.message
    });
  }
};

// Verify OTP and change language
export const verifyAndChangeLanguage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp, language } = req.body;

    const userLanguage = await UserLanguage.findOne({ userId });

    if (!userLanguage || !userLanguage.otp || userLanguage.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (new Date() > userLanguage.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Update language
    userLanguage.language = language;
    userLanguage.otp = undefined; // Clear OTP
    await userLanguage.save();

    res.status(200).json({
      success: true,
      message: `Language successfully changed to ${language}`,
      language: userLanguage.language
    });

  } catch (error) {
    console.error('Verify and change language error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing language',
      error: error.message
    });
  }
};

export default {
  getUserLanguage,
  requestChangeLanguage,
  verifyAndChangeLanguage
};