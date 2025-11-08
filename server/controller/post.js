import Post from '../models/post.js';
import Friendship from '../models/friendship.js';
import DailyPostLimit from '../models/dailyPostLimit.js';
import User from '../models/auth.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'), false);
    }
  }
});

// Get user's friend count
const getUserFriendCount = async (userId) => {
  try {
    const friendCount = await Friendship.countDocuments({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });
    return friendCount;
  } catch (error) {
    console.error('Error getting friend count:', error);
    return 0;
  }
};

// Get user's daily post limit based on friend count
const getUserPostLimit = (friendCount) => {
  if (friendCount === 0) return 0;
  if (friendCount === 1) return 1;
  if (friendCount === 2) return 2;
  if (friendCount >= 10) return 999; // Unlimited for users with 10+ friends
  return 1; // Default for 3-9 friends
};

// Create a new post
export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;
    const files = req.files || [];

    // Get user's friend count
    const friendCount = await getUserFriendCount(userId);
    
    // Check if user has any friends
    if (friendCount === 0) {
      return res.status(403).json({
        success: false,
        message: 'You need at least 1 friend to post. Add some friends first!'
      });
    }

    // Get current date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check or create daily post limit record
    let dailyLimit = await DailyPostLimit.findOne({ userId, date: today });
    
    if (!dailyLimit) {
      const maxPosts = getUserPostLimit(friendCount);
      dailyLimit = new DailyPostLimit({
        userId,
        date: today,
        maxPosts,
        postCount: 0
      });
    } else {
      // Update max posts based on current friend count
      dailyLimit.maxPosts = getUserPostLimit(friendCount);
    }

    // Check if user has reached daily post limit
    if (dailyLimit.postCount >= dailyLimit.maxPosts) {
      return res.status(429).json({
        success: false,
        message: `You have reached your daily post limit of ${dailyLimit.maxPosts} posts. Come back tomorrow!`
      });
    }

    // Upload media files to Cloudinary
    const uploadedMedia = [];
    
    for (const file of files) {
      try {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
            folder: 'stackoverflow-posts',
            public_id: `post_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              throw error;
            }
            uploadedMedia.push({
              type: file.mimetype.startsWith('video/') ? 'video' : 'image',
              url: result.secure_url,
              publicId: result.public_id
            });
          }
        );

        // Convert buffer to stream and upload
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);

        // Wait for upload to complete
        await new Promise((resolve, reject) => {
          uploadStream.on('finish', resolve);
          uploadStream.on('error', reject);
        });
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading media files'
        });
      }
    }

    // Create the post
    const newPost = new Post({
      userId,
      content,
      media: uploadedMedia
    });

    await newPost.save();

    // Update daily post count
    dailyLimit.postCount += 1;
    await dailyLimit.save();

    // Populate user information
    const populatedPost = await Post.findById(newPost._id)
      .populate('userId', 'name email profilePicture')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: populatedPost,
      remainingPosts: dailyLimit.maxPosts - dailyLimit.postCount
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message
    });
  }
};

// Get all posts (public feed)
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('userId', 'name email profilePicture')
      .populate('comments.userId', 'name email profilePicture')
      .populate('likes.userId', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments();

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNextPage: skip + posts.length < totalPosts,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
};

// Like a post
export const likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already liked the post
    const existingLike = post.likes.find(like => like.userId.toString() === userId);
    
    if (existingLike) {
      // Unlike the post
      post.likes = post.likes.filter(like => like.userId.toString() !== userId);
      await post.save();
      
      return res.status(200).json({
        success: true,
        message: 'Post unliked successfully',
        likes: post.likes.length
      });
    } else {
      // Like the post
      post.likes.push({ userId });
      await post.save();
      
      return res.status(200).json({
        success: true,
        message: 'Post liked successfully',
        likes: post.likes.length
      });
    }

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking post',
      error: error.message
    });
  }
};

// Comment on a post
export const commentOnPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const newComment = {
      userId,
      content: content.trim()
    };

    post.comments.push(newComment);
    await post.save();

    // Populate the comment with user info
    const populatedPost = await Post.findById(postId)
      .populate('comments.userId', 'name email profilePicture')
      .lean();

    const addedComment = populatedPost.comments[populatedPost.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: addedComment,
      totalComments: populatedPost.comments.length
    });

  } catch (error) {
    console.error('Comment on post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// Share a post
export const sharePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already shared the post
    const existingShare = post.shares.find(share => share.userId.toString() === userId);
    
    if (existingShare) {
      return res.status(400).json({
        success: false,
        message: 'You already shared this post'
      });
    }

    post.shares.push({ userId });
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post shared successfully',
      shares: post.shares.length
    });

  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing post',
      error: error.message
    });
  }
};

// Get user's daily posting status
export const getDailyPostStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const friendCount = await getUserFriendCount(userId);
    const maxPosts = getUserPostLimit(friendCount);

    let dailyLimit = await DailyPostLimit.findOne({ userId, date: today });
    
    if (!dailyLimit) {
      dailyLimit = {
        postCount: 0,
        maxPosts: maxPosts
      };
    }

    res.status(200).json({
      success: true,
      dailyStatus: {
        postCount: dailyLimit.postCount,
        maxPosts: dailyLimit.maxPosts,
        remainingPosts: Math.max(0, dailyLimit.maxPosts - dailyLimit.postCount),
        canPost: dailyLimit.postCount < dailyLimit.maxPosts && friendCount > 0,
        friendCount
      }
    });

  } catch (error) {
    console.error('Get daily post status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily post status',
      error: error.message
    });
  }
};

// Export multer upload middleware
export const uploadMiddleware = upload.array('media', 5); // Max 5 files per post

export default {
  createPost,
  getPosts,
  likePost,
  commentOnPost,
  sharePost,
  getDailyPostStatus,
  uploadMiddleware
};