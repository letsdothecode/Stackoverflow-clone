import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { syncDatabase } from "./models/index.js";
import userroutes from "./routes/auth.js"
import questionroute from "./routes/question.js"
import answerroutes from "./routes/answer.js"
import postroutes from "./routes/post.js"
import passwordResetRoutes from "./routes/passwordReset.js"
import subscriptionRoutes from "./routes/subscription.js"
import rewardRoutes from "./routes/reward.js"
import languageRoutes from "./routes/language.js"
import loginHistoryRoutes from "./routes/loginHistory.js"

const app = express();
dotenv.config();
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

// CORS configuration - allow requests from Netlify and localhost
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
      process.env.NETLIFY_URL,
      process.env.VERCEL_URL,
      process.env.RENDER_URL,
      // Add your deployment URLs here or set them via environment variables
      /\.netlify\.app$/, // Allow all Netlify preview deployments
      /\.vercel\.app$/, // Allow all Vercel preview deployments
      /\.vercel\.dev$/, // Allow Vercel development deployments
      /\.onrender\.com$/, // Allow all Render deployments
    ].filter(Boolean);
    
    // Check if origin is allowed
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    })) {
      callback(null, true);
    } else {
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Trust proxy to get real IP address
app.set('trust proxy', true);

app.get("/", (req, res) => {
  res.send("Stackoverflow clone is running perfect");
});

app.use('/user',userroutes)
app.use('/question',questionroute)
app.use('/answer',answerroutes)
app.use('/posts',postroutes)
app.use('/password-reset',passwordResetRoutes)
app.use('/subscription',subscriptionRoutes)
app.use('/reward',rewardRoutes)
app.use('/language',languageRoutes)
app.use('/login-history',loginHistoryRoutes)

const PORT = process.env.PORT || 5000;

// Initialize database and start server
syncDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database initialization error:", err.message);
    process.exit(1);
  });
