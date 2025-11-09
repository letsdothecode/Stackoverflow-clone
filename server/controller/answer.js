import { Question, Answer, Reward } from "../models/index.js";
import { grantReward } from "./reward.js";

export const Askanswer = async (req, res) => {
  const { id } = req.params;
  const questionId = parseInt(id);
  
  if (isNaN(questionId)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  
  const { noofanswer, answerbody, useranswered, userid } = req.body;
  const userId = parseInt(userid);
  
  try {
    // Create answer
    const newAnswer = await Answer.create({
      questionId,
      answerbody,
      useranswered,
      userid: userId,
      upvote: [],
      downvote: []
    });
    
    // Grant 5 points for answering
    await grantReward(userId, 5, null);
    
    // Update question answer count
    await updatenoofanswer(questionId, noofanswer);
    
    // Get updated question with answers
    const updatequestion = await Question.findByPk(questionId, {
      include: [{ model: Answer, as: 'answers' }]
    });
    
    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

const updatenoofanswer = async (questionId, noofanswer) => {
  try {
    const question = await Question.findByPk(questionId);
    if (question) {
      question.noofanswer = noofanswer;
      await question.save();
    }
  } catch (error) {
    console.log(error);
  }
};

export const deleteanswer = async (req, res) => {
  const { id } = req.params;
  const { noofanswer, answerid } = req.body;
  const questionId = parseInt(id);
  const answerId = parseInt(answerid);
  
  if (isNaN(questionId)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (isNaN(answerId)) {
    return res.status(400).json({ message: "answer unavailable" });
  }
  
  try {
    const answer = await Answer.findByPk(answerId);
    if (!answer) {
      return res.status(404).json({ message: "answer not found" });
    }
    
    const userId = answer.userid;
    const upvotes = answer.upvote || [];
    
    // Deduct points: 5 for answer creation + 5 for every 5 upvotes milestone reached
    let pointsToDeduct = 5; // Base points for answering
    const upvoteCount = upvotes.length;
    if (upvoteCount >= 5) {
      pointsToDeduct += 5; // Bonus points for reaching 5 upvotes
    }
    
    // Deduct points from user's reward
    if (userId) {
      const userReward = await Reward.findOne({ where: { userId } });
      if (userReward && userReward.points >= pointsToDeduct) {
        userReward.points -= pointsToDeduct;
        userReward.totalPointsSpent += pointsToDeduct;
        await userReward.save();
      }
    }
    
    await answer.destroy();
    await updatenoofanswer(questionId, noofanswer);
    
    res.status(200).json({ message: "answer deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

// Vote on an answer
export const voteAnswer = async (req, res) => {
  const { id } = req.params;
  const { value, userid } = req.body;
  const answerId = parseInt(id);
  const userId = parseInt(userid);
  
  if (isNaN(answerId)) {
    return res.status(400).json({ message: "answer unavailable" });
  }
  
  try {
    const answer = await Answer.findByPk(answerId);
    if (!answer) {
      return res.status(404).json({ message: "answer not found" });
    }
    
    const answerUserId = answer.userid;
    let upvote = answer.upvote || [];
    let downvote = answer.downvote || [];
    
    const upindex = upvote.findIndex((id) => id === userId);
    const downindex = downvote.findIndex((id) => id === userId);
    
    let previousUpvoteCount = upvote.length;
    let pointsChanged = false;
    
    if (value === "upvote") {
      if (downindex !== -1) {
        downvote = downvote.filter((id) => id !== userId);
        // Remove downvote penalty
        if (answerUserId) {
          const userReward = await Reward.findOne({ where: { userId: answerUserId } });
          if (userReward) {
            userReward.points += 1; // Reverse downvote penalty
            await userReward.save();
          }
        }
      }
      if (upindex === -1) {
        upvote.push(userId);
      } else {
        upvote = upvote.filter((id) => id !== userId);
      }
    } else if (value === "downvote") {
      if (upindex !== -1) {
        upvote = upvote.filter((id) => id !== userId);
      }
      if (downindex === -1) {
        downvote.push(userId);
        // Deduct 1 point for downvote
        if (answerUserId) {
          const userReward = await Reward.findOne({ where: { userId: answerUserId } });
          if (userReward && userReward.points > 0) {
            userReward.points -= 1;
            userReward.totalPointsSpent += 1;
            await userReward.save();
          }
        }
      } else {
        downvote = downvote.filter((id) => id !== userId);
        // Reverse downvote penalty
        if (answerUserId) {
          const userReward = await Reward.findOne({ where: { userId: answerUserId } });
          if (userReward) {
            userReward.points += 1;
            await userReward.save();
          }
        }
      }
    }
    
    answer.upvote = upvote;
    answer.downvote = downvote;
    await answer.save();
    
    // Check if answer reached 5 upvotes milestone
    const currentUpvoteCount = upvote.length;
    if (answerUserId && currentUpvoteCount === 5 && previousUpvoteCount < 5) {
      // Grant bonus 5 points for reaching 5 upvotes
      await grantReward(answerUserId, 5, null);
      pointsChanged = true;
    }
    
    res.status(200).json({ 
      data: answer,
      pointsAwarded: pointsChanged ? 5 : 0
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};
