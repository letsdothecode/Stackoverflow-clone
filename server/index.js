import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
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
app.use(cors());
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
const databaseurl = process.env.MONGODB_URL;

mongoose
  .connect(databaseurl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
