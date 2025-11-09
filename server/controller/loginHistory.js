import { LoginHistory } from '../models/index.js';
import { UAParser } from 'ua-parser-js';

// Function to get client IP address
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.ip || 
         'unknown';
};

// Function to record login attempt
export const recordLoginAttempt = async (userId, req, status, failureReason = null) => {
  try {
    if (!req) {
      console.error('Request object is required for recording login attempt');
      return;
    }

    const parser = new UAParser(req.headers['user-agent'] || '');
    const ua = parser.getResult();
    const ipAddress = getClientIP(req);

    const loginRecord = await LoginHistory.create({
      userId: userId || null, // Use null for anonymous attempts
      ipAddress: ipAddress,
      browser: {
        name: ua.browser?.name || 'unknown',
        version: ua.browser?.version || 'unknown'
      },
      os: {
        name: ua.os?.name || 'unknown',
        version: ua.os?.version || 'unknown'
      },
      device: ua.device?.type || 'desktop',
      status,
      failureReason
    });
  } catch (error) {
    console.error('Error recording login attempt:', error);
  }
};

// Get user's login history
export const getLoginHistory = async (req, res) => {
  try {
    const userId = parseInt(req.user.id);
    const history = await LoginHistory.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching login history',
      error: error.message
    });
  }
};

// Middleware to check for unusual login activity
export const checkUnusualLogin = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id);
    const currentIp = req.ip;

    // Get last 5 successful logins
    const recentLogins = await LoginHistory.findAll({
      where: {
        userId,
        status: 'success'
      },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    if (recentLogins.length > 0) {
      const knownIps = recentLogins.map(login => login.ipAddress);
      if (!knownIps.includes(currentIp)) {
        // This could trigger a notification or require extra verification
        console.log(`Unusual login detected for user ${userId} from new IP: ${currentIp}`);
      }
    }

    next();
  } catch (error) {
    console.error('Check unusual login error:', error);
    next(); // Don't block login on error
  }
};