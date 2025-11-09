import { User, PasswordReset } from '../models/index.js';
import crypto from 'crypto';
import { createTransport } from 'nodemailer';
import twilio from 'twilio';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

// Configure email transporter - conditional initialization
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    transporter = createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('✅ Email transporter initialized successfully (password reset controller)');
  } catch (error) {
    console.warn('⚠️ Email transporter initialization failed:', error.message);
  }
} else {
  console.warn('⚠️ Email credentials not found. Email features will be disabled.');
}

// Configure SMS client - conditional initialization
let smsClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    smsClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ SMS client initialized successfully (password reset controller)');
  } catch (error) {
    console.warn('⚠️ SMS client initialization failed:', error.message);
  }
} else {
  console.warn('⚠️ Twilio credentials not found. SMS features will be disabled.');
}

// Generate random password (only uppercase and lowercase letters, no special characters or numbers)
const generateRandomPassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  let password = '';
  
  // Generate 4 uppercase letters
  for (let i = 0; i < 4; i++) {
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
  }
  
  // Generate 4 lowercase letters
  for (let i = 0; i < 4; i++) {
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Generate secure reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Check if user has exceeded daily reset limit (1 per day)
const checkDailyResetLimit = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const resetCount = await PasswordReset.count({
    where: {
      userId,
      createdAt: { [Op.gte]: today, [Op.lt]: tomorrow }
    }
  });
  
  return resetCount >= 1; // Only 1 reset per day allowed
};

// Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either email or phone number'
      });
    }

    // Find user by email or phone
    let user;
    let resetType;
    let resetValue;
    
    if (email) {
      user = await User.findOne({ where: { email } });
      resetType = 'email';
      resetValue = email;
    } else if (phone) {
      user = await User.findOne({ where: { phone } });
      resetType = 'phone';
      resetValue = phone;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with the provided email/phone'
      });
    }

    // Check daily reset limit
    const hasExceededLimit = await checkDailyResetLimit(user.id);
    if (hasExceededLimit) {
      return res.status(429).json({
        success: false,
        message: 'Warning: You can only request password reset once per day. You have already used your daily request. Please try again tomorrow.',
        warning: true
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    
    // Generate new password
    const newPassword = generateRandomPassword();
    
    // Create password reset record
    const passwordReset = await PasswordReset.create({
      userId: user.id,
      resetToken,
      resetType,
      resetValue,
      used: false
    });

    // Send reset information via email or SMS
    if (resetType === 'email') {
      await sendResetEmail(user.email, user.name, newPassword, resetToken);
    } else if (resetType === 'phone') {
      await sendResetSMS(user.phone, user.name, newPassword, resetToken);
    }

    res.status(200).json({
      success: true,
      message: `Password reset instructions have been sent to your ${resetType}`,
      resetToken, // For testing purposes - remove in production
      newPassword // For testing purposes - remove in production
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message
    });
  }
};

// Send reset email
const sendResetEmail = async (email, name, newPassword, resetToken) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset - StackOverflow Clone',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f48024;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We have received a request to reset your password. Here is your new password:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong style="font-size: 18px; letter-spacing: 2px;">${newPassword}</strong>
        </div>
        <p><strong>Important:</strong></p>
        <ul>
          <li>This password is case-sensitive</li>
          <li>Please change this password after logging in</li>
          <li>This password reset link expires in 1 hour</li>
        </ul>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p>Best regards,<br>StackOverflow Clone Team</p>
      </div>
    `
  };

  if (!transporter) {
    console.warn('Email transporter not configured. Skipping email send.');
    return;
  }
  await transporter.sendMail(mailOptions);
};

// Send reset SMS
const sendResetSMS = async (phone, name, newPassword, resetToken) => {
  if (!smsClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn('SMS client not configured. Skipping SMS send.');
    return;
  }
  const message = `Hello ${name}, your StackOverflow Clone password has been reset. Your new password is: ${newPassword}. Please change it after logging in. This password expires in 1 hour.`;
  
  await smsClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
};

// Reset password using token
export const resetPassword = async (req, res) => {
  try {
    const { resetToken } = req.body;
    
    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    // Find valid reset token
    const passwordReset = await PasswordReset.findOne({
      where: {
        resetToken,
        used: false,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Check if attempts exceeded
    if (passwordReset.attempts >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Maximum attempts exceeded for this reset token'
      });
    }

    // Generate new password
    const newPassword = generateRandomPassword();
    
    // Update user password
    const user = await User.findByPk(passwordReset.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashpassword = await bcrypt.hash(newPassword, 12);
    user.password = hashpassword;
    await user.save();

    // Mark reset token as used
    passwordReset.used = true;
    await passwordReset.save();

    // Send new password to user
    if (passwordReset.resetType === 'email') {
      await sendNewPasswordEmail(user.email, user.name, newPassword);
    } else if (passwordReset.resetType === 'phone') {
      await sendNewPasswordSMS(user.phone, user.name, newPassword);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Your new password has been sent to your registered contact.',
      newPassword // For testing purposes - remove in production
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// Send new password email
const sendNewPasswordEmail = async (email, name, newPassword) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your New Password - StackOverflow Clone',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f48024;">Your New Password</h2>
        <p>Hello ${name},</p>
        <p>Your password has been successfully reset. Here is your new password:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong style="font-size: 18px; letter-spacing: 2px;">${newPassword}</strong>
        </div>
        <p><strong>Important:</strong> This password is case-sensitive. Please change it after logging in.</p>
        <p>Best regards,<br>StackOverflow Clone Team</p>
      </div>
    `
  };

  if (!transporter) {
    console.warn('Email transporter not configured. Skipping email send.');
    return;
  }
  await transporter.sendMail(mailOptions);
};

// Send new password SMS
const sendNewPasswordSMS = async (phone, name, newPassword) => {
  if (!smsClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn('SMS client not configured. Skipping SMS send.');
    return;
  }
  const message = `Hello ${name}, your StackOverflow Clone password has been reset. Your new password is: ${newPassword}. Please change it after logging in.`;
  
  await smsClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
};

// Verify reset token (for frontend validation)
export const verifyResetToken = async (req, res) => {
  try {
    const { resetToken } = req.params;
    
    const passwordReset = await PasswordReset.findOne({
      where: {
        resetToken,
        used: false,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reset token is valid',
      resetType: passwordReset.resetType,
      resetValue: passwordReset.resetValue
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying reset token',
      error: error.message
    });
  }
};