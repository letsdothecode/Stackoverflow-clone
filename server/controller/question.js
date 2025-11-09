import { Question, User, Answer } from "../models/index.js";

export const Askquestion = async (req, res) => {
  const { postquestiondata } = req.body;
  try {
    const postques = await Question.create({ ...postquestiondata });
    res.status(200).json({ data: postques });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const getallquestion = async (req, res) => {
  try {
    const allquestion = await Question.findAll({
      order: [['askedon', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Answer, as: 'answers' }
      ]
    });
    res.status(200).json({ data: allquestion });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const deletequestion = async (req, res) => {
  const { id } = req.params;
  const questionId = parseInt(id);

  if (isNaN(questionId)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  
  try {
    const questionDoc = await Question.findByPk(questionId);
    if (!questionDoc) {
      return res.status(404).json({ message: "question not found" });
    }
    await questionDoc.destroy();
    res.status(200).json({ message: "question deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const votequestion = async (req, res) => {
  const { id } = req.params;
  const { value, userid } = req.body;
  const questionId = parseInt(id);
  const userId = parseInt(userid);
  
  if (isNaN(questionId)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  
  try {
    const questionDoc = await Question.findByPk(questionId);
    if (!questionDoc) {
      return res.status(404).json({ message: "question not found" });
    }
    
    let upvote = questionDoc.upvote || [];
    let downvote = questionDoc.downvote || [];
    
    const upindex = upvote.findIndex((id) => id === userId);
    const downindex = downvote.findIndex((id) => id === userId);
    
    if (value === "upvote") {
      if (downindex !== -1) {
        downvote = downvote.filter((id) => id !== userId);
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
      } else {
        downvote = downvote.filter((id) => id !== userId);
      }
    }
    
    questionDoc.upvote = upvote;
    questionDoc.downvote = downvote;
    await questionDoc.save();
    
    res.status(200).json({ data: questionDoc });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};
