import LoginHistory from '../models/loginHistory.js';
import UAParser from 'ua-parser-js';

// Function to record login attempt
export const recordLoginAttempt = async (userId, req, status, failureReason = null) => {
  try {
    const parser = new UAParser(req.headers['user-agent']);
    const ua = parser.getResult();

    const loginRecord = new LoginHistory({
      userId,
      ipAddress: req.ip,
      browser: {
        name: ua.browser.name,
        version: ua.browser.version
      },
      os: {
        name: ua.os.name,
        version: ua.os.version
      },
      device: ua.device.type || 'desktop',
      status,
      failureReason
    });

    await loginRecord.save();
  } catch (error) {
    console.error('Error recording login attempt:', error);
  }
};

// Get user's login history
export const getLoginHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await LoginHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

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
    const userId = req.user.id;
    const currentIp = req.ip;

    // Get last 5 successful logins
    const recentLogins = await LoginHistory.find({
      userId,
      status: 'success'
    })
    .sort({ createdAt: -1 })
    .limit(5);

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

export default {
  recordLoginAttempt,
  getLoginHistory,
  checkUnusualLogin
};