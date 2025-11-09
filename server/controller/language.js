import { UserLanguage, User } from '../models/index.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

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
    console.log('✅ Email transporter initialized successfully (language controller)');
  } catch (error) {
    console.warn('⚠️ Email transporter initialization failed:', error.message);
  }
} else {
  console.warn('⚠️ Email credentials not found. Email features will be disabled.');
}

// Configure Twilio client - conditional initialization
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client initialized successfully');
  } catch (error) {
    console.warn('⚠️ Twilio client initialization failed:', error.message);
  }
} else {
  console.warn('⚠️ Twilio credentials not found. SMS features will be disabled.');
}

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get user's language preference
export const getUserLanguage = async (req, res) => {
  try {
    const userId = parseInt(req.user.id);
    let userLanguage = await UserLanguage.findOne({ where: { userId } });

    if (!userLanguage) {
      userLanguage = await UserLanguage.create({ userId });
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
    const userId = parseInt(req.user.id);
    const { language } = req.body;

    // Validate language
    const validLanguages = ['en', 'es', 'hi', 'pt', 'zh', 'fr'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid language. Supported languages: en, es, hi, pt, zh, fr' 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // French requires email OTP, others require mobile OTP
    const method = language === 'fr' ? 'email' : 'sms';
    
    // Check if user has phone for non-French languages
    if (method === 'sms' && !user.phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required for language change. Please update your profile with a phone number.' 
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    let userLanguage = await UserLanguage.findOne({ where: { userId } });
    if (!userLanguage) {
      userLanguage = await UserLanguage.create({ userId });
    }

    userLanguage.otp = { code: otp, expiresAt, language };
    await userLanguage.save();

    let otpSent = false;
    let devModeOtp = null;

    // Send OTP via email for French, SMS for others
    if (method === 'email') {
      if (!transporter) {
        // In development, log the OTP instead of sending email
        console.log(`[DEV MODE] Email OTP for ${user.email}: ${otp}`);
        devModeOtp = otp;
        otpSent = true;
      } else {
        try {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Language Change Verification - StackOverflow Clone',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f48024;">Language Change Verification</h2>
                <p>Hello ${user.name},</p>
                <p>You requested to change your language to French. Please use the following OTP to verify:</p>
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                  <strong style="font-size: 24px; letter-spacing: 3px;">${otp}</strong>
                </div>
                <p>This OTP will expire in 10 minutes.</p>
                <p>If you did not request this change, please ignore this email.</p>
                <p>Best regards,<br>StackOverflow Clone Team</p>
              </div>
            `
          };
          await transporter.sendMail(mailOptions);
          otpSent = true;
        } catch (error) {
          console.error('Error sending email OTP:', error);
          // Fallback to dev mode
          console.log(`[DEV MODE] Email OTP for ${user.email}: ${otp}`);
          devModeOtp = otp;
          otpSent = true;
        }
      }
    } else if (method === 'sms' && user.phone) {
      if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
        // In development, log the OTP instead of sending SMS
        console.log(`[DEV MODE] SMS OTP for ${user.phone}: ${otp}`);
        devModeOtp = otp;
        otpSent = true;
      } else {
        try {
          await twilioClient.messages.create({
            body: `Your StackOverflow Clone language change OTP is: ${otp}. This OTP expires in 10 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: user.phone
          });
          otpSent = true;
        } catch (error) {
          console.error('Error sending SMS OTP:', error);
          // Fallback to dev mode
          console.log(`[DEV MODE] SMS OTP for ${user.phone}: ${otp}`);
          devModeOtp = otp;
          otpSent = true;
        }
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid verification method or missing phone number' });
    }

    if (otpSent) {
      const responseMessage = devModeOtp 
        ? `OTP sent to your ${method === 'email' ? 'email' : 'mobile number'}. Development mode - Check console for OTP: ${devModeOtp}`
        : `OTP sent to your ${method === 'email' ? 'email' : 'mobile number'}`;
      
      return res.status(200).json({
        success: true,
        message: responseMessage,
        method,
        ...(devModeOtp && { devOtp: devModeOtp })
      });
    }

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
    const userId = parseInt(req.user.id);
    const { otp } = req.body;

    const userLanguage = await UserLanguage.findOne({ where: { userId } });

    if (!userLanguage || !userLanguage.otp || userLanguage.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (new Date() > new Date(userLanguage.otp.expiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Get language from OTP data
    const language = userLanguage.otp.language || userLanguage.language;

    // Update language
    userLanguage.language = language;
    userLanguage.otp = null; // Clear OTP
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