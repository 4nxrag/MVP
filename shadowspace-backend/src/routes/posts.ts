import { Server } from 'socket.io';
import express, { Router, Request, Response } from 'express';
import Joi from 'joi';
import Post from '../models/Post';
import User from '../models/User';
import Vote from '../models/Vote';

import { authMiddleware, AuthRequest } from '../utils/auth';
import { containsBannedContent, getBannedWords } from '../utils/keywordFilter';
import { generateFakeRegion } from '../utils/privacyShield';

const router: Router = express.Router();

// Validation schema
const createPostSchema = Joi.object({
  content: Joi.string().min(1).max(500).required()
});

// POST /api/posts - Create a new post
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Validate input
    const { error, value } = createPostSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { content } = value;

    // Check for banned keywords
    if (containsBannedContent(content)) {
      const bannedWords = getBannedWords(content);
      return res.status(400).json({ 
        error: 'Content contains prohibited keywords',
        bannedWords: bannedWords
      });
    }

    // Create new post
    const post = new Post({
      userId: req.userId,
      content,
      fakeRegion: generateFakeRegion()
    });

    await post.save();

    router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // ... existing validation and post creation code ...

    await post.save();

    // Populate user info for response
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'anonymousName')
      .exec();

    const postData = {
      id: populatedPost!._id,
      content: populatedPost!.content,
      upvotes: populatedPost!.upvotes,
      downvotes: populatedPost!.downvotes,
      impressions: populatedPost!.impressions,
      fakeRegion: populatedPost!.fakeRegion,
      createdAt: populatedPost!.createdAt,
      author: (populatedPost!.userId as any).anonymousName
    };

    // Broadcast new post to all connected users using Web Sockets (Socket.IO)
    const io: Server = req.app.get('io');
    io.to('main-feed').emit('new_post', postData);

    res.status(201).json({
      message: 'Post created successfully',
      post: postData
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

    // Populate user info for response (but only anonymous name)
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'anonymousName')
      .exec();

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        id: populatedPost!._id,
        content: populatedPost!.content,
        upvotes: populatedPost!.upvotes,
        downvotes: populatedPost!.downvotes,
        impressions: populatedPost!.impressions,
        fakeRegion: populatedPost!.fakeRegion,
        createdAt: populatedPost!.createdAt,
        author: (populatedPost!.userId as any).anonymousName
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /api/posts route with enhanced sorting:
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const sort = req.query.sort as string || 'recent';

    let sortQuery: any = {};
    
    switch (sort) {
      case 'top':
        // Most upvoted first, then by creation date
        sortQuery = { upvotes: -1, createdAt: -1 };
        break;
      case 'viewed':
        // Most viewed (impressions) first
        sortQuery = { impressions: -1, createdAt: -1 };
        break;
      case 'trending':
        // Trending algorithm: recent posts with good engagement
        // We'll use MongoDB aggregation for this
        break;
      case 'recent':
      default:
        sortQuery = { createdAt: -1 };
        break;
    }

    const skip = (page - 1) * limit;

    let posts;
    
    if (sort === 'trending') {
      // Advanced trending algorithm using aggregation
      posts = await Post.aggregate([
        {
          $addFields: {
            // Calculate trending score: (upvotes - downvotes) / age_in_hours
            trendingScore: {
              $divide: [
                { $subtract: ['$upvotes', '$downvotes'] },
                {
                  $add: [
                    {
                      $divide: [
                        { $subtract: [new Date(), '$createdAt'] },
                        1000 * 60 * 60 // Convert to hours
                      ]
                    },
                    1 // Prevent division by zero
                  ]
                }
              ]
            }
          }
        },
        { $sort: { trendingScore: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $addFields: {
            author: { $arrayElemAt: ['$user.anonymousName', 0] }
          }
        },
        {
          $project: {
            user: 0,
            userId: 0,
            trendingScore: 0
          }
        }
      ]);
    } else {
      posts = await Post.find()
        .populate('userId', 'anonymousName')
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .exec();
    }

    const totalPosts = await Post.countDocuments();
    const hasMore = skip + posts.length < totalPosts;

    const formattedPosts = posts.map(post => ({
      id: post._id,
      content: post.content,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      impressions: post.impressions,
      fakeRegion: post.fakeRegion,
      createdAt: post.createdAt,
      author: post.author || (post.userId as any)?.anonymousName
    }));

    res.json({
      posts: formattedPosts,
      pagination: {
        currentPage: page,
        totalPosts,
        hasMore,
        totalPages: Math.ceil(totalPosts / limit)
      },
      sort: sort
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/posts/:id/vote - Vote on a post
router.put('/:id/vote', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const { type } = req.body; // 'upvote', 'downvote', or 'remove'
    
    if (!['upvote', 'downvote', 'remove'].includes(type)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Find existing vote
    const existingVote = await Vote.findOne({
      userId: req.userId,
      postId: postId
    });

    if (type === 'remove') {
      // Remove existing vote
      if (existingVote) {
        // Update post vote counts
        if (existingVote.voteType === 'upvote') {
          post.upvotes = Math.max(0, post.upvotes - 1);
        } else {
          post.downvotes = Math.max(0, post.downvotes - 1);
        }
        
        await existingVote.deleteOne();
        await post.save();
      }
    } else {
      // Add or change vote
      if (existingVote) {
        // Change existing vote
        if (existingVote.voteType !== type) {
          // Update post counts (remove old, add new)
          if (existingVote.voteType === 'upvote') {
            post.upvotes = Math.max(0, post.upvotes - 1);
            post.downvotes += 1;
          } else {
            post.downvotes = Math.max(0, post.downvotes - 1);
            post.upvotes += 1;
          }
          
          existingVote.voteType = type as 'upvote' | 'downvote';
          await existingVote.save();
          await post.save();
        }
        // If same vote type, do nothing
      } else {
        // Create new vote
        const newVote = new Vote({
          userId: req.userId,
          postId: postId,
          voteType: type
        });
        
        // Update post counts
        if (type === 'upvote') {
          post.upvotes += 1;
        } else {
          post.downvotes += 1;
        }
        
        await newVote.save();
        await post.save();
      }
    }

    res.json({
      message: 'Vote updated successfully',
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      userVote: type === 'remove' ? null : type
    });

        const voteData = {
      postId: postId,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      userVote: type === 'remove' ? null : type
    };

    // Real-Time Broadcast vote update to all users
    const io: Server = req.app.get('io');
    io.to('main-feed').emit('vote_update', voteData);

    res.json({
      message: 'Vote updated successfully',
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      userVote: type === 'remove' ? null : type
    });

  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});





// PUT /api/posts/:id/impression - Track post impression in real time

router.put('/:id/impression', async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    
    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment impression count
    post.impressions += 1;
    await post.save();

    // Broadcast impression update to all users
    const io: Server = req.app.get('io');
    io.to('main-feed').emit('impression_update', {
      postId: postId,
      impressions: post.impressions
    });

    res.json({
      message: 'Impression tracked',
      impressions: post.impressions
    });

  } catch (error) {
    console.error('Impression tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// GET /api/posts/:id - Get single post with user's vote status
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;
    
    const post = await Post.findById(postId)
      .populate('userId', 'anonymousName')
      .exec();
      
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check user's vote on this post
    const userVote = await Vote.findOne({
      userId: req.userId,
      postId: postId
    });

    res.json({
      post: {
        id: post._id,
        content: post.content,
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        impressions: post.impressions,
        fakeRegion: post.fakeRegion,
        createdAt: post.createdAt,
        author: (post.userId as any).anonymousName,
        userVote: userVote ? userVote.voteType : null
      }
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




export default router;
