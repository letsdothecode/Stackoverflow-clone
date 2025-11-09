import { User, LoginHistory } from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UAParser } from 'ua-parser-js';
import { recordLoginAttempt } from './loginHistory.js';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Check if mobile access time is allowed (10 AM to 1 PM IST)
const isMobileAccessTimeAllowed = () => {
  try {
    const now = new Date();
    // Get IST time using Intl.DateTimeFormat
    const istFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false
    });
    
    const parts = istFormatter.formatToParts(now);
    const hour = parseInt(parts.find(part => part.type === 'hour').value, 10);
    return hour >= 10 && hour < 13; // 10 AM to 1 PM IST
  } catch (error) {
    console.error('Error checking mobile access time:', error);
    return false;
  }
};

// Store login OTPs temporarily (in production, use Redis or database)
const loginOTPs = new Map();

export const Signup = async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const exisitinguser = await User.findOne({ where: { email } });
    if (exisitinguser) {
      return res.status(404).json({ message: "User already exist" });
    }
    const hashpassword = await bcrypt.hash(password, 12);
    const newuser = await User.create({
      name,
      email,
      password: hashpassword,
      phone: phone || null
    });
    const token = jwt.sign(
      { email: newuser.email, id: newuser.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ data: newuser, token });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const parser = new UAParser(req.headers['user-agent']);
    const ua = parser.getResult();
    const browserName = ua.browser.name?.toLowerCase() || '';
    const deviceType = ua.device.type || 'desktop';
    const isMobile = deviceType === 'mobile' || deviceType === 'tablet';

    const exisitinguser = await User.findOne({ where: { email } });
    if (!exisitinguser) {
      await recordLoginAttempt(null, req, 'failure', 'User does not exist');
      return res.status(404).json({ message: "User does not exist" });
    }

    const ispasswordcrct = await bcrypt.compare(
      password,
      exisitinguser.password
    );
    if (!ispasswordcrct) {
      await recordLoginAttempt(exisitinguser.id, req, 'failure', 'Invalid password');
      return res.status(400).json({ message: "Invalid password" });
    }

    // Check if mobile and time restriction
    if (isMobile && !isMobileAccessTimeAllowed()) {
      await recordLoginAttempt(exisitinguser.id, req, 'failure', 'Mobile access not allowed outside 10 AM - 1 PM IST');
      return res.status(403).json({ 
        message: "Mobile access is only allowed between 10 AM to 1 PM IST. Please try again during this time.",
        accessDenied: true
      });
    }

    // Chrome browser: require email OTP
    if (browserName.includes('chrome') && !browserName.includes('edge')) {
      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      loginOTPs.set(exisitinguser.id, { otp, expiresAt, email: exisitinguser.email });

      // Send OTP email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: exisitinguser.email,
        subject: 'Login Verification OTP - StackOverflow Clone',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f48024;">Login Verification</h2>
            <p>Hello ${exisitinguser.name},</p>
            <p>You are logging in from Google Chrome. Please use the following OTP to complete your login:</p>
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
              <strong style="font-size: 24px; letter-spacing: 3px;">${otp}</strong>
            </div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you did not attempt to login, please ignore this email.</p>
            <p>Best regards,<br>StackOverflow Clone Team</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      
      return res.status(200).json({ 
        message: "OTP sent to your email. Please verify to complete login.",
        requiresOTP: true,
        userId: exisitinguser.id
      });
    }

    // Microsoft Edge: no authentication needed (direct login)
    if (browserName.includes('edge')) {
      const token = jwt.sign(
        { email: exisitinguser.email, id: exisitinguser.id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      await recordLoginAttempt(exisitinguser.id, req, 'success');
      return res.status(200).json({ data: exisitinguser, token });
    }

    // Other browsers: direct login
    const token = jwt.sign(
      { email: exisitinguser.email, id: exisitinguser.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    await recordLoginAttempt(exisitinguser.id, req, 'success');
    res.status(200).json({ data: exisitinguser, token });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

// Verify OTP for Chrome login
export const verifyLoginOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const storedOTP = loginOTPs.get(userId);
    if (!storedOTP || storedOTP.otp !== otp) {
      await recordLoginAttempt(userId, req, 'failure', 'Invalid OTP');
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > storedOTP.expiresAt) {
      loginOTPs.delete(userId);
      await recordLoginAttempt(userId, req, 'failure', 'OTP expired');
      return res.status(400).json({ message: "OTP has expired" });
    }

    // OTP verified, generate token
    const token = jwt.sign(
      { email: user.email, id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    loginOTPs.delete(userId);
    await recordLoginAttempt(userId, req, 'success');
    res.status(200).json({ data: user, token });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const getallusers = async (req, res) => {
  try {
    const alluser = await User.findAll();
    res.status(200).json({ data: alluser });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const updateprofile = async (req, res) => {
  const { id } = req.params;
  const { name, about, tags } = req.body.editForm;
  const userId = parseInt(id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ message: "User unavailable" });
  }
  
  try {
    const updateprofile = await User.findByPk(userId);
    if (!updateprofile) {
      return res.status(404).json({ message: "User not found" });
    }
    
    updateprofile.name = name;
    updateprofile.about = about;
    updateprofile.tags = tags;
    await updateprofile.save();
    
    res.status(200).json({ data: updateprofile });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};
